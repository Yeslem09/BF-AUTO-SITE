/**
 * Lecture de la configuration depuis les variables d'environnement.
 * Toutes les anomalies sont rassemblées : un démarrage raté dit tout d'un coup.
 *
 * | Variable                  | Défaut                   | Rôle                                            |
 * |---------------------------|--------------------------|-------------------------------------------------|
 * | PORT                      | 3000                     | Port d’écoute HTTP                              |
 * | HOTE                      | 127.0.0.1                | Interface d’écoute (0.0.0.0 en hébergement)     |
 * | URL_PUBLIQUE              | http://localhost:<PORT>  | Origine publique (liens canoniques, partages)   |
 * | CHEMIN_DONNEES            | donnees                  | Dossier des données versionnées                 |
 * | CHEMIN_PUBLIC             | public                   | Dossier des fichiers statiques                  |
 * | BASE_SQLITE               | var/demandes.sqlite      | Base des demandes, fermetures et sessions       |
 * | COURRIEL_GARAGE           | la boîte d’envoi         | Destinataire des nouvelles demandes             |
 * | COURRIEL_GARAGISTE        | COURRIEL_GARAGE          | Seule adresse où partent les liens de connexion |
 * | COURRIEL_RESPONSABLE_SITE | (aucun)                  | Anthony : signalements de changement, alertes   |
 * | COURRIEL_FOURNISSEUR,     | Gmail (préréglage)       | Envoi, lecture de la boîte et SMS : variables    |
 * | SMTP_*, IMAP_*, SMS_*     |                          | décrites dans src/infrastructure/courriel/       |
 * |                           |                          | reglages.ts et src/infrastructure/sms/reglages.ts|
 * | NIVEAU_JOURNAL            | info                     | fatal, error, warn, info, debug, trace, silent  |
 * | MODE_SITE                 | production               | production, relecture ou demonstration          |
 * | TRUST_PROXY               | 0 (aucun mandataire)     | Mandataires devant le site (1 sur Render)       |
 *
 * En production, le canal de notification des demandes (envoi de courriel
 * configuré, destinataire connu) est une donnée bloquante : la racine de
 * composition refuse de démarrer sans lui (Kano D8). COURRIEL_GARAGE vaut par
 * défaut l'adresse de la boîte d'envoi quand c'est une vraie boîte (Gmail :
 * le garage s'écrit à lui-même, Kano connecteurs C1).
 *
 * TRUST_PROXY : derrière un mandataire (Render en place un), l'adresse du
 * client n'est lisible que si l'on dit combien de mandataires la précèdent ;
 * sans cela, la limitation de débit verrait la même adresse pour tous les
 * visiteurs (Kano D9). Trop grand, un visiteur pourrait se faire passer pour un
 * autre en forgeant X-Forwarded-For : mettre le nombre exact, 1 sur Render. Ne
 * le régler que si le serveur n'est joignable qu'à travers ces mandataires.
 *
 * MODE_SITE=relecture n'écoute que sur 127.0.0.1 (Kano D8) : un HOTE différent
 * arrête le démarrage.
 */
import { resolve } from 'node:path'
import { MODES_SITE, type ModeSite } from './contrats/index.js'
import { PREREGLAGES } from './infrastructure/courriel/fournisseurs.js'
import {
  ErreurReglagesConnecteurs,
  lireReglagesConnecteurs,
  type ReglagesConnecteurs,
} from './infrastructure/reglages-connecteurs.js'
import { NIVEAUX_JOURNAL, type NiveauJournal } from './web/serveur.js'

