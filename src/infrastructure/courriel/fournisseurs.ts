/**
 * Préréglages des fournisseurs de courriel courants d'un petit garage (Kano
 * connecteurs, C1). Gmail est le préréglage par défaut : c'est la boîte du
 * garage. Chaque valeur reste surchargeable par sa variable d'environnement.
 */

export const FOURNISSEURS_COURRIEL = [
  'gmail',
  'google-workspace',
  'outlook',
  'microsoft-365',
  'orange',
  'free',
  'sfr',
  'ovh',
  'ionos',
  'brevo',
  'personnalise',
] as const

export type FournisseurCourriel = (typeof FOURNISSEURS_COURRIEL)[number]

export const FOURNISSEUR_PAR_DEFAUT: FournisseurCourriel = 'gmail'

/** Un serveur : `securise` vrai pour TLS direct (465, 993), faux pour STARTTLS, alors exigé. */
export interface ServeurMessagerie {
  readonly hote: string
  readonly port: number
  readonly securise: boolean
}

export interface PrereglageCourriel {
  readonly libelle: string
  /** `null` : pas de serveur connu d'avance (serveur personnalisé), `SMTP_HOTE` obligatoire. */
  readonly smtp: ServeurMessagerie | null
  /** `null` : le fournisseur n'offre pas de lecture par mot de passe. */
  readonly imap: ServeurMessagerie | null
  /** Pourquoi la lecture est absente, dit à l'exploitant au démarrage. */
  readonly noteLecture: string | null
  /** La lecture se fait avec les mêmes identifiants que l'envoi (même boîte). */
  readonly identifiantsPartages: boolean
  /** Identifiants exigés (tout fournisseur hébergé ; un relais personnalisé peut s'en passer). */
  readonly identifiantsObligatoires: boolean
  /** Gmail et Google Workspace : mot de passe d'application de 16 lettres. */
  readonly motDePasseApplication: boolean
  /** Le fournisseur réécrit ou refuse un expéditeur autre que le compte (sauf alias vérifié). */
  readonly expediteurDuCompte: boolean
  /** Refus motivé : le fournisseur n'accepte plus de connexion par mot de passe. */
  readonly refus: string | null
  /** Remède quand le serveur refuse les identifiants. */
  readonly remedeIdentifiants: string
}

const SMTP_TLS_DIRECT = 465
const SMTP_STARTTLS = 587
const IMAP_TLS_DIRECT = 993

const tlsDirect = (hote: string, port: number): ServeurMessagerie => ({
  hote,
  port,
  securise: true,
})
const starttls = (hote: string, port: number): ServeurMessagerie => ({
  hote,
  port,
  securise: false,
})

const REMEDE_GOOGLE =
  'Google refuse le mot de passe habituel du compte : activez la validation en deux étapes, créez un mot de passe d’application sur https://myaccount.google.com/apppasswords et copiez ses 16 lettres dans SMTP_MOT_DE_PASSE. SMTP_UTILISATEUR est l’adresse Gmail complète.'

const REMEDE_BOITE =
  'Vérifiez SMTP_UTILISATEUR (adresse complète de la boîte) et SMTP_MOT_DE_PASSE (mot de passe de la messagerie, pas celui de l’espace client).'

const boiteHebergee = (
  libelle: string,
  smtp: ServeurMessagerie,
  imap: ServeurMessagerie,
): PrereglageCourriel => ({
  libelle,
  smtp,
  imap,
  noteLecture: null,
  identifiantsPartages: true,
  identifiantsObligatoires: true,
  motDePasseApplication: false,
  expediteurDuCompte: true,
  refus: null,
  remedeIdentifiants: REMEDE_BOITE,
})

