interface Window {
  gtag?: <T extends Record<string, unknown>>(
    commandName: string,
    eventName: string,
    additionalPayload?: T
  ) => void
  Beacon?: (command: string, options?: Record<string, unknown>) => void
}
