/**
 * Tri d'un message sur ses seuls en-têtes, avant tout téléchargement de son
 * contenu (Kano connecteurs, C5). Fonction pure, partagée par les adaptateurs.
 */
import {
  estIdentifiantDuSite,
  PREFIXE_REFERENCE,
  referencesDansIdentifiants,
  referencesDansObjet,
} from '../reference.js'

/** Ce que l'on sait du message d'origine d'un rapport de non-remise, sans l'avoir téléchargé. */
export type OriginalRapport =
  | { readonly etat: 'connu'; readonly identifiant: string | null; readonly objet: string | null }
  /** Les en-têtes d'origine sont dans une partie `text/rfc822-headers` à lire. */
  | { readonly etat: 'a-lire'; readonly partie: string }
  | { readonly etat: 'absent' }

export interface EnTetesMessage {
  readonly objet: string | null
  readonly identifiant: string | null
  /** `In-Reply-To` et `References` réunis. */
  readonly enTetesDeFil: string | null
  /** Adresse de l'expéditeur, en minuscules. */
  readonly expediteur: string | null
  readonly autoSubmitted: string | null
  readonly precedence: string | null
  /** `X-Autoreply` ou `X-Autorespond` présent. */
  readonly repondeurDeclare: boolean
  /** Type de contenu, en minuscules, paramètres compris. */
  readonly typeContenu: string | null
  readonly original: OriginalRapport
}

export type MotifEcart =
  'sans-reference' | 'envoi-du-site' | 'reponse-automatique' | 'non-remise-etrangere'

export type Tri =
  | { readonly decision: 'reponse'; readonly references: readonly string[] }
  | { readonly decision: 'non-remise'; readonly references: readonly string[] }
  | { readonly decision: 'lire-original'; readonly partie: string }
  | { readonly decision: 'ecarte'; readonly motif: MotifEcart }

/** Rapport de remise (RFC 3464), quel que soit l'émetteur. */
const TYPE_RAPPORT =
  /^multipart\/report\b[\s\S]*report-type\s*=\s*"?(delivery-status|global-delivery-status)/
/** Émetteurs des rapports qui ne respectent pas la RFC 3464. */
const EMETTEURS_SYSTEME = /^(mailer-daemon|postmaster)@/
const PRECEDENCES_AUTOMATIQUES = new Set(['auto_reply', 'bulk', 'junk', 'list'])
const OBJETS_AUTOMATIQUES =
  /^\s*(réponse automatique|reponse automatique|automatic reply|absence|out of office|auto:)/i
const AUTO_SUBMITTED_HUMAIN = 'no'

/** Motif que le serveur cherche dans l'objet et les en-têtes de fil (recherche IMAP). */
export const MOTIF_RECHERCHE = `${PREFIXE_REFERENCE}-`

/**
 * Premier tri, celui que le serveur IMAP applique par sa recherche : un
 * surensemble de ce que `trierEnTetes` retient. L'adaptateur mémoire s'en
 * sert pour trier exactement comme le serveur.
 */
export function correspondRechercheServeur(enTetes: EnTetesMessage): boolean {
  const motif = MOTIF_RECHERCHE.toLowerCase()
  return (
    (enTetes.objet ?? '').toLowerCase().includes(motif) ||
    (enTetes.enTetesDeFil ?? '').toLowerCase().includes(motif) ||
    estRapportSysteme(enTetes)
  )
}

export function estRapportSysteme(enTetes: EnTetesMessage): boolean {
  return (
    TYPE_RAPPORT.test(enTetes.typeContenu ?? '') || EMETTEURS_SYSTEME.test(enTetes.expediteur ?? '')
  )
}

export function trierEnTetes(enTetes: EnTetesMessage): Tri {
  if (estIdentifiantDuSite(enTetes.identifiant)) {
    return { decision: 'ecarte', motif: 'envoi-du-site' }
  }
  if (estRapportSysteme(enTetes)) return trierRapport(enTetes)
  if (estReponseAutomatique(enTetes)) return { decision: 'ecarte', motif: 'reponse-automatique' }
  const references = reunir(
    referencesDansObjet(enTetes.objet),
    referencesDansIdentifiants(enTetes.enTetesDeFil),
  )
  return references.length > 0
    ? { decision: 'reponse', references }
    : { decision: 'ecarte', motif: 'sans-reference' }
}

function trierRapport(enTetes: EnTetesMessage): Tri {
  const { original } = enTetes
  if (original.etat === 'a-lire') return { decision: 'lire-original', partie: original.partie }
  const references = reunir(
    referencesDansObjet(enTetes.objet),
    original.etat === 'connu' ? referencesDansIdentifiants(original.identifiant) : [],
    original.etat === 'connu' ? referencesDansObjet(original.objet) : [],
  )
  return references.length > 0
    ? { decision: 'non-remise', references }
    : { decision: 'ecarte', motif: 'non-remise-etrangere' }
}

function estReponseAutomatique(enTetes: EnTetesMessage): boolean {
  const autoSubmitted = enTetes.autoSubmitted?.trim().toLowerCase() ?? null
  if (autoSubmitted !== null && autoSubmitted !== AUTO_SUBMITTED_HUMAIN) return true
  if (enTetes.repondeurDeclare) return true
  const precedence = enTetes.precedence?.trim().toLowerCase() ?? ''
  return PRECEDENCES_AUTOMATIQUES.has(precedence) || OBJETS_AUTOMATIQUES.test(enTetes.objet ?? '')
}

function reunir(...listes: readonly (readonly string[])[]): string[] {
  return [...new Set(listes.flat())]
}
