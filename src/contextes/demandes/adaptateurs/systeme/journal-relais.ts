import type { Journal } from '../../application/ports.js'

export interface JournalRelais extends Journal {
  /** Branche le journal du serveur, disponible seulement quand les routes s'enregistrent. */
  brancher(cible: Journal): void
}

/**
 * Journal qui écrit dans la console d'erreur tant que celui du serveur n'est
 * pas branché : rien ne se perd entre l'assemblage et le démarrage.
 */
export function creerJournalRelais(): JournalRelais {
  let cible: Journal = {
    info: () => undefined,
    avertir: (message, details) => console.warn(message, details ?? ''),
    erreur: (message, details) => console.error(message, details ?? ''),
  }
  return {
    brancher: (nouvelle) => {
      cible = nouvelle
    },
    info: (message, details) => cible.info(message, details),
    avertir: (message, details) => cible.avertir(message, details),
    erreur: (message, details) => cible.erreur(message, details),
  }
}
