import { describe, expect, it } from 'vitest'
import { MOMENTS_REPONSE, type MomentReponse } from '../../../contrats/index.js'
import { calendrier, fermeture } from '../essais/calendrier-essai.js'
import type { PeriodeFermeture } from './fermeture.js'
import { annoncerRappel } from './rappel.js'
import { instantLocal } from './temps-local.js'

const annonce = (
  instantUtc: string,
  fermetures: readonly PeriodeFermeture[] = [],
  moment: MomentReponse = 'des-que-possible',
) => annoncerRappel(calendrier(fermetures), instantLocal(new Date(instantUtc)), moment)

const UNE_HEURE = /\d+\s*h\b/

describe('rappel annoncé à la demi-journée (Kano AT-3, US-13)', () => {
  it('mercredi à 21 h (heure d’été) : jeudi matin', () => {
    expect(annonce('2026-09-23T19:00:00Z')).toBe('Nous vous rappelons jeudi matin.')
  })

  it('le jeudi couvert par une fermeture : la première demi-journée après la fermeture', () => {
    expect(
      annonce('2026-09-23T19:00:00Z', [fermeture('2026-09-24', '2026-09-24', 'imprevu')]),
    ).toBe('Nous vous rappelons vendredi matin.')
  })

  it('pendant la matinée : cet après-midi ; avant l’ouverture : ce matin', () => {
    expect(annonce('2026-09-23T08:00:00Z')).toBe('Nous vous rappelons cet après-midi.')
    expect(annonce('2026-09-23T05:00:00Z')).toBe('Nous vous rappelons ce matin.')
  })

  it('pendant la pause de midi : cet après-midi', () => {
    expect(annonce('2026-09-23T10:30:00Z')).toBe('Nous vous rappelons cet après-midi.')
  })

  it('le dimanche : lundi matin', () => {
    expect(annonce('2026-09-27T10:00:00Z')).toBe('Nous vous rappelons lundi matin.')
  })

  it('veille de congés d’une semaine : la date complète du retour', () => {
    const conges = [fermeture('2026-09-28', '2026-10-03')]
    expect(annonce('2026-09-26T18:00:00Z', conges)).toBe(
      'Nous vous rappelons le lundi 5 octobre au matin.',
    )
  })

  it('pendant une longue fermeture : le jour de la réouverture, jamais avant', () => {
    expect(annonce('2026-09-29T10:00:00Z', [fermeture('2026-09-28', '2026-10-07')])).toBe(
      'Nous vous rappelons le jeudi 8 octobre au matin.',
    )
  })

  it('heure d’hiver et heure d’été : même instant UTC, demi-journée différente', () => {
    // 7 h UTC : 8 h à Paris en hiver (avant l'ouverture), 9 h en été (matinée entamée).
    expect(annonce('2026-03-27T07:00:00Z')).toBe('Nous vous rappelons ce matin.')
    expect(annonce('2026-03-30T07:00:00Z')).toBe('Nous vous rappelons cet après-midi.')
  })

  it('le soir du passage à l’heure d’hiver : lundi matin', () => {
    expect(annonce('2026-10-24T17:30:00Z')).toBe('Nous vous rappelons lundi matin.')
  })

  it('fermé au-delà de l’horizon : aucune promesse', () => {
    expect(annonce('2026-09-23T19:00:00Z', [fermeture('2026-09-24', '2026-12-22')])).toBeNull()
  })

  it('n’annonce jamais une heure, quel que soit le moment choisi', () => {
    for (const instant of [
      '2026-09-23T05:00:00Z',
      '2026-09-23T08:00:00Z',
      '2026-09-23T19:00:00Z',
    ]) {
      for (const moment of MOMENTS_REPONSE) {
        expect(annonce(instant, [], moment)).not.toMatch(UNE_HEURE)
      }
    }
  })
})

describe('rappel annoncé selon le moment où le client peut répondre (US-13)', () => {
  const MERCREDI_21H = '2026-09-23T19:00:00Z'

  it('mercredi à 21 h, « En fin de journée » : jeudi, en fin de journée', () => {
    expect(annonce(MERCREDI_21H, [], 'fin-de-journee')).toBe(
      'Nous vous rappelons jeudi, en fin de journée.',
    )
  })

  it('mercredi à 21 h, « Dès que possible » ou « Le matin » : jeudi matin', () => {
    expect(annonce(MERCREDI_21H, [], 'des-que-possible')).toBe('Nous vous rappelons jeudi matin.')
    expect(annonce(MERCREDI_21H, [], 'matin')).toBe('Nous vous rappelons jeudi matin.')
  })

  it('mercredi à 21 h, « À midi » : jeudi, à midi', () => {
    expect(annonce(MERCREDI_21H, [], 'midi')).toBe('Nous vous rappelons jeudi, à midi.')
  })

  it('le jeudi couvert par une fermeture : la première demi-journée voulue après elle', () => {
    const imprevu = [fermeture('2026-09-24', '2026-09-24', 'imprevu')]
    expect(annonce(MERCREDI_21H, imprevu, 'fin-de-journee')).toBe(
      'Nous vous rappelons vendredi, en fin de journée.',
    )
  })

  it('pendant la matinée : « En fin de journée » aujourd’hui, « Le matin » le lendemain', () => {
    expect(annonce('2026-09-23T08:00:00Z', [], 'fin-de-journee')).toBe(
      'Nous vous rappelons aujourd’hui, en fin de journée.',
    )
    expect(annonce('2026-09-23T08:00:00Z', [], 'matin')).toBe('Nous vous rappelons jeudi matin.')
  })

  it('veille de congés d’une semaine : la date complète du retour, avec le moment', () => {
    const conges = [fermeture('2026-09-28', '2026-10-03')]
    expect(annonce('2026-09-26T18:00:00Z', conges, 'fin-de-journee')).toBe(
      'Nous vous rappelons le lundi 5 octobre, en fin de journée.',
    )
  })
})
