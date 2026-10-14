import { afterEach, describe, expect, it } from 'vitest'
import { creerDemande, type ContenuDemande } from '../domaine/demande.js'
import { redigerSms } from '../domaine/message-sms.js'
import { referenceDeDemande } from '../domaine/reference.js'
import { HEURE_MS } from '../domaine/temps.js'
import { validerDemande } from '../domaine/validation.js'
import { environnementEssai, resumeEssai, saisieEssai, type EnvironnementEssai } from '../essai.js'
import { creerNotifierDemande } from './notifier-demande.js'
import type { EvenementBoite, SourceBoite } from './ports.js'
import { creerReleverBoite } from './relever-boite.js'
import { creerSurveillerNotifications } from './surveiller-notifications.js'

const GARAGE = 'garage@gmail.com'
const ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
let env: EnvironnementEssai

afterEach(() => env.base.close())

function contenu(): ContenuDemande {
  const validation = validerDemande(saisieEssai('rappel'), {
    demiJournees: [],
    anneeCourante: 2026,
    famille: null,
    resume: null,
    venteAuComptoir: false,
  })
  if (!validation.ok) throw new Error('saisie d’essai invalide')
  return validation.contenu
}

async function enregistrer(id: string = ID, surcharge: Partial<ContenuDemande> = {}) {
  await env.depot.enregistrer(
    creerDemande({ ...contenu(), ...surcharge }, { id, recueLe: env.horloge.maintenant() }),
    { formulaire: `f-${id}`, confirmation: `c-${id}` },
  )
}

async function demande(id: string = ID) {
  const lecture = await env.depot.trouver(id)
  if (lecture.etat !== 'trouvee') throw new Error('demande introuvable')
  return lecture.demande
}

/** Source de boîte d'essai : rend les événements donnés, compte les confirmations. */
function source(evenements: EvenementBoite[]): SourceBoite & { confirmations: number } {
  const doublure = {
    confirmations: 0,
    relever: async () => ({
      evenements,
      confirmer: async () => {
        doublure.confirmations += 1
      },
    }),
  }
  return doublure
}

const reponse = (surcharge: Partial<Extract<EvenementBoite, { nature: 'reponse' }>> = {}) =>
  ({
    nature: 'reponse',
    references: [referenceDeDemande(ID)],
    recueLe: new Date('2026-09-16T09:00:00Z'),
    expediteur: GARAGE,
    commandeTraitee: true,
    authentificationEchouee: false,
    ...surcharge,
  }) as const

function relever(evenements: EvenementBoite[]) {
  const doublure = source(evenements)
  const cas = creerReleverBoite({
    depot: env.depot,
    source: doublure,
    horloge: env.horloge,
    journal: env.journal,
    expediteursAdmis: [GARAGE],
  })
  return { cas, doublure }
}

