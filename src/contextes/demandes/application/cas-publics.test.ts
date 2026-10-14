import type { AnnoncerRappel, MomentReponse } from '../../../contrats/index.js'
import { afterEach, describe, expect, it } from 'vitest'
import { creerDemande, type ContenuDemande } from '../domaine/demande.js'
import { HEURE_MS } from '../domaine/temps.js'
import {
  DEMI_JOURNEES_ESSAI,
  EXCLUSIONS_ESSAI,
  FAMILLE_ESSAI,
  OFFRE_PIECES_ESSAI,
  environnementEssai,
  journalMemoire,
  horlogePilotee,
  INSTANT_ESSAI,
  type EnvironnementEssai,
} from '../essai.js'
import { creerSignatureJetonsHmac } from '../adaptateurs/jetons/signature-jetons-hmac.js'
import { creerConsulterConfirmation } from './consulter-confirmation.js'
import { creerPreparerFormulaire } from './preparer-formulaire.js'

let environnement: EnvironnementEssai | null = null

afterEach(() => {
  environnement?.base.close()
  environnement = null
})

const CONTENU: ContenuDemande = {
  type: 'rendez-vous',
  sujet: { nature: 'objet', objet: 'entretien' },
  creneaux: [{ code: 'le-plus-tot', libelle: 'Le plus tôt possible' }],
  vehicule: null,
  pieces: [],
  gamme: null,
  modalite: null,
  contact: {
    prenom: 'Julie',
    telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
    moment: 'matin',
  },
  precisions: null,
}

describe('préparer le formulaire unique', () => {
  const vide = { type: '', famille: '', prediagnostic: '' }

  it('sans type reconnu, propose le rappel', async () => {
    environnement = environnementEssai()
    const formulaire = await environnement.preparerFormulaire({ ...vide, type: '<b>reserver</b>' })
    expect(formulaire.type).toBe('rappel')
    expect(environnement.jetons.lire(formulaire.jeton)).toEqual({
      nature: 'formulaire',
      emisLe: INSTANT_ESSAI,
    })
  })

  it('les années du véhicule suivent le calendrier de Paris (nuit du Nouvel An)', async () => {
    environnement = environnementEssai()
    environnement.horloge.regler(new Date('2026-12-31T23:30:00.000Z'))
    const formulaire = await environnement.preparerFormulaire({ ...vide, type: 'devis' })
    expect(formulaire.anneeCourante).toBe(2027)
  })

  it('résout la famille pour un devis ou un rendez-vous, jamais pour un rappel', async () => {
    environnement = environnementEssai()
    const env = environnement
    expect(
      (await env.preparerFormulaire({ ...vide, type: 'devis', famille: 'freinage' })).famille,
    ).toEqual(FAMILLE_ESSAI)
    expect(
      (await env.preparerFormulaire({ ...vide, type: 'rappel', famille: 'freinage' })).famille,
    ).toBeNull()
    expect(
      (await env.preparerFormulaire({ ...vide, type: 'devis', famille: 'inconnue' })).famille,
    ).toBeNull()
  })

  it('joint le résumé du pré-diagnostic à un rappel, avec son code', async () => {
    environnement = environnementEssai()
    const formulaire = await environnement.preparerFormulaire({
      ...vide,
      type: 'rappel',
      prediagnostic: 'code-urgent',
    })
    expect(formulaire.preDiagnostic?.code).toBe('code-urgent')
    expect(formulaire.preDiagnostic?.resume.urgence).toBe('ne-pas-rouler')
  })

  it('les demi-journées ne sont demandées que pour un rendez-vous', async () => {
    environnement = environnementEssai()
    expect(
      (await environnement.preparerFormulaire({ ...vide, type: 'rendez-vous' })).demiJournees,
    ).toEqual(DEMI_JOURNEES_ESSAI)
    expect(
      (await environnement.preparerFormulaire({ ...vide, type: 'devis' })).demiJournees,
    ).toEqual([])
  })

  it('une capacité voisine en panne n’empêche pas d’écrire au garage', async () => {
    const journal = journalMemoire()
    const preparer = creerPreparerFormulaire({
      horloge: horlogePilotee(INSTANT_ESSAI),
      jetons: creerSignatureJetonsHmac(Buffer.alloc(32, 1)),
      journal,
      trouverFamille: async () => {
        throw new Error('catalogue indisponible')
      },
      retrouverResumePreDiagnostic: async () => null,
      proposerDemiJournees: async () => {
        throw new Error('horaires illisibles')
      },
      listerCeQueNousNeFaisonsPas: async () => {
        throw new Error('catalogue illisible')
      },
      consulterOffrePieces: async () => {
        throw new Error('catalogue illisible')
      },
    })
    const formulaire = await preparer({ ...vide, type: 'rendez-vous', famille: 'freinage' })
    expect(formulaire.famille).toBeNull()
    expect(formulaire.demiJournees).toEqual([])
    expect(formulaire.ceQueNousNeFaisonsPas).toEqual([])
    expect(journal.lignes.filter((ligne) => ligne.niveau === 'erreur')).toHaveLength(3)
    const devis = await preparer({ ...vide, type: 'devis' })
    expect(devis.offrePieces).toEqual({ engagementVerification: null, venteAuComptoir: false })
  })

  it('reprend « Ce que nous ne faisons pas » sur tout type, l’engagement sur le devis seul', async () => {
    environnement = environnementEssai()
    const rappel = await environnement.preparerFormulaire({ ...vide, type: 'rappel' })
    expect(rappel.ceQueNousNeFaisonsPas).toEqual(EXCLUSIONS_ESSAI)
    expect(rappel.offrePieces.engagementVerification).toBeNull()
    const devis = await environnement.preparerFormulaire({ ...vide, type: 'devis' })
    expect(devis.offrePieces).toEqual(OFFRE_PIECES_ESSAI)
  })
})

