import type { H3Event } from 'h3'
import { getRequestHeaders } from 'h3'

/**
 * Request headers passed on to Drupal.
 *
 * The X-Forwarded-* headers make Drupal see the public host and protocol, so
 * that it generates the right absolute URLs and the browser's session cookie is
 * valid there.
 */
const FORWARDED_HEADERS = [
  'cookie',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
]

export function getForwardedHeaders(event: H3Event): Record<string, string> {
  const requestHeaders = getRequestHeaders(event)
  const headers: Record<string, string> = {}
  for (const name of FORWARDED_HEADERS) {
    const value = requestHeaders[name]
    if (value) {
      headers[name] = value
    }
  }
  return headers
}
