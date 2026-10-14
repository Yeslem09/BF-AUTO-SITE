import { existsSync } from 'node:fs'
import { join } from 'node:path'
import fastifyCompress from '@fastify/compress'
import fastifyCookie from '@fastify/cookie'
import fastifyFormbody from '@fastify/formbody'
import fastifyStatic from '@fastify/static'
import Fastify, {
  type FastifyBaseLogger,
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type preHandlerAsyncHookHandler,
} from 'fastify'
import {
  CHAMP_JETON_FORMULAIRE,
  CHEMINS,
  NOM_COOKIE_SESSION,
  PARAMETRES_CONNEXION,
  type EtatNotifications,
  type ModeSite,
  type PreDiagnosticPublie,
  type ProtectionFormulairesGaragiste,
  type SurveillerNotifications,
  type VerifierSessionGaragiste,
} from '../contrats/index.js'
import { lireCouleurThemeDuFichier } from './couleur-theme.js'
import { enTetesSecurite } from './en-tetes-securite.js'
import type { Html } from './html.js'
import { composerTypographie } from './typographie.js'
import { rendrePage, type CadrePage, type VuePage } from './mise-en-page.js'
import type {
  EmplacementAccueil,
  ModuleContexte,
  OutilsPage,
  RendreBlocAccueil,
} from './module-contexte.js'
import { politiqueCache } from './politique-cache.js'
import { RESSOURCES, RESSOURCES_INDISPENSABLES } from './ressources.js'
import { creerVersionneur } from './versionneur.js'
import { vueAccueil, type BlocsAccueilRendus } from './vues/accueil.js'
import {
  PAGE_SECOURS,
  STATUT_ERREUR_SERVEUR,
  vueConnexionRequise,
  vueErreurServeur,
  vueIntrouvable,
  type PublicationErreurs,
  vueRequeteInvalide,
} from './vues/erreurs.js'

export const CHEMIN_SANTE = '/sante'
/** Hors production, aucune réponse n'est indexée (Kano D8, arbitrage 3). */
export const EN_TETE_ROBOTS_HORS_PRODUCTION = 'noindex'
const TYPE_HTML = 'text/html; charset=utf-8'
const STATUT_OK = 200
/** La sonde externe alerte Anthony sur ce statut (Kano D11). */
const STATUT_INDISPONIBLE = 503
const PREMIER_STATUT_CLIENT = 400
const PREMIER_STATUT_SERVEUR = 500
const STATUT_VOIR_AILLEURS = 303
/** Envoi de formulaire de l'espace garagiste refusé (falsification). */
const STATUT_REFUSE = 403
/** Aucune réponse de l'espace garagiste ne se garde en cache (Kano D5, D11). */
const CACHE_ESPACE_GARAGISTE = 'no-store'
/** Méthodes d'une navigation ordinaire : on peut rediriger vers la connexion puis revenir. */
const METHODES_NAVIGATION: ReadonlySet<string> = new Set(['GET', 'HEAD'])

export const NIVEAUX_JOURNAL = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const
export type NiveauJournal = (typeof NIVEAUX_JOURNAL)[number]

export interface OptionsServeur {
  /** Modules des contextes, enregistrés dans l'ordre donné. */
  readonly modules: readonly ModuleContexte[]
  /** Identité et statut d'ouverture du garage, demandés à chaque page rendue. */
  readonly fournirCadre: () => Promise<CadrePage>
  /** Origine publique sans barre finale, pour les liens canoniques. */
  readonly urlPublique: string
  /** Chemin absolu du dossier `public/`. */
  readonly racinePublique: string
  readonly niveauJournal: NiveauJournal
  /** Vrai si le jeton du cookie de session désigne une session garagiste valide. */
  readonly verifierSessionGaragiste: VerifierSessionGaragiste
  /** Anti-falsification des formulaires de l'espace garagiste (fournie par l'accès). */
  readonly protectionFormulairesGaragiste: ProtectionFormulairesGaragiste
  /** Instant présent, transmis aux blocs de l'accueil (horloge fixe en test et en capture). */
  readonly maintenant: () => Date
  /** Mode du site : le bandeau de démonstration ou de relecture en dépend. */
  readonly mode: ModeSite
  /** Pré-diagnostic publié : la mise en page ne lie `/pre-diagnostic` que s'il l'est. */
  readonly preDiagnosticPublie: PreDiagnosticPublie
  /**
   * État des notifications de demande : `/sante` répond 503 quand il est
   * dégradé. Absent (serveur d'essai sans demandes) : rien à surveiller.
   */
  readonly surveillerNotifications?: SurveillerNotifications
  /**
   * Nombre de mandataires placés devant le site (TRUST_PROXY) : Fastify lit
   * l'adresse du client dans X-Forwarded-For à cette profondeur exacte, jamais
   * au-delà. Absent ou 0 : l'adresse de la connexion, sans en-tête lu.
   */
  readonly mandatairesDeConfiance?: number
  /** Destination du journal (essais) ; la sortie standard par défaut. */
  readonly fluxJournal?: { write(ligne: string): void }
}

