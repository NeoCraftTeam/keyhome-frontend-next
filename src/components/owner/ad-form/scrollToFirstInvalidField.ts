/**
 * Brings the first invalid form field of the current wizard step into view.
 *
 * When step validation fails, `handleNext` refuses to advance. Without this,
 * the "Suivant" button feels dead: the failing field (e.g. the required
 * quartier at the very top of the Détails step) can sit off-screen while the
 * button lives at the bottom. Scrolling the first invalid control into view —
 * paired with an explanatory snackbar — makes the refusal legible.
 *
 * MUI flags errored controls with the `Mui-error` class and errored inputs with
 * `aria-invalid="true"`, so we can locate them without threading refs through
 * every child field component. Hidden steps use `unmountOnExit`, so only the
 * visible step's fields are ever in the DOM.
 *
 * @returns true when an invalid field was found and scrolled to.
 */
export function scrollToFirstInvalidField(
  root: ParentNode = document
): boolean {
  const target = root.querySelector<HTMLElement>(
    '[aria-invalid="true"], .Mui-error'
  );

  if (!target) {
    return false;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return true;
}
