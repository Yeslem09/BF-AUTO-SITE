import type { ModeSite } from '../contrats/index.js'
/**
 * Outils de test partagés : un serveur complet (sécurité, mise en page, pages
 * d'erreur) monté avec les seuls modules voulus, sur un dossier public jetable.
 * Réservé aux fichiers de test.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type {
  ProtectionFormulairesGaragiste,
  SurveillerNotifications,
  VerifierSessionGaragiste,
} from '../contrats/index.js'
import type { CadrePage } from './mise-en-page.js'
import type { ModuleContexte } from './module-contexte.js'
import { RESSOURCES_INDISPENSABLES } from './ressources.js'
import { creerServeur, type NiveauJournal } from './serveur.js'

export const URL_PUBLIQUE_ESSAI = 'https://garage.exemple'

export const CADRE_ESSAI: CadrePage = {
  identite: {
    nom: 'BF Auto',
    accroche: 'Accroche d’essai',
    adresse: { voie: '7 rue Demanieux', codePostal: '94600', ville: 'Choisy-le-Roi' },
    telephone: { affichable: '06 05 92 28 38', lien: 'tel:+33605922838' },
  },
  statut: { etat: 'a-confirmer', libelle: 'Horaires à confirmer' },
}

const PREFIXE_JETON_ESSAI = 'formulaire-de-'

/**
 * Anti-falsification d'essai, aux règles de l'accès : le jeton est propre à la
 * session du cookie, et l'envoi doit venir de l'origine publique d'essai ou du
 * même hôte que la requête (en-tête `Origin`, à défaut `Referer`).
 */
export const PROTECTION_FORMULAIRES_ESSAI: ProtectionFormulairesGaragiste = {
  jeton: (jetonSession) =>
    jetonSession === undefined ? null : `${PREFIXE_JETON_ESSAI}${jetonSession}`,
  admettre: (envoi) => {
    if (envoi.jetonSession === undefined) return false
    if (envoi.jetonFormulaire !== `${PREFIXE_JETON_ESSAI}${envoi.jetonSession}`) return false
    const indication = envoi.origine ?? envoi.referent
    if (indication === undefined) return false
    try {
      const provenance = new URL(indication)
      return provenance.origin === URL_PUBLIQUE_ESSAI || provenance.host === envoi.hote
    } catch {
      return false
    }
  },
}

/** Dossier public minimal : chaque ressource indispensable existe, avec un contenu factice. */
export async function creerRacinePubliqueEssai(): Promise<string> {
  const racine = await mkdtemp(join(tmpdir(), 'bf-auto-public-'))
  for (const ressource of RESSOURCES_INDISPENSABLES) {
    const fichier = join(racine, ressource)
    await mkdir(dirname(fichier), { recursive: true })
    await writeFile(fichier, `/* ressource d'essai ${ressource} */`)
  }
  return racine
}

export interface OptionsServeurEssai {
  readonly cadre?: CadrePage
  readonly racinePublique?: string
  /** Par défaut, aucune session n'est valide. */
  readonly verifierSessionGaragiste?: VerifierSessionGaragiste
  /** Par défaut, `PROTECTION_FORMULAIRES_ESSAI`. */
  readonly protectionFormulairesGaragiste?: ProtectionFormulairesGaragiste
  /** Par défaut, l'horloge système. */
  readonly maintenant?: () => Date
  /** Par défaut, production. */
  readonly mode?: ModeSite
  /** Par défaut, publié. */
  readonly preDiagnosticPublie?: boolean
  readonly surveillerNotifications?: SurveillerNotifications
  readonly mandatairesDeConfiance?: number
  /** Par défaut, le journal est muet. */
  readonly journal?: {
    readonly niveau: NiveauJournal
    readonly flux: { write(ligne: string): void }
  }
}

/** Serveur prêt pour `app.inject()`. Son dossier public disparaît à `app.close()`. */
export async function creerServeurEssai(
  modules: readonly ModuleContexte[],
  options: OptionsServeurEssai = {},
): Promise<FastifyInstance> {
  const racinePublique = options.racinePublique ?? (await creerRacinePubliqueEssai())
  const cadre = options.cadre ?? CADRE_ESSAI
  const app = await creerServeur({
    modules,
    fournirCadre: async () => cadre,
    urlPublique: URL_PUBLIQUE_ESSAI,
    racinePublique,
    niveauJournal: options.journal?.niveau ?? 'silent',
    ...(options.journal !== undefined && { fluxJournal: options.journal.flux }),
    verifierSessionGaragiste: options.verifierSessionGaragiste ?? (async () => false),
    protectionFormulairesGaragiste:
      options.protectionFormulairesGaragiste ?? PROTECTION_FORMULAIRES_ESSAI,
    maintenant: options.maintenant ?? (() => new Date()),
    mode: options.mode ?? 'production',
    preDiagnosticPublie: options.preDiagnosticPublie ?? true,
    ...(options.surveillerNotifications !== undefined && {
      surveillerNotifications: options.surveillerNotifications,
    }),
    ...(options.mandatairesDeConfiance !== undefined && {
      mandatairesDeConfiance: options.mandatairesDeConfiance,
    }),
  })
  if (options.racinePublique === undefined) {
    app.addHook('onClose', async () => rm(racinePublique, { recursive: true, force: true }))
  }
  return app
}
