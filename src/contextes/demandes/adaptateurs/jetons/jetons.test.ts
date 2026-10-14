import { describe, expect, it } from 'vitest'
import { FORMAT_IDENTIFIANT, FORMAT_JETON_CONFIRMATION, aleasCrypto } from './aleas-crypto.js'
import { creerSignatureJetonsHmac } from './signature-jetons-hmac.js'

const CLE = Buffer.alloc(32, 7)
const AUTRE_CLE = Buffer.alloc(32, 8)
const EMIS = new Date('2026-09-16T08:00:00.123Z')

describe('jetons de formulaire signés', () => {
  const jetons = creerSignatureJetonsHmac(CLE)

  it('relit la nature et la date d’émission', () => {
    expect(jetons.lire(jetons.emettre('formulaire', EMIS))).toEqual({
      nature: 'formulaire',
      emisLe: EMIS,
    })
    expect(jetons.lire(jetons.emettre('confirmation', EMIS))).toEqual({
      nature: 'confirmation',
      emisLe: EMIS,
    })
  })

  it('deux jetons émis au même instant sont différents', () => {
    expect(jetons.emettre('formulaire', EMIS)).not.toBe(jetons.emettre('formulaire', EMIS))
  })

  it('refuse un jeton antidaté, changé de nature ou signé par une autre clé', () => {
    const jeton = jetons.emettre('formulaire', EMIS)
    const [, emis = '', alea = '', signature = ''] = jeton.split('.')
    const antidate = `f.${(EMIS.getTime() - 60_000).toString(36)}.${alea}.${signature}`
    const confirme = `c.${emis}.${alea}.${signature}`
    expect(jetons.lire(antidate)).toBeNull()
    expect(jetons.lire(confirme)).toBeNull()
    expect(creerSignatureJetonsHmac(AUTRE_CLE).lire(jeton)).toBeNull()
    expect(jetons.lire('')).toBeNull()
    expect(jetons.lire('n.importe.quoi.ici')).toBeNull()
    expect(jetons.lire(`${jeton}${'x'.repeat(100)}`)).toBeNull()
  })
})

describe('aléas', () => {
  it('jeton de confirmation de 128 bits, identifiant non séquentiel', () => {
    const jeton = aleasCrypto.jetonConfirmation()
    expect(jeton).toMatch(FORMAT_JETON_CONFIRMATION)
    expect(Buffer.from(jeton, 'base64url')).toHaveLength(16)
    expect(aleasCrypto.identifiant()).toMatch(FORMAT_IDENTIFIANT)
    expect(aleasCrypto.identifiant()).not.toBe(aleasCrypto.identifiant())
  })
})