export interface Configuration {
  readonly port: number
  readonly hote: string
  readonly urlPublique: string
  readonly cheminDonnees: string
  readonly cheminPublic: string
  readonly baseSqlite: string
  /** Destinataire des notifications de nouvelle demande. */
  readonly courrielGarage: string | null
  /** Destinataire des liens de connexion à l'espace garagiste (à défaut, `courrielGarage`). */
  readonly courrielGaragiste: string | null
  /** Anthony : signalements de changement et alertes de l'espace garagiste. */
  readonly courrielResponsable: string | null
  /** Envoi de courriel, lecture de la boîte et SMS (Kano connecteurs). */
  readonly connecteurs: ReglagesConnecteurs
  /** Réglages admis mais à dire au démarrage (lecture désactivée, SMS désactivé...). */
  readonly avertissementsConnecteurs: readonly string[]
  readonly niveauJournal: NiveauJournal
  readonly mode: ModeSite
  /** Nombre de mandataires (proxys inverses) placés devant le site ; 0 : aucun. */
  readonly mandatairesDeConfiance: number
}

export type Environnement = Readonly<Record<string, string | undefined>>

export class ErreurConfiguration extends Error {
  override readonly name = 'ErreurConfiguration'

  constructor(readonly problemes: readonly string[]) {
    super(`Configuration invalide :\n${problemes.map((probleme) => `- ${probleme}`).join('\n')}`)
  }
}

const PORT_PAR_DEFAUT = 3000
const PORT_MAX = 65_535
const HOTE_PAR_DEFAUT = '127.0.0.1'
/** Seule interface d'écoute admise en relecture : le poste d'Anthony, jamais le réseau. */
const HOTE_RELECTURE = HOTE_PAR_DEFAUT
const MANDATAIRES_PAR_DEFAUT = 0
/** Au-delà, une valeur trahit une faute de saisie (Render place un seul mandataire). */
const MANDATAIRES_MAX = 10
const DONNEES_PAR_DEFAUT = 'donnees'
const PUBLIC_PAR_DEFAUT = 'public'
const BASE_PAR_DEFAUT = 'var/demandes.sqlite'
const NIVEAU_PAR_DEFAUT: NiveauJournal = 'info'
const MODE_PAR_DEFAUT: ModeSite = 'production'
const FORMAT_COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Construit la configuration. Les chemins relatifs sont résolus depuis
 * `repertoireCourant` (la racine du projet quand on lance `pnpm demarrer`).
 */
export function lireConfiguration(
  env: Environnement,
  repertoireCourant: string = process.cwd(),
): Configuration {
  const problemes: string[] = []
  const texte = (nom: string): string | null => {
    const valeur = env[nom]?.trim()
    return valeur === undefined || valeur === '' ? null : valeur
  }
  const port = (nom: string, defaut: number): number => {
    const brut = texte(nom)
    if (brut === null) return defaut
    const valeur = Number(brut)
    if (!Number.isInteger(valeur) || valeur < 1 || valeur > PORT_MAX) {
      problemes.push(`${nom} : « ${brut} » n’est pas un port (entier de 1 à ${PORT_MAX})`)
      return defaut
    }
    return valeur
  }
  const courriel = (nom: string): string | null => {
    const valeur = texte(nom)
    if (valeur !== null && !FORMAT_COURRIEL.test(valeur)) {
      problemes.push(`${nom} : « ${valeur} » n’est pas une adresse de courriel`)
    }
    return valeur
  }

  const portHttp = port('PORT', PORT_PAR_DEFAUT)
  const urlPublique = lireUrlPublique(texte('URL_PUBLIQUE'), portHttp, problemes)
  const niveauJournal = lireNiveauJournal(texte('NIVEAU_JOURNAL'), problemes)
  const mode = lireMode(texte('MODE_SITE'), problemes)
  const hote = texte('HOTE') ?? HOTE_PAR_DEFAUT
  if (mode === 'relecture' && hote !== HOTE_RELECTURE) {
    problemes.push(
      `HOTE : « ${hote} » refusé en relecture, qui n’écoute que sur ${HOTE_RELECTURE} (retirer HOTE)`,
    )
  }
  const courrielGarageSaisi = courriel('COURRIEL_GARAGE')
  const { connecteurs, avertissements } = lireConnecteurs(env, problemes)
  const courrielGarage = courrielGarageSaisi ?? boiteDEnvoi(connecteurs)

  const configuration: Configuration = {
    port: portHttp,
    hote,
    urlPublique,
    cheminDonnees: resolve(repertoireCourant, texte('CHEMIN_DONNEES') ?? DONNEES_PAR_DEFAUT),
    cheminPublic: resolve(repertoireCourant, texte('CHEMIN_PUBLIC') ?? PUBLIC_PAR_DEFAUT),
    baseSqlite: resolve(repertoireCourant, texte('BASE_SQLITE') ?? BASE_PAR_DEFAUT),
    courrielGarage,
    courrielGaragiste: courriel('COURRIEL_GARAGISTE') ?? courrielGarage,
    courrielResponsable: courriel('COURRIEL_RESPONSABLE_SITE'),
    connecteurs,
    avertissementsConnecteurs: avertissements,
    niveauJournal,
    mode,
    mandatairesDeConfiance: lireMandataires(texte('TRUST_PROXY'), problemes),
  }
  if (problemes.length > 0) throw new ErreurConfiguration(problemes)
  return configuration
}

