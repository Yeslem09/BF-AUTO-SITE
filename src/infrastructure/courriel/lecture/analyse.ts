/**
 * Analyse d'un message téléchargé : tri sur ses en-têtes, puis réponse
 * (texte et commande) ou rapport de non-remise. Le texte n'est jamais
 * conservé au-delà de ce qu'il faut pour reconnaître la commande.
 */
import { simpleParser, type AddressObject, type HeaderValue, type ParsedMail } from 'mailparser'
import { lireRapportNonRemise } from './non-remise.js'
import type { Authentification, MessageRecu } from './ports.js'
import { extraireReponse, reconnaitreCommande } from './reponse.js'
import { trierEnTetes, type EnTetesMessage, type OriginalRapport, type Tri } from './tri.js'

export interface MessageAnalyse {
  readonly tri: Tri
  /** `null` si le message est écarté. */
  readonly message: MessageRecu | null
}

const OPTIONS_ANALYSE = { skipImageLinks: true, skipTextToHtml: true, skipTextLinks: true } as const
const TYPES_ORIGINAL = new Set(['message/rfc822', 'text/rfc822-headers', 'message/global'])
const ENTETES_ORIGINAL = /^(message-id|subject)\s*:\s*(.*)$/gim
const FIN_DES_ENTETES = /\r?\n\r?\n/
/** Date d'un message qui n'en porte aucune : l'origine des temps, jamais « maintenant » inventé. */
const DATE_INCONNUE = new Date(0)

export async function analyserSource(
  uid: number,
  source: Buffer | string,
  recuLe: Date | null,
): Promise<MessageAnalyse> {
  const analyse = await simpleParser(source, OPTIONS_ANALYSE)
  const enTetes = enTetesDepuisAnalyse(analyse)
  const tri = trierEnTetes(enTetes)
  const date = recuLe ?? analyse.date ?? DATE_INCONNUE
  if (tri.decision === 'reponse') {
    const texte = extraireReponse({
      texte: analyse.text ?? null,
      html: typeof analyse.html === 'string' ? analyse.html : null,
    })
    return {
      tri,
      message: {
        nature: 'reponse',
        uid,
        recuLe: date,
        references: tri.references,
        expediteur: enTetes.expediteur,
        texte,
        commande: reconnaitreCommande(texte),
        authentification: lireAuthentification(premiereLigne(analyse, 'authentication-results')),
      },
    }
  }
  if (tri.decision === 'non-remise') {
    const rapport = lireRapportNonRemise(
      [analyse.text ?? '', ...textesDesPieces(analyse)],
      enTetes.objet,
      texteEnTete(analyse.headers.get('x-failed-recipients')),
    )
    if (rapport === null) return { tri, message: null }
    return {
      tri,
      message: { nature: 'non-remise', uid, recuLe: date, references: tri.references, ...rapport },
    }
  }
  return { tri, message: null }
}

/** En-têtes utiles au tri, tirés d'un message analysé (mêmes champs que ceux lus par IMAP). */
export function enTetesDepuisAnalyse(analyse: ParsedMail): EnTetesMessage {
  const fil = [analyse.inReplyTo, ...[analyse.references ?? []].flat()]
    .filter((valeur): valeur is string => typeof valeur === 'string')
    .join(' ')
  return {
    objet: analyse.subject ?? null,
    identifiant: analyse.messageId ?? null,
    enTetesDeFil: fil === '' ? null : fil,
    expediteur: premiereAdresse(analyse.from),
    autoSubmitted: texteEnTete(analyse.headers.get('auto-submitted')),
    precedence: texteEnTete(analyse.headers.get('precedence')),
    repondeurDeclare: analyse.headers.has('x-autoreply') || analyse.headers.has('x-autorespond'),
    typeContenu: typeContenu(analyse.headers.get('content-type')),
    original: originalDe(analyse),
  }
}

/** Identifiant et objet du message d'origine joint à un rapport. */
export function lireEnTetesOriginal(texte: string): OriginalRapport {
  const bloc = texte.split(FIN_DES_ENTETES)[0] ?? ''
  const valeurs = new Map<string, string>()
  for (const trouve of bloc.matchAll(ENTETES_ORIGINAL)) {
    const nom = trouve[1]?.toLowerCase()
    if (nom !== undefined && !valeurs.has(nom)) valeurs.set(nom, (trouve[2] ?? '').trim())
  }
  return {
    etat: 'connu',
    identifiant: valeurs.get('message-id') ?? null,
    objet: valeurs.get('subject') ?? null,
  }
}

function originalDe(analyse: ParsedMail): OriginalRapport {
  const piece = analyse.attachments.find((jointe) => TYPES_ORIGINAL.has(jointe.contentType))
  return piece === undefined ? { etat: 'absent' } : lireEnTetesOriginal(piece.content.toString())
}

function textesDesPieces(analyse: ParsedMail): string[] {
  return analyse.attachments
    .filter((jointe) => jointe.contentType.includes('delivery-status'))
    .map((jointe) => jointe.content.toString())
}

/**
 * Verdict du serveur de réception, lu sur le premier `Authentication-Results`
 * (le plus récent, posé par le serveur de la boîte ; les suivants peuvent
 * être forgés). DMARC fait foi ; à défaut, DKIM et SPF.
 */
export function lireAuthentification(ligne: string | null): Authentification {
  if (ligne === null) return 'inconnue'
  const resultat = (methode: string): string | null =>
    new RegExp(`\\b${methode}\\s*=\\s*([a-z]+)`, 'i').exec(ligne)?.[1]?.toLowerCase() ?? null
  const dmarc = resultat('dmarc')
  if (dmarc === 'pass') return 'reussie'
  if (dmarc === 'fail') return 'echouee'
  const dkim = resultat('dkim')
  const spf = resultat('spf')
  if (dkim === 'fail' || spf === 'fail') return 'echouee'
  if (dkim === 'pass' || spf === 'pass') return 'reussie'
  return 'inconnue'
}

function premiereLigne(analyse: ParsedMail, nom: string): string | null {
  const ligne = analyse.headerLines.find((entete) => entete.key === nom)?.line ?? null
  return ligne === null ? null : ligne.slice(ligne.indexOf(':') + 1).trim()
}

function premiereAdresse(adresses: AddressObject | AddressObject[] | undefined): string | null {
  const premiere = [adresses ?? []].flat()[0]?.value[0]?.address
  return premiere === undefined || premiere === '' ? null : premiere.toLowerCase()
}

function texteEnTete(valeur: HeaderValue | undefined): string | null {
  if (typeof valeur === 'string') return valeur
  if (Array.isArray(valeur)) {
    const premiere = valeur[0]
    if (typeof premiere === 'string') return premiere
  }
  return null
}

function typeContenu(valeur: HeaderValue | undefined): string | null {
  if (typeof valeur === 'string') return valeur.toLowerCase()
  if (
    valeur !== undefined &&
    typeof valeur === 'object' &&
    'value' in valeur &&
    'params' in valeur
  ) {
    const parametres = Object.entries(valeur.params)
      .map(([nom, contenu]) => `; ${nom}=${contenu}`)
      .join('')
    return `${valeur.value}${parametres}`.toLowerCase()
  }
  return null
}
