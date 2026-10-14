/**
 * Réglages du courriel lus dans l'environnement (Kano connecteurs, C1 à C5).
 *
 * | Variable                 | Défaut                              | Rôle                                                   |
 * |--------------------------|-------------------------------------|--------------------------------------------------------|
 * | COURRIEL_FOURNISSEUR     | gmail, ou déduit de SMTP_HOTE       | Préréglage : gmail, google-workspace, outlook,         |
 * |                          |                                     | microsoft-365, orange, free, sfr, ovh, ionos, brevo,   |
 * |                          |                                     | personnalise                                           |
 * | SMTP_HOTE                | celui du préréglage                 | Serveur d'envoi (obligatoire en personnalise)          |
 * | SMTP_PORT                | celui du préréglage, sinon 587      | Port d'envoi                                           |
 * | SMTP_SECURISE            | vrai pour 465, faux sinon           | true : TLS direct ; false : STARTTLS, alors exigé      |
 * | SMTP_UTILISATEUR         | (aucun)                             | Identifiant, pour Gmail l'adresse complète             |
 * | SMTP_MOT_DE_PASSE        | (aucun)                             | Secret ; Gmail : mot de passe d'application (16 lettres)|
 * | SMTP_EXPEDITEUR          | SMTP_UTILISATEUR s'il est une adresse| Adresse d'expédition                                  |
 * | SMTP_NOM_EXPEDITEUR      | (aucun)                             | Nom affiché devant l'adresse                           |
 * | SMTP_REPONDRE_A          | la boîte lue si elle diffère        | Adresse de réponse (Reply-To)                          |
 * | IMAP_ACTIF               | true                                | false : ne jamais lire la boîte                        |
 * | IMAP_HOTE                | celui du préréglage                 | Serveur de lecture                                     |
 * | IMAP_PORT                | celui du préréglage, sinon 993      | Port de lecture                                        |
 * | IMAP_SECURISE            | vrai pour 993, faux sinon           | true : TLS direct ; false : STARTTLS, alors exigé      |
 * | IMAP_UTILISATEUR         | SMTP_UTILISATEUR (même boîte)       | Identifiant de lecture                                 |
 * | IMAP_MOT_DE_PASSE        | SMTP_MOT_DE_PASSE (même boîte)      | Secret de lecture                                      |
 * | IMAP_DOSSIER             | INBOX                               | Dossier lu, en lecture seule                           |
 * | IMAP_INTERVALLE_SECONDES | 120 (de 30 à 3600)                  | Intervalle entre deux relevés                          |
 */
import { estAdresseCourriel, type LecteurEnvironnement } from '../environnement.js'
import {
  FOURNISSEUR_PAR_DEFAUT,
  FOURNISSEURS_COURRIEL,
  PORT_IMAP_PAR_DEFAUT,
  PORT_SMTP_PAR_DEFAUT,
  PREREGLAGES,
  securiseParDefaut,
  type FournisseurCourriel,
  type PrereglageCourriel,
  type ServeurMessagerie,
} from './fournisseurs.js'

export interface ReglagesSmtp {
  readonly fournisseur: FournisseurCourriel
  readonly serveur: ServeurMessagerie
  readonly utilisateur: string | null
  readonly motDePasse: string | null
  readonly expediteur: string
  readonly nomExpediteur: string | null
  /** Adresse de réponse résolue ; `null` : on répond à l'expéditeur. */
  readonly repondreA: string | null
}

export interface ReglagesImap {
  readonly fournisseur: FournisseurCourriel
  readonly serveur: ServeurMessagerie
  readonly utilisateur: string
  readonly motDePasse: string
  readonly dossier: string
  readonly intervalleSecondes: number
}

export interface ReglagesCourriel {
  readonly smtp: ReglagesSmtp
  /** `null` : la boîte n'est pas lue (désactivée ou impossible chez ce fournisseur). */
  readonly imap: ReglagesImap | null
}

export interface LectureCourriel {
  /** `null` : aucun courriel configuré (console en développement, échec visible en production). */
  readonly reglages: ReglagesCourriel | null
  readonly avertissements: readonly string[]
}

