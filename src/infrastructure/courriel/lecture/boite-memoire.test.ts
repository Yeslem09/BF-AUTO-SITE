import { describe, expect, it } from 'vitest'
import { creerBoiteMemoire } from './boite-memoire.js'
import {
  courrielClient,
  nonRemiseEtrangere,
  nonRemiseGmail,
  notificationDuSite,
  reponseAutomatique,
  reponseGmail,
} from './essai/echantillons.js'

describe('boîte de réception en mémoire', () => {
  it('le premier relevé ne lit rien de l’existant, le suivant lit les nouveautés une seule fois', async () => {
    const boite = creerBoiteMemoire()
    boite.deposer(reponseGmail('Fait'))
    const premier = await boite.relever(null)
    expect(premier.messages).toEqual([])
    expect(premier.filigrane.dernierUid).toBe(1)

    const uidReponse = boite.deposer(reponseGmail('Rappelé'))
    const second = await boite.relever(premier.filigrane)
    expect(second.messages).toHaveLength(1)
    expect(second.messages[0]).toMatchObject({ uid: uidReponse, commande: 'marquer-traitee' })

    const troisieme = await boite.relever(second.filigrane)
    expect(troisieme.messages).toEqual([])
    expect(troisieme.filigrane).toEqual(second.filigrane)
  })

  it('ne lit le contenu que des réponses et rapports du site (US-C04)', async () => {
    const boite = creerBoiteMemoire()
    const depart = await boite.relever(null)
    const client = boite.deposer(courrielClient())
    boite.deposer(notificationDuSite())
    boite.deposer(reponseAutomatique())
    boite.deposer(nonRemiseEtrangere())
    const reponse = boite.deposer(reponseGmail('Fait'))
    const rapport = boite.deposer(nonRemiseGmail())
    const releve = await boite.relever(depart.filigrane)
    expect(releve.messages.map((message) => [message.uid, message.nature])).toEqual([
      [reponse, 'reponse'],
      [rapport, 'non-remise'],
    ])
    expect(boite.contenusLus).toEqual([reponse, rapport])
    expect(boite.contenusLus).not.toContain(client)
    expect(releve.ecartes).toBe(3)
  })

  it('un dossier recréé fait repartir de la fin, et le relevé le dit', async () => {
    const boite = creerBoiteMemoire()
    const depart = await boite.relever(null)
    boite.deposer(reponseGmail('Fait'))
    boite.recreerDossier()
    const releve = await boite.relever(depart.filigrane)
    expect(releve.reinitialise).toBe(true)
    expect(releve.messages).toEqual([])
  })

  it('liste les messages référencés récents sans filigrane, et se vérifie', async () => {
    const boite = creerBoiteMemoire()
    boite.deposer(reponseGmail('Fait'), new Date('2026-09-01T00:00:00Z'))
    boite.deposer(reponseGmail('Traité'), new Date('2026-09-22T00:00:00Z'))
    const recents = await boite.listerRecents(new Date('2026-09-16T00:00:00Z'))
    expect(recents.map((message) => message.nature === 'reponse' && message.texte)).toEqual([
      'Traité',
    ])
    expect(await boite.verifier()).toEqual({ dossier: 'INBOX', messages: 2 })
  })
})
