import type { LogLevel } from 'fastify'

/**
 * Les réponses du pré-diagnostic voyagent dans la chaîne de requête. Le journal
 * d'accès de Fastify (niveau info : « incoming request », « request completed »)
 * recopie l'adresse entière : sur la route du parcours, on ne garde que les
 * avertissements et les erreurs, qui ne portent pas l'adresse (Kano D3 :
 * « les journaux d'accès n'enregistrent pas la chaîne de requête »).
 */

/** Du plus bavard au plus muet, dans l'ordre de pino. */
const NIVEAUX_DU_PLUS_BAVARD: readonly LogLevel[] = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'silent',
]
/** Premier niveau qui n'enregistre plus les accès. */
const NIVEAU_SANS_ACCES: LogLevel = 'warn'

/**
 * Niveau à poser sur une route qui reçoit des réponses dans l'adresse : le plus
 * strict entre le niveau du site et « warn ». Un site muet reste muet ; un
 * niveau inconnu donne « warn ».
 */
export function niveauSansAcces(niveauDuSite: string): LogLevel {
  const niveau = NIVEAUX_DU_PLUS_BAVARD.find((connu) => connu === niveauDuSite)
  if (niveau === undefined) return NIVEAU_SANS_ACCES
  return NIVEAUX_DU_PLUS_BAVARD.indexOf(niveau) > NIVEAUX_DU_PLUS_BAVARD.indexOf(NIVEAU_SANS_ACCES)
    ? niveau
    : NIVEAU_SANS_ACCES
}
