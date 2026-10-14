/**
 * Doublures réservées aux tests de ce contexte. Elles ne remplacent que ce qui
 * sort du processus (horloge, aléa, envoi) : la base reste le vrai moteur SQLite.
 */
import type {
  GenerateurJeton,
  Horloge,
  Messagerie,
  MessageSortant,
} from '../../application/ports.js'

export interface HorlogeReglable extends Horloge {
  avancer(millisecondes: number): void
}

export function creerHorlogeReglable(depart: Date): HorlogeReglable {
  let instant = depart.getTime()
  return {
    maintenant: () => new Date(instant),
    avancer: (millisecondes) => {
      instant += millisecondes
    },
  }
}

/** Jetons prévisibles, de la bonne forme : `jeton-essai-0001...`. */
export function creerGenerateurSequentiel(prefixe = 'jeton-essai'): GenerateurJeton {
  let compteur = 0
  return {
    generer: () => {
      compteur += 1
      return `${prefixe}-${String(compteur).padStart(24, '0')}`
    },
  }
}

export interface MessagerieRetenue extends Messagerie {
  readonly envoyes: MessageSortant[]
  /** Fait échouer les prochains envois, comme un serveur d'envoi qui ne répond pas. */
  tomberEnPanne(): void
}

export function creerMessagerieRetenue(): MessagerieRetenue {
  const envoyes: MessageSortant[] = []
  let enPanne = false
  return {
    envoyes,
    tomberEnPanne: () => {
      enPanne = true
    },
    envoyer: async (message) => {
      if (enPanne) throw new Error('Serveur d’envoi injoignable (essai)')
      envoyes.push(message)
    },
  }
}
