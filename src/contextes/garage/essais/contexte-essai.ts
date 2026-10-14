/**
 * Assemblage d'essai de la couche application : données validées en mémoire,
 * dépôt SQLite réel en mémoire (même moteur qu'en production : aucune doublure
 * plus permissive), horloge fixe. Réservé aux fichiers de test.
 */
import type { TarifsDuSocle } from '../../../contrats/index.js'
import { creerHorlogeFixe } from '../adaptateurs/horloge/horloge-fixe.js'
import {
  BASE_EN_MEMOIRE,
  creerDepotFermeturesSqlite,
} from '../adaptateurs/sqlite/depot-fermetures-sqlite.js'
import type { DepotFermetures, Horloge, SourceIdentiteGarage } from '../application/ports.js'
import type { PeriodeFermeture } from '../domaine/fermeture.js'
import { validerDonneesGarage } from '../domaine/validation.js'
import type { Donnees } from './donnees-essai.js'

export function sourceDe(donnees: Donnees): SourceIdentiteGarage {
  const garage = validerDonneesGarage(donnees)
  return { charger: async () => garage }
}

export async function depotAvec(
  ...fermetures: readonly PeriodeFermeture[]
): Promise<DepotFermetures & { fermer(): void }> {
  const depot = creerDepotFermeturesSqlite(BASE_EN_MEMOIRE)
  for (const fermeture of fermetures)
    await depot.ajouter(fermeture, new Date('2026-01-01T00:00:00Z'))
  return depot
}

export function horlogeA(instantUtc: string): Horloge {
  return creerHorlogeFixe(new Date(instantUtc))
}

/**
 * Prix du socle tels que le catalogue les offre (contrat, déjà mis en mots) :
 * premier contrôle gratuit d'une demi-heure, taux horaire de 60 euros, et
 * trois exemples de prestations courantes pour le bloc atelier.
 */
export const TARIFS_ESSAI: TarifsDuSocle = {
  premierControle: {
    montant: 'Gratuit',
    gratuit: true,
    comprend: 'écoute du bruit et lecture des codes défaut',
    dateEffet: '1er janvier 2026',
    duree: '30 minutes environ',
    deduitDeLaReparation: false,
    aValider: false,
  },
  tauxHoraire: {
    montant: '60,00\u00a0€\u00a0TTC',
    gratuit: false,
    comprend: 'une heure de main-d’œuvre',
    dateEffet: '1er janvier 2026',
    duree: null,
    deduitDeLaReparation: null,
    aValider: false,
  },
  exemples: [
    {
      intitule: 'Vidange',
      montant: 'À partir de 69,00\u00a0€\u00a0TTC',
      precision: 'Citadine essence, prix au 1er octobre 2026',
      lien: '/pieces-et-reparations/vidange-et-filtres',
      aValider: false,
    },
    {
      intitule: 'Révision',
      montant: 'À partir de 129,00\u00a0€\u00a0TTC',
      precision: 'Citadine essence, prix au 1er octobre 2026',
      lien: '/pieces-et-reparations/vidange-et-filtres',
      aValider: false,
    },
    {
      intitule: 'Plaquettes avant posées',
      montant: 'À partir de 89,00\u00a0€\u00a0TTC',
      precision: 'Citadine essence, prix au 1er octobre 2026',
      lien: '/pieces-et-reparations/freinage',
      aValider: true,
    },
  ],
}

/** Aucun prix publié par le catalogue : ni tableau, ni question, ni montant d'attente. */
export const TARIFS_ABSENTS: TarifsDuSocle = {
  premierControle: null,
  tauxHoraire: null,
  exemples: [],
}
