export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (__DEV__) {
    console.log('[analytics]', name, params ?? {});
  }

  // TODO:
  // Buraya ileride Firebase / PostHog / Mixpanel bağlanabilir.
}
