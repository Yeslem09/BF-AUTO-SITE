import { describe, expect, it } from 'vitest'
import { ErreurDonneesDemandes } from './erreurs.js'
import { lireParametresDemandes } from './parametres.js'

function probleme(contenu: unknown): readonly string[] {
  try {
    lireParametresDemandes(contenu)
  } catch (erreur) {
    if (erreur instanceof ErreurDonneesDemandes) return erreur.problemes
    throw erreur
  }
  throw new Error('aucune erreur levée')
}

describe('paramètres des demandes (donnees/demandes.json)', () => {
  it('lit un numéro de rappel à valider accompagné d’une proposition', () => {
    expect(
      lireParametresDemandes({
        commentaire: 'libre',
        numero_rappel: { valeur: '06 05 92 28 38', statut: 'a_valider', source: 'proposition' },
      }),
    ).toEqual({
      numeroRappel: {
        telephone: { affichable: '06 05 92 28 38', lien: 'tel:+33605922838' },
        statut: 'a_valider',
      },
    })
  })

  it('un numéro validé doit avoir une valeur', () => {
    expect(
      probleme({ numero_rappel: { valeur: null, statut: 'valide', source: 'garagiste' } }),
    ).toEqual(['numero_rappel.valeur : obligatoire quand le statut est « valide »'])
  })

  it('rassemble tous les problèmes : clé inconnue, statut, source, numéro', () => {
    expect(
      probleme({
        inconnue: 1,
        numero_rappel: { valeur: '123', statut: 'peut-etre', source: '', autre: true },
      }),
    ).toEqual([
      'clé inconnue « inconnue »',
      'numero_rappel : clé inconnue « autre »',
      'numero_rappel.statut : « valide » ou « a_valider » attendu',
      'numero_rappel.source : texte attendu (qui a donné ou proposé la valeur)',
      'numero_rappel.valeur : numéro français ou null attendu',
    ])
  })

  it('refuse une racine qui n’est pas un objet', () => {
    expect(probleme([])).toEqual(['la racine doit être un objet'])
  })
})
