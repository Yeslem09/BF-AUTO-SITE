import { describe, expect, it } from 'vitest'
import {
  anneeAParis,
  dateAParis,
  debutDeSemaine,
  estDateValide,
  formaterHeure,
  formaterInstant,
  heureAParis,
  jourEnLettres,
} from './temps.js'

describe('temps à l’heure de Paris', () => {
  it('formate une heure sans minutes inutiles', () => {
    expect(formaterHeure(19, 0)).toBe('19 h')
    expect(formaterHeure(8, 5)).toBe('8 h 05')
  })

  it('lit un instant à l’heure d’été puis d’hiver', () => {
    expect(formaterInstant(new Date('2026-07-15T16:30:00.000Z'))).toBe(
      'mercredi 15 juillet à 18 h 30',
    )
    expect(formaterInstant(new Date('2026-10-26T07:15:00.000Z'))).toBe('lundi 26 octobre à 8 h 15')
  })

  it('ajoute l’année quand elle diffère de la référence', () => {
    expect(
      formaterInstant(new Date('2025-12-31T22:30:00.000Z'), new Date('2026-09-16T08:00:00.000Z')),
    ).toBe('mercredi 31 décembre 2025 à 23 h 30')
  })

  it('l’année est celle de Paris : le Nouvel An arrive une heure avant UTC', () => {
    expect(anneeAParis(new Date('2026-12-31T22:59:00.000Z'))).toBe(2026)
    expect(anneeAParis(new Date('2026-12-31T23:30:00.000Z'))).toBe(2027)
  })

  it('la semaine commence le lundi à minuit, heure de Paris', () => {
    // Mercredi 16 septembre 2026, 10 h à Paris : lundi 14 à minuit = dimanche 13 à 22 h UTC.
    expect(debutDeSemaine(new Date('2026-09-16T08:00:00.000Z'))).toEqual(
      new Date('2026-09-13T22:00:00.000Z'),
    )
    // Lundi 26 octobre 2026 (heure d'hiver) à 0 h 30 à Paris.
    expect(debutDeSemaine(new Date('2026-10-25T23:30:00.000Z'))).toEqual(
      new Date('2026-10-25T23:00:00.000Z'),
    )
    // Dimanche 1er novembre 2026, 23 h à Paris : la semaine a commencé le lundi 26 octobre.
    expect(debutDeSemaine(new Date('2026-11-01T22:00:00.000Z'))).toEqual(
      new Date('2026-10-25T23:00:00.000Z'),
    )
  })
})

describe('dates du calendrier à Paris (promesses de rappel)', () => {
  it('la date civile à Paris : minuit passé à Paris, c’est déjà le lendemain', () => {
    expect(dateAParis(new Date('2026-09-23T21:59:00.000Z'))).toBe('2026-09-23')
    expect(dateAParis(new Date('2026-09-23T22:01:00.000Z'))).toBe('2026-09-24')
    expect(dateAParis(new Date('2026-01-05T08:00:00.000Z'))).toBe('2026-01-05')
  })

  it('une date existe au calendrier ou non', () => {
    expect(estDateValide('2026-09-24')).toBe(true)
    expect(estDateValide('2028-02-29')).toBe(true)
    expect(estDateValide('2026-02-29')).toBe(false)
    expect(estDateValide('2026-9-24')).toBe(false)
    expect(estDateValide('jeudi')).toBe(false)
  })

  it('le jour en lettres, l’année si elle diffère ; l’heure à Paris', () => {
    const reference = new Date('2026-09-24T08:00:00.000Z')
    expect(jourEnLettres('2026-09-24', reference)).toBe('jeudi 24 septembre')
    expect(jourEnLettres('2027-03-28', reference)).toBe('dimanche 28 mars 2027')
    expect(() => jourEnLettres('2026-13-01', reference)).toThrow(RangeError)
    expect(heureAParis(new Date('2026-09-24T07:05:00.000Z'))).toBe('9 h 05')
    expect(heureAParis(new Date('2026-12-24T17:00:00.000Z'))).toBe('18 h')
  })
})
