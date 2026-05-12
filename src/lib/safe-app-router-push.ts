type RouterHrefOp = (href: string) => void | Promise<void>;

function swallowNavigationPromise(
  result: void | Promise<void>,
  onNavigateFailed?: () => void
): void {
  if (
    typeof result === 'object' &&
    result !== null &&
    'catch' in result &&
    typeof (result as Promise<void>).catch === 'function'
  ) {
    void (result as Promise<void>).catch(() => {
      onNavigateFailed?.();
    });
  }
}

/**
 * Lance `router.push` en absorbant les rejets côté client.
 * Ajoute un `try/catch` synchrone pour les rares environnements qui lèvent.
 */
export function runAppRouterNavigation(
  router: { push: RouterHrefOp },
  href: string,
  onNavigateFailed?: () => void
): void {
  try {
    const result = router.push(href);
    swallowNavigationPromise(result, onNavigateFailed);
  } catch {
    onNavigateFailed?.();
  }
}

/**
 * Lance `router.replace` avec la même politique que `runAppRouterNavigation`.
 */
export function runAppRouterReplacement(
  router: { replace: RouterHrefOp },
  href: string,
  onNavigateFailed?: () => void
): void {
  try {
    const result = router.replace(href);
    swallowNavigationPromise(result, onNavigateFailed);
  } catch {
    onNavigateFailed?.();
  }
}
