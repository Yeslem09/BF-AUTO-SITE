import { describe, expect, it } from 'vitest'
import { ETAT_INITIAL } from '../../domaine/parcours.js'
import {
  adresseEtat,
  adresseRappel,
  adresseSymptome,
  estRequeteVide,
  lireEtat,
} from './adresses.js'

describe('état du parcours dans l’adresse', () => {
  it('lit les paramètres simples et répétés', () => {
    expect(
      lireEtat({
        q1: 'bruit',
        q2: ['aucun', 'ne-sais-pas'],
        r: 'freinage',
        coche: ['x'],
        etape: 'y',
      }),
    ).toEqual({
      symptome: 'bruit',
      signes: ['aucun', 'ne-sais-pas'],
      reponses: ['freinage'],
      coches: ['x'],
      etapeEnvoyee: 'y',
    })
  })

  it('ignore tout ce qui n’est pas un texte, et une requête absente', () => {
    expect(lireEtat({ q1: 12, q2: [{ a: 1 }, 'aucun'], r: null })).toEqual({
      ...ETAT_INITIAL,
      signes: ['aucun'],
    })
    expect(lireEtat(undefined)).toEqual(ETAT_INITIAL)
    expect(lireEtat('q1=bruit')).toEqual(ETAT_INITIAL)
  })

  it('borne le nombre de valeurs d’un même paramètre', () => {
    expect(lireEtat({ r: Array.from({ length: 50 }, () => 'x') }).reponses.length).toBe(12)
  })

  it('écrit l’adresse d’une étape, et l’entrée nue sans rien', () => {
    expect(adresseEtat(ETAT_INITIAL)).toBe('/pre-diagnostic')
    expect(adresseSymptome('voyant')).toBe('/pre-diagnostic?q1=voyant')
    expect(
      adresseEtat({
        ...ETAT_INITIAL,
        symptome: 'bruit',
        signes: ['aucun'],
        reponses: ['freinage'],
        coches: ['sifflement'],
      }),
    ).toBe('/pre-diagnostic?q1=bruit&q2=aucun&r=freinage&coche=sifflement')
  })

  it('relit ce qu’elle écrit', () => {
    const etat = { ...ETAT_INITIAL, symptome: 'bruit', signes: ['fumee-brule', 'aucun'] }
    const requete = Object.fromEntries(
      [...new URL(adresseEtat(etat), 'https://x').searchParams.entries()].reduce(
        (liste, [cle, valeur]) => {
          const existante = liste.get(cle)
          liste.set(cle, existante === undefined ? valeur : [existante, valeur].flat())
          return liste
        },
        new Map<string, string | string[]>(),
      ),
    )
    expect(lireEtat(requete)).toEqual(etat)
  })

  it('ouvre la demande de rappel préremplie avec le code du parcours', () => {
    expect(adresseRappel('bruit.aucun.freinage.sifflement')).toBe(
      '/demande?type=rappel&prediagnostic=bruit.aucun.freinage.sifflement',
    )
  })

  it('ne tient pour entrée nue que la requête vide', () => {
    expect(estRequeteVide({})).toBe(true)
    expect(estRequeteVide({ q1: 'x' })).toBe(false)
  })
})
