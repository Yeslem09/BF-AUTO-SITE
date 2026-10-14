import { changerStatut, type StatutDemande } from '../domaine/demande.js'
import type { DepotDemandes, Horloge, Journal } from './ports.js'

export interface DependancesChangerStatut {
  readonly depot: DepotDemandes
  readonly horloge: Horloge
  readonly journal: Journal
}

export type IssueChangementStatut = 'change' | 'inchange' | 'absente'

/** Range une demande « Traitée » ou la remet « À rappeler » ; la date du changement est gardée (purge). */
export type ChangerStatut = (id: string, statut: StatutDemande) => Promise<IssueChangementStatut>

export function creerChangerStatut(dependances: DependancesChangerStatut): ChangerStatut {
  return async (id, statut) => {
    const lecture = await dependances.depot.trouver(id)
    if (lecture.etat !== 'trouvee') return 'absente'
    const modifiee = changerStatut(lecture.demande, statut, dependances.horloge.maintenant())
    if (modifiee === lecture.demande || modifiee.statutChangeLe === null) return 'inchange'
    await dependances.depot.changerStatut(id, modifiee.statut, modifiee.statutChangeLe)
    dependances.journal.info('Statut de demande changé', { demande: id, statut })
    return 'change'
  }
}
