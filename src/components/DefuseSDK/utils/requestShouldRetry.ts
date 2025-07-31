import { HttpRequestError } from "../errors/request"

export function requestShouldRetry(error: Error) {
  if (error instanceof HttpRequestError && error.status != null) {
    // Forbidden
    if (error.status === 403) return true
    // Request Timeout
    if (error.status === 408) return true
    // Request Entity Too Large
    if (error.status === 413) return true
    // Too Many Requests
    if (error.status === 429) return true
    // Internal Server Error
    if (error.status === 500) return true
    // Bad Gateway
    if (error.status === 502) return true
    // Service Unavailable
    if (error.status === 503) return true
    // Gateway Timeout
    if (error.status === 504) return true
    return false
  }
  return true
}
