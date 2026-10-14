import { rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Writable } from 'node:stream'
import type { FastifyInstance } from 'fastify'
import type { EtatNotifications, ModeSite } from '../contrats/index.js'
import { afterEach, describe, expect, it } from 'vitest'
import { POLITIQUE_CONTENU } from './en-tetes-securite.js'
import {
  CADRE_ESSAI,
  creerRacinePubliqueEssai,
  creerServeurEssai,
  PROTECTION_FORMULAIRES_ESSAI,
} from './essai.js'
import { html } from './html.js'
import type { EmplacementAccueil, ModuleContexte } from './module-contexte.js'
import { CACHE_IMMUABLE, CACHE_REVALIDER } from './politique-cache.js'
import {
  completerCadre,
  creerServeur,
  ErreurDemarrageServeur,
  serialiserRequete,
} from './serveur.js'

const MODULE_ESSAI: ModuleContexte = {
  nom: 'essai',
  enregistrer: (app, outils) => {
    app.get('/essai', async (_requete, reponse) =>
      outils.envoyerPage(reponse, {
        titre: 'Page d’essai',
        description: 'Une page de test.',
        chemin: '/essai',
        contenu: html`<p>${'x'.repeat(3000)}</p>`,
      }),
    )
    app.get('/panne', async () => {
      throw new Error('panne simulée')
    })
    app.post('/formulaire', async (requete) => ({ recu: requete.body }))
  },
}

let app: FastifyInstance | null = null

async function serveur(
  modules: readonly ModuleContexte[] = [MODULE_ESSAI],
): Promise<FastifyInstance> {
  app = await creerServeurEssai(modules)
  return app
}

afterEach(async () => {
  await app?.close()
  app = null
})

describe('serveur : pages', () => {
  it('rend la page d’un module dans la mise en page commune', async () => {
    const reponse = await (await serveur()).inject('/essai')
    expect(reponse.statusCode).toBe(200)
    expect(reponse.headers['content-type']).toBe('text/html; charset=utf-8')
    expect(reponse.body).toContain('<title>Page d’essai | BF Auto</title>')
    expect(reponse.body).toContain('Aller au contenu')
  })

  it('accepte la barre oblique finale', async () => {
    expect((await (await serveur()).inject('/essai/')).statusCode).toBe(200)
  })

  it('répond 404 par une page soignée, dans la mise en page et non indexée', async () => {
    const reponse = await (await serveur()).inject('/nulle-part?x=1')
    expect(reponse.statusCode).toBe(404)
    expect(reponse.body).toContain('<h1>Page introuvable</h1>')
    expect(reponse.body).toContain('<meta name="robots" content="noindex">')
    expect(reponse.body).toContain(
      '<link rel="canonical" href="https://garage.exemple/nulle-part">',
    )
    expect(reponse.body).toContain('tel:+33605922838')
  })

  it('répond 404 pour un fichier public absent', async () => {
    expect((await (await serveur()).inject('/css/absent.css')).statusCode).toBe(404)
  })

  it('répond 500 par une page soignée sans rien divulguer de l’erreur', async () => {
    const reponse = await (await serveur()).inject('/panne')
    expect(reponse.statusCode).toBe(500)
    expect(reponse.body).toContain('Le site a rencontré un problème')
    expect(reponse.body).not.toContain('panne simulée')
  })

  it('se replie sur une page de secours si la mise en page elle-même échoue', async () => {
    app = await creerServeur({
      modules: [MODULE_ESSAI],
      fournirCadre: async () => {
        throw new Error('identité illisible')
      },
      urlPublique: 'https://garage.exemple',
      racinePublique: await creerRacinePubliqueEssai(),
      niveauJournal: 'silent',
      verifierSessionGaragiste: async () => false,
      maintenant: () => new Date(),
      mode: 'production',
      preDiagnosticPublie: true,
      protectionFormulairesGaragiste: PROTECTION_FORMULAIRES_ESSAI,
    })
    const reponse = await app.inject('/essai')
    expect(reponse.statusCode).toBe(500)
    expect(reponse.body).toContain('<h1>Le site a rencontré un problème</h1>')
    expect(reponse.body).not.toContain('identité illisible')
  })

  it('décode les formulaires envoyés en application/x-www-form-urlencoded', async () => {
    const reponse = await (
      await serveur()
    ).inject({
      method: 'POST',
      url: '/formulaire',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'nom=Dupont&message=Bonjour',
    })
    expect(reponse.json()).toEqual({ recu: { nom: 'Dupont', message: 'Bonjour' } })
  })

  it('expose une route de santé jamais mise en cache', async () => {
    const reponse = await (await serveur()).inject('/sante')
    expect(reponse.statusCode).toBe(200)
    expect(reponse.json()).toEqual({ statut: 'ok' })
    expect(reponse.headers['cache-control']).toBe('no-store')
  })

  it('compresse les pages quand le navigateur l’accepte', async () => {
    const reponse = await (
      await serveur()
    ).inject({
      url: '/essai',
      headers: { 'accept-encoding': 'gzip' },
    })
    expect(reponse.headers['content-encoding']).toBe('gzip')
  })
})

