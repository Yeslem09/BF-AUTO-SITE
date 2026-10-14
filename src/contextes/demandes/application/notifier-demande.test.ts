import { afterEach, describe, expect, it, vi } from 'vitest'
import { creerDemande } from '../domaine/demande.js'
import { HEURE_MS, MINUTE_MS } from '../domaine/temps.js'
import { environnementEssai, saisieEssai, type EnvironnementEssai } from '../essai.js'
import { validerDemande } from '../domaine/validation.js'
import type { MessageNotification } from '../domaine/message-notification.js'
import { creerNotifierDemande } from './notifier-demande.js'
import { creerRenvoyerNotifications } from './renvoyer-notifications.js'
import { creerSurveillerNotifications } from './surveiller-notifications.js'

let environnement: EnvironnementEssai

afterEach(() => environnement.base.close())

let compteur = 0

async function demandeEnregistree(env: EnvironnementEssai): Promise<string> {
  const validation = validerDemande(saisieEssai('rappel'), {
    demiJournees: [],
    anneeCourante: 2026,
    famille: null,
    resume: null,
    venteAuComptoir: false,
  })
  if (!validation.ok) throw new Error('saisie d’essai invalide')
  compteur += 1
  const id = `00000000-0000-4000-8000-${String(compteur).padStart(12, '0')}`
  await env.depot.enregistrer(
    creerDemande(validation.contenu, { id, recueLe: env.horloge.maintenant() }),
    {
      formulaire: `f-${id}`,
      confirmation: `c-${id}`,
    },
  )
  return id
}

async function notification(env: EnvironnementEssai, id: string) {
  const lecture = await env.depot.trouver(id)
  if (lecture.etat !== 'trouvee') throw new Error('demande introuvable')
  return lecture.demande.notification
}

describe('notifier le garagiste (D5, US-16)', () => {
  it('un échec est enregistré sur la demande, journalisé, et programme un essai à 1 minute', async () => {
    environnement = environnementEssai()
    const env = environnement
    env.notificateur.enPanne(true)
    const id = await demandeEnregistree(env)
    const depart = env.horloge.maintenant()
    await env.notifierDemande(id)
    expect(await notification(env, id)).toEqual({
      etat: 'en-echec',
      premierEchecLe: depart,
      essais: 1,
      prochainEssaiLe: new Date(depart.getTime() + MINUTE_MS),
      derniereErreur: 'Serveur de courriel injoignable',
    })
    expect(
      env.journal.lignes.some(
        (ligne) => ligne.niveau === 'erreur' && ligne.details?.['demande'] === id,
      ),
    ).toBe(true)
  })

  it('la file renvoie à 1 minute, 10 minutes et 1 heure selon l’horloge, puis réussit', async () => {
    environnement = environnementEssai()
    const env = environnement
    const renvoyer = creerRenvoyerNotifications({
      depot: env.depot,
      horloge: env.horloge,
      notifierDemande: env.notifierDemande,
    })
    env.notificateur.enPanne(true)
    const id = await demandeEnregistree(env)
    const depart = env.horloge.maintenant().getTime()
    await env.notifierDemande(id)

    const essaisA = async (depuisDepartMs: number) => {
      env.horloge.regler(new Date(depart + depuisDepartMs - 1))
      expect(await renvoyer()).toBe(0)
      env.horloge.regler(new Date(depart + depuisDepartMs))
      expect(await renvoyer()).toBe(1)
    }
    await essaisA(MINUTE_MS)
    await essaisA(10 * MINUTE_MS)
    await essaisA(HEURE_MS)
    expect(env.notificateur.essais()).toBe(4)

    env.notificateur.enPanne(false)
    await essaisA(2 * HEURE_MS)
    expect(await notification(env, id)).toMatchObject({ etat: 'envoyee' })
    env.horloge.avancer(10 * HEURE_MS)
    expect(await renvoyer()).toBe(0)
    expect(env.notificateur.messages).toHaveLength(1)
  })

  it('une demande traitée n’est plus renvoyée', async () => {
    environnement = environnementEssai()
    const env = environnement
    const renvoyer = creerRenvoyerNotifications({
      depot: env.depot,
      horloge: env.horloge,
      notifierDemande: env.notifierDemande,
    })
    env.notificateur.enPanne(true)
    const id = await demandeEnregistree(env)
    await env.notifierDemande(id)
    await env.depot.changerStatut(id, 'traitee', env.horloge.maintenant())
    env.horloge.avancer(HEURE_MS)
    expect(await renvoyer()).toBe(0)
  })

  it('une notification jamais tentée (arrêt du service) est reprise par la file', async () => {
    environnement = environnementEssai()
    const env = environnement
    const renvoyer = creerRenvoyerNotifications({
      depot: env.depot,
      horloge: env.horloge,
      notifierDemande: env.notifierDemande,
    })
    const id = await demandeEnregistree(env)
    expect(await renvoyer()).toBe(0)
    env.horloge.avancer(MINUTE_MS)
    expect(await renvoyer()).toBe(1)
    expect(await notification(env, id)).toMatchObject({ etat: 'envoyee' })
  })

  it('la sonde passe « dégradée » après 2 heures d’échec, puis « ok » après un envoi réussi', async () => {
    environnement = environnementEssai()
    const env = environnement
    const surveiller = creerSurveillerNotifications({ depot: env.depot, horloge: env.horloge })
    env.notificateur.enPanne(true)
    const id = await demandeEnregistree(env)
    await env.notifierDemande(id)
    expect(await surveiller()).toEqual({ etat: 'ok', echecsDurables: 0, connecteursEnEchec: [] })
    env.horloge.avancer(2 * HEURE_MS)
    expect(await surveiller()).toEqual({
      etat: 'degradee',
      echecsDurables: 1,
      connecteursEnEchec: [],
    })
    env.notificateur.enPanne(false)
    await env.notifierDemande(id)
    expect(await surveiller()).toEqual({ etat: 'ok', echecsDurables: 0, connecteursEnEchec: [] })
  })

  it('un serveur de courriel lent : la file ne relance pas un envoi encore en cours (un seul message)', async () => {
    environnement = environnementEssai()
    const env = environnement
    const recus: MessageNotification[] = []
    let liberer: () => void = () => undefined
    const notifierDemande = creerNotifierDemande({
      depot: env.depot,
      horloge: env.horloge,
      journal: env.journal,
      lienFiche: (id) => `/garagiste/demandes/${id}`,
      notificateur: {
        canal: 'lent',
        envoyer: (message) =>
          new Promise<void>((resolve) => {
            recus.push(message)
            liberer = resolve
          }),
      },
    })
    const renvoyer = creerRenvoyerNotifications({
      depot: env.depot,
      horloge: env.horloge,
      notifierDemande,
    })
    const id = await demandeEnregistree(env)
    const premier = notifierDemande(id)
    await vi.waitFor(() => expect(recus).toHaveLength(1))
    env.horloge.avancer(2 * MINUTE_MS)
    await renvoyer()
    await notifierDemande(id)
    expect(recus).toHaveLength(1)
    liberer()
    await premier
    expect(await notification(env, id)).toMatchObject({ etat: 'envoyee' })
    await notifierDemande(id)
    expect(recus).toHaveLength(1)
  })

  it('ne rejette jamais, même si la demande est introuvable', async () => {
    environnement = environnementEssai()
    await expect(environnement.notifierDemande('inconnue')).resolves.toBeUndefined()
    expect(environnement.journal.lignes.at(-1)?.niveau).toBe('erreur')
  })
})
