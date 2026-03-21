import type { Viewer, ViewerConfig } from '@photo-sphere-viewer/core';
import { DEFAULTS } from '@photo-sphere-viewer/core';

export const PSV_HELP_PANEL_ID = 'keyhome-psv-help';

/**
 * French shortcuts panel for Photo Sphere Viewer (HTML string for {@linkcode Panel.show}).
 */
export const PSV_SHORTCUTS_HELP_HTML_FR = `
<h3 style="margin-top:0">Raccourcis clavier</h3>
<ul style="margin:0;padding-left:1.25rem;line-height:1.6">
  <li><strong>Flèches</strong> — Déplacer la vue</li>
  <li><strong>Page haut / bas</strong> ou <strong>+ / −</strong> — Zoom</li>
  <li><strong>F</strong> — Plein écran</li>
  <li><strong>Échap</strong> — Quitter le plein écran</li>
  <li><strong>H</strong> — Afficher ou masquer cette aide</li>
  <li>Icône <strong>galerie</strong> (barre du bas) — liste des scènes, si la visite en compte plusieurs</li>
</ul>
`.trim();

/**
 * Default PSV arrow / page / zoom keys plus <kbd>H</kbd> (help panel) and <kbd>F</kbd> (fullscreen).
 */
export function buildPsvKeyboardActions(
  helpContentHtml: string = PSV_SHORTCUTS_HELP_HTML_FR,
): NonNullable<ViewerConfig['keyboardActions']> {
  return {
    ...DEFAULTS.keyboardActions,
    h: (viewer: Viewer, evt: KeyboardEvent) => {
      if (evt.ctrlKey || evt.altKey || evt.metaKey) {
        return;
      }
      if (viewer.panel.isVisible(PSV_HELP_PANEL_ID)) {
        viewer.panel.hide(PSV_HELP_PANEL_ID);
      } else {
        viewer.panel.show({
          id: PSV_HELP_PANEL_ID,
          content: helpContentHtml,
        });
      }
    },
    f: (viewer: Viewer, evt: KeyboardEvent) => {
      if (!evt.ctrlKey && !evt.altKey) {
        viewer.toggleFullscreen();
      }
    },
  };
}
