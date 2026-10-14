import { Writable } from 'node:stream'
import fastifyCookie from '@fastify/cookie'
import fastifyFormbody from '@fastify/formbody'
import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import type { OutilsPage } from '../../../../web/index.js'
import { assemblerAcces } from '../../module.js'
import { BASE_EN_MEMOIRE } from '../sqlite/depot-acces-sqlite.js'
import { creerMessagerieRetenue } from '../essai/doublures.js'

/** Outils minimaux de la couche web : la page se réduit à son titre, la garde laisse passer. */
const OUTILS: OutilsPage = {
  envoyerPage: async (reponse, vue) =>
    reponse
      .code(vue.statutHttp ?? 200)
      .type('text/html')
      .send(vue.titre),
  exigerGaragiste: async () => undefined,
  jetonFormulaireGaragiste: () => '',
  exigerFormulaireGaragiste: async () => undefined,
}

let app: FastifyInstance | null = null
afterEach(async () => {
  await app?.close()
  app = null
})

/** Serveur au journal d'accès réel (niveau info, comme en production), capturé ligne à ligne. */
async function monterAvecJournal(): Promise<{ app: FastifyInstance; journal: string[] }> {
  const journal: string[] = []
  const flux = new Writable({
    write(morceau: Buffer, _encodage, suite) {
      journal.push(morceau.toString('utf8'))
      suite()
    },
  })
  const serveur = Fastify({ logger: { level: 'info', stream: flux } })
  await serveur.register(fastifyFormbody)
  await serveur.register(fastifyCookie)
  const acces = await assemblerAcces({
    mode: 'production',
    cheminBase: BASE_EN_MEMOIRE,
    reglages: {
      urlPublique: 'https://garage.exemple',
      courrielGaragiste: 'garagiste@exemple.fr',
      courrielResponsable: null,
      expediteur: null,
    },
    messagerie: creerMessagerieRetenue(),
  })
  await acces.module.enregistrer(serveur, OUTILS)
  app = serveur
  return { app: serveur, journal }
}

describe('journal d’accès de l’espace (Kano D9)', () => {
  it('la page du lien n’écrit jamais son adresse, donc jamais le jeton, dans le journal', async () => {
    const { app, journal } = await monterAvecJournal()
    const jeton = 'jeton-secret-de-connexion-0001'
    const reponse = await app.inject({ url: `/garagiste/connexion/lien?jeton=${jeton}` })
    expect(reponse.statusCode).toBe(404)
    expect(journal.join('')).not.toContain(jeton)
  })

  it('les autres pages de l’espace restent journalisées, preuve que le journal est bien actif', async () => {
    const { app, journal } = await monterAvecJournal()
    await app.inject({ url: '/garagiste/connexion?retour=%2Fgaragiste' })
    expect(journal.join('')).toContain('/garagiste/connexion?retour=%2Fgaragiste')
  })
})
