import type { FastifyBaseLogger } from 'fastify'
import type { Journal } from '../../application/ports.js'

/** Journal applicatif branché sur celui du serveur (niveaux, format et destination communs). */
export function creerJournalFastify(journal: FastifyBaseLogger): Journal {
  const contexte = { contexte: 'demandes' }
  return {
    info: (message, details) => journal.info({ ...contexte, ...details }, message),
    avertir: (message, details) => journal.warn({ ...contexte, ...details }, message),
    erreur: (message, details) => journal.error({ ...contexte, ...details }, message),
  }
}
