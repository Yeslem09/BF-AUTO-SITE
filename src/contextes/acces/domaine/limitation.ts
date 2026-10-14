import {
  DEMANDES_MAX_PAR_ADRESSE,
  FENETRE_LIMITATION_MS,
  MINUTE_MS,
  SEUIL_ALERTE_GLOBALE,
} from './regles.js'

export type DecisionLimitation =
  { readonly autorisee: true } | { readonly autorisee: false; readonly attenteMs: number }

/** Début de la fenêtre glissante qui se termine à `maintenant`. */
export function debutFenetre(maintenant: Date): Date {
  return new Date(maintenant.getTime() - FENETRE_LIMITATION_MS)
}

function dansLaFenetre(instants: readonly Date[], maintenant: Date): number[] {
  const debut = debutFenetre(maintenant).getTime()
  return instants
    .map((instant) => instant.getTime())
    .filter((temps) => temps > debut && temps <= maintenant.getTime())
    .sort((a, b) => a - b)
}

/**
 * Une adresse client a droit à cinq demandes de lien acceptées par heure
 * glissante. Au-delà, l'attente annoncée court jusqu'à ce que la plus ancienne
 * des cinq sorte de la fenêtre.
 */
export function evaluerLimiteAdresse(
  accepteesDeLAdresse: readonly Date[],
  maintenant: Date,
): DecisionLimitation {
  const recentes = dansLaFenetre(accepteesDeLAdresse, maintenant)
  if (recentes.length < DEMANDES_MAX_PAR_ADRESSE) return { autorisee: true }
  const plusAncienne = recentes[recentes.length - DEMANDES_MAX_PAR_ADRESSE] ?? maintenant.getTime()
  return {
    autorisee: false,
    attenteMs: plusAncienne + FENETRE_LIMITATION_MS - maintenant.getTime(),
  }
}

/**
 * Faut-il alerter Anthony ? Oui dès que les demandes reçues dans l'heure, toutes
 * adresses confondues, dépassent le seuil, et au plus une fois par fenêtre.
 */
export function alerteGlobaleDue(
  recues: readonly Date[],
  derniereAlerte: Date | null,
  maintenant: Date,
): boolean {
  if (dansLaFenetre(recues, maintenant).length <= SEUIL_ALERTE_GLOBALE) return false
  return derniereAlerte === null || derniereAlerte.getTime() <= debutFenetre(maintenant).getTime()
}

/** Attente arrondie à la minute supérieure, jamais moins d'une minute. */
export function minutesAttente(attenteMs: number): number {
  return Math.max(1, Math.ceil(attenteMs / MINUTE_MS))
}
