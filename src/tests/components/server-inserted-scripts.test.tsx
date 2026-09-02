import JsonLd from '@/components/seo/JsonLd';
import { ServerInsertedScripts } from '@/components/ServerInsertedScripts';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Children, isValidElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Les <script> inline enfants de <head> sont hydratés POSITIONNELLEMENT par
 * React (contrairement à <link>/<meta>, appariés par attributs). Un seul nœud
 * inséré dans <head> avant l'hydratation — extension navigateur, gtm.js,
 * clarity.js — décale donc l'alignement : React compare nos JSON-LD au mauvais
 * nœud DOM et signale « Hydration failed », puis re-rend l'arbre côté client,
 * ce qui déclenche en plus l'avertissement React 19 « Encountered a script tag
 * while rendering React component ».
 *
 * Ces tests verrouillent le remède : tous ces scripts passent par
 * useServerInsertedHTML et ne font donc jamais partie de l'arbre hydraté.
 */

const holder = vi.hoisted(() => ({ callbacks: [] as Array<() => ReactNode> }));

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: (callback: () => ReactNode) => {
    holder.callbacks.push(callback);
  },
}));

type ScriptProps = {
  id?: string;
  type?: string;
  nonce?: string;
  suppressHydrationWarning?: boolean;
  dangerouslySetInnerHTML?: { __html: string };
};

/** Scripts émis dans le flux SSR (jamais rendus côté client). */
function serverInsertedScripts(): ScriptProps[] {
  return holder.callbacks.flatMap((callback) => {
    const emitted = callback();
    const children = isValidElement<{ children?: ReactNode }>(emitted)
      ? emitted.props.children
      : emitted;
    return Children.toArray(children)
      .filter(isValidElement<ScriptProps>)
      .map((child) => {
        expect(child.type).toBe('script');
        return child.props;
      });
  });
}

afterEach(() => {
  holder.callbacks.length = 0;
  cleanup();
});

describe('ServerInsertedScripts', () => {
  it("n'insère rien dans l'arbre hydraté", () => {
    const { container } = render(
      <ServerInsertedScripts
        nonce="n0nce"
        scripts={[{ id: 'kh-a', html: 'window.a=1;' }]}
      />
    );

    expect(container.innerHTML).toBe('');
    expect(container.querySelector('script')).toBeNull();
  });

  it('émet chaque script dans le flux SSR avec id, type et nonce', () => {
    render(
      <ServerInsertedScripts
        nonce="n0nce"
        scripts={[
          { id: 'kh-gtm-init', html: 'window.dataLayer=[];' },
          { id: 'kh-ld', type: 'application/ld+json', html: '{"a":1}' },
        ]}
      />
    );

    expect(serverInsertedScripts()).toEqual([
      {
        id: 'kh-gtm-init',
        type: undefined,
        nonce: 'n0nce',
        suppressHydrationWarning: true,
        dangerouslySetInnerHTML: { __html: 'window.dataLayer=[];' },
      },
      {
        id: 'kh-ld',
        type: 'application/ld+json',
        nonce: 'n0nce',
        suppressHydrationWarning: true,
        dangerouslySetInnerHTML: { __html: '{"a":1}' },
      },
    ]);
  });

  it("n'émet qu'au premier flush (Next rappelle le callback à chaque flush)", () => {
    render(
      <ServerInsertedScripts scripts={[{ id: 'kh-a', html: 'window.a=1;' }]} />
    );

    expect(holder.callbacks).toHaveLength(1);
    const emit = holder.callbacks[0]!;

    expect(emit()).not.toBeNull();
    expect(emit()).toBeNull();
    expect(emit()).toBeNull();
  });
});

describe('JsonLd', () => {
  it('émet les 7 schémas en SSR sans rien ajouter à l’arbre hydraté', () => {
    const { container } = render(<JsonLd nonce="n0nce" />);

    expect(container.innerHTML).toBe('');

    const scripts = serverInsertedScripts();
    expect(scripts).toHaveLength(7);

    const types = scripts.map((script) => {
      expect(script.type).toBe('application/ld+json');
      const json = JSON.parse(script.dangerouslySetInnerHTML!.__html) as {
        '@context': string;
        '@type': string;
      };
      expect(json['@context']).toBe('https://schema.org');
      return json['@type'];
    });

    expect(types).toEqual([
      'WebSite',
      'Organization',
      'RealEstateAgent',
      'SoftwareApplication',
      'FAQPage',
      'HowTo',
      'BreadcrumbList',
    ]);
  });
});

describe('<head> du RootLayout', () => {
  it('ne rend aucun <script> réconcilié côté client', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/layout.tsx'),
      'utf8'
    );
    const head = source.slice(
      source.indexOf('<head>'),
      source.indexOf('</head>')
    );

    expect(head).not.toBe('');
    expect(head).not.toMatch(/<script/);
    expect(head).toMatch(/<ServerInsertedScripts/);
  });
});
