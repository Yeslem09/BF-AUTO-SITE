import type { ExpediteurCourriel } from '../../../../infrastructure/courriel/envoi/ports.js'

/**
 * Réglages de l'accès, lus et validés par `src/configuration.ts` puis transmis
 * par la racine de composition (variables URL_PUBLIQUE, COURRIEL_GARAGISTE à
 * défaut COURRIEL_GARAGE, COURRIEL_RESPONSABLE_SITE) et l'expéditeur de courriel partagé du site.
 */
export interface ReglagesAcces {
  /** Origine publique sans barre finale, par exemple `https://www.bf-auto.fr`. */
  readonly urlPublique: string
  /** Seule adresse où partent les liens de connexion. */
  readonly courrielGaragiste: string | null
  /** Anthony : signalements de changement et alertes. */
  readonly courrielResponsable: string | null
  /** Envoi de courriel du site ; `null` : aucun envoi configuré (console). */
  readonly expediteur: ExpediteurCourriel | null
}
