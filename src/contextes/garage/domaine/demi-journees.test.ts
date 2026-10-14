import { describe, expect, it } from 'vitest'
import { calendrier, date, fermeture, plage, SEMAINE_ESSAI } from '../essais/calendrier-essai.js'
import {
  codeDemiJournee,
  demiJourneesDuJour,
  libelleDemiJournee,
  NOMBRE_DEMI_JOURNEES_PROPOSEES,
  prochainesDemiJournees,
} from './demi-journees.js'
import type { PeriodeFermeture } from './fermeture.js'
import type { SemaineType } from './horaires.js'
import { instantLocal } from './temps-local.js'

const codes = (instantUtc: string, fermetures: readonly PeriodeFermeture[] = []) =>
  prochainesDemiJournees(
    calendrier(fermetures),
    instantLocal(new Date(instantUtc)),
    NOMBRE_DEMI_JOURNEES_PROPOSEES,
  ).map(codeDemiJournee)

const semaineDe = (lundi: SemaineType['lundi']): SemaineType => ({ ...SEMAINE_ESSAI, lundi })

describe('demi-journées d’une date', () => {
  it('matin et après-midi avec la pause de midi, chacun avec sa première minute', () => {
    expect(demiJourneesDuJour(calendrier(), date('2026-09-28'))).toEqual([
      { date: date('2026-09-28'), moment: 'matin', debut: 510 },
      { date: date('2026-09-28'), moment: 'apres-midi', debut: 840 },
    ])
  })

  it('une journée continue compte un matin et un après-midi, qui commence à midi', () => {
    const journeeContinue = calendrier([], semaineDe([plage('09:00', '19:00')]))
    expect(
      demiJourneesDuJour(journeeContinue, date('2026-09-28')).map((d) => [d.moment, d.debut]),
    ).toEqual([
      ['matin', 540],
      ['apres-midi', 720],
    ])
  })

  it('un jour ouvert l’après-midi seulement n’a pas de matin', () => {
    const apresMidi = calendrier([], semaineDe([plage('14:00', '19:00')]))
    expect(demiJourneesDuJour(apresMidi, date('2026-09-28')).map((d) => d.moment)).toEqual([
      'apres-midi',
    ])
  })

  it('le dimanche fermé et un jour de fermeture exceptionnelle n’en ont aucune', () => {
    expect(demiJourneesDuJour(calendrier(), date('2026-09-27'))).toEqual([])
    const imprevu = calendrier([fermeture('2026-09-28', '2026-09-28', 'imprevu')])
    expect(demiJourneesDuJour(imprevu, date('2026-09-28'))).toEqual([])
  })
})

describe('prochaines demi-journées proposées pour un rendez-vous (Kano D4, US-11)', () => {
  it('mercredi 23 septembre à 10 h : les dix suivantes, sans la matinée entamée ni le dimanche', () => {
    expect(codes('2026-09-23T08:00:00Z')).toEqual([
      '2026-09-23-apres-midi',
      '2026-09-24-matin',
      '2026-09-24-apres-midi',
      '2026-09-25-matin',
      '2026-09-25-apres-midi',
      '2026-09-26-matin',
      '2026-09-26-apres-midi',
      '2026-09-28-matin',
      '2026-09-28-apres-midi',
      '2026-09-29-matin',
    ])
  })

  it('une fermeture déclarée le lundi suivant retire ce lundi de la liste', () => {
    const liste = codes('2026-09-23T08:00:00Z', [fermeture('2026-09-28', '2026-09-28')])
    expect(liste.some((code) => code.startsWith('2026-09-28'))).toBe(false)
    expect(liste.some((code) => code.startsWith('2026-09-27'))).toBe(false)
    expect(liste).toHaveLength(NOMBRE_DEMI_JOURNEES_PROPOSEES)
  })

  it('une demi-journée qui commence à l’instant même est déjà entamée', () => {
    expect(codes('2026-09-23T06:29:00Z')[0]).toBe('2026-09-23-matin')
    expect(codes('2026-09-23T06:30:00Z')[0]).toBe('2026-09-23-apres-midi')
  })

  it('longue fermeture : la liste reprend après les congés', () => {
    expect(codes('2026-09-23T08:00:00Z', [fermeture('2026-09-23', '2026-10-17')])[0]).toBe(
      '2026-10-19-matin',
    )
  })

  it('fermé au-delà de l’horizon de recherche : aucune demi-journée inventée', () => {
    expect(codes('2026-09-23T08:00:00Z', [fermeture('2026-09-23', '2026-12-22')])).toEqual([])
  })

  it('s’écrit pour le client : « Jeudi 24 septembre, matin »', () => {
    const [matin, apresMidi] = demiJourneesDuJour(calendrier(), date('2026-09-24'))
    if (matin === undefined || apresMidi === undefined)
      throw new Error('jeudi d’essai sans demi-journée')
    expect(libelleDemiJournee(matin)).toBe('Jeudi 24 septembre, matin')
    expect(libelleDemiJournee(apresMidi)).toBe('Jeudi 24 septembre, après-midi')
    expect(codeDemiJournee(apresMidi)).toBe('2026-09-24-apres-midi')
  })
})
