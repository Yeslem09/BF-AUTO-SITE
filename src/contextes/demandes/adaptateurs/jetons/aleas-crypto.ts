import { randomBytes, randomUUID } from 'node:crypto'
import type { GenerateurAleas } from '../../application/ports.js'

/** 16 octets : les 128 bits d'aléa exigés pour le jeton de confirmation (US-12). */
const OCTETS_JETON_CONFIRMATION = 16

/** Format d'un jeton de confirmation : 22 caractères base64url. */
export const FORMAT_JETON_CONFIRMATION = /^[A-Za-z0-9_-]{22}$/

/** Format d'un identifiant de demande (UUID v4). */
export const FORMAT_IDENTIFIANT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export const aleasCrypto: GenerateurAleas = {
  identifiant: () => randomUUID(),
  jetonConfirmation: () => randomBytes(OCTETS_JETON_CONFIRMATION).toString('base64url'),
}
