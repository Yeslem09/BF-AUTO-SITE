import { describe, expect, it } from 'vitest'
import type { PrixChiffre, PrixInconnu } from './catalogue.js'
import {
  DEDUIT_DE_LA_REPARATION,
  formaterDate,
  formaterMontant,
  LIBELLE_GRATUIT,
  LIBELLE_PRIX_SUR_DEVIS,
  LIBELLE_SUR_DEMANDE,
  presenterForfait,
  presenterTarif,
} from './prix.js'

const INSECABLE = '\u00a0'
const FINE_INSECABLE = '\u202f'

const FORFAIT: PrixChiffre = {
  nature: 'chiffre',
  statut: 'valide',
  source: null,
  note: null,
  montantTtcCentimes: 8900,
  aPartirDe: false,
  vehiculeReference: 'citadine essence',
  comprend: 'plaquettes avant et main-d’œuvre',
  dateEffet: { annee: 2026, mois: 10, jour: 1 },
  duree: null,
  deduitDeLaReparation: null,
}

const INCONNU: PrixInconnu = { nature: 'inconnu', statut: 'a_valider', note: 'À obtenir.' }

describe('format unique des montants', () => {
  it.each([
    [8900, `89,00${INSECABLE}€`],
    [7990, `79,90${INSECABLE}€`],
    [5, `0,05${INSECABLE}€`],
    [123456, `1${FINE_INSECABLE}234,56${INSECABLE}€`],
    [100000000, `1${FINE_INSECABLE}000${FINE_INSECABLE}000,00${INSECABLE}€`],
  ])('%i centimes s’écrivent « %s »', (centimes, attendu) => {
    expect(formaterMontant(centimes)).toBe(attendu)
  })
})

describe('dates d’effet', () => {
  it.each([
    [{ annee: 2026, mois: 10, jour: 1 }, '1er octobre 2026'],
    [{ annee: 2026, mois: 3, jour: 15 }, '15 mars 2026'],
    [{ annee: 2027, mois: 8, jour: 2 }, '2 août 2027'],
    [{ annee: 2026, mois: 12, jour: 31 }, '31 décembre 2026'],
  ])('%o s’écrit « %s »', (date, attendu) => {
    expect(formaterDate(date)).toBe(attendu)
  })
})

describe('présentation d’un forfait de famille', () => {
  it('chiffré : montant TTC, contenu, et la référence (véhicule et date) à part, dite une fois par tableau', () => {
    expect(presenterForfait(FORFAIT)).toEqual({
      montant: `89,00${INSECABLE}€${INSECABLE}TTC`,
      precisions: ['Comprend : plaquettes avant et main-d’œuvre'],
      reference: 'Exemple : citadine essence, prix au 1er octobre 2026',
      indicatif: `89,00${INSECABLE}€${INSECABLE}TTC`,
      estPublie: true,
    })
  })

  it('« à partir de » : le montant le dit, « dès » dans une phrase, et le véhicule de référence reste nommé', () => {
    const presente = presenterForfait({ ...FORFAIT, aPartirDe: true })
    expect(presente.montant).toBe(`À partir de 89,00${INSECABLE}€${INSECABLE}TTC`)
    expect(presente.indicatif).toBe(`dès 89,00${INSECABLE}€${INSECABLE}TTC`)
    expect(presente.reference).toBe('Exemple : citadine essence, prix au 1er octobre 2026')
  })

  it('sur devis : « Sur devis après examen », sans montant ni précision', () => {
    expect(
      presenterForfait({
        nature: 'sur-devis',
        statut: 'a_valider',
        source: 'étude',
        note: 'À confirmer.',
        precision: 'après examen',
      }),
    ).toEqual({
      montant: 'Sur devis après examen',
      precisions: [],
      reference: null,
      indicatif: 'sur devis après examen',
      estPublie: true,
    })
  })

  it('inconnu : « Prix sur devis », sans montant ni précision', () => {
    expect(presenterForfait(INCONNU)).toEqual({
      montant: LIBELLE_PRIX_SUR_DEVIS,
      precisions: [],
      reference: null,
      indicatif: 'prix sur devis',
      estPublie: false,
    })
    expect(LIBELLE_PRIX_SUR_DEVIS).toBe('Prix sur devis')
  })
})

describe('présentation d’un tarif transverse', () => {
  const tarif: PrixChiffre = {
    ...FORFAIT,
    montantTtcCentimes: 6500,
    comprend: 'une heure de main-d’œuvre',
    vehiculeReference: null,
    dateEffet: { annee: 2026, mois: 9, jour: 1 },
  }

  it('chiffré : montant, contenu et date, sans véhicule de référence', () => {
    expect(presenterTarif(tarif)).toEqual({
      montant: `65,00${INSECABLE}€${INSECABLE}TTC`,
      precisions: ['Comprend : une heure de main-d’œuvre'],
      reference: 'Prix au 1er septembre 2026',
      indicatif: `65,00${INSECABLE}€${INSECABLE}TTC`,
      estPublie: true,
    })
  })

  it('premier contrôle : ce qu’il comprend, sa durée, et s’il est déduit de la réparation', () => {
    const presente = presenterTarif({
      ...tarif,
      montantTtcCentimes: 2900,
      comprend: 'écoute du bruit et essai',
      duree: '30 minutes environ',
      deduitDeLaReparation: true,
    })
    expect(presente.precisions).toEqual([
      'Comprend : écoute du bruit et essai',
      'Durée : 30 minutes environ',
      DEDUIT_DE_LA_REPARATION,
    ])
  })

  it('à zéro : « Gratuit », un fait et non une donnée inconnue', () => {
    expect(presenterTarif({ ...tarif, montantTtcCentimes: 0 }).montant).toBe(LIBELLE_GRATUIT)
    expect(LIBELLE_GRATUIT).toBe('Gratuit')
  })

  it('inconnu : « Sur demande », jamais un zéro', () => {
    const presente = presenterTarif(INCONNU)
    expect(presente).toEqual({
      montant: LIBELLE_SUR_DEMANDE,
      precisions: [],
      reference: null,
      indicatif: 'sur demande',
      estPublie: false,
    })
    expect(presente.montant).not.toMatch(/\d/)
  })
})