describe('réponses du garagiste lues dans la boîte (US-C22, US-C23)', () => {
  it('« fait » du garagiste range la demande « Traitée » et confirme le relevé', async () => {
    env = environnementEssai()
    await enregistrer()
    const { cas, doublure } = relever([reponse()])
    await cas.relever()
    const rangee = await demande()
    expect(rangee.statut).toBe('traitee')
    expect(rangee.statutChangeLe).toEqual(env.horloge.maintenant())
    expect(doublure.confirmations).toBe(1)
  })

  it('une réponse non reconnue ne change rien mais s’affiche sur la fiche', async () => {
    env = environnementEssai()
    await enregistrer()
    await relever([reponse({ commandeTraitee: false })]).cas.relever()
    expect((await demande()).statut).toBe('a-rappeler')
    expect(await env.depot.suiviCourriel(ID)).toEqual({
      reponseNonReconnueLe: new Date('2026-09-16T09:00:00Z'),
      nonRemise: null,
    })
  })

  it('un autre expéditeur, ou une authentification en échec, ne commande rien', async () => {
    env = environnementEssai()
    await enregistrer()
    await relever([
      reponse({ expediteur: 'intrus@exemple.test' }),
      reponse({ authentificationEchouee: true }),
    ]).cas.relever()
    expect((await demande()).statut).toBe('a-rappeler')
  })

  it('une référence inconnue est ignorée ; le relevé est quand même confirmé', async () => {
    env = environnementEssai()
    await enregistrer()
    const { cas, doublure } = relever([reponse({ references: ['BF-000000'] })])
    await cas.relever()
    expect((await demande()).statut).toBe('a-rappeler')
    expect(doublure.confirmations).toBe(1)
  })

  it('un courriel revenu en erreur remet la notification en échec et nomme le motif', async () => {
    env = environnementEssai()
    await enregistrer()
    await env.depot.enregistrerNotification(ID, {
      etat: 'envoyee',
      envoyeeLe: env.horloge.maintenant(),
    })
    await relever([
      {
        nature: 'non-remise',
        references: [referenceDeDemande(ID)],
        recueLe: new Date('2026-09-16T09:05:00Z'),
        motif: '5.1.1, 550 User unknown',
      },
    ]).cas.relever()
    const { notification } = await demande()
    expect(notification).toMatchObject({
      etat: 'en-echec',
      derniereErreur: 'Notification non remise : 5.1.1, 550 User unknown',
    })
    expect((await env.depot.suiviCourriel(ID)).nonRemise).toEqual({
      le: new Date('2026-09-16T09:05:00Z'),
      motif: '5.1.1, 550 User unknown',
    })
  })

  it('une boîte injoignable depuis plus d’une heure dégrade la sonde, puis se rétablit', async () => {
    env = environnementEssai()
    let enPanne = true
    const cas = creerReleverBoite({
      depot: env.depot,
      source: {
        relever: async () => {
          if (enPanne) throw new Error('IMAP injoignable')
          return { evenements: [], confirmer: async () => undefined }
        },
      },
      horloge: env.horloge,
      journal: env.journal,
      expediteursAdmis: [GARAGE],
    })
    const surveiller = creerSurveillerNotifications({
      depot: env.depot,
      horloge: env.horloge,
      releveEnEchecDepuis: () => cas.enEchecDepuis(),
    })
    await cas.relever()
    expect((await surveiller()).etat).toBe('ok')
    env.horloge.avancer(2 * HEURE_MS)
    await cas.relever()
    expect(await surveiller()).toEqual({
      etat: 'degradee',
      echecsDurables: 0,
      connecteursEnEchec: ['Lecture de la boîte'],
    })
    enPanne = false
    await cas.relever()
    expect((await surveiller()).etat).toBe('ok')
  })
})

describe('SMS « Ne roulez pas » au premier essai (US-C24)', () => {
  it('part une seule fois, en plus du courriel, et son échec n’empêche pas le courriel', async () => {
    env = environnementEssai()
    await enregistrer(ID, {
      type: 'rappel',
      sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') },
    })
    const sms: string[] = []
    const notifier = creerNotifierDemande({
      depot: env.depot,
      notificateur: env.notificateur,
      horloge: env.horloge,
      journal: env.journal,
      lienFiche: (id) => `https://garage.exemple/garagiste/demandes/${id}`,
      alerteSms: {
        envoyer: async (texte) => {
          sms.push(texte)
          throw new Error('crédits épuisés')
        },
      },
    })
    env.notificateur.enPanne(true)
    await notifier(ID)
    env.notificateur.enPanne(false)
    env.horloge.avancer(HEURE_MS)
    await notifier(ID)
    expect(sms).toEqual([redigerSms(await demande())])
    expect((await demande()).notification.etat).toBe('envoyee')
    expect(
      env.journal.lignes.some((ligne) =>
        ligne.message.startsWith('SMS « Ne roulez pas » non envoyé'),
      ),
    ).toBe(true)
  })
})
