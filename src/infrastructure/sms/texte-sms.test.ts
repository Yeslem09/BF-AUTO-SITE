import { describe, expect, it } from 'vitest'
import { ErreurConnecteur } from '../erreurs.js'
import { compterSegments, preparerTexteSms, SEGMENTS_MAX, versAlphabetGsm } from './texte-sms.js'

const code = (...points: number[]): string => String.fromCodePoint(...points)
const APOSTROPHE = code(0x2019)
const GUILLEMETS = [code(0x00ab), code(0x00bb)] as const
const INSECABLE = code(0x00a0)

describe('texte d’un SMS dans l’alphabet GSM (US-C10)', () => {
  it('remplace les signes typographiques et retire les accents hors alphabet', () => {
    const texte = `Ne roulez pas : rappelez Julie aujourd${APOSTROPHE}hui, fenêtre ${GUILLEMETS[0]}${INSECABLE}fin de journée${INSECABLE}${GUILLEMETS[1]}`
    const { texte: gsm, segments } = preparerTexteSms(texte)
    expect(gsm).toBe('Ne roulez pas : rappelez Julie aujourd\'hui, fenetre " fin de journée "')
    expect(segments).toBe(1)
  })

  it('garde les lettres accentuées de l’alphabet GSM, remplace les autres', () => {
    expect(versAlphabetGsm('é è à ù ì ò É Ç ç ê â î ô û ë ï œ Œ')).toBe(
      'é è à ù ì ò É Ç c e a i o u e i oe OE',
    )
    expect(versAlphabetGsm(`${code(0x2026)} ${code(0x2013)} ${code(0x2014)}`)).toBe('... - -')
    expect(versAlphabetGsm('Garage 中')).toBe('Garage ?')
  })

  it('compte les SMS : 160 septets pour un seul, 153 par segment au-delà, extension comptée double', () => {
    expect(compterSegments('a'.repeat(160))).toBe(1)
    expect(compterSegments('a'.repeat(161))).toBe(2)
    expect(compterSegments('a'.repeat(306))).toBe(2)
    expect(compterSegments('a'.repeat(307))).toBe(3)
    expect(compterSegments('€'.repeat(80))).toBe(1)
    expect(compterSegments('€'.repeat(81))).toBe(2)
  })

  it(`refuse un texte vide ou de plus de ${SEGMENTS_MAX} SMS, avant tout appel réseau`, () => {
    expect(() => preparerTexteSms('a'.repeat(307))).toThrow(ErreurConnecteur)
    expect(() => preparerTexteSms('   ')).toThrow(ErreurConnecteur)
    expect(preparerTexteSms('a'.repeat(306)).segments).toBe(2)
  })
})
