interface Window {
  gtag?: <T extends Record<string, unknown>>(
    commandName: string,
    eventName: string,
    additionalPayload?: T
  ) => void
  Beacon?: (method: string, options?: unknown, data?: unknown) => void
}