/**
 * Cadre remis à la mise en page : celui du garage, plus ce qui est publié.
 * Le champ `preDiagnosticPublie` permet à la navigation de masquer le lien
 * vers une page qui n'existe pas.
 */
export type CadrePagePublie = CadrePage & { readonly preDiagnosticPublie: PreDiagnosticPublie }

export function completerCadre(
  cadre: CadrePage,
  preDiagnosticPublie: PreDiagnosticPublie,
): CadrePagePublie {
  return { ...cadre, preDiagnosticPublie }
}

/**
 * Confiance limitée aux `mandataires` premiers sauts, comptés depuis la
 * connexion : l'adresse du client est celle que le dernier mandataire a
 * ajoutée à X-Forwarded-For, jamais une valeur plus ancienne que le client
 * aurait pu écrire lui-même. Fastify refuse désormais un simple nombre (il ne
 * peut pas vérifier que la connexion vient bien du mandataire) : ce réglage
 * suppose donc que le serveur n'est joignable qu'à travers eux, comme sur Render.
 */
export function faireConfianceAuxMandataires(
  mandataires: number,
): (adresse: string, saut: number) => boolean {
  return (_adresse, saut) => saut < mandataires
}

/** Réponse de `/sante` : `ok`, ou la raison pour laquelle la sonde doit alerter. */
export type EtatSante =
  | { readonly statut: 'ok' }
  | {
      readonly statut: 'degradee'
      readonly notificationsEnEchec: number
      readonly connecteursEnEchec: readonly string[]
    }
  | { readonly statut: 'indisponible' }

/**
 * Ce que le journal écrit d'une requête (Kano D9, B-30) : la méthode et le
 * chemin, jamais la chaîne de requête (codes de parcours, jetons) ni
 * l'adresse IP ou le port du client.
 */
export function serialiserRequete(requete: { readonly method: string; readonly url: string }): {
  readonly method: string
  readonly url: string
} {
  return { method: requete.method, url: cheminSansRequete(requete.url) }
}

export class ErreurDemarrageServeur extends Error {
  override readonly name = 'ErreurDemarrageServeur'
}

/**
 * Fabrique le serveur HTTP : fichiers publics, sécurité, cache, pages d'erreur
 * et routes des contextes. Ne dépend d'aucun contexte : tout arrive en paramètre.
 */
