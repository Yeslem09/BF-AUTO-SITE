import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { SignatureJetons } from '../../application/ports.js'
import type { NatureJeton } from '../../domaine/anti-abus.js'

/**
 * Jetons signés HMAC-SHA256. Jeton de formulaire :
 * `<nature>.<émis le, millisecondes en base 36>.<aléa>.<signature>`.
 * Sans la clé, impossible de dater un formulaire dans le passé pour passer
 * le délai minimal, ni de changer sa nature.
 */

const PREFIXES: Readonly<Record<NatureJeton, string>> = { formulaire: 'f', confirmation: 'c' }
const NATURES: Readonly<Record<string, NatureJeton>> = { f: 'formulaire', c: 'confirmation' }
const BASE_36 = 36
const OCTETS_ALEA = 9
const LONGUEUR_SIGNATURE = 32
const FORMAT = /^([fc])\.([0-9a-z]{1,12})\.([A-Za-z0-9_-]{12})\.([A-Za-z0-9_-]{32})$/
const LONGUEUR_MAX_JETON = 80

export function creerSignatureJetonsHmac(cle: Buffer): SignatureJetons {
  const signer = (texte: string): string =>
    createHmac('sha256', cle).update(texte).digest('base64url').slice(0, LONGUEUR_SIGNATURE)

  const egaux = (attendu: string, recu: string): boolean => {
    const a = Buffer.from(attendu)
    const b = Buffer.from(recu)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  return {
    emettre(nature, emisLe) {
      const corps = `${PREFIXES[nature]}.${emisLe.getTime().toString(BASE_36)}.${randomBytes(OCTETS_ALEA).toString('base64url')}`
      return `${corps}.${signer(`jeton:${corps}`)}`
    },

    lire(jeton) {
      if (jeton.length > LONGUEUR_MAX_JETON) return null
      const lu = FORMAT.exec(jeton)
      if (lu === null) return null
      const [, prefixe = '', emis = '', alea = '', signature = ''] = lu
      if (!egaux(signer(`jeton:${prefixe}.${emis}.${alea}`), signature)) return null
      const nature = NATURES[prefixe]
      const emisLe = new Date(Number.parseInt(emis, BASE_36))
      if (nature === undefined || Number.isNaN(emisLe.getTime())) return null
      return { nature, emisLe }
    },
  }
}
