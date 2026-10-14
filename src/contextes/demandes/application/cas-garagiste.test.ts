import { afterEach, describe, expect, it } from 'vitest'
import { creerDemande, type ContenuDemande } from '../domaine/demande.js'
import { JOUR_MS, MINUTE_MS } from '../domaine/temps.js'
import { environnementEssai, resumeEssai, type EnvironnementEssai } from '../essai.js'
import { creerChangerStatut } from './changer-statut.js'
import { creerConsulterFiche } from './consulter-fiche.js'
import { creerListerDemandes } from './lister-demandes.js'
import { creerPurgerDemandes } from './purger-demandes.js'

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
    prenom: 'Julie',
    telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
    moment: 'matin',
  },
  precisions: null,
}

let rang = 0
function identifiant(): string {
  rang += 1
  return `00000000-0000-4000-8000-${String(rang).padStart(12, '0')}`
}

async function enregistrer(
  env: EnvironnementEssai,
  recueLe: Date,
  contenu: ContenuDemande = CONTENU,
): Promise<string> {
  const id = identifiant()
  await env.depot.enregistrer(creerDemande(contenu, { id, recueLe }), {
    formulaire: `f-${id}`,
    confirmation: `c-${id}`,
  })
  return id
}

describe('espace garagiste : liste, fiche, statut (D5, US-22, US-30)', () => {
  it('liste l’urgente en tête des demandes à rappeler, puis les traitées', async () => {
    environnement = environnementEssai()
    const env = environnement
    const maintenant = env.horloge.maintenant().getTime()
    const ancienne = await enregistrer(env, new Date(maintenant - 3 * JOUR_MS))
    const recente = await enregistrer(env, new Date(maintenant - JOUR_MS))
    const urgente = await enregistrer(env, new Date(maintenant - 5 * JOUR_MS), {
      ...CONTENU,
      sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') },
    })
    const traitee = await enregistrer(env, new Date(maintenant - 2 * JOUR_MS))
    await creerChangerStatut({ depot: env.depot, horloge: env.horloge, journal: env.journal })(
      traitee,
      'traitee',
    )
    const tableau = await creerListerDemandes({
      depot: env.depot,
      registre: env.registre,
      horloge: env.horloge,
    })()
    expect(tableau.demandes.map((demande) => demande.id)).toEqual([
      urgente,
      recente,
      ancienne,
      traitee,
    ])
  })

  it('les traitées depuis plus de 30 jours ne sont plus listées', async () => {
    environnement = environnementEssai()
    const env = environnement
    const id = await enregistrer(env, env.horloge.maintenant())
    await env.depot.changerStatut(id, 'traitee', env.horloge.maintenant())
    env.horloge.avancer(31 * JOUR_MS)
    const tableau = await creerListerDemandes({
      depot: env.depot,
      registre: env.registre,
      horloge: env.horloge,
    })()
    expect(tableau.demandes).toEqual([])
  })

  it('compte les envois non confirmés de la semaine (US-15)', async () => {
    environnement = environnementEssai()
    const env = environnement
    const maintenant = env.horloge.maintenant()
    await env.registre.noter('c1', maintenant, null)
    await env.registre.noter('c2', maintenant, null)
    await env.registre.noter('c3', maintenant, null)
    await env.registre.noter('c4', maintenant, null)
    await env.registre.confirmer('c4', maintenant)
    await env.registre.noter('semaine-passee', new Date(maintenant.getTime() - 7 * JOUR_MS), null)
    const tableau = await creerListerDemandes({
      depot: env.depot,
      registre: env.registre,
      horloge: env.horloge,
    })()
    expect(tableau.envoisNonConfirmes).toBe(3)
  })

  it('la première ouverture de la fiche est datée, les suivantes ne la changent pas', async () => {
    environnement = environnementEssai()
    const env = environnement
    const id = await enregistrer(env, env.horloge.maintenant())
    const consulter = creerConsulterFiche({ depot: env.depot, horloge: env.horloge })
    env.horloge.avancer(10 * MINUTE_MS)
    const premiere = env.horloge.maintenant()
    const lue = await consulter(id)
    expect(lue.etat === 'trouvee' && lue.demande.premiereConsultationLe).toEqual(premiere)
    env.horloge.avancer(MINUTE_MS)
    await consulter(id)
    const relue = await env.depot.trouver(id)
    expect(relue.etat === 'trouvee' && relue.demande.premiereConsultationLe).toEqual(premiere)
    expect(await consulter('absente')).toEqual({ etat: 'absente' })
  })

  it('« Traitée » enregistre le statut et l’heure du changement ; une demande absente le dit', async () => {
    environnement = environnementEssai()
    const env = environnement
    const id = await enregistrer(env, env.horloge.maintenant())
    const changer = creerChangerStatut({
      depot: env.depot,
      horloge: env.horloge,
      journal: env.journal,
    })
    env.horloge.avancer(MINUTE_MS)
    expect(await changer(id, 'traitee')).toBe('change')
    const lue = await env.depot.trouver(id)
    expect(lue).toMatchObject({
      etat: 'trouvee',
      demande: { statut: 'traitee', statutChangeLe: env.horloge.maintenant() },
    })
    expect(await changer(id, 'traitee')).toBe('inchange')
    expect(await changer('absente', 'traitee')).toBe('absente')
  })
})

describe('purge à 12 mois (US-34)', () => {
  it('supprime la demande de 13 mois jamais modifiée, garde celle traitée il y a 2 mois, et le journal compte', async () => {
    environnement = environnementEssai()
    const env = environnement
    const maintenant = env.horloge.maintenant()
    const ilYA = (mois: number) => {
      const date = new Date(maintenant.getTime())
      date.setUTCMonth(date.getUTCMonth() - mois)
      return date
    }
    const perimee = await enregistrer(env, ilYA(13))
    const reactivee = await enregistrer(env, ilYA(13))
    await env.depot.changerStatut(reactivee, 'traitee', ilYA(2))
    const recente = await enregistrer(env, ilYA(1))
    await env.registre.noter('ancien-suspect', ilYA(2), null)

    const bilan = await creerPurgerDemandes({
      depot: env.depot,
      registre: env.registre,
      horloge: env.horloge,
      journal: env.journal,
    })()

    expect(bilan).toEqual({ demandes: 1, envoisSuspects: 1 })
    expect(await env.depot.trouver(perimee)).toEqual({ etat: 'absente' })
    expect((await env.depot.trouver(reactivee)).etat).toBe('trouvee')
    expect((await env.depot.trouver(recente)).etat).toBe('trouvee')
    expect(env.journal.lignes.at(-1)?.message).toBe(
      'Purge des demandes : 1 demande(s) et 1 envoi(s) non confirmé(s) supprimé(s)',
    )
  })
})
