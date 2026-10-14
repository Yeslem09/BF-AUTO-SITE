import { describe, expect, it } from 'vitest'
import {
  MESSAGES_VEHICULE,
  anneesProposees,
  decrireVehicule,
  lireVehicule,
  suffitPourUnDevis,
  type SaisieVehicule,
} from './vehicule.js'

const VIDE: SaisieVehicule = { plaque: '', marque: '', modele: '', annee: '', energie: '' }
const ANNEE_COURANTE = 2026

describe('objet valeur Vehicule', () => {
  it('un véhicule entièrement vide vaut null', () => {
    expect(lireVehicule(VIDE, ANNEE_COURANTE)).toEqual({ ok: true, vehicule: null })
  })

  it('normalise la plaque et lit marque, modèle, année et énergie dans leurs listes', () => {
    const lu = lireVehicule(
      {
        plaque: 'ab 123 cd',
        marque: 'peugeot',
        modele: '  208  ',
        annee: '2019',
        energie: 'essence',
      },
      ANNEE_COURANTE,
    )
    expect(lu).toEqual({
      ok: true,
      vehicule: {
        plaque: 'AB-123-CD',
        marque: 'peugeot',
        modele: '208',
        annee: 2019,
        energie: 'essence',
      },
    })
  })

  it('refuse chaque valeur hors de sa liste, champ par champ', () => {
    const lu = lireVehicule(
      {
        plaque: '12-AB',
        marque: 'lada-inconnue',
        modele: 'x'.repeat(41),
        annee: '1850',
        energie: 'vapeur',
      },
      ANNEE_COURANTE,
    )
    expect(lu).toEqual({
      ok: false,
      erreurs: {
        plaque: MESSAGES_VEHICULE.plaque,
        marque: MESSAGES_VEHICULE.marque,
        modele: MESSAGES_VEHICULE.modele,
        annee: MESSAGES_VEHICULE.annee,
        energie: MESSAGES_VEHICULE.energie,
      },
    })
  })

  it('le message de plaque donne un exemple de chaque format', () => {
    expect(MESSAGES_VEHICULE.plaque).toContain('AB-123-CD')
    expect(MESSAGES_VEHICULE.plaque).toContain('1234 AB 56')
  })

  it('refuse une année future, accepte « avant 1990 »', () => {
    expect(lireVehicule({ ...VIDE, annee: '2027' }, ANNEE_COURANTE).ok).toBe(false)
    expect(lireVehicule({ ...VIDE, annee: 'avant-1990' }, ANNEE_COURANTE)).toMatchObject({
      ok: true,
      vehicule: { annee: 'avant-1990' },
    })
  })

  it('propose les années de l’année en cours à 1990, la plus récente d’abord', () => {
    const annees = anneesProposees(ANNEE_COURANTE)
    expect(annees[0]).toBe(2026)
    expect(annees.at(-1)).toBe(1990)
    expect(annees).toHaveLength(37)
  })

  it('un devis se contente de la plaque, ou des quatre éléments réunis (P-07)', () => {
    const sans = { plaque: null, marque: null, modele: null, annee: null, energie: null }
    expect(suffitPourUnDevis(null)).toBe(false)
    expect(suffitPourUnDevis({ ...sans, plaque: 'AB-123-CD' })).toBe(true)
    expect(suffitPourUnDevis({ ...sans, marque: 'renault', modele: 'Clio', annee: 2015 })).toBe(
      false,
    )
    expect(
      suffitPourUnDevis({
        ...sans,
        marque: 'renault',
        modele: 'Clio',
        annee: 2015,
        energie: 'diesel',
      }),
    ).toBe(true)
  })

  it('se décrit en toutes lettres', () => {
    expect(
      decrireVehicule({
        plaque: 'AB-123-CD',
        marque: 'citroen',
        modele: 'C3',
        annee: 'avant-1990',
        energie: 'gpl',
      }),
    ).toBe('Citroën C3, Avant 1990, GPL, plaque AB-123-CD')
  })
})
