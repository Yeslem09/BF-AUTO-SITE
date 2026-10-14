import type { FastifyReply } from 'fastify'

const EN_TETES_PRIVES = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex',
} as const

/** Pages de l'espace garagiste : jamais gardées en cache, jamais indexées. */
export function poserEnTetesPrives(reponse: FastifyReply): void {
  reponse.headers(EN_TETES_PRIVES)
}

/** Champ texte d'un formulaire envoyé ; vide s'il manque ou s'il est répété. */
export function champ(corps: unknown, nom: string): string {
  if (typeof corps !== 'object' || corps === null) return ''
  const valeur = (corps as Record<string, unknown>)[nom]
  return typeof valeur === 'string' ? valeur : ''
}
