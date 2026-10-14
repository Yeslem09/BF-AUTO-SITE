import { estFormeDeJeton } from '../domaine/jeton.js'
import { etatDuLien, type EtatLien } from '../domaine/lien-connexion.js'
import { nouvelleSession, type Session } from '../domaine/session.js'
import type { DepotAcces, GenerateurJeton, Hachage, Horloge } from './ports.js'

export type ResultatOuverture =
  | {
      readonly issue: 'ouverte'
      /** Jeton en clair, destiné au seul cookie de session. */
      readonly jetonSession: string
      readonly session: Session
      readonly retour: string
    }
  | { readonly issue: Exclude<EtatLien, 'valide'> }

export type OuvrirSession = (jetonLien: unknown) => ResultatOuverture

/** Échange un lien valide contre une session de 90 jours glissants. Le lien ne resservira plus. */
export function creerOuvrirSession(dependances: {
  readonly depot: DepotAcces
  readonly generateur: GenerateurJeton
  readonly hachage: Hachage
  readonly horloge: Horloge
}): OuvrirSession {
  const { depot, generateur, hachage, horloge } = dependances
  return (jetonLien) => {
    if (!estFormeDeJeton(jetonLien)) return { issue: 'inconnu' }
    const maintenant = horloge.maintenant()
    const empreinteLien = hachage.empreinte(jetonLien)
    const lien = depot.trouverLien(empreinteLien)
    const etat = etatDuLien(lien, maintenant)
    if (etat !== 'valide') return { issue: etat }
    if (lien === null) return { issue: 'inconnu' }

    const jetonSession = generateur.generer()
    const session = nouvelleSession(hachage.empreinte(jetonSession), maintenant)
    // Une autre ouverture a pu devancer celle-ci entre la lecture et l'échange.
    if (!depot.echangerLienContreSession(empreinteLien, session, maintenant)) {
      return { issue: 'deja-utilise' }
    }
    return { issue: 'ouverte', jetonSession, session, retour: lien.retour }
  }
}