export async function creerServeur(options: OptionsServeur): Promise<FastifyInstance> {
  verifierRessources(options.racinePublique)
  const mandataires = options.mandatairesDeConfiance ?? 0
  const app = Fastify({
    logger: {
      level: options.niveauJournal,
      serializers: { req: serialiserRequete },
      ...(options.fluxJournal !== undefined && { stream: options.fluxJournal }),
    },
    trustProxy: mandataires > 0 ? faireConfianceAuxMandataires(mandataires) : false,
    routerOptions: { ignoreTrailingSlash: true },
  })
  const versionner = creerVersionneur(options.racinePublique)
  // Barre du navigateur sur téléphone : la couleur vient des jetons (--couleur-theme).
  const couleurTheme = lireCouleurThemeDuFichier(
    join(options.racinePublique, RESSOURCES.feuilleDeStyle),
  )
  const enTetes = enTetesSecurite(options.urlPublique)
  const publication = { preDiagnosticPublie: options.preDiagnosticPublie }

  const envoyerPage = async (reponse: FastifyReply, vue: VuePage): Promise<FastifyReply> => {
    const cadre = completerCadre(await options.fournirCadre(), options.preDiagnosticPublie)
    const page = rendrePage(vue, cadre, {
      urlPublique: options.urlPublique,
      versionner,
      mode: options.mode,
      couleurTheme,
    })
    return reponse
      .code(vue.statutHttp ?? STATUT_OK)
      .type(TYPE_HTML)
      .send(composerTypographie(page.toString()))
  }
  const protection = options.protectionFormulairesGaragiste
  const outils: OutilsPage = {
    envoyerPage,
    exigerGaragiste: creerExigerGaragiste(options.verifierSessionGaragiste, envoyerPage),
    jetonFormulaireGaragiste: (requete) =>
      protection.jeton(requete.cookies[NOM_COOKIE_SESSION]) ?? '',
    exigerFormulaireGaragiste: creerExigerFormulaireGaragiste(protection, envoyerPage),
  }
  const blocsAccueil = indexerBlocsAccueil(options.modules)

  const enTetesDuMode =
    options.mode === 'production'
      ? enTetes
      : { ...enTetes, 'x-robots-tag': EN_TETE_ROBOTS_HORS_PRODUCTION }
  app.addHook('onRequest', async (_requete, reponse) => {
    reponse.headers(enTetesDuMode)
  })
  app.addHook('onSend', async (requete, reponse, charge) => {
    if (!reponse.hasHeader('cache-control')) {
      const typeContenu = reponse.getHeader('content-type')
      reponse.header(
        'cache-control',
        politiqueCache(requete.url, typeof typeContenu === 'string' ? typeContenu : undefined),
      )
    }
    return charge
  })

  await app.register(fastifyCompress)
  await app.register(fastifyFormbody)
  await app.register(fastifyCookie)
  await app.register(fastifyStatic, {
    root: options.racinePublique,
    index: false,
    cacheControl: false,
    etag: true,
    lastModified: true,
  })

  app.get(CHEMIN_SANTE, async (requete, reponse) => {
    const sante = await etatDeSante(options.surveillerNotifications, requete.log)
    return reponse.code(sante.statut === 'ok' ? STATUT_OK : STATUT_INDISPONIBLE).send(sante)
  })
  app.get(CHEMINS.accueil, async (_requete, reponse) => {
    const [cadre, blocs] = await Promise.all([
      options.fournirCadre(),
      rendreBlocsAccueil(blocsAccueil, options.maintenant()),
    ])
    return envoyerPage(reponse, vueAccueil(cadre.identite, blocs))
  })

  for (const module of options.modules) {
    await module.enregistrer(app, outils)
    app.log.debug({ module: module.nom }, 'Module de contexte enregistré')
  }

  app.setNotFoundHandler(async (requete, reponse) =>
    envoyerPage(reponse, vueIntrouvable(cheminSansRequete(requete.url), publication)),
  )
  app.setErrorHandler(async (erreur: FastifyError, requete, reponse) =>
    repondreErreur(erreur, requete, reponse, envoyerPage, publication),
  )

  return app
}

/**
 * Santé du site pour la sonde externe (Kano D5, D11) : une notification en
 * échec depuis plus d'une heure, ou une base illisible, fait répondre 503.
 */
async function etatDeSante(
  surveillerNotifications: SurveillerNotifications | undefined,
  journal: FastifyBaseLogger,
): Promise<EtatSante> {
  if (surveillerNotifications === undefined) return { statut: 'ok' }
  let notifications: EtatNotifications
  try {
    notifications = await surveillerNotifications()
  } catch (erreur) {
    journal.error({ err: erreur }, 'Santé : état des notifications illisible')
    return { statut: 'indisponible' }
  }
  return notifications.etat === 'ok'
    ? { statut: 'ok' }
    : {
        statut: 'degradee',
        notificationsEnEchec: notifications.echecsDurables,
        connecteursEnEchec: notifications.connecteursEnEchec ?? [],
      }
}

/**
 * Associe chaque emplacement de l'accueil au module qui le fournit. Deux
 * modules sur le même emplacement : le serveur refuse de démarrer plutôt que
 * d'en masquer un en silence.
 */
function indexerBlocsAccueil(
  modules: readonly ModuleContexte[],
): ReadonlyMap<EmplacementAccueil, RendreBlocAccueil> {
  const fournisseurs = new Map<EmplacementAccueil, { module: string; rendre: RendreBlocAccueil }>()
  for (const module of modules) {
    for (const [emplacement, rendre] of Object.entries(module.blocsAccueil ?? {}) as [
      EmplacementAccueil,
      RendreBlocAccueil | undefined,
    ][]) {
      if (rendre === undefined) continue
      const deja = fournisseurs.get(emplacement)
      if (deja !== undefined) {
        throw new ErreurDemarrageServeur(
          `L'emplacement d'accueil « ${emplacement} » est fourni par deux modules : ${deja.module} et ${module.nom}.`,
        )
      }
      fournisseurs.set(emplacement, { module: module.nom, rendre })
    }
  }
  return new Map([...fournisseurs].map(([emplacement, { rendre }]) => [emplacement, rendre]))
}

