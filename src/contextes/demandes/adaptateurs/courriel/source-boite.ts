import type {
  BoiteDeReception,
  MessageRecu,
} from '../../../../infrastructure/courriel/lecture/ports.js'
import type { EvenementBoite, SourceBoite } from '../../application/ports.js'
import type { DepotFiligrane } from '../sqlite/filigrane-sqlite.js'

/**
 * Relevé de la boîte du garage pour les demandes : lecture seule, reprise
 * au filigrane gardé en base (rien n'est relu, l'historique n'est jamais
 * parcouru), traduction en événements sans le texte reçu (Kano connecteurs, C5).
 */
export function creerSourceBoite(
  boite: BoiteDeReception,
  filigranes: DepotFiligrane,
  dossier: string,
): SourceBoite {
  return {
    async relever() {
      const releve = await boite.relever(filigranes.lire(dossier))
      return {
        evenements: releve.messages.flatMap(versEvenement),
        confirmer: async () => filigranes.ecrire(dossier, releve.filigrane),
      }
    },
  }
}

function versEvenement(message: MessageRecu): EvenementBoite[] {
  if (message.nature === 'reponse') {
    return [
      {
        nature: 'reponse',
        references: message.references,
        recueLe: message.recuLe,
        expediteur: message.expediteur,
        commandeTraitee: message.commande === 'marquer-traitee',
        authentificationEchouee: message.authentification === 'echouee',
      },
    ]
  }
  if (message.action !== 'echec') return []
  const motif = [message.statut, message.motif].filter((partie) => partie !== null).join(', ')
  return [
    {
      nature: 'non-remise',
      references: message.references,
      recueLe: message.recuLe,
      motif: motif === '' ? 'motif non précisé par le serveur' : motif,
    },
  ]
}