export const PREREGLAGES: Readonly<Record<FournisseurCourriel, PrereglageCourriel>> = {
  gmail: {
    ...boiteHebergee(
      'Gmail',
      tlsDirect('smtp.gmail.com', SMTP_TLS_DIRECT),
      tlsDirect('imap.gmail.com', IMAP_TLS_DIRECT),
    ),
    motDePasseApplication: true,
    remedeIdentifiants: REMEDE_GOOGLE,
  },
  'google-workspace': {
    ...boiteHebergee(
      'Google Workspace',
      tlsDirect('smtp.gmail.com', SMTP_TLS_DIRECT),
      tlsDirect('imap.gmail.com', IMAP_TLS_DIRECT),
    ),
    motDePasseApplication: true,
    remedeIdentifiants: `${REMEDE_GOOGLE} L’administrateur Google Workspace peut aussi avoir interdit les mots de passe d’application ou IMAP.`,
  },
  outlook: {
    ...boiteHebergee(
      'Outlook.com, Hotmail, Live',
      starttls('smtp-mail.outlook.com', SMTP_STARTTLS),
      tlsDirect('outlook.office365.com', IMAP_TLS_DIRECT),
    ),
    refus:
      'COURRIEL_FOURNISSEUR : Outlook.com, Hotmail et Live refusent depuis le 16 septembre 2024 toute connexion par mot de passe depuis une autre application. Utilisez la boîte Gmail du garage (COURRIEL_FOURNISSEUR=gmail) ou un relais d’envoi (brevo).',
  },
  'microsoft-365': {
    ...boiteHebergee(
      'Microsoft 365',
      starttls('smtp.office365.com', SMTP_STARTTLS),
      tlsDirect('outlook.office365.com', IMAP_TLS_DIRECT),
    ),
    imap: null,
    noteLecture:
      'Microsoft 365 n’accepte plus la lecture IMAP par mot de passe : les réponses « fait » et les rapports de non-remise ne seront pas lus.',
    remedeIdentifiants:
      'Microsoft 365 n’accepte l’envoi par mot de passe que si l’administrateur a activé « SMTP authentifié » pour cette boîte (désactivé par défaut à partir de fin décembre 2026). Sinon, utilisez Gmail ou Brevo.',
  },
  orange: boiteHebergee(
    'Orange',
    tlsDirect('smtp.orange.fr', SMTP_TLS_DIRECT),
    tlsDirect('imap.orange.fr', IMAP_TLS_DIRECT),
  ),
  free: boiteHebergee(
    'Free',
    tlsDirect('smtp.free.fr', SMTP_TLS_DIRECT),
    tlsDirect('imap.free.fr', IMAP_TLS_DIRECT),
  ),
  sfr: boiteHebergee(
    'SFR',
    tlsDirect('smtp.sfr.fr', SMTP_TLS_DIRECT),
    tlsDirect('imap.sfr.fr', IMAP_TLS_DIRECT),
  ),
  ovh: {
    ...boiteHebergee(
      'OVHcloud (MX Plan)',
      tlsDirect('ssl0.ovh.net', SMTP_TLS_DIRECT),
      tlsDirect('ssl0.ovh.net', IMAP_TLS_DIRECT),
    ),
    remedeIdentifiants: `${REMEDE_BOITE} Offre Email Pro ou Exchange : renseignez aussi SMTP_HOTE et IMAP_HOTE donnés dans l’espace client OVHcloud.`,
  },
  ionos: boiteHebergee(
    'IONOS',
    tlsDirect('smtp.ionos.fr', SMTP_TLS_DIRECT),
    tlsDirect('imap.ionos.fr', IMAP_TLS_DIRECT),
  ),
  brevo: {
    libelle: 'Brevo (relais d’envoi)',
    smtp: starttls('smtp-relay.brevo.com', SMTP_STARTTLS),
    imap: null,
    noteLecture:
      'Brevo ne fait qu’envoyer : pour lire les réponses « fait » et les rapports de non-remise, renseignez IMAP_HOTE, IMAP_UTILISATEUR et IMAP_MOT_DE_PASSE de la boîte de l’expéditeur.',
    identifiantsPartages: false,
    identifiantsObligatoires: true,
    motDePasseApplication: false,
    expediteurDuCompte: false,
    refus: null,
    remedeIdentifiants:
      'SMTP_UTILISATEUR est l’identifiant SMTP de Brevo (onglet « SMTP et API ») et SMTP_MOT_DE_PASSE une clé SMTP, pas une clé API ni le mot de passe du compte. SMTP_EXPEDITEUR doit être un expéditeur vérifié chez Brevo.',
  },
  personnalise: {
    libelle: 'Serveur personnalisé',
    smtp: null,
    imap: null,
    noteLecture:
      'Aucun IMAP_HOTE : les réponses « fait » et les rapports de non-remise ne seront pas lus.',
    identifiantsPartages: true,
    identifiantsObligatoires: false,
    motDePasseApplication: false,
    expediteurDuCompte: false,
    refus: null,
    remedeIdentifiants:
      'Vérifiez SMTP_UTILISATEUR et SMTP_MOT_DE_PASSE auprès de l’hébergeur du serveur.',
  },
}

/** Port de soumission par défaut d'un serveur personnalisé ; 465 vaut TLS direct. */
export const PORT_SMTP_PAR_DEFAUT = SMTP_STARTTLS
export const PORT_IMAP_PAR_DEFAUT = IMAP_TLS_DIRECT

/** Déduit le chiffrement du port quand rien ne le précise : 465 et 993 sont en TLS direct. */
export function securiseParDefaut(port: number): boolean {
  return port === SMTP_TLS_DIRECT || port === IMAP_TLS_DIRECT
}
