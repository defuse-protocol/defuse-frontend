// src/shims/thread-stream.ts

type ThreadStreamOptions = {
  worker?: string
  [key: string]: unknown
}

export default class ThreadStream {
  // Minimal constructor signature; pino normally passes an options object.
  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  constructor(_opts: ThreadStreamOptions) {}

  write(_chunk: unknown): void {
    // no-op
  }

  end(): void {
    // no-op
  }

  on(_event: string, _listener: (...args: unknown[]) => void): void {
    // no-op
  }
}
