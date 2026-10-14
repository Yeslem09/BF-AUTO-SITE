import { describe, expect, it } from 'vitest'
import {
  CACHE_AUCUN,
  CACHE_IMAGES,
  CACHE_IMMUABLE,
  CACHE_REVALIDER,
  politiqueCache,
} from './politique-cache.js'

describe('politique de cache', () => {
  it.each([
    ['/fonts/hanken-grotesk-400.woff2', 'font/woff2', CACHE_IMMUABLE],
    ['/css/bf-auto.css?v=3f2a', 'text/css', CACHE_IMMUABLE],
    ['/js/pre-diagnostic/assistant.js?v=3f2a', 'application/javascript', CACHE_IMMUABLE],
    ['/css/bf-auto.css', 'text/css', CACHE_REVALIDER],
    ['/js/commun.js?autre=1', 'application/javascript', CACHE_REVALIDER],
    ['/', 'text/html; charset=utf-8', CACHE_REVALIDER],
    ['/pieces-et-reparations?page=2', 'text/html; charset=utf-8', CACHE_REVALIDER],
    ['/sante', 'application/json; charset=utf-8', CACHE_AUCUN],
    ['/favicon.svg', 'image/svg+xml', CACHE_IMAGES],
    ['/img/atelier.webp', 'image/webp', CACHE_IMAGES],
    ['/inconnu', undefined, CACHE_REVALIDER],
  ])('%s (%s) : %s', (url, typeContenu, attendu) => {
    expect(politiqueCache(url, typeContenu)).toBe(attendu)
  })
})
