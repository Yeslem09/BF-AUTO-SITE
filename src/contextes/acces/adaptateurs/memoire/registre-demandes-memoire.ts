import type { RegistreDemandesLien } from '../../application/ports.js'

/**
 * Registre en mémoire du processus : la limitation n'a besoin que de la
 * dernière heure, et aucune adresse client n'est écrite sur disque. Un
 * redémarrage remet les compteurs à zéro, ce qui ne profite à personne : un
 * visiteur ne peut pas redémarrer le serveur.
 */
export function creerRegistreDemandesMemoire(): RegistreDemandesLien {
  let recues: Date[] = []
  const accepteesParAdresse = new Map<string, Date[]>()
  let alerte: Date | null = null

  const oublierAvant = (instants: readonly Date[], depuis: Date): Date[] =>
    instants.filter((instant) => instant.getTime() > depuis.getTime())

  return {
    noterReception: (instant) => {
      recues.push(instant)
    },
    recuesDepuis: (depuis) => {
      recues = oublierAvant(recues, depuis)
      return [...recues]
    },
    noterAcceptation: (adresseClient, instant) => {
      accepteesParAdresse.set(adresseClient, [
        ...(accepteesParAdresse.get(adresseClient) ?? []),
        instant,
      ])
    },
    accepteesDepuis: (adresseClient, depuis) => {
      // Chaque passage oublie aussi les adresses silencieuses depuis une heure.
      for (const [adresse, instants] of accepteesParAdresse) {
        const recentes = oublierAvant(instants, depuis)
        if (recentes.length === 0) accepteesParAdresse.delete(adresse)
        else accepteesParAdresse.set(adresse, recentes)
      }
      return [...(accepteesParAdresse.get(adresseClient) ?? [])]
    },
    derniereAlerte: () => alerte,
    noterAlerte: (instant) => {
      alerte = instant
    },
  }
}
