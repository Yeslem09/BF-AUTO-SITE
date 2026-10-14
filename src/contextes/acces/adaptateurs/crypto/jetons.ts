import { createHash, randomBytes } from 'node:crypto'
import type { GenerateurJeton, Hachage } from '../../application/ports.js'

/** 256 bits d'aléa : bien au-delà des 128 bits exigés (Kano D12). */
const OCTETS_ALEATOIRES = 32

export const generateurJetonAleatoire: GenerateurJeton = {
  generer: () => randomBytes(OCTETS_ALEATOIRES).toString('base64url'),
}

/**
 * SHA-256 suffit ici : le jeton porte 256 bits d'aléa, aucune attaque par
 * dictionnaire n'a de prise, et la recherche par empreinte reste directe.
 */
export const hachageSha256: Hachage = {
  empreinte: (jeton) => createHash('sha256').update(jeton, 'utf8').digest('hex'),
}
