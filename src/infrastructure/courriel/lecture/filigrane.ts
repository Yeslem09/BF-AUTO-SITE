/**
 * Filigrane de lecture (Kano connecteurs, C5) : on ne relit jamais un
 * message, on ne parcourt jamais l'historique. Fonctions pures.
 */
import type { Filigrane } from './ports.js'

/** État du dossier au moment où il est ouvert. */
export interface EtatDossier {
  readonly validiteUid: string
  /** UID que recevra le prochain message ; les messages présents ont un UID inférieur. */
  readonly prochainUid: number
}

export interface PlanReleve {
  /** Premier UID à examiner ; au-delà de la fin du dossier, il n'y a rien de nouveau. */
  readonly premierUid: number
  /** Filigrane de départ, à avancer après le relevé. */
  readonly depart: Filigrane
  readonly reinitialise: boolean
  /** Vrai s'il existe des messages au-delà du filigrane. */
  readonly nouveautes: boolean
}

export function planifierReleve(filigrane: Filigrane | null, dossier: EtatDossier): PlanReleve {
  const fin = Math.max(0, dossier.prochainUid - 1)
  const depuisLaFin = (reinitialise: boolean): PlanReleve => ({
    premierUid: fin + 1,
    depart: { validiteUid: dossier.validiteUid, dernierUid: fin },
    reinitialise,
    nouveautes: false,
  })
  if (filigrane === null) return depuisLaFin(false)
  if (filigrane.validiteUid !== dossier.validiteUid) return depuisLaFin(true)
  return {
    premierUid: filigrane.dernierUid + 1,
    depart: filigrane,
    reinitialise: false,
    nouveautes: filigrane.dernierUid < fin,
  }
}

/**
 * UID strictement au-delà du filigrane, triés et sans doublon. Une recherche
 * IMAP sur la plage `N:*` renvoie le dernier message même s'il est avant N
 * (« * » vaut le plus grand UID) : ce filtre l'écarte.
 */
export function uidsNouveaux(uids: readonly number[], filigrane: Filigrane): number[] {
  return [...new Set(uids)]
    .filter((uid) => uid > filigrane.dernierUid)
    .sort((premier, second) => premier - second)
}

/** Filigrane après le relevé : tout ce qui existait à l'ouverture, et tout ce qui a été vu. */
export function avancerFiligrane(
  depart: Filigrane,
  dossier: EtatDossier,
  uidsVus: readonly number[],
): Filigrane {
  return {
    validiteUid: depart.validiteUid,
    dernierUid: Math.max(depart.dernierUid, dossier.prochainUid - 1, ...uidsVus),
  }
}
