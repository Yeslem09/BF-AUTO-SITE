import type { LimiteurEnvois } from '../../application/ports.js'
import { envoisDansLaFenetre, limiteAtteinte } from '../../domaine/anti-abus.js'

/** Au-delà de ce nombre d'adresses suivies, les adresses sans envoi récent sont oubliées. */
const ADRESSES_AVANT_NETTOYAGE = 1_000

/**
 * Compteur en mémoire : aucune adresse n'est écrite sur disque, tout s'efface
 * au redémarrage et au bout d'une heure (minimisation, D9).
 */
export function creerLimiteurMemoire(): LimiteurEnvois {
  const envois = new Map<string, readonly number[]>()

  const oublierLesAnciennes = (maintenant: Date) => {
    for (const [cle, horodatages] of envois) {
      if (envoisDansLaFenetre(horodatages, maintenant).length === 0) envois.delete(cle)
    }
  }

  return {
    estAtteinte(cle, instant) {
      return limiteAtteinte(envois.get(cle) ?? [], instant)
    },
    compter(cle, instant) {
      if (envois.size >= ADRESSES_AVANT_NETTOYAGE) oublierLesAnciennes(instant)
      envois.set(cle, [...envoisDansLaFenetre(envois.get(cle) ?? [], instant), instant.getTime()])
    },
  }
}
