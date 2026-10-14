import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { demarrerFauxServeur, type FauxServeur, type Routes } from '../essai/faux-serveur-http.js'
import { ErreurConnecteur } from '../erreurs.js'
import { creerEnvoiSmsOvh, signerRequeteOvh } from './envoi-ovh.js'
import type { ReglagesOvh } from './reglages.js'

const HEURE_OVH = 1_790_000_000
const SERVICE = 'sms-ab12345-1'
let serveur: FauxServeur | null = null

afterEach(async () => {
  await serveur?.fermer()
  serveur = null
})

async function demarrer(routes: Routes): Promise<{ reglages: ReglagesOvh; serveur: FauxServeur }> {
  serveur = await demarrerFauxServeur({
    'GET /1.0/auth/time': { statut: 200, corps: HEURE_OVH },
    ...routes,
  })
  return {
    serveur,
    reglages: {
      cleApplication: 'cle-app',
      secretApplication: 'secret-app',
      cleConsommateur: 'cle-conso',
      service: SERVICE,
      expediteur: null,
      pointAcces: `${serveur.origine}/1.0`,
    },
  }
}

describe('SMS par OVHcloud, contre un faux serveur local (US-C09)', () => {
  it('signe la requête avec l’heure d’OVH et envoie un message de service au garagiste', async () => {
    const { reglages, serveur } = await demarrer({
      [`POST /1.0/sms/${SERVICE}/jobs`]: {
        statut: 200,
        corps: {
          ids: [27814656],
          invalidReceivers: [],
          validReceivers: ['+33605922838'],
          totalCreditsRemoved: 1,
        },
      },
    })
    const remise = await creerEnvoiSmsOvh(reglages).envoyer({
      destinataire: '+33605922838',
      texte: 'Ne roulez pas : rappelez Julie, 06 12 34 56 78 [BF-7K3Q9D]',
    })
    expect(remise).toEqual({ identifiant: '27814656', segments: 1 })
    const envoi = serveur.requetes.find((requete) => requete.methode === 'POST')
    expect(envoi).toBeDefined()
    const adresse = `${reglages.pointAcces}/sms/${SERVICE}/jobs`
    const attendue = `$1$${createHash('sha1')
      .update(
        ['secret-app', 'cle-conso', 'POST', adresse, envoi?.corps ?? '', String(HEURE_OVH)].join(
          '+',
        ),
      )
      .digest('hex')}`
    expect(envoi?.enTetes['x-ovh-application']).toBe('cle-app')
    expect(envoi?.enTetes['x-ovh-consumer']).toBe('cle-conso')
    expect(envoi?.enTetes['x-ovh-timestamp']).toBe(String(HEURE_OVH))
    expect(envoi?.enTetes['x-ovh-signature']).toBe(attendue)
    expect(JSON.parse(envoi?.corps ?? '{}')).toEqual({
      message: 'Ne roulez pas : rappelez Julie, 06 12 34 56 78 [BF-7K3Q9D]',
      receivers: ['+33605922838'],
      charset: 'UTF-8',
      coding: '7bit',
      priority: 'high',
      noStopClause: true,
      senderForResponse: true,
    })
  })

  it('utilise l’expéditeur déclaré quand il est configuré', async () => {
    const { reglages, serveur } = await demarrer({
      [`POST /1.0/sms/${SERVICE}/jobs`]: { statut: 200, corps: { ids: [1], invalidReceivers: [] } },
    })
    await creerEnvoiSmsOvh({ ...reglages, expediteur: 'BFAuto' }).envoyer({
      destinataire: '+33605922838',
      texte: 'Essai',
    })
    const corps = JSON.parse(serveur.requetes.at(-1)?.corps ?? '{}') as Record<string, unknown>
    expect(corps['sender']).toBe('BFAuto')
    expect(corps).not.toHaveProperty('senderForResponse')
  })

  it('un numéro refusé par OVHcloud est un échec qui le nomme, jamais une réussite', async () => {
    const { reglages } = await demarrer({
      [`POST /1.0/sms/${SERVICE}/jobs`]: {
        statut: 200,
        corps: { ids: [], invalidReceivers: ['+33605922838'], validReceivers: [] },
      },
    })
    await expect(
      creerEnvoiSmsOvh(reglages).envoyer({ destinataire: '+33605922838', texte: 'Essai' }),
    ).rejects.toThrow(/\+33605922838/)
  })

  it('clés refusées : échec « identifiants » avec le remède OVHcloud', async () => {
    const { reglages } = await demarrer({
      [`GET /1.0/sms/${SERVICE}`]: { statut: 403, corps: { message: 'Invalid signature' } },
    })
    const echec = await creerEnvoiSmsOvh(reglages)
      .verifier()
      .then(
        () => null,
        (erreur: unknown) => erreur,
      )
    expect(echec).toBeInstanceOf(ErreurConnecteur)
    expect((echec as ErreurConnecteur).nature).toBe('identifiants')
    expect((echec as ErreurConnecteur).detail).toBe('HTTP 403 : Invalid signature')
    expect((echec as ErreurConnecteur).remede).toContain('SMS_OVH_CLE_CONSOMMATEUR')
  })

  it('vérifie le compte et lit les crédits restants ; inconnus si OVHcloud ne les donne pas', async () => {
    const { reglages } = await demarrer({
      [`GET /1.0/sms/${SERVICE}`]: { statut: 200, corps: { creditsLeft: 97, status: 'enable' } },
    })
    expect(await creerEnvoiSmsOvh(reglages).verifier()).toEqual({ creditsRestants: 97 })
    await serveur?.fermer()
    const sansCredits = await demarrer({ [`GET /1.0/sms/${SERVICE}`]: { statut: 200, corps: {} } })
    expect(await creerEnvoiSmsOvh(sansCredits.reglages).verifier()).toEqual({
      creditsRestants: null,
    })
  })

  it('refuse un texte de trois SMS avant tout appel réseau', async () => {
    const { reglages, serveur } = await demarrer({})
    await expect(
      creerEnvoiSmsOvh(reglages).envoyer({ destinataire: '+33605922838', texte: 'a'.repeat(400) }),
    ).rejects.toMatchObject({ nature: 'configuration' })
    expect(serveur.requetes).toEqual([])
  })
})

describe('signature OVHcloud', () => {
  it('suit la formule documentée : $1$ puis SHA-1 des six éléments joints par « + »', () => {
    const signature = signerRequeteOvh(
      { secretApplication: 'AS', cleConsommateur: 'CK' },
      'GET',
      'https://eu.api.ovh.com/1.0/sms',
      '',
      1_366_560_945,
    )
    expect(signature).toBe(
      `$1$${createHash('sha1').update('AS+CK+GET+https://eu.api.ovh.com/1.0/sms++1366560945').digest('hex')}`,
    )
  })
})
