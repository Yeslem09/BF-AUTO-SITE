/**
 * Appel JSON borné dans le temps vers une API de fournisseur (SMS). Les
 * pannes réseau deviennent des `ErreurConnecteur` nommées ; les réponses
 * HTTP sont rendues telles quelles, chaque adaptateur interprète les siennes.
 */
import { detailDe, ErreurConnecteur } from './erreurs.js'

export const DELAI_HTTP_MS = 10_000

export interface RequeteJson {
  readonly methode: 'GET' | 'POST'
  readonly url: string
  readonly enTetes?: Readonly<Record<string, string>>
  /** Corps déjà sérialisé : certaines signatures portent sur les octets exacts. */
  readonly corps?: string
}

export interface ReponseJson {
  readonly statut: number
  /** Corps décodé ; `null` s'il est vide ou n'est pas du JSON. */
  readonly corps: unknown
}

const PREMIER_STATUT_SUCCES = 200
const PREMIER_STATUT_REDIRECTION = 300
const STATUT_NON_AUTORISE = 401
const STATUT_INTERDIT = 403
const STATUT_TROP_DE_REQUETES = 429
const PREMIER_STATUT_SERVEUR = 500
const NOMS_DELAI = new Set(['TimeoutError', 'AbortError'])

export async function appelerJson(
  requete: RequeteJson,
  connecteur: string,
  delaiMs: number = DELAI_HTTP_MS,
): Promise<ReponseJson> {
  let reponse: Response
  try {
    reponse = await fetch(requete.url, {
      method: requete.methode,
      headers: {
        Accept: 'application/json',
        ...(requete.corps === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...requete.enTetes,
      },
      ...(requete.corps === undefined ? {} : { body: requete.corps }),
      signal: AbortSignal.timeout(delaiMs),
    })
  } catch (erreur) {
    const delai = erreur instanceof Error && NOMS_DELAI.has(erreur.name)
    throw new ErreurConnecteur(
      connecteur,
      delai ? 'delai' : 'injoignable',
      detailDe(erreur),
      delai
        ? 'Le fournisseur ne répond pas à temps : réessayez plus tard.'
        : 'Vérifiez la connexion du serveur à Internet et l’adresse de l’API du fournisseur.',
    )
  }
  const texte = await reponse.text()
  let corps: unknown = null
  try {
    corps = texte === '' ? null : JSON.parse(texte)
  } catch {
    corps = null
  }
  return { statut: reponse.status, corps }
}

export function estSucces(reponse: ReponseJson): boolean {
  return reponse.statut >= PREMIER_STATUT_SUCCES && reponse.statut < PREMIER_STATUT_REDIRECTION
}

/** Échec HTTP traduit en nature et remède ; `messageFournisseur` est extrait du corps par l'adaptateur. */
export function echecHttp(
  reponse: ReponseJson,
  connecteur: string,
  messageFournisseur: string | null,
  remedeIdentifiants: string,
): ErreurConnecteur {
  const detail = `HTTP ${reponse.statut}${messageFournisseur === null ? '' : ` : ${messageFournisseur}`}`
  if (reponse.statut === STATUT_NON_AUTORISE || reponse.statut === STATUT_INTERDIT) {
    return new ErreurConnecteur(connecteur, 'identifiants', detail, remedeIdentifiants)
  }
  if (reponse.statut === STATUT_TROP_DE_REQUETES) {
    return new ErreurConnecteur(
      connecteur,
      'refus',
      detail,
      'Trop d’envois rapprochés : attendez quelques minutes.',
    )
  }
  if (reponse.statut >= PREMIER_STATUT_SERVEUR) {
    return new ErreurConnecteur(
      connecteur,
      'injoignable',
      detail,
      'Le fournisseur est en panne : réessayez plus tard.',
    )
  }
  return new ErreurConnecteur(
    connecteur,
    'refus',
    detail,
    'Le fournisseur refuse la demande : vérifiez le numéro, l’expéditeur et les crédits du compte.',
  )
}

/** Champ d'un corps JSON décodé ; `undefined` si le corps n'est pas un objet ou n'a pas ce champ. */
export function lireChamp(corps: unknown, nom: string): unknown {
  return typeof corps === 'object' && corps !== null
    ? (corps as Readonly<Record<string, unknown>>)[nom]
    : undefined
}

/** Premier message lisible d'un corps d'erreur de fournisseur (`message`, `error`). */
export function messageDuCorps(corps: unknown): string | null {
  const message = lireChamp(corps, 'message') ?? lireChamp(corps, 'error')
  return typeof message === 'string' && message !== '' ? message : null
}
