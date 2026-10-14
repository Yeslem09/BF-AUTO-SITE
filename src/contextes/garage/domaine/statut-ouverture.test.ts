import { describe, expect, it } from 'vitest'
import { calendrier, fermeture, plage, SEMAINE_ESSAI } from '../essais/calendrier-essai.js'
import type { PeriodeFermeture } from './fermeture.js'
import {
  calculerStatutOuverture,
  HORIZON_RECHERCHE_JOURS,
  LIBELLE_HORAIRES_A_CONFIRMER,
} from './statut-ouverture.js'
import { ajouterJours, dateIso } from './temps-local.js'

const statutA = (instantUtc: string, fermetures: readonly PeriodeFermeture[] = []) =>
  calculerStatutOuverture(calendrier(fermetures), new Date(instantUtc))

describe('statut d’ouverture, critères de US-02 (configuration d’essai)', () => {
  it('mercredi 15 juillet 2026, 18 h 30 à Paris : ouvert, ferme à 19 h', () => {
    expect(statutA('2026-07-15T16:30:00Z')).toEqual({
      etat: 'ouvert',
      libelle: 'Ouvert, ferme à 19 h',
    })
  })

  it('mercredi 15 juillet 2026, 19 h 30 à Paris : fermé, ouvre jeudi à 8 h 30, le jour nommé', () => {
    expect(statutA('2026-07-15T17:30:00Z')).toEqual({
      etat: 'ferme',
      libelle: 'Fermé, ouvre jeudi à 8 h 30',
    })
  })

  it('jamais « demain » : lu la nuit, il désignerait le jour qui commence', () => {
    const libelles = [
      '2026-07-15T17:30:00Z',
      '2026-07-15T22:30:00Z',
      '2026-01-11T09:00:00Z',
      '2026-10-23T17:00:00Z',
    ].map((instant) => statutA(instant).libelle)
    expect(libelles.some((libelle) => libelle.includes('demain'))).toBe(false)
  })

  it('mercredi 15 juillet 2026, 12 h 30 à Paris : fermé, rouvre à 14 h', () => {
    expect(statutA('2026-07-15T10:30:00Z')).toEqual({
      etat: 'ferme',
      libelle: 'Fermé, rouvre à 14 h',
    })
  })

  it('samedi 18 juillet 2026, 21 h à Paris : fermé, ouvre lundi à 8 h 30', () => {
    expect(statutA('2026-07-18T19:00:00Z').libelle).toBe('Fermé, ouvre lundi à 8 h 30')
  })

  it('lundi 26 octobre 2026, lendemain du passage à l’heure d’hiver', () => {
    expect(statutA('2026-10-26T07:15:00Z').libelle).toBe('Fermé, ouvre à 8 h 30')
    expect(statutA('2026-10-26T07:45:00Z').libelle).toBe('Ouvert, ferme à 12 h')
  })

  it('fermeture du 28 septembre au 7 octobre 2026, mardi 29 septembre : fermé exceptionnellement', () => {
    expect(statutA('2026-09-29T10:00:00Z', [fermeture('2026-09-28', '2026-10-07')])).toEqual({
      etat: 'ferme',
      libelle: 'Fermé exceptionnellement, ouvre le jeudi 8 octobre à 8 h 30',
    })
  })
})

describe('statut d’ouverture un jour ordinaire (lundi 5 janvier 2026, heure d’hiver UTC+1)', () => {
  it('juste après minuit : ouvre le jour même, pas « demain »', () => {
    expect(statutA('2026-01-04T23:30:00Z').libelle).toBe('Fermé, ouvre à 8 h 30')
  })

  it('à l’heure pile d’ouverture : ouvert', () => {
    expect(statutA('2026-01-05T07:30:00Z').libelle).toBe('Ouvert, ferme à 12 h')
  })

  it('une minute avant la fermeture, puis à 19 h pile', () => {
    expect(statutA('2026-01-05T17:59:00Z').libelle).toBe('Ouvert, ferme à 19 h')
    expect(statutA('2026-01-05T18:00:00Z').libelle).toBe('Fermé, ouvre mardi à 8 h 30')
  })

  it('le dimanche : fermé, ouvre lundi (ni « exceptionnellement » ni rouvre)', () => {
    expect(statutA('2026-01-11T09:00:00Z')).toEqual({
      etat: 'ferme',
      libelle: 'Fermé, ouvre lundi à 8 h 30',
    })
  })
})