describe('consulter la confirmation (US-12, US-13)', () => {
  async function avecDemande(annoncer: AnnoncerRappel) {
    environnement = environnementEssai()
    const env = environnement
    await env.depot.enregistrer(
      creerDemande(CONTENU, { id: 'id-1', recueLe: env.horloge.maintenant() }),
      { formulaire: 'f', confirmation: 'jeton-de-confirmation-1' },
    )
    return {
      env,
      consulter: creerConsulterConfirmation({
        depot: env.depot,
        horloge: env.horloge,
        journal: env.journal,
        annoncerRappel: annoncer,
      }),
    }
  }

  it('dans l’heure, montre la demande et la suite annoncée par le garage', async () => {
    let envoiRecu: Date | null = null
    let momentRecu: MomentReponse | null = null
    const { env, consulter } = await avecDemande(async (envoi, moment) => {
      envoiRecu = envoi
      momentRecu = moment
      return 'Nous vous rappelons jeudi, en fin de journée.'
    })
    env.horloge.avancer(HEURE_MS)
    const confirmation = await consulter('jeton-de-confirmation-1')
    expect(confirmation).toMatchObject({
      etat: 'disponible',
      suite: 'Nous vous rappelons jeudi, en fin de journée.',
    })
    expect(envoiRecu).toEqual(INSTANT_ESSAI)
    // Le garage reçoit le moment où le client peut répondre (AT-3, US-13).
    expect(momentRecu).toBe(CONTENU.contact.moment)
  })

  it('après une heure, la page devient neutre', async () => {
    const { env, consulter } = await avecDemande(async () => null)
    env.horloge.avancer(HEURE_MS + 1)
    expect(await consulter('jeton-de-confirmation-1')).toEqual({ etat: 'neutre' })
  })

  it('un jeton inconnu ou modifié d’un caractère est introuvable', async () => {
    const { consulter } = await avecDemande(async () => null)
    expect(await consulter('jeton-de-confirmation-2')).toEqual({ etat: 'introuvable' })
    expect(await consulter('')).toEqual({ etat: 'introuvable' })
    expect(await consulter('x'.repeat(200))).toEqual({ etat: 'introuvable' })
  })

  it('si le garage ne sait pas annoncer la suite, rien n’est promis et la page s’affiche', async () => {
    const { env, consulter } = await avecDemande(async () => {
      throw new Error('horaires illisibles')
    })
    expect(await consulter('jeton-de-confirmation-1')).toMatchObject({
      etat: 'disponible',
      suite: null,
    })
    expect(env.journal.lignes.at(-1)?.niveau).toBe('erreur')
  })
})
