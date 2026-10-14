/**
 * Réglages de tous les connecteurs (courriel et SMS), lus d'un coup : toutes
 * les anomalies rassemblées dans une seule erreur, avec leur remède, et les
 * avertissements à part. Détail des variables : `courriel/reglages.ts` et
 * `sms/reglages.ts`. Les secrets ne vivent que dans l'environnement (Kano
 * connecteurs, C2) et ne sont jamais reproduits ici.
 */
import { lireReglagesCourriel, type ReglagesCourriel } from './courriel/reglages.js'
import { PREREGLAGES } from './courriel/fournisseurs.js'
import { creerLecteurEnvironnement, type Environnement } from './environnement.js'
import { lireReglagesSms, type ReglagesSms } from './sms/reglages.js'

export interface DefautsConnecteurs {
  /**
   * Téléphone du garage (source unique : `donnees/garage.json`), destinataire
   * SMS par défaut ; absent, le destinataire reste à résoudre
   * (`resoudreDestinataireSms`) une fois l'identité du garage lue.
   */
  readonly telephoneGarage?: string | null
}

export interface ReglagesConnecteurs {
  readonly courriel: ReglagesCourriel | null
  readonly sms: ReglagesSms | null
}

export interface LectureConnecteurs {
  readonly reglages: ReglagesConnecteurs
  /** Réglages admis mais à savoir : lecture désactivée, expéditeur réécrit, SMS désactivé. */
  readonly avertissements: readonly string[]
}

export class ErreurReglagesConnecteurs extends Error {
  override readonly name = 'ErreurReglagesConnecteurs'

  constructor(readonly problemes: readonly string[]) {
    super(`Réglages des connecteurs invalides :\n${problemes.map((p) => `- ${p}`).join('\n')}`)
  }
}

export function lireReglagesConnecteurs(
  env: Environnement,
  defauts: DefautsConnecteurs = {},
): LectureConnecteurs {
  const lecteur = creerLecteurEnvironnement(env)
  const courriel = lireReglagesCourriel(lecteur)
  const sms = lireReglagesSms(lecteur, defauts.telephoneGarage)
  if (lecteur.problemes.length > 0) throw new ErreurReglagesConnecteurs(lecteur.problemes)
  return {
    reglages: { courriel: courriel.reglages, sms: sms.reglages },
    avertissements: [...courriel.avertissements, ...sms.avertissements],
  }
}

const DEFINI = 'défini'
const libelleChiffrement = (securise: boolean): string =>
  securise ? 'TLS direct' : 'STARTTLS exigé'

/** Réglages résolus, lisibles par l'exploitant ; aucun secret, seulement « défini ». */
export function decrireReglages(reglages: ReglagesConnecteurs): string[] {
  return [...decrireReglagesCourriel(reglages.courriel), ...decrireReglagesSms(reglages.sms)]
}

export function decrireReglagesCourriel(courriel: ReglagesCourriel | null): string[] {
  if (courriel === null) {
    return ['Courriel : non configuré (console en développement, échec visible en production)']
  }
  const { smtp, imap } = courriel
  const nom = smtp.nomExpediteur === null ? '' : `${smtp.nomExpediteur} `
  return [
    `Courriel : ${PREREGLAGES[smtp.fournisseur].libelle}`,
    `  Envoi : ${smtp.serveur.hote}:${smtp.serveur.port}, ${libelleChiffrement(smtp.serveur.securise)}`,
    `  Compte : ${smtp.utilisateur ?? '(sans identifiant)'}, mot de passe : ${smtp.motDePasse === null ? 'aucun' : DEFINI}`,
    `  Expéditeur : ${nom}<${smtp.expediteur}>`,
    `  Réponses à : ${smtp.repondreA ?? 'l’expéditeur'}`,
    imap === null
      ? '  Lecture de la boîte : désactivée'
      : `  Lecture de la boîte : ${imap.serveur.hote}:${imap.serveur.port}, ${libelleChiffrement(imap.serveur.securise)}, compte ${imap.utilisateur}, dossier ${imap.dossier} en lecture seule, toutes les ${imap.intervalleSecondes} s`,
  ]
}

export function decrireReglagesSms(sms: ReglagesSms | null): string[] {
  if (sms === null) return ['SMS : désactivé']
  const destinataire = `  Destinataire : ${sms.destinataire ?? 'le téléphone du garage'}`
  switch (sms.fournisseur) {
    case 'ovh':
      return [
        `SMS : OVHcloud, compte ${sms.ovh.service}, clés : ${DEFINI}, expéditeur : ${sms.ovh.expediteur ?? 'numéro court de réponse'}`,
        destinataire,
      ]
    case 'brevo':
      return [
        `SMS : Brevo, clé API : ${DEFINI}, expéditeur : ${sms.brevo.expediteur}`,
        destinataire,
      ]
    case 'console':
      return ['SMS : console (aucun envoi réel)', destinataire]
  }
}