describe('statut d’ouverture et fermetures exceptionnelles', () => {
  it('« Imprévu aujourd’hui » en pleine matinée : fermé exceptionnellement, ouvre jeudi', () => {
    expect(
      statutA('2026-09-23T08:00:00Z', [fermeture('2026-09-23', '2026-09-23', 'imprevu')]),
    ).toEqual({
      etat: 'ferme',
      libelle: 'Fermé exceptionnellement, ouvre jeudi à 8 h 30',
    })
  })

  it('veille d’une fermeture : l’annonce saute les jours fermés', () => {
    const noel = [fermeture('2026-12-25', '2026-12-26', 'jour-ferie')]
    expect(statutA('2026-12-24T18:30:00Z', noel).libelle).toBe('Fermé, ouvre lundi à 8 h 30')
  })

  it('un dimanche pris dans des congés reste « Fermé », sans « exceptionnellement »', () => {
    const conges = [fermeture('2026-09-26', '2026-09-28')]
    expect(statutA('2026-09-27T10:00:00Z', conges).libelle).toBe('Fermé, ouvre mardi à 8 h 30')
  })

  it('longue fermeture : annonce la date complète, « 1er » compris', () => {
    const aout = [fermeture('2026-08-01', '2026-08-31')]
    expect(statutA('2026-08-10T10:00:00Z', aout).libelle).toBe(
      'Fermé exceptionnellement, ouvre le mardi 1er septembre à 8 h 30',
    )
  })

  it('sans réouverture dans l’horizon de recherche : fermé, sans date inventée', () => {
    const debut = { annee: 2026, mois: 1, jour: 5 }
    const tres = {
      du: debut,
      au: ajouterJours(debut, HORIZON_RECHERCHE_JOURS + 1),
      motif: 'conges' as const,
    }
    expect(dateIso(tres.au)).toBe('2026-03-07')
    expect(statutA('2026-01-05T10:00:00Z', [tres])).toEqual({
      etat: 'ferme',
      libelle: 'Fermé exceptionnellement',
    })
  })
})

describe('statut d’ouverture et changements d’heure (Europe/Paris)', () => {
  it('vendredi 27 mars 2026, encore en heure d’hiver (UTC+1)', () => {
    expect(statutA('2026-03-27T07:29:00Z').libelle).toBe('Fermé, ouvre à 8 h 30')
    expect(statutA('2026-03-27T07:30:00Z').etat).toBe('ouvert')
  })

  it('lundi 30 mars 2026, passé en heure d’été (UTC+2)', () => {
    expect(statutA('2026-03-30T06:29:00Z').libelle).toBe('Fermé, ouvre à 8 h 30')
    expect(statutA('2026-03-30T06:30:00Z').libelle).toBe('Ouvert, ferme à 12 h')
    expect(statutA('2026-03-30T17:00:00Z').libelle).toBe('Fermé, ouvre mardi à 8 h 30')
  })

  it('le jour même du passage à l’heure d’été, un dimanche ouvert', () => {
    const dimancheOuvert = { ...SEMAINE_ESSAI, dimanche: [plage('09:00', '12:00')] }
    const statut = (instant: string) =>
      calculerStatutOuverture(calendrier([], dimancheOuvert), new Date(instant))
    expect(statut('2026-03-29T00:30:00Z').libelle).toBe('Fermé, ouvre à 9 h')
    expect(statut('2026-03-29T07:30:00Z').etat).toBe('ouvert')
  })

  it('vendredi 23 octobre 2026 (UTC+2) puis lundi 26 octobre (UTC+1)', () => {
    expect(statutA('2026-10-23T16:59:00Z').libelle).toBe('Ouvert, ferme à 19 h')
    expect(statutA('2026-10-23T17:00:00Z').libelle).toBe('Fermé, ouvre samedi à 8 h 30')
    expect(statutA('2026-10-26T17:59:00Z').libelle).toBe('Ouvert, ferme à 19 h')
    expect(statutA('2026-10-26T18:00:00Z').libelle).toBe('Fermé, ouvre mardi à 8 h 30')
  })
})

describe('horaires non publiables', () => {
  it('ne prétend ni ouvert ni fermé, quelle que soit l’heure', () => {
    for (const instant of [
      '2026-01-05T10:00:00Z',
      '2026-01-05T21:00:00Z',
      '2026-01-11T10:00:00Z',
    ]) {
      expect(calculerStatutOuverture({ semaine: null, fermetures: [] }, new Date(instant))).toEqual(
        {
          etat: 'a-confirmer',
          libelle: LIBELLE_HORAIRES_A_CONFIRMER,
        },
      )
    }
  })

  it('mais une fermeture déclarée pour aujourd’hui reste une certitude', () => {
    const imprevu = [fermeture('2026-01-05', '2026-01-05', 'imprevu')]
    expect(
      calculerStatutOuverture(
        { semaine: null, fermetures: imprevu },
        new Date('2026-01-05T10:00:00Z'),
      ),
    ).toEqual({
      etat: 'ferme',
      libelle: 'Fermé exceptionnellement aujourd’hui',
    })
  })
})
