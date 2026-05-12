/**
 * MUI `<Dialog>` `onClose` reasons that should be ignored when dismissal is
 * only allowed via explicit action buttons (no backdrop tap / ESC).
 *
 * @see https://mui.com/material-ui/react-dialog/#preventing-close-on-backdrop-click
 */
export type EnforcedExplicitCloseReason = 'backdropClick' | 'escapeKeyDown';

export function isImplicitDialogDismissReason(
  reason: EnforcedExplicitCloseReason | undefined
): reason is EnforcedExplicitCloseReason {
  return reason === 'backdropClick' || reason === 'escapeKeyDown';
}
