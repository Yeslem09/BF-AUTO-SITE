import { describe, expect, it } from 'vitest'
import { creerMessagerieRetenue } from '../adaptateurs/essai/doublures.js'
import { creerSignalerChangement } from './signaler-changement.js'

const RESPONSABLE = 'anthony@exemple.fr'

describe('signaler un changement (US-49)', () => {
  it('envoie un message structuré à Anthony et rien d’autre', async () => {
    const messagerie = creerMessagerieRetenue()
    const signaler = creerSignalerChangement({
      canalResponsable: { messagerie, destinataire: RESPONSABLE, remise: 'courriel' },
    })
    const resultat = await signaler({ nature: 'horaires', texte: 'Fermeture à 18 h le samedi' })
    expect(resultat).toEqual({
      issue: 'envoye',
      signalement: { nature: 'horaires', texte: 'Fermeture à 18 h le samedi' },
      remise: 'courriel',
    })
    expect(messagerie.envoyes).toHaveLength(1)
    expect(messagerie.envoyes[0]?.destinataire).toBe(RESPONSABLE)
    expect(messagerie.envoyes[0]?.objet).toBe('Signalement du garagiste : Horaires habituels')
  })

  it('n’envoie rien d’une saisie invalide, et la rend avec ses erreurs', async () => {
    const messagerie = creerMessagerieRetenue()
    const resultat = await creerSignalerChangement({
      canalResponsable: { messagerie, destinataire: RESPONSABLE, remise: 'courriel' },
    })({ nature: 'inconnue', texte: 'Un texte' })
    expect(resultat).toEqual({
      issue: 'invalide',
      saisie: { nature: 'inconnue', texte: 'Un texte' },
      erreurs: { nature: 'Choisissez ce qui change.' },
    })
    expect(messagerie.envoyes).toEqual([])
  })

  it('dit ce qu’est devenu le message : écrit au journal quand aucun serveur d’envoi n’existe', async () => {
    const messagerie = creerMessagerieRetenue()
    const resultat = await creerSignalerChangement({
      canalResponsable: { messagerie, destinataire: RESPONSABLE, remise: 'journal' },
    })({ nature: 'prix', texte: 'Nouveau prix' })
    expect(resultat.issue === 'envoye' && resultat.remise).toBe('journal')
  })

  it('garde le texte quand l’envoi échoue ou que l’adresse d’Anthony manque', async () => {
    const messagerie = creerMessagerieRetenue()
    messagerie.tomberEnPanne()
    const enPanne = await creerSignalerChangement({
      canalResponsable: { messagerie, destinataire: RESPONSABLE, remise: 'courriel' },
    })({ nature: 'prix', texte: 'Nouveau prix' })
    expect(enPanne.issue).toBe('echec-envoi')
    expect(enPanne.issue !== 'envoye' && enPanne.saisie).toEqual({
      nature: 'prix',
      texte: 'Nouveau prix',
    })
    const sansAdresse = await creerSignalerChangement({ canalResponsable: null })({
      nature: 'prix',
      texte: 'Nouveau prix',
    })
    expect(sansAdresse).toEqual({
      issue: 'canal-absent',
      saisie: { nature: 'prix', texte: 'Nouveau prix' },
    })
  })
})