/** Blocs de l'accueil à cet instant ; un bloc rendu `null` laisse son emplacement absent. */
async function rendreBlocsAccueil(
  fournisseurs: ReadonlyMap<EmplacementAccueil, RendreBlocAccueil>,
  maintenant: Date,
): Promise<BlocsAccueilRendus> {
  const rendus = await Promise.all(
    [...fournisseurs].map(
      async ([emplacement, rendre]) => [emplacement, await rendre(maintenant)] as const,
    ),
  )
  return Object.fromEntries(
    rendus.filter((rendu): rendu is readonly [EmplacementAccueil, Html] => rendu[1] !== null),
  )
}

/** Crochet d'accès à l'espace garagiste, décrit dans `OutilsPage.exigerGaragiste`. */
function creerExigerGaragiste(
  verifierSession: VerifierSessionGaragiste,
  envoyerPage: OutilsPage['envoyerPage'],
): preHandlerAsyncHookHandler {
  return async (requete, reponse) => {
    if (await verifierSession(requete.cookies[NOM_COOKIE_SESSION])) return
    if (METHODES_NAVIGATION.has(requete.method)) {
      const parametres = new URLSearchParams({ [PARAMETRES_CONNEXION.retour]: requete.url })
      return reponse.redirect(
        `${CHEMINS.garagisteConnexion}?${parametres.toString()}`,
        STATUT_VOIR_AILLEURS,
      )
    }
    return envoyerPage(reponse, vueConnexionRequise(cheminSansRequete(requete.url)))
  }
}

/** Crochet anti-falsification de l'espace, décrit dans `OutilsPage.exigerFormulaireGaragiste`. */
function creerExigerFormulaireGaragiste(
  protection: ProtectionFormulairesGaragiste,
  envoyerPage: OutilsPage['envoyerPage'],
): preHandlerAsyncHookHandler {
  return async (requete, reponse) => {
    const admis = protection.admettre({
      jetonSession: requete.cookies[NOM_COOKIE_SESSION],
      jetonFormulaire: champDuCorps(requete.body, CHAMP_JETON_FORMULAIRE),
      origine: premiereValeur(requete.headers.origin),
      referent: premiereValeur(requete.headers.referer),
      hote: premiereValeur(requete.headers.host),
    })
    if (admis) return
    requete.log.warn({ chemin: requete.routeOptions.url }, 'Formulaire de l’espace refusé')
    reponse.header('cache-control', CACHE_ESPACE_GARAGISTE)
    return envoyerPage(reponse, vueRequeteInvalide(cheminSansRequete(requete.url), STATUT_REFUSE))
  }
}

function champDuCorps(corps: unknown, nom: string): unknown {
  return typeof corps === 'object' && corps !== null
    ? (corps as Readonly<Record<string, unknown>>)[nom]
    : undefined
}

function premiereValeur(valeur: string | readonly string[] | undefined): string | undefined {
  return typeof valeur === 'string' ? valeur : valeur?.[0]
}

function cheminSansRequete(url: string): string {
  return url.split('?', 1)[0] ?? url
}

function verifierRessources(racinePublique: string): void {
  const absentes = RESSOURCES_INDISPENSABLES.filter(
    (ressource) => !existsSync(join(racinePublique, ressource)),
  )
  if (absentes.length > 0) {
    throw new ErreurDemarrageServeur(
      `Ressources publiques absentes dans ${racinePublique} : ${absentes.join(', ')}. ` +
        'Lancer « pnpm run construire:client » avant de démarrer.',
    )
  }
}

async function repondreErreur(
  erreur: FastifyError,
  requete: FastifyRequest,
  reponse: FastifyReply,
  envoyerPage: OutilsPage['envoyerPage'],
  publication: PublicationErreurs,
): Promise<FastifyReply> {
  const statutClient =
    erreur.statusCode !== undefined &&
    erreur.statusCode >= PREMIER_STATUT_CLIENT &&
    erreur.statusCode < PREMIER_STATUT_SERVEUR
  const chemin = cheminSansRequete(requete.url)
  if (statutClient) {
    requete.log.info({ err: erreur }, 'Requête refusée')
  } else {
    requete.log.error({ err: erreur }, 'Erreur serveur')
  }
  const vue = statutClient
    ? vueRequeteInvalide(chemin, erreur.statusCode ?? PREMIER_STATUT_CLIENT)
    : vueErreurServeur(chemin, publication)
  try {
    return await envoyerPage(reponse, vue)
  } catch (erreurDeRendu) {
    requete.log.error({ err: erreurDeRendu }, 'Page d’erreur impossible à rendre')
    return reponse.code(STATUT_ERREUR_SERVEUR).type(TYPE_HTML).send(PAGE_SECOURS)
  }
}
