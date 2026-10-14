import { afterEach, describe, expect, it } from 'vitest'
import { creerDemande, type ContenuDemande } from '../domaine/demande.js'
import type { PromesseRappel } from '../domaine/promesse.js'
import { MINUTE_MS } from '../domaine/temps.js'
import {
  environnementEssai,
  journalMemoire,
  resumeEssai,
  type EnvironnementEssai,
} from '../essai.js'
import { creerCompterDemandesARappeler, creerListerRappelsPromis } from './capacites-espace.js'
import { creerChangerStatut } from './changer-statut.js'
import { creerConsulterFiche } from './consulter-fiche.js'
import { creerNoterTentative } from './noter-tentative.js'
import { creerPromettreRappel } from './promettre-rappel.js'

let environnement: EnvironnementEssai

afterEach(() => environnement.base.close())

const CONTENU: ContenuDemande = {
  type: 'rappel',
  sujet: { nature: 'motif', motif: 'souci' },
  creneaux: [],
  vehicule: null,
  pieces: [],
  gamme: null,
  modalite: null,
  contact: {
    prenom: 'Sophie',
    telephone: { affichable: '07 22 33 44 55', lien: 'tel:+33722334455' },
    moment: 'fin-de-journee',
  },
  precisions: null,
}

const URGENT: ContenuDemande = {
  ...CONTENU,
  sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') },
  contact: {
    prenom: 'Karim',
    telephone: { affichable: '06 11 22 33 44', lien: 'tel:+33611223344' },
    moment: 'matin',
  },
}

const cheminFiche = (id: string) => `/garagiste/demandes/${id}`

let rang = 0
async function enregistrer(
  env: EnvironnementEssai,
  contenu: ContenuDemande,
  promesse: PromesseRappel | null = null,
  decalageMinutes = 0,
): Promise<string> {
  rang += 1
  const id = `00000000-0000-4000-8000-${String(rang).padStart(12, '0')}`
  const recueLe = new Date(env.horloge.maintenant().getTime() + decalageMinutes * MINUTE_MS)
  await env.depot.enregistrer(creerDemande(contenu, { id, recueLe, promesse }), {
    formulaire: `f-${id}`,
    confirmation: `c-${id}`,
  })
  return id
}

const JEUDI_SOIR: PromesseRappel = {
  phrase: 'Nous vous rappelons jeudi, en fin de journée.',
  date: '2026-09-17',
  demiJournee: 'apres-midi',
}
const JEUDI_MATIN: PromesseRappel = {
  phrase: 'Nous vous rappelons jeudi matin.',
  date: '2026-09-17',
  demiJournee: 'matin',
}
const VENDREDI_MATIN: PromesseRappel = {
  phrase: 'Nous vous rappelons vendredi matin.',
  date: '2026-09-18',
  demiJournee: 'matin',
}

describe('compteur de l’accueil de l’espace (contrat CompterDemandesARappeler)', () => {
  it('« 3 à rappeler, dont 1 Ne roulez pas » : les traitées ne comptent pas', async () => {
    environnement = environnementEssai()
    const env = environnement
    const compter = creerCompterDemandesARappeler({
      depot: env.depot,
      cheminFiche,
      horloge: env.horloge,
    })
    expect(await compter()).toEqual({ total: 0, neRoulezPas: 0 })
    await enregistrer(env, CONTENU)
    await enregistrer(env, CONTENU)
    await enregistrer(env, URGENT)
    const traitee = await enregistrer(env, URGENT)
    await creerChangerStatut({ depot: env.depot, horloge: env.horloge, journal: env.journal })(
      traitee,
      'traitee',
    )
    expect(await compter()).toEqual({ total: 3, neRoulezPas: 1 })
  })

  it('garage fermé aujourd’hui : les rappels promis pour aujourd’hui sont à reporter (J4, passe 2)', async () => {
    environnement = environnementEssai()
    const env = environnement
    env.horloge.regler(new Date('2026-09-17T06:00:00.000Z'))
    let ferme = true
    const compter = creerCompterDemandesARappeler({
      depot: env.depot,
      cheminFiche,
      horloge: env.horloge,
      garageFermeAujourdhui: async () => ferme,
    })
    await enregistrer(env, CONTENU, JEUDI_MATIN)
    await enregistrer(env, CONTENU, JEUDI_SOIR)
    await enregistrer(env, CONTENU, VENDREDI_MATIN)
    await enregistrer(env, CONTENU)
    expect(await compter()).toEqual({
      total: 4,
      neRoulezPas: 0,
      fermeAujourdhui: { rappelsAReporter: 2 },
    })
    ferme = false
    expect(await compter()).toEqual({ total: 4, neRoulezPas: 0 })
    // Une capacité en panne ne dit rien de la fermeture, et le compteur répond.
    const enPanne = creerCompterDemandesARappeler({
      depot: env.depot,
      cheminFiche,
      horloge: env.horloge,
      garageFermeAujourdhui: async () => {
        throw new Error('base verrouillée')
      },
    })
    expect(await enPanne()).toEqual({ total: 4, neRoulezPas: 0 })
  })
})

