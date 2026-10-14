/**
 * Fabrique et vérification des connecteurs à partir de leurs réglages.
 * Utilisée par les commandes de test et, en phase B, par la racine de
 * composition au démarrage (Kano connecteurs, C4) : une vérification en
 * échec se journalise et dégrade `/sante`, elle ne bloque jamais le démarrage.
 */
import { creerBoiteImap } from './courriel/lecture/boite-imapflow.js'
import type { BoiteDeReception } from './courriel/lecture/ports.js'
import { creerExpediteurSmtp } from './courriel/envoi/expediteur-smtp.js'
import type { ExpediteurCourriel } from './courriel/envoi/ports.js'
import { enErreurConnecteur, type ErreurConnecteur } from './erreurs.js'
import type { ReglagesConnecteurs } from './reglages-connecteurs.js'
import { creerEnvoiSmsBrevo } from './sms/envoi-brevo.js'
import { creerEnvoiSmsConsole } from './sms/envoi-console.js'
import { creerEnvoiSmsOvh } from './sms/envoi-ovh.js'
import type { EnvoiSms } from './sms/ports.js'

export interface Connecteurs {
  /** `null` : aucun courriel configuré ; l'appelant choisit la console ou l'échec visible. */
  readonly expediteur: ExpediteurCourriel | null
  readonly boite: BoiteDeReception | null
  readonly sms: EnvoiSms | null
}

export interface OptionsConnecteurs {
  /** Où écrire ce qu'un connecteur console « envoie ». */
  readonly ecrireConsole: (texte: string) => void
}

export function creerConnecteurs(
  reglages: ReglagesConnecteurs,
  options: OptionsConnecteurs,
): Connecteurs {
  const { courriel, sms } = reglages
  return {
    expediteur: courriel === null ? null : creerExpediteurSmtp(courriel.smtp),
    boite: courriel === null || courriel.imap === null ? null : creerBoiteImap(courriel.imap),
    sms: creerEnvoi(sms, options),
  }
}

function creerEnvoi(sms: ReglagesConnecteurs['sms'], options: OptionsConnecteurs): EnvoiSms | null {
  if (sms === null) return null
  switch (sms.fournisseur) {
    case 'ovh':
      return creerEnvoiSmsOvh(sms.ovh)
    case 'brevo':
      return creerEnvoiSmsBrevo(sms.brevo)
    case 'console':
      return creerEnvoiSmsConsole(options.ecrireConsole)
  }
}

export type ResultatVerification =
  | { readonly etat: 'inactif' }
  | { readonly etat: 'reussi'; readonly detail: string }
  | { readonly etat: 'echec'; readonly erreur: ErreurConnecteur }

export interface RapportVerification {
  readonly envoi: ResultatVerification
  readonly lecture: ResultatVerification
  readonly sms: ResultatVerification
}

/** Vérifie les trois connecteurs en parallèle, sans rien envoyer ni rien modifier. */
export async function verifierConnecteurs(connecteurs: Connecteurs): Promise<RapportVerification> {
  const { expediteur, boite, sms } = connecteurs
  const [envoi, lecture, compte] = await Promise.all([
    expediteur === null
      ? inactif()
      : verifier('Envoi de courriel', async () => {
          await expediteur.verifier()
          return 'connexion et authentification réussies'
        }),
    boite === null
      ? inactif()
      : verifier('Lecture de la boîte', async () => {
          const etat = await boite.verifier()
          return `dossier ${etat.dossier} ouvert en lecture seule, ${etat.messages} message(s)`
        }),
    sms === null
      ? inactif()
      : verifier('SMS', async () => {
          const etat = await sms.verifier()
          return `identifiants acceptés, crédits restants : ${etat.creditsRestants ?? 'inconnus'}`
        }),
  ])
  return { envoi, lecture, sms: compte }
}

export function verificationReussie(rapport: RapportVerification): boolean {
  return [rapport.envoi, rapport.lecture, rapport.sms].every(
    (resultat) => resultat.etat !== 'echec',
  )
}

async function inactif(): Promise<ResultatVerification> {
  return { etat: 'inactif' }
}

async function verifier(
  connecteur: string,
  travail: () => Promise<string>,
): Promise<ResultatVerification> {
  try {
    return { etat: 'reussi', detail: await travail() }
  } catch (erreur) {
    return { etat: 'echec', erreur: enErreurConnecteur(erreur, connecteur) }
  }
}
