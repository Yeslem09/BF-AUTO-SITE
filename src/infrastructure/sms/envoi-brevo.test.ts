import { afterEach, describe, expect, it } from 'vitest'
import { demarrerFauxServeur, type FauxServeur, type Routes } from '../essai/faux-serveur-http.js'
import { creerEnvoiSmsBrevo } from './envoi-brevo.js'
import type { ReglagesBrevo } from './reglages.js'

let serveur: FauxServeur | null = null

afterEach(async () => {
  await serveur?.fermer()
  serveur = null
})

async function demarrer(
  routes: Routes,
): Promise<{ reglages: ReglagesBrevo; serveur: FauxServeur }> {
  serveur = await demarrerFauxServeur(routes)
  return {
    serveur,
    reglages: {
      cleApi: 'xkeysib-cle',
      expediteur: 'SiteBFAuto',
      pointAcces: `${serveur.origine}/v3`,
    },
  }
}

describe('SMS par Brevo, contre un faux serveur local (US-C09)', () => {
  it('envoie un SMS transactionnel, destinataire sans « + », clé dans l’en-tête', async () => {
    const { reglages, serveur } = await demarrer({
      'POST /v3/transactionalSMS/send': { statut: 201, corps: { messageId: 1511882900100020 } },
    })
    const remise = await creerEnvoiSmsBrevo(reglages).envoyer({
      destinataire: '+33605922838',
      texte: 'Ne roulez pas : rappelez Julie',
    })
    expect(remise).toEqual({ identifiant: '1511882900100020', segments: 1 })
    const [envoi] = serveur.requetes
    expect(envoi?.enTetes['api-key']).toBe('xkeysib-cle')
    expect(envoi?.enTetes['content-type']).toBe('application/json')
    expect(JSON.parse(envoi?.corps ?? '{}')).toEqual({
      sender: 'SiteBFAuto',
      recipient: '33605922838',
      content: 'Ne roulez pas : rappelez Julie',
      type: 'transactional',
      unicodeEnabled: false,
    })
  })

  it('clé refusée : échec « identifiants » ; demande refusée : échec « refus » avec le message de Brevo', async () => {
    const { reglages } = await demarrer({
      'POST /v3/transactionalSMS/send': {
        statut: 400,
        corps: { code: 'not_enough_credits', message: 'Not enough credits' },
      },
      'GET /v3/account': { statut: 401, corps: { code: 'unauthorized', message: 'Key not found' } },
    })
    const envoi = creerEnvoiSmsBrevo(reglages)
    await expect(envoi.verifier()).rejects.toMatchObject({ nature: 'identifiants' })
    await expect(
      envoi.envoyer({ destinataire: '+33605922838', texte: 'Essai' }),
    ).rejects.toMatchObject({ nature: 'refus', detail: 'HTTP 400 : Not enough credits' })
  })

  it('lit les crédits SMS du plan ; inconnus si la ligne manque, jamais zéro inventé', async () => {
    const { reglages } = await demarrer({
      'GET /v3/account': {
        statut: 200,
        corps: {
          plan: [
            { type: 'free', credits: 300 },
            { type: 'sms', credits: 25 },
          ],
        },
      },
    })
    expect(await creerEnvoiSmsBrevo(reglages).verifier()).toEqual({ creditsRestants: 25 })
    await serveur?.fermer()
    const sansSms = await demarrer({ 'GET /v3/account': { statut: 200, corps: { plan: [] } } })
    expect(await creerEnvoiSmsBrevo(sansSms.reglages).verifier()).toEqual({ creditsRestants: null })
  })
})