describe('rappels promis pour une date (contrat ListerRappelsPromis, item 7)', () => {
  it('ceux du jour demandé, « Ne roulez pas » d’abord, puis le matin avant le soir', async () => {
    environnement = environnementEssai()
    const env = environnement
    const lister = creerListerRappelsPromis({ depot: env.depot, cheminFiche })
    const sophie = await enregistrer(env, CONTENU, JEUDI_SOIR)
    const matin = await enregistrer(
      env,
      { ...CONTENU, contact: { ...CONTENU.contact, prenom: 'Lina', moment: 'matin' } },
      JEUDI_MATIN,
    )
    const karim = await enregistrer(env, URGENT, JEUDI_SOIR)
    await enregistrer(env, CONTENU, VENDREDI_MATIN)
    await enregistrer(env, CONTENU, null)
    const rappels = await lister('2026-09-17')
    expect(rappels.map((rappel) => rappel.chemin)).toEqual([
      cheminFiche(karim),
      cheminFiche(matin),
      cheminFiche(sophie),
    ])
    expect(rappels[2]).toEqual({
      prenom: 'Sophie',
      telephone: { affichable: '07 22 33 44 55', lien: 'tel:+33722334455' },
      date: '2026-09-17',
      quand: 'en fin de journée',
      phrase: 'Nous vous rappelons jeudi, en fin de journée.',
      neRoulezPas: false,
      chemin: cheminFiche(sophie),
    })
    expect(rappels[0]?.neRoulezPas).toBe(true)
  })

  it('une période, bornes comprises ; une demande traitée n’attend plus rien', async () => {
    environnement = environnementEssai()
    const env = environnement
    const lister = creerListerRappelsPromis({ depot: env.depot, cheminFiche })
    await enregistrer(env, CONTENU, JEUDI_SOIR)
    await enregistrer(env, CONTENU, VENDREDI_MATIN)
    const faite = await enregistrer(env, CONTENU, VENDREDI_MATIN)
    await creerChangerStatut({ depot: env.depot, horloge: env.horloge, journal: env.journal })(
      faite,
      'traitee',
    )
    expect(await lister('2026-09-17', '2026-09-18')).toHaveLength(2)
    expect(await lister('2026-09-18', '2026-09-18')).toHaveLength(1)
    expect(await lister('2026-09-19', '2026-09-30')).toEqual([])
    expect(await lister('2026-09-18', '2026-09-17')).toEqual([])
  })

  it('une date mal formée est refusée', async () => {
    environnement = environnementEssai()
    const lister = creerListerRappelsPromis({ depot: environnement.depot, cheminFiche })
    await expect(lister('jeudi')).rejects.toThrow(RangeError)
    await expect(lister('2026-09-17', '2026-02-30')).rejects.toThrow(RangeError)
  })
})

describe('promesse retenue à l’envoi (AT-3)', () => {
  const DEMI_JOURNEES = [
    { code: '2026-09-16-apres-midi', libelle: 'Mercredi 16 septembre, après-midi' },
    { code: '2026-09-17-matin', libelle: 'Jeudi 17 septembre, matin' },
  ]

  it('la phrase du garage et sa demi-journée ; rien quand le garage ne promet rien', async () => {
    const journal = journalMemoire()
    const promettre = creerPromettreRappel({
      annoncerRappel: async (_envoi, moment) =>
        moment === 'matin' ? 'Nous vous rappelons jeudi matin.' : null,
      proposerDemiJournees: async () => DEMI_JOURNEES,
      journal,
    })
    const envoi = new Date('2026-09-16T08:00:00.000Z')
    expect(await promettre(envoi, 'matin')).toEqual({
      phrase: 'Nous vous rappelons jeudi matin.',
      date: '2026-09-17',
      demiJournee: 'matin',
    })
    expect(await promettre(envoi, 'fin-de-journee')).toBeNull()
  })

  it('un garage qui ne répond pas ne bloque rien : aucune promesse, une ligne au journal', async () => {
    const journal = journalMemoire()
    const promettre = creerPromettreRappel({
      annoncerRappel: async () => 'Nous vous rappelons jeudi matin.',
      proposerDemiJournees: async () => {
        throw new Error('fichier du garage illisible')
      },
      journal,
    })
    expect(await promettre(new Date(), 'matin')).toBeNull()
    expect(journal.lignes.at(-1)).toMatchObject({ niveau: 'erreur' })
    const sansDemiJournee = creerPromettreRappel({
      annoncerRappel: async () => 'Nous vous rappelons lundi matin.',
      proposerDemiJournees: async () => [],
      journal,
    })
    expect(await sansDemiJournee(new Date(), 'matin')).toBeNull()
    expect(journal.lignes.at(-1)).toMatchObject({ niveau: 'avertir' })
  })
})

describe('« Pas de réponse » et doublons sur la fiche (J4)', () => {
  it('l’appel manqué est daté en base, la demande reste à rappeler', async () => {
    environnement = environnementEssai()
    const env = environnement
    const noter = creerNoterTentative({
      depot: env.depot,
      horloge: env.horloge,
      journal: env.journal,
    })
    const id = await enregistrer(env, CONTENU)
    expect(await noter(id)).toBe('notee')
    expect(await noter(id)).toBe('inchangee')
    env.horloge.avancer(5 * MINUTE_MS)
    expect(await noter(id)).toBe('notee')
    expect(await noter('00000000-0000-4000-8000-999999999999')).toBe('absente')
    const lecture = await env.depot.trouver(id)
    expect(lecture.etat === 'trouvee' && lecture.demande.tentativesAppel).toHaveLength(2)
    expect(lecture.etat === 'trouvee' && lecture.demande.statut).toBe('a-rappeler')
  })

  it('la fiche liste les demandes du même numéro reçues à moins de 30 minutes', async () => {
    environnement = environnementEssai()
    const env = environnement
    const premiere = await enregistrer(env, CONTENU)
    const seconde = await enregistrer(env, CONTENU, null, 8)
    await enregistrer(env, CONTENU, null, 45)
    await enregistrer(env, URGENT, null, 2)
    const lecture = await creerConsulterFiche({ depot: env.depot, horloge: env.horloge })(premiere)
    expect(lecture.etat === 'trouvee' && lecture.doublons.map((demande) => demande.id)).toEqual([
      seconde,
    ])
  })
})
