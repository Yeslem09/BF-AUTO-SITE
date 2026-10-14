import type { ResumePreDiagnostic } from '../../../contrats/index.js'
import { CONDUITES } from './niveau.js'
import type { EtapeFinale } from './parcours.js'

/**
 * Résumé transmis à la demande de rappel, rédigé pour le garagiste : il lit le
 * cas en toutes lettres, sans code à décoder.
 */

export const CONSIGNE_ARRET =
  'Consigne donnée : ne pas rouler, se mettre en sécurité, appeler l’assistance de son assureur, et le 112 en cas de danger immédiat.'
export const CONCLUSION_INSUFFISANTE =
  'Réponses insuffisantes pour orienter : l’atelier doit voir la voiture.'
export const SIGNES_INCERTAINS = 'Le conducteur ne sait pas si un signe de danger est présent.'
const INTRODUCTION_PISTES = 'Pistes évoquées : '
const SEPARATEUR_PISTES = ' ; '
const POINT_FINAL = /\.$/

export function resumer(etape: EtapeFinale): ResumePreDiagnostic {
  return {
    symptome: { identifiant: etape.branche.code, libelle: etape.branche.libelle },
    reponses: etape.reponses,
    urgence: etape.niveau,
    conclusion: [`${CONDUITES[etape.niveau]}.`, ...precisions(etape)].join(' '),
  }
}

function precisions(etape: EtapeFinale): readonly string[] {
  if (etape.type === 'arret') return [CONSIGNE_ARRET]
  const incertitude = etape.signesARappeler.length > 0 ? [SIGNES_INCERTAINS] : []
  if (etape.conclusion.type === 'insuffisante') return [CONCLUSION_INSUFFISANTE, ...incertitude]
  const pistes = etape.conclusion.resultat.pistes.map((piste) =>
    piste.texte.replace(POINT_FINAL, ''),
  )
  return [`${INTRODUCTION_PISTES}${pistes.join(SEPARATEUR_PISTES)}.`, ...incertitude]
}
