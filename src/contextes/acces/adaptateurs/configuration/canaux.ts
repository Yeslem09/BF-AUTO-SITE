import type { ModeSite } from '../../../../contrats/index.js'
import type { Canal, Messagerie } from '../../application/ports.js'
import type { ReglagesAcces } from './reglages.js'

/**
 * Adresses de démonstration, dans le domaine réservé `.invalid` : elles ne
 * désignent personne et aucun message n'y part (la démonstration écrit tout en
 * console).
 */
export const ADRESSES_DEMONSTRATION = {
  garagiste: 'garagiste@demonstration.invalid',
  responsable: 'responsable@demonstration.invalid',
} as const

export interface Canaux {
  readonly canalGaragiste: Canal | null
  readonly canalResponsable: Canal | null
}

export interface MessageriesDisponibles {
  readonly console: Messagerie
  /** `null` tant qu'aucun serveur d'envoi n'est configuré. */
  readonly smtp: Messagerie | null
}

/**
 * Politique d'envoi selon le mode :
 * - production et relecture : le serveur d'envoi s'il est configuré (remise
 *   `courriel`), sinon la console (convention du site, remise `journal`) ; une
 *   adresse absente ferme le canal ; dans tous les cas, la page dit ce qui est
 *   réellement arrivé au message au lieu de prétendre qu'il est parti ;
 * - démonstration : jamais d'envoi réel (remise `demonstration`), adresses de
 *   démonstration à défaut ; le lien revient alors à la page pour que la visite
 *   puisse se poursuivre.
 */
export function choisirCanaux(
  mode: ModeSite,
  reglages: ReglagesAcces,
  messageries: MessageriesDisponibles,
): Canaux {
  if (mode === 'demonstration') {
    return {
      canalGaragiste: {
        messagerie: messageries.console,
        destinataire: reglages.courrielGaragiste ?? ADRESSES_DEMONSTRATION.garagiste,
        remise: 'demonstration',
      },
      canalResponsable: {
        messagerie: messageries.console,
        destinataire: reglages.courrielResponsable ?? ADRESSES_DEMONSTRATION.responsable,
        remise: 'demonstration',
      },
    }
  }
  const { messagerie, remise } =
    messageries.smtp === null
      ? { messagerie: messageries.console, remise: 'journal' as const }
      : { messagerie: messageries.smtp, remise: 'courriel' as const }
  const canal = (destinataire: string | null): Canal | null =>
    destinataire === null ? null : { messagerie, destinataire, remise }
  return {
    canalGaragiste: canal(reglages.courrielGaragiste),
    canalResponsable: canal(reglages.courrielResponsable),
  }
}

/** Ce qu'il faut dire à l'exploitant au démarrage : chaque réglage manquant et sa conséquence. */
export function avertissementsDeDemarrage(mode: ModeSite, reglages: ReglagesAcces): string[] {
  if (mode === 'demonstration') return []
  const avertissements: string[] = []
  if (reglages.courrielGaragiste === null) {
    avertissements.push(
      'Espace garagiste : ni COURRIEL_GARAGISTE ni COURRIEL_GARAGE, aucun lien de connexion ne peut partir (lien de secours : commande garagiste lien).',
    )
  }
  if (reglages.courrielResponsable === null) {
    avertissements.push(
      'Espace garagiste : COURRIEL_RESPONSABLE_SITE absent, les signalements de changement ne partent pas et les alertes restent dans le journal.',
    )
  }
  if (reglages.expediteur === null) {
    avertissements.push(
      'Espace garagiste : aucun envoi de courriel configuré (SMTP_UTILISATEUR, SMTP_MOT_DE_PASSE), les liens de connexion et les signalements s’écrivent dans le journal du serveur au lieu de partir.',
    )
  }
  return avertissements
}
