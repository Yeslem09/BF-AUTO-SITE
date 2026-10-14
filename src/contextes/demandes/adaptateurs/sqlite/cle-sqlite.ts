import { randomBytes } from 'node:crypto'
import type { Base } from './base.js'

const NOM_CLE_JETONS = 'signature-jetons'
const OCTETS_CLE = 32

/**
 * Clé de signature des jetons, créée au premier démarrage puis gardée en base :
 * un formulaire ouvert avant un redémarrage reste valable après.
 */
export function lireOuCreerCleJetons(base: Base): Buffer {
  base
    .prepare('INSERT OR IGNORE INTO demandes_cles (nom, valeur) VALUES (?, ?)')
    .run(NOM_CLE_JETONS, randomBytes(OCTETS_CLE).toString('base64'))
  const valeur: unknown = base
    .prepare('SELECT valeur FROM demandes_cles WHERE nom = ?')
    .pluck()
    .get(NOM_CLE_JETONS)
  if (typeof valeur !== 'string') throw new Error('Clé de signature des jetons illisible.')
  const cle = Buffer.from(valeur, 'base64')
  if (cle.length !== OCTETS_CLE)
    throw new Error('Clé de signature des jetons de longueur inattendue.')
  return cle
}
