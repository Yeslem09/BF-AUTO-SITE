import { describe, expect, it } from 'vitest'
import { creerMessagerieRetenue } from '../essai/doublures.js'
import { creerAlerteur } from './alerteur.js'
import { creerMessagerieConsole } from './messagerie-console.js'
import { creerExpediteurSmtp } from '../../../../infrastructure/courriel/envoi/expediteur-smtp.js'
import { creerMessagerieCourriel } from './messagerie-courriel.js'

const MESSAGE = {
  destinataire: 'garagiste@exemple.fr',
  objet: 'Votre lien de connexion',
  texte: 'Voici le lien : https://garage.exemple/garagiste/connexion/lien?jeton=abc',
}

describe('messagerie console', () => {
  it('écrit le message complet sur la sortie, sans rien envoyer', async () => {
    const ecrits: string[] = []
    await creerMessagerieConsole((texte) => ecrits.push(texte)).envoyer(MESSAGE)
    expect(ecrits).toHaveLength(1)
    expect(ecrits[0]).toContain('aucun envoi réel')
    expect(ecrits[0]).toContain('À : garagiste@exemple.fr')
    expect(ecrits[0]).toContain('Objet : Votre lien de connexion')
    expect(ecrits[0]).toContain('jeton=abc')
  })
})

describe('messagerie par l’expéditeur partagé', () => {
  it('confie le message à l’expéditeur, sans référence de demande', async () => {
    const envoyes: unknown[] = []
    await creerMessagerieCourriel({
      canal: 'smtp',
      envoyer: async (courriel) => {
        envoyes.push(courriel)
        return { identifiantMessage: '<x@exemple.fr>' }
      },
      verifier: async () => undefined,
    }).envoyer(MESSAGE)
    expect(envoyes).toEqual([
      { destinataire: MESSAGE.destinataire, objet: MESSAGE.objet, texte: MESSAGE.texte },
    ])
  })

  it('remonte l’échec du serveur d’envoi au lieu de le taire', async () => {
    const messagerie = creerMessagerieCourriel(
      creerExpediteurSmtp({
        fournisseur: 'personnalise',
        serveur: { hote: '127.0.0.1', port: 1, securise: false },
        utilisateur: null,
        motDePasse: null,
        expediteur: 'site@bf-auto.exemple',
        nomExpediteur: null,
        repondreA: null,
      }),
    )
    await expect(messagerie.envoyer(MESSAGE)).rejects.toThrow(/injoignable/)
  })
})

describe('alerteur', () => {
  it('prévient Anthony par son canal', async () => {
    const messagerie = creerMessagerieRetenue()
    await creerAlerteur({
      messagerie,
      destinataire: 'anthony@exemple.fr',
      remise: 'courriel',
    }).alerter('Objet', 'Texte')
    expect(messagerie.envoyes).toEqual([
      { destinataire: 'anthony@exemple.fr', objet: 'Objet', texte: 'Texte' },
    ])
  })

  it('écrit l’alerte au journal d’erreur quand aucun canal n’existe ou que l’envoi échoue', async () => {
    const journal: string[] = []
    await creerAlerteur(null, (texte) => journal.push(texte)).alerter('Objet', 'Texte')
    const messagerie = creerMessagerieRetenue()
    messagerie.tomberEnPanne()
    await creerAlerteur(
      { messagerie, destinataire: 'anthony@exemple.fr', remise: 'courriel' },
      (texte) => journal.push(texte),
    ).alerter('Objet', 'Texte')
    expect(journal).toHaveLength(2)
    expect(journal[0]).toContain('aucune adresse d’alerte configurée')
    expect(journal[1]).toContain('envoi de l’alerte impossible')
  })
})
