/**
 * Traduit une erreur de nodemailer (SMTP) ou d'imapflow (IMAP) en échec
 * nommé, avec un remède en français propre au fournisseur (Kano
 * connecteurs, AT-C3 et PC-05). Le message d'origine est gardé en détail.
 */
import { detailDe, ErreurConnecteur, type NatureEchec } from '../erreurs.js'
import { PREREGLAGES, type FournisseurCourriel, type ServeurMessagerie } from './fournisseurs.js'

export type Protocole = 'SMTP' | 'IMAP'

export interface ContexteDiagnostic {
  readonly protocole: Protocole
  readonly fournisseur: FournisseurCourriel
  readonly serveur: ServeurMessagerie
  /** Dossier IMAP ouvert, pour nommer un dossier absent. */
  readonly dossier?: string
}

/** Champs que nodemailer et imapflow posent sur leurs erreurs ; tous facultatifs. */
interface ChampsErreur {
  readonly code?: unknown
  readonly responseCode?: unknown
  readonly authenticationFailed?: unknown
  readonly tlsFailed?: unknown
  readonly mailboxMissing?: unknown
  readonly serverResponseCode?: unknown
}

const NOMS_CONNECTEUR: Readonly<Record<Protocole, string>> = {
  SMTP: 'Envoi de courriel (SMTP)',
  IMAP: 'Lecture de la boîte (IMAP)',
}

const CODES_IDENTIFIANTS = new Set(['EAUTH', 'AUTHENTICATIONFAILED', 'NOPERM'])
const CODES_INJOIGNABLE = new Set([
  'ECONNECTION',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ECONNRESET',
  'EDNS',
  'NoConnection',
])
const CODES_DELAI = new Set([
  'ETIMEDOUT',
  'ETIMEOUT',
  'CONNECT_TIMEOUT',
  'GREETING_TIMEOUT',
  'ESOCKET_TIMEOUT',
])
const CODES_CERTIFICAT = new Set([
  'ETLS',
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'ERR_SSL_WRONG_VERSION_NUMBER',
])
const CODES_REFUS = new Set(['EENVELOPE', 'EMESSAGE'])
/** nodemailer range sous ESOCKET aussi bien un refus de connexion qu'un échec TLS. */
const CODE_SOCKET = 'ESOCKET'
const MESSAGE_CHIFFREMENT = /certificate|self[- ]signed|ssl|tls|wrong version/i
/** Codes de réponse SMTP : 535 et 534 identifiants, 530 authentification exigée, 55x refus. */
const REPONSES_IDENTIFIANTS = new Set([530, 534, 535])
const PREMIER_CODE_REFUS = 550
const DERNIER_CODE_REFUS = 554

export function diagnostiquerCourriel(
  erreur: unknown,
  contexte: ContexteDiagnostic,
): ErreurConnecteur {
  if (erreur instanceof ErreurConnecteur) return erreur
  const nature = natureDe(erreur)
  return new ErreurConnecteur(
    NOMS_CONNECTEUR[contexte.protocole],
    nature,
    detailDe(erreur),
    remedeDe(nature, contexte),
  )
}

function natureDe(erreur: unknown): NatureEchec {
  const champs: ChampsErreur = typeof erreur === 'object' && erreur !== null ? erreur : {}
  const code = typeof champs.code === 'string' ? champs.code : ''
  const reponse = typeof champs.responseCode === 'number' ? champs.responseCode : 0
  const codeServeur =
    typeof champs.serverResponseCode === 'string' ? champs.serverResponseCode.toUpperCase() : ''
  if (
    champs.authenticationFailed === true ||
    CODES_IDENTIFIANTS.has(code) ||
    CODES_IDENTIFIANTS.has(codeServeur) ||
    REPONSES_IDENTIFIANTS.has(reponse)
  ) {
    return 'identifiants'
  }
  if (champs.mailboxMissing === true || codeServeur === 'NONEXISTENT') return 'configuration'
  const socketChiffre = code === CODE_SOCKET && MESSAGE_CHIFFREMENT.test(detailDe(erreur))
  if (champs.tlsFailed === true || CODES_CERTIFICAT.has(code) || socketChiffre) return 'certificat'
  if (CODES_DELAI.has(code)) return 'delai'
  if (CODES_INJOIGNABLE.has(code) || code === CODE_SOCKET) return 'injoignable'
  if (CODES_REFUS.has(code) || (reponse >= PREMIER_CODE_REFUS && reponse <= DERNIER_CODE_REFUS)) {
    return 'refus'
  }
  return 'autre'
}

function remedeDe(nature: NatureEchec, contexte: ContexteDiagnostic): string {
  const { protocole, serveur } = contexte
  const adresse = `${serveur.hote}:${serveur.port}`
  switch (nature) {
    case 'identifiants':
      return protocole === 'SMTP'
        ? PREREGLAGES[contexte.fournisseur].remedeIdentifiants
        : `${PREREGLAGES[contexte.fournisseur].remedeIdentifiants} Pour la lecture, IMAP_UTILISATEUR et IMAP_MOT_DE_PASSE reprennent ces valeurs s’ils sont absents.`
    case 'injoignable':
      return `Vérifiez ${protocole}_HOTE et ${protocole}_PORT (${adresse}) et la connexion du serveur. Sur Render, l’offre gratuite ferme les ports 465 et 587 en sortie : une instance payante est nécessaire.`
    case 'delai':
      return `${adresse} ne répond pas à temps. Réessayez ; si cela dure, vérifiez que ${protocole}_SECURISE correspond au port (true pour ${protocole === 'SMTP' ? '465' : '993'}, false pour un port STARTTLS).`
    case 'certificat':
      return `Le chiffrement n’a pas pu s’établir avec ${adresse} : ${protocole}_HOTE doit être le nom exact donné par le fournisseur (pas une adresse IP) et ${protocole}_SECURISE doit correspondre au port.`
    case 'refus':
      return 'Le serveur refuse l’expéditeur ou le destinataire : SMTP_EXPEDITEUR doit être l’adresse du compte ou un alias vérifié, et l’adresse du destinataire doit exister. Gmail limite aussi l’envoi à 500 messages par jour.'
    case 'configuration':
      return `Le dossier « ${contexte.dossier ?? ''} » n’existe pas dans la boîte : laissez IMAP_DOSSIER vide (INBOX).`
    case 'autre':
      return 'Relancez pnpm courriel:tester ; si l’erreur persiste, transmettez ce message à Anthony.'
  }
}
