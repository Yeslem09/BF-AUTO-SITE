/**
 * Mode de fonctionnement du site, choisi au démarrage (variable MODE_SITE).
 *
 * - `production` : seules les valeurs validées s'affichent ; une donnée
 *   bloquante manquante empêche le démarrage.
 * - `relecture` : usage local d'Anthony ; les valeurs à valider s'affichent
 *   surlignées pour être relues.
 * - `demonstration` : les propositions à valider s'affichent normalement,
 *   un bandeau l'annonce en tête de page ; jamais en ligne.
 */
export const MODES_SITE = ['production', 'relecture', 'demonstration'] as const

export type ModeSite = (typeof MODES_SITE)[number]
