export {};

declare global {
  interface Window {
    /**
     * GTM queue: event-shaped objects and/or gtag command argument tuples
     * (see inline `function gtag(){dataLayer.push(arguments)}` shim pattern).
     */
    dataLayer?: Array<Record<string, unknown> | unknown[]>;
    gtag?: (...args: unknown[]) => void;
  }
}
