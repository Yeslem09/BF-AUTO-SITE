import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import type { OutilsPage } from '../../../../web/index.js'
import { creerConsulterEtape } from '../../application/consulter-etape.js'
import { creerConsulterLivret } from '../../application/consulter-livret.js'
import { arbreAccepte } from '../../essais/arbre-essai.js'
import { niveauSansAcces } from './journal.js'
import { enregistrerRoutesPreDiagnostic } from './routes.js'

/** Réponses d'un parcours, telles qu'elles voyagent dans l'adresse. */
const PARCOURS = '/pre-diagnostic?q1=bruit&q2=aucun&r=freinage'
/** Route témoin, hors du parcours : prouve que la capture du journal fonctionne. */
const TEMOIN = '/temoin?marque=visible'

const outilsEssai: OutilsPage = {
  envoyerPage: async (reponse, vue) => reponse.type('text/html').send(vue.titre),
  exigerGaragiste: async () => undefined,
  jetonFormulaireGaragiste: () => '',
  exigerFormulaireGaragiste: async () => undefined,
}

let app: FastifyInstance | null = null
afterEach(async () => {
  await app?.close()
  app = null
})

/** Serveur au niveau de journal donné, dont chaque ligne écrite est gardée. */
async function monter(niveau: string): Promise<{ lignes: string[] }> {
  const lignes: string[] = []
  const serveur = Fastify({
    logger: { level: niveau, stream: { write: (ligne: string) => lignes.push(ligne) } },
  })
  const arbre = arbreAccepte()
  enregistrerRoutesPreDiagnostic(serveur, outilsEssai, {
    mode: 'demonstration',
    arbre,
    consulterEtape: creerConsulterEtape(arbre),
    consulterLivret: creerConsulterLivret(arbre),
    consulterGarage: null,
    trouverFamille: null,
  })
  serveur.get('/temoin', async () => 'témoin')
  app = serveur
  return { lignes }
}

describe('pré-diagnostic : le journal d’accès ne garde pas les réponses', () => {
  it('au niveau info, la chaîne de requête du parcours n’est pas journalisée', async () => {
    const { lignes } = await monter('info')
    expect((await app?.inject(PARCOURS))?.statusCode).toBe(200)
    expect((await app?.inject(TEMOIN))?.statusCode).toBe(200)
    const journal = lignes.join('')
    // Vivacité : la route témoin est bien journalisée avec son adresse.
    expect(journal).toContain('marque=visible')
    expect(journal).not.toContain('q1=')
    expect(journal).not.toContain('freinage')
  })

  it('pose le plus strict entre le niveau du site et « warn »', () => {
    expect(niveauSansAcces('trace')).toBe('warn')
    expect(niveauSansAcces('info')).toBe('warn')
    expect(niveauSansAcces('warn')).toBe('warn')
    expect(niveauSansAcces('error')).toBe('error')
    expect(niveauSansAcces('silent')).toBe('silent')
    expect(niveauSansAcces('inconnu')).toBe('warn')
  })
})
