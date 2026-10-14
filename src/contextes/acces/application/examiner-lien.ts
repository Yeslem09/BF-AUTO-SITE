import { estFormeDeJeton } from '../domaine/jeton.js'
import { etatDuLien, type EtatLien } from '../domaine/lien-connexion.js'
import type { DepotAcces, Hachage, Horloge } from './ports.js'

export type ExaminerLien = (jeton: unknown) => EtatLien

/**
 * État d'un lien ouvert depuis le message, sans rien consommer : une simple
 * lecture (GET) ne change aucun état, si bien qu'un robot qui prévisualise le
 * lien dans une messagerie ne le brûle pas.
 */
export function creerExaminerLien(dependances: {
  readonly depot: DepotAcces
  readonly hachage: Hachage
  readonly horloge: Horloge
}): ExaminerLien {
  return (jeton) => {
    if (!estFormeDeJeton(jeton)) return 'inconnu'
    const lien = dependances.depot.trouverLien(dependances.hachage.empreinte(jeton))
    return etatDuLien(lien, dependances.horloge.maintenant())
  }
}