describe('serveur : sécurité', () => {
  it('pose les en-têtes de sécurité sur les pages, les fichiers et les erreurs', async () => {
    const instance = await serveur()
    for (const url of ['/essai', '/css/bf-auto.css', '/nulle-part']) {
      const reponse = await instance.inject(url)
      expect(reponse.headers['content-security-policy']).toBe(POLITIQUE_CONTENU)
      expect(reponse.headers['x-content-type-options']).toBe('nosniff')
      expect(reponse.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
      expect(reponse.headers['permissions-policy']).toContain('camera=()')
    }
  })

  it('interdit tout script en ligne et tout encadrement du site', () => {
    expect(POLITIQUE_CONTENU).toContain("default-src 'self'")
    expect(POLITIQUE_CONTENU).toContain("script-src 'self'")
    expect(POLITIQUE_CONTENU).not.toContain('unsafe-inline')
    expect(POLITIQUE_CONTENU).toContain("img-src 'self' data:")
    expect(POLITIQUE_CONTENU).toContain("form-action 'self'")
    expect(POLITIQUE_CONTENU).toContain("frame-ancestors 'none'")
  })

  it('n’active HSTS qu’avec une adresse publique en https', async () => {
    const reponse = await (await serveur()).inject('/essai')
    expect(reponse.headers['strict-transport-security']).toContain('max-age=')
  })
})

describe('serveur : cache', () => {
  it('fait revalider le HTML à chaque visite', async () => {
    const reponse = await (await serveur()).inject('/essai')
    expect(reponse.headers['cache-control']).toBe(CACHE_REVALIDER)
  })

  it('rend immuables la feuille de style versionnée et les polices', async () => {
    const instance = await serveur()
    const page = await instance.inject('/essai')
    const feuille = /href="(\/css\/bf-auto\.css\?v=[0-9a-f]+)"/.exec(page.body)?.[1]
    expect(feuille).toBeDefined()
    const css = await instance.inject(feuille ?? '')
    expect(css.statusCode).toBe(200)
    expect(css.headers['cache-control']).toBe(CACHE_IMMUABLE)
    const police = await instance.inject('/fonts/hanken-grotesk-400.woff2')
    expect(police.headers['cache-control']).toBe(CACHE_IMMUABLE)
  })

  it('fait revalider une feuille de style demandée sans version', async () => {
    const reponse = await (await serveur()).inject('/css/bf-auto.css')
    expect(reponse.headers['cache-control']).toBe(CACHE_REVALIDER)
  })

  it('change la version quand le fichier change', async () => {
    const racinePublique = await creerRacinePubliqueEssai()
    app = await creerServeurEssai([MODULE_ESSAI], { racinePublique })
    const version = async () =>
      /bf-auto\.css\?v=([0-9a-f]+)/.exec((await app?.inject('/essai'))?.body ?? '')?.[1]
    const avant = await version()
    await writeFile(join(racinePublique, 'css/bf-auto.css'), 'body { color: black }')
    // Date de modification distincte même sur un système de fichiers à la seconde.
    const plusTard = new Date(Date.now() + 5_000)
    await utimes(join(racinePublique, 'css/bf-auto.css'), plusTard, plusTard)
    expect(await version()).not.toBe(avant)
    await rm(racinePublique, { recursive: true, force: true })
  })
})

describe('serveur : démarrage', () => {
  it('refuse de démarrer sans les ressources client construites', async () => {
    await expect(
      creerServeur({
        modules: [],
        fournirCadre: async () => CADRE_ESSAI,
        urlPublique: 'http://localhost:3000',
        racinePublique: join(tmpdir(), 'bf-auto-dossier-public-inexistant'),
        niveauJournal: 'silent',
        verifierSessionGaragiste: async () => false,
        maintenant: () => new Date(),
        mode: 'production',
        preDiagnosticPublie: true,
        protectionFormulairesGaragiste: PROTECTION_FORMULAIRES_ESSAI,
      }),
    ).rejects.toThrow(ErreurDemarrageServeur)
  })
})

const JETON_VALIDE = 'jeton-valide'

const MODULE_GARAGISTE: ModuleContexte = {
  nom: 'garagiste-essai',
  enregistrer: (app, outils) => {
    app.get('/garagiste/essai', { preHandler: outils.exigerGaragiste }, async () => ({
      page: 'espace',
    }))
    app.post('/garagiste/essai', { preHandler: outils.exigerGaragiste }, async () => ({
      enregistre: true,
    }))
  },
}

async function serveurGaragiste(): Promise<FastifyInstance> {
  app = await creerServeurEssai([MODULE_GARAGISTE], {
    verifierSessionGaragiste: async (jeton) => jeton === JETON_VALIDE,
  })
  return app
}

describe('serveur : accès à l’espace garagiste', () => {
  it('redirige une page demandée sans session vers la connexion, avec le chemin de retour', async () => {
    const reponse = await (await serveurGaragiste()).inject('/garagiste/essai?filtre=nouvelles')
    expect(reponse.statusCode).toBe(303)
    expect(reponse.headers['location']).toBe(
      '/garagiste/connexion?retour=%2Fgaragiste%2Fessai%3Ffiltre%3Dnouvelles',
    )
  })

  it('redirige aussi quand le cookie porte un jeton invalide', async () => {
    const reponse = await (
      await serveurGaragiste()
    ).inject({ url: '/garagiste/essai', cookies: { bf_session: 'jeton-perime' } })
    expect(reponse.statusCode).toBe(303)
  })

  it('refuse un envoi sans session par 401, avec une page qui mène à la connexion', async () => {
    const reponse = await (
      await serveurGaragiste()
    ).inject({
      method: 'POST',
      url: '/garagiste/essai',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'statut=close',
    })
    expect(reponse.statusCode).toBe(401)
    expect(reponse.body).toContain('<h1>Connexion requise</h1>')
    expect(reponse.body).toContain('href="/garagiste/connexion"')
    expect(reponse.body).toContain('<meta name="robots" content="noindex">')
    expect(reponse.body).not.toContain('enregistre')
  })

  it('laisse passer une session valide, en lecture comme en envoi', async () => {
    const instance = await serveurGaragiste()
    const lecture = await instance.inject({
      url: '/garagiste/essai',
      cookies: { bf_session: JETON_VALIDE },
    })
    expect(lecture.statusCode).toBe(200)
    expect(lecture.json()).toEqual({ page: 'espace' })
    const envoi = await instance.inject({
      method: 'POST',
      url: '/garagiste/essai',
      cookies: { bf_session: JETON_VALIDE },
    })
    expect(envoi.statusCode).toBe(200)
    expect(envoi.json()).toEqual({ enregistre: true })
  })
})

/** Module qui fournit les emplacements donnés, chacun rendu par un texte reconnaissable. */
function moduleBlocs(nom: string, emplacements: readonly EmplacementAccueil[]): ModuleContexte {
  return {
    nom,
    enregistrer: () => undefined,
    blocsAccueil: Object.fromEntries(
      emplacements.map((emplacement) => [
        emplacement,
        async (maintenant: Date) => html`<p>bloc ${emplacement} ${maintenant.toISOString()}</p>`,
      ]),
    ),
  }
}

describe('serveur : page d’accueil assemblée par blocs', () => {
  const INSTANT = new Date('2026-09-24T08:00:00Z')

  it('place les zones dans l’ordre du téléphone, quel que soit le module qui les fournit', async () => {
    app = await creerServeurEssai(
      [
        moduleBlocs('demandes', ['rappel']),
        moduleBlocs('garage', ['garage', 'questions', 'information']),
        moduleBlocs('catalogue', ['catalogue']),
        moduleBlocs('pre-diagnostic', ['pre-diagnostic']),
      ],
      { maintenant: () => INSTANT },
    )
    const reponse = await app.inject('/')
    expect(reponse.statusCode).toBe(200)
    const ordre = [...reponse.body.matchAll(/class="accueil__zone accueil__zone--([a-z-]+)"/g)].map(
      ([, emplacement]) => emplacement,
    )
    expect(ordre).toEqual([
      'pre-diagnostic',
      'catalogue',
      'information',
      'questions',
      'garage',
      'rappel',
    ])
    expect(reponse.body).toContain('<p>bloc rappel 2026-09-24T08:00:00.000Z</p>')
    expect(reponse.body).toContain('<div class="conteneur accueil__colonnes">')
    expect(reponse.body).toContain(
      '<h1 class="ouverture__titre surtitre" id="titre-accueil">BF Auto, garage automobile à Choisy-le-Roi</h1>',
    )
    expect(reponse.body).toContain('<title>BF Auto, garage automobile à Choisy-le-Roi</title>')
  })

  it('omet un emplacement non fourni, sans texte d’attente', async () => {
    app = await creerServeurEssai([moduleBlocs('garage', ['garage'])])
    const reponse = await app.inject('/')
    expect(reponse.statusCode).toBe(200)
    expect(reponse.body.match(/accueil__zone--/g)).toHaveLength(1)
    expect(reponse.body).toContain('accueil__zone--garage')
    expect(reponse.body).not.toMatch(/en construction|bientôt|à venir/i)
  })

  it('un bloc qui rend null laisse son emplacement absent, à cette requête seulement', async () => {
    let publie = false
    const rappel: ModuleContexte = {
      nom: 'demandes',
      enregistrer: () => undefined,
      blocsAccueil: { rappel: async () => (publie ? html`<p>bloc rappel</p>` : null) },
    }
    app = await creerServeurEssai([rappel, moduleBlocs('garage', ['garage'])])
    const sans = (await app.inject('/')).body
    expect(sans).not.toContain('accueil__zone--rappel')
    expect(sans).toContain('accueil__zone--garage')
    expect(sans.match(/accueil__zone--/g)).toHaveLength(1)
    expect(sans).not.toMatch(/en construction|bientôt|à venir/i)
    publie = true
    expect((await app.inject('/')).body).toContain(
      '<div class="accueil__zone accueil__zone--rappel"><p>bloc rappel</p></div>',
    )
  })

  it('une colonne dont tous les blocs rendent null n’est pas rendue', async () => {
    const vide: ModuleContexte = {
      nom: 'garage',
      enregistrer: () => undefined,
      blocsAccueil: { questions: async () => null, encart: async () => null },
    }
    app = await creerServeurEssai([vide, moduleBlocs('demandes', ['rappel'])])
    const corps = (await app.inject('/')).body
    expect(corps).not.toContain('accueil__colonne--gauche')
    expect(corps).not.toContain('accueil__zone--encart')
    expect(corps).toContain('accueil__colonne--droite')
  })

  it('rend un accueil vide mais valide quand aucun module ne fournit de bloc', async () => {
    app = await creerServeurEssai([])
    const reponse = await app.inject('/')
    expect(reponse.statusCode).toBe(200)
    expect(reponse.body).not.toContain('accueil__zone')
  })

  it('refuse de démarrer si deux modules fournissent le même emplacement', async () => {
    await expect(
      creerServeurEssai([moduleBlocs('garage', ['rappel']), moduleBlocs('demandes', ['rappel'])]),
    ).rejects.toThrow(/rappel.*garage et demandes/)
  })
})

/** Module qui renvoie l'adresse du client telle que Fastify l'a établie. */
const MODULE_ADRESSE: ModuleContexte = {
  nom: 'adresse',
  enregistrer: (app) => {
    app.get('/adresse', async (requete) => ({ ip: requete.ip }))
  },
}
const ADRESSE_MANDATAIRE = '10.0.0.1'
const ADRESSE_CLIENT = '203.0.113.7'
const ADRESSE_FORGEE = '198.51.100.9'

describe('serveur : adresse du client derrière un mandataire (TRUST_PROXY, Kano D9)', () => {
  const adresseVue = async (mandataires: number, transmises: string): Promise<string> => {
    app = await creerServeurEssai([MODULE_ADRESSE], { mandatairesDeConfiance: mandataires })
    const reponse = await app.inject({
      url: '/adresse',
      remoteAddress: ADRESSE_MANDATAIRE,
      headers: { 'x-forwarded-for': transmises },
    })
    return (reponse.json() as { ip: string }).ip
  }

  it('sans mandataire déclaré, l’en-tête X-Forwarded-For n’est jamais lu', async () => {
    expect(await adresseVue(0, ADRESSE_CLIENT)).toBe(ADRESSE_MANDATAIRE)
  })

  it('avec un mandataire (Render), l’adresse ajoutée par lui est celle du client', async () => {
    expect(await adresseVue(1, ADRESSE_CLIENT)).toBe(ADRESSE_CLIENT)
  })

  it('une adresse forgée par le client en tête de l’en-tête est ignorée', async () => {
    expect(await adresseVue(1, `${ADRESSE_FORGEE}, ${ADRESSE_CLIENT}`)).toBe(ADRESSE_CLIENT)
  })
})

describe('serveur : journal sans chaîne de requête ni adresse IP (Kano D9, B-30)', () => {
  it('la sérialisation d’une requête ne garde que la méthode et le chemin', () => {
    expect(serialiserRequete({ method: 'GET', url: '/demande/envoyee?j=secret' })).toEqual({
      method: 'GET',
      url: '/demande/envoyee',
    })
  })

  it('le journal d’accès réel n’écrit ni la chaîne de requête ni l’adresse du client', async () => {
    const lignes: string[] = []
    const flux = new Writable({
      write(morceau: Buffer, _encodage, suite) {
        lignes.push(morceau.toString('utf8'))
        suite()
      },
    })
    app = await creerServeurEssai([MODULE_ESSAI], { journal: { niveau: 'info', flux } })
    await app.inject({ url: '/essai?code=parcours-secret', remoteAddress: ADRESSE_CLIENT })
    const journal = lignes.join('')
    expect(journal).toContain('"url":"/essai"')
    expect(journal).not.toContain('parcours-secret')
    expect(journal).not.toContain(ADRESSE_CLIENT)
    expect(journal).not.toContain('remoteAddress')
  })
})

describe('serveur : aucune indexation hors production (Kano D8)', () => {
  const robots = async (mode: ModeSite, url: string) => {
    app = await creerServeurEssai([MODULE_ESSAI], { mode })
    return (await app.inject(url)).headers['x-robots-tag']
  }

  it.each(['/essai', '/nulle-part', '/panne', '/sante', '/css/bf-auto.css'])(
    'démonstration et relecture : noindex sur %s',
    async (url) => {
      expect(await robots('demonstration', url)).toBe('noindex')
      await app?.close()
      expect(await robots('relecture', url)).toBe('noindex')
    },
  )

  it('production : aucun en-tête X-Robots-Tag sur les pages publiques', async () => {
    expect(await robots('production', '/essai')).toBeUndefined()
  })
})

describe('serveur : sonde de santé (Kano D5, D11)', () => {
  const sante = async (surveiller: () => Promise<EtatNotifications>) => {
    app = await creerServeurEssai([], { surveillerNotifications: surveiller })
    const reponse = await app.inject('/sante')
    return { statut: reponse.statusCode, corps: reponse.json() as unknown }
  }

  it('répond 200 tant qu’aucune notification n’échoue durablement', async () => {
    expect(await sante(async () => ({ etat: 'ok', echecsDurables: 0 }))).toEqual({
      statut: 200,
      corps: { statut: 'ok' },
    })
  })

  it('répond 503 quand une notification échoue depuis plus d’une heure', async () => {
    expect(await sante(async () => ({ etat: 'degradee', echecsDurables: 2 }))).toEqual({
      statut: 503,
      corps: { statut: 'degradee', notificationsEnEchec: 2, connecteursEnEchec: [] },
    })
  })

  it('répond 503 et nomme le connecteur en panne (Kano connecteurs, C4)', async () => {
    expect(
      await sante(async () => ({
        etat: 'degradee',
        echecsDurables: 0,
        connecteursEnEchec: ['Envoi de courriel (SMTP)'],
      })),
    ).toEqual({
      statut: 503,
      corps: {
        statut: 'degradee',
        notificationsEnEchec: 0,
        connecteursEnEchec: ['Envoi de courriel (SMTP)'],
      },
    })
  })

  it('répond 503 quand l’état des notifications est illisible (base inaccessible)', async () => {
    const lecture = sante(async () => {
      throw new Error('base verrouillée')
    })
    expect(await lecture).toEqual({ statut: 503, corps: { statut: 'indisponible' } })
  })
})

describe('serveur : pré-diagnostic non publié et couleur de thème', () => {
  it('aucune page, 404 comprise, ne lie le pré-diagnostic non publié', async () => {
    app = await creerServeurEssai([MODULE_ESSAI], { preDiagnosticPublie: false })
    for (const url of ['/essai', '/nulle-part']) {
      expect((await app.inject(url)).body, url).not.toContain('/pre-diagnostic')
    }
  })

  it('pose la couleur de la barre du navigateur lue dans les jetons de la feuille', async () => {
    const racine = await creerRacinePubliqueEssai()
    await writeFile(
      join(racine, '/css/bf-auto.css'),
      ':root{--couleur-graphite: #3a3935;--couleur-theme: var(--couleur-graphite)}',
    )
    app = await creerServeurEssai([MODULE_ESSAI], { racinePublique: racine })
    expect((await app.inject('/essai')).body).toContain(
      '<meta name="theme-color" content="#3a3935">',
    )
    await rm(racine, { recursive: true, force: true })
  })
})

describe('serveur : publication du pré-diagnostic dans le cadre de page', () => {
  it('le cadre remis à la mise en page dit si le pré-diagnostic est publié', () => {
    expect(completerCadre(CADRE_ESSAI, false)).toEqual({
      ...CADRE_ESSAI,
      preDiagnosticPublie: false,
    })
  })
})
