/**
 * True for iPhone / iPad / iPod WebKit. Used to avoid layout hacks that fight
 * `interactive-widget: resizes-content` on iOS 16.4+.
 */
export function isLikelyIosWebKit(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /iP(hone|ad|od)/i.test(navigator.userAgent);
}