const VARIABLES_QUI_ACTIVENT = [
  'COURRIEL_FOURNISSEUR',
  'SMTP_HOTE',
  'SMTP_UTILISATEUR',
  'SMTP_MOT_DE_PASSE',
  'SMTP_EXPEDITEUR',
] as const
const PORT_MIN = 1
const PORT_MAX = 65_535
export const DOSSIER_IMAP_PAR_DEFAUT = 'INBOX'
export const INTERVALLE_IMAP = { defaut: 120, min: 30, max: 3_600 } as const
/** Mot de passe d'application Google : 16 lettres, affichées par Google en quatre groupes. */
const MOT_DE_PASSE_APPLICATION = /^[a-z]{16}$/
const ESPACES = /\s+/g
const LONGUEUR_MAX_NOM = 64
const CARACTERES_INTERDITS_NOM = /[\r\n<>"]/

export function lireReglagesCourriel(lecteur: LecteurEnvironnement): LectureCourriel {
  const avertissements: string[] = []
  if (!VARIABLES_QUI_ACTIVENT.some((nom) => lecteur.definie(nom))) {
    return { reglages: null, avertissements }
  }
  const fournisseur =
    lecteur.choix('COURRIEL_FOURNISSEUR', FOURNISSEURS_COURRIEL) ??
    deduireFournisseur(lecteur.texte('SMTP_HOTE'))
  const prereglage = PREREGLAGES[fournisseur]
  if (prereglage.refus !== null) {
    lecteur.signaler(prereglage.refus)
    return { reglages: null, avertissements }
  }
  const smtp = lireSmtp(lecteur, fournisseur, prereglage, avertissements)
  if (smtp === null) return { reglages: null, avertissements }
  const imap = lireImap(lecteur, smtp, prereglage, avertissements)
  const repondreA =
    lecteur.courriel('SMTP_REPONDRE_A') ??
    (imap !== null &&
    estAdresseCourriel(imap.utilisateur) &&
    imap.utilisateur.toLowerCase() !== smtp.expediteur.toLowerCase()
      ? imap.utilisateur
      : null)
  return { reglages: { smtp: { ...smtp, repondreA }, imap }, avertissements }
}

/**
 * Sans COURRIEL_FOURNISSEUR : Gmail ; ou, si SMTP_HOTE est donné, le
 * fournisseur dont c'est le serveur (smtp.gmail.com vaut Gmail, lecture
 * comprise), à défaut un serveur personnalisé.
 */
function deduireFournisseur(hote: string | null): FournisseurCourriel {
  if (hote === null) return FOURNISSEUR_PAR_DEFAUT
  const connu = FOURNISSEURS_COURRIEL.find(
    (fournisseur) => PREREGLAGES[fournisseur].smtp?.hote === hote.toLowerCase(),
  )
  return connu ?? 'personnalise'
}

function lireServeur(
  lecteur: LecteurEnvironnement,
  prefixe: 'SMTP' | 'IMAP',
  connu: ServeurMessagerie | null,
  portParDefaut: number,
): ServeurMessagerie | null {
  const hote = lecteur.texte(`${prefixe}_HOTE`) ?? connu?.hote ?? null
  const port = lecteur.entier(`${prefixe}_PORT`, {
    defaut: connu?.port ?? portParDefaut,
    min: PORT_MIN,
    max: PORT_MAX,
  })
  const securiseConnu = lecteur.definie(`${prefixe}_PORT`) ? null : (connu?.securise ?? null)
  const securise = lecteur.booleen(`${prefixe}_SECURISE`, securiseConnu ?? securiseParDefaut(port))
  return hote === null ? null : { hote, port, securise }
}

function lireSmtp(
  lecteur: LecteurEnvironnement,
  fournisseur: FournisseurCourriel,
  prereglage: PrereglageCourriel,
  avertissements: string[],
): Omit<ReglagesSmtp, 'repondreA'> | null {
  const serveur = lireServeur(lecteur, 'SMTP', prereglage.smtp, PORT_SMTP_PAR_DEFAUT)
  if (serveur === null) lecteur.signaler('SMTP_HOTE : obligatoire pour un serveur personnalisé')

  const utilisateur = lecteur.texte('SMTP_UTILISATEUR')
  let motDePasse = lecteur.secret('SMTP_MOT_DE_PASSE')
  if (prereglage.identifiantsObligatoires) {
    if (utilisateur === null) {
      lecteur.signaler(`SMTP_UTILISATEUR : obligatoire pour ${prereglage.libelle}`)
    }
    if (motDePasse === null) {
      lecteur.signaler(`SMTP_MOT_DE_PASSE : obligatoire pour ${prereglage.libelle}`)
    }
  } else if ((utilisateur === null) !== (motDePasse === null)) {
    lecteur.signaler('SMTP_UTILISATEUR et SMTP_MOT_DE_PASSE : les deux ou aucun')
  }
  if (prereglage.motDePasseApplication && motDePasse !== null) {
    motDePasse = motDePasse.replace(ESPACES, '')
    if (!MOT_DE_PASSE_APPLICATION.test(motDePasse)) {
      lecteur.signaler(
        `SMTP_MOT_DE_PASSE : ${prereglage.libelle} exige un mot de passe d’application de 16 lettres (validation en deux étapes active, https://myaccount.google.com/apppasswords) ; le mot de passe habituel du compte est refusé par Google`,
      )
    }
  }
  if (prereglage.expediteurDuCompte && utilisateur !== null && !estAdresseCourriel(utilisateur)) {
    lecteur.signaler(
      `SMTP_UTILISATEUR : « ${utilisateur} », adresse complète attendue pour ${prereglage.libelle}`,
    )
  }

  const expediteur =
    lecteur.courriel('SMTP_EXPEDITEUR') ??
    (utilisateur !== null && estAdresseCourriel(utilisateur) ? utilisateur : null)
  if (expediteur === null && !lecteur.definie('SMTP_EXPEDITEUR')) {
    lecteur.signaler('SMTP_EXPEDITEUR : obligatoire (adresse d’expédition)')
  }
  if (
    prereglage.expediteurDuCompte &&
    expediteur !== null &&
    utilisateur !== null &&
    expediteur.toLowerCase() !== utilisateur.toLowerCase()
  ) {
    avertissements.push(
      `SMTP_EXPEDITEUR (${expediteur}) diffère du compte ${utilisateur} : ${prereglage.libelle} le remplacera par l’adresse du compte, sauf s’il s’agit d’un alias vérifié (Gmail : Paramètres, Comptes, « Envoyer des e-mails en tant que »).`,
    )
  }
  const nomExpediteur = lireNomExpediteur(lecteur)
  if (serveur === null || expediteur === null) return null
  return { fournisseur, serveur, utilisateur, motDePasse, expediteur, nomExpediteur }
}

function lireNomExpediteur(lecteur: LecteurEnvironnement): string | null {
  const nom = lecteur.texte('SMTP_NOM_EXPEDITEUR')
  if (nom === null) return null
  if (nom.length > LONGUEUR_MAX_NOM || CARACTERES_INTERDITS_NOM.test(nom)) {
    lecteur.signaler(
      `SMTP_NOM_EXPEDITEUR : ${LONGUEUR_MAX_NOM} caractères au plus, sans retour à la ligne, chevron ni guillemet`,
    )
    return null
  }
  return nom
}

function lireImap(
  lecteur: LecteurEnvironnement,
  smtp: Omit<ReglagesSmtp, 'repondreA'>,
  prereglage: PrereglageCourriel,
  avertissements: string[],
): ReglagesImap | null {
  if (!lecteur.booleen('IMAP_ACTIF', true)) return null
  const serveur = lireServeur(lecteur, 'IMAP', prereglage.imap, PORT_IMAP_PAR_DEFAUT)
  if (serveur === null) {
    if (prereglage.noteLecture !== null) avertissements.push(prereglage.noteLecture)
    return null
  }
  const partages = prereglage.identifiantsPartages
  const utilisateur = lecteur.texte('IMAP_UTILISATEUR') ?? (partages ? smtp.utilisateur : null)
  const motDePasse = lecteur.secret('IMAP_MOT_DE_PASSE') ?? (partages ? smtp.motDePasse : null)
  if (utilisateur === null || motDePasse === null) {
    lecteur.signaler(
      `IMAP_UTILISATEUR et IMAP_MOT_DE_PASSE : obligatoires pour lire ${serveur.hote} (ou IMAP_ACTIF=false)`,
    )
    return null
  }
  const dossier = lecteur.texte('IMAP_DOSSIER') ?? DOSSIER_IMAP_PAR_DEFAUT
  const intervalleSecondes = lecteur.entier('IMAP_INTERVALLE_SECONDES', INTERVALLE_IMAP)
  return {
    fournisseur: smtp.fournisseur,
    serveur,
    utilisateur,
    motDePasse,
    dossier,
    intervalleSecondes,
  }
}