function lireMode(brut: string | null, problemes: string[]): ModeSite {
  if (brut === null) return MODE_PAR_DEFAUT
  const mode = MODES_SITE.find((connu) => connu === brut)
  if (mode === undefined) {
    problemes.push(`MODE_SITE : « ${brut} » inconnu (${MODES_SITE.join(', ')})`)
    return MODE_PAR_DEFAUT
  }
  return mode
}

function lireMandataires(brut: string | null, problemes: string[]): number {
  if (brut === null) return MANDATAIRES_PAR_DEFAUT
  const valeur = Number(brut)
  if (!Number.isInteger(valeur) || valeur < 0 || valeur > MANDATAIRES_MAX) {
    problemes.push(
      `TRUST_PROXY : « ${brut} », nombre de mandataires attendu (entier de 0 à ${MANDATAIRES_MAX}, 1 sur Render)`,
    )
    return MANDATAIRES_PAR_DEFAUT
  }
  return valeur
}

function lireNiveauJournal(brut: string | null, problemes: string[]): NiveauJournal {
  if (brut === null) return NIVEAU_PAR_DEFAUT
  const niveau = NIVEAUX_JOURNAL.find((connu) => connu === brut)
  if (niveau === undefined) {
    problemes.push(`NIVEAU_JOURNAL : « ${brut} » inconnu (${NIVEAUX_JOURNAL.join(', ')})`)
    return NIVEAU_PAR_DEFAUT
  }
  return niveau
}

function lireUrlPublique(brut: string | null, port: number, problemes: string[]): string {
  if (brut === null) return `http://localhost:${port}`
  let url: URL
  try {
    url = new URL(brut)
  } catch {
    problemes.push(`URL_PUBLIQUE : « ${brut} » n’est pas une adresse`)
    return brut
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    problemes.push('URL_PUBLIQUE : http ou https attendu')
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    problemes.push('URL_PUBLIQUE : origine seule attendue, sans chemin (https://www.exemple.fr)')
  }
  return url.origin
}

/** Réglages des connecteurs ; leurs fautes rejoignent celles du reste de la configuration. */
function lireConnecteurs(
  env: Environnement,
  problemes: string[],
): { connecteurs: ReglagesConnecteurs; avertissements: readonly string[] } {
  try {
    const lecture = lireReglagesConnecteurs(env)
    return { connecteurs: lecture.reglages, avertissements: lecture.avertissements }
  } catch (erreur) {
    if (!(erreur instanceof ErreurReglagesConnecteurs)) throw erreur
    problemes.push(...erreur.problemes)
    return { connecteurs: { courriel: null, sms: null }, avertissements: [] }
  }
}

/** Adresse de la boîte d'envoi quand c'est la boîte du garage (pas un relais). */
function boiteDEnvoi(connecteurs: ReglagesConnecteurs): string | null {
  const smtp = connecteurs.courriel?.smtp
  if (smtp === undefined || !PREREGLAGES[smtp.fournisseur].expediteurDuCompte) return null
  return smtp.expediteur
}
