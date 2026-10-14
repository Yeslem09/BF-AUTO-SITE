import { CHEMINS, type NiveauUrgence } from '../../../../../contrats/index.js'
import { brut, html, type Html, type VuePage } from '../../../../../web/index.js'
import { CONDUITES } from '../../../domaine/niveau.js'
import type { EtapeResultat } from '../../../domaine/parcours.js'
import { adresseRendezVous } from '../adresses.js'
import {
  ATTRIBUTS_FOCUS,
  barreFixeVersRappel,
  classeNiveau,
  CLASSE_FICHE,
  DESCRIPTION_PARCOURS,
  ETAPE_RESULTAT,
  rendreActions,
  rendreAvertissementRelecture,
  rendreConsignesArret,
  rendreFilAriane,
  rendreImpression,
  rendreMention,
  rendreNavigationParcours,
  rendreReponses,
  SCRIPT_ETAPE,
  SCRIPT_IMPRESSION,
  type ContexteVue,
} from './commun.js'
import { famillesDesPistes, rendrePistes } from './pistes.js'

export const PHRASE_INSUFFISANTE =
  'Vos réponses ne suffisent pas pour orienter : l’atelier doit voir la voiture.'
export const TITRE_SIGNES_INCERTAINS = 'Vous ne savez pas si l’un de ces signes est présent.'
export const PHRASE_SIGNES_INCERTAINS = 'Si c’est le cas, ne roulez pas et appelez-nous :'
export const LIBELLE_RENDEZ_VOUS = 'Demander un rendez-vous'

/**
 * L'alerte de chaque niveau : aplat rouge, cadre ambre épais, cadre gris. Le
 * titre écrit toujours la conduite ; la forme et la couleur ne font qu'appuyer.
 */
const ALERTES: Readonly<Record<NiveauUrgence, { classe: string; explication: string }>> = {
  'ne-pas-rouler': {
    classe: 'alerte alerte--danger',
    explication:
      'Ce que vous décrivez peut rendre la conduite dangereuse ou aggraver la panne. Suivez les consignes ci-dessous.',
  },
  'a-controler': {
    classe: 'alerte alerte--attention',
    explication:
      'Rien dans vos réponses n’impose de vous arrêter, mais l’atelier doit voir la voiture sans attendre que cela s’aggrave.',
  },
  'sans-urgence': {
    classe: 'alerte',
    explication:
      'Rien dans vos réponses ne presse. Parlez-en lors de votre prochain passage à l’atelier.',
  },
}

/**
 * Résultat, dans l'ordre du Kano : la conduite à tenir en toutes lettres, les
 * pistes sans pourcentage ni rang (avec la figure de la famille concernée), les
 * actions, puis la mention. Au niveau « Ne roulez pas », les consignes de
 * l'arrêt passent avant les pistes et l'impression suit la mention, comme sur
 * l'écran d'arrêt.
 */
export function vueResultat(etape: EtapeResultat, contexte: ContexteVue): VuePage {
  const conduite = CONDUITES[etape.niveau]
  const alerte = ALERTES[etape.niveau]
  const arret = etape.niveau === 'ne-pas-rouler'
  const insuffisante = etape.conclusion.type === 'insuffisante'
  return {
    titre: `Résultat du pré-diagnostic : ${conduite}`,
    description: DESCRIPTION_PARCOURS,
    chemin: CHEMINS.preDiagnostic,
    rubrique: 'pre-diagnostic',
    indexable: false,
    scripts: [SCRIPT_IMPRESSION, SCRIPT_ETAPE],
    ...barreFixeVersRappel(etape.code),
    contenu: html`<div class="conteneur section pile pre-diagnostic ${CLASSE_FICHE}">
  ${rendreFilAriane(ETAPE_RESULTAT)}
  ${rendreAvertissementRelecture(contexte.aRelire)}
  <div class="${alerte.classe} pre-diagnostic-conduite ${classeNiveau(etape.niveau)}" role="status">
    <h1 class="alerte__titre" ${brut(ATTRIBUTS_FOCUS)}>${conduite}</h1>
    ${insuffisante ? html`<p class="pre-diagnostic-insuffisant">${PHRASE_INSUFFISANTE}</p>` : html`<p>${alerte.explication}</p>`}
  </div>
  ${
    etape.signesARappeler.length > 0 &&
    html`<div class="alerte pre-diagnostic-rappel-signes">
    <p class="alerte__titre">${TITRE_SIGNES_INCERTAINS}</p>
    <p>${PHRASE_SIGNES_INCERTAINS}</p>
    <ul class="pre-diagnostic-signales">${etape.signesARappeler.map((signe) => html`<li>${signe.libelle}</li>`)}</ul>
  </div>`
  }
  ${arret && rendreConsignesArret(contexte.actions, contexte.contact, etape.code)}
  ${etape.conclusion.type === 'pistes' && rendrePistes(etape.conclusion.resultat.pistes, etape.code, contexte.familles)}
  ${
    !arret &&
    html`<section class="pre-diagnostic-suite" aria-labelledby="pre-diagnostic-titre-suite">
    <h2 id="pre-diagnostic-titre-suite">Et maintenant ?</h2>
    ${rendreActions(contexte.actions, contexte.contact, etape.code, rendezVous(etape))}
  </section>`
  }
  ${rendreReponses(etape.reponses)}
  ${rendreMention(contexte.mention)}
  ${arret && rendreImpression(contexte.actions)}
  ${rendreNavigationParcours(etape.retour, true)}
</div>`,
  }
}

/**
 * « Faites contrôler dans les prochains jours » (J5, passe 2 du jury) : un
 * rendez-vous prérempli avec les réponses, et la famille quand les pistes
 * n'en désignent qu'une. Rien aux autres niveaux.
 */
function rendezVous(etape: EtapeResultat): readonly Html[] {
  if (etape.niveau !== 'a-controler') return []
  const familles =
    etape.conclusion.type === 'pistes' ? famillesDesPistes(etape.conclusion.resultat.pistes) : []
  const famille = familles.length === 1 ? (familles[0] ?? null) : null
  return [
    html`<li><a class="bouton bouton--secondaire" href="${adresseRendezVous(etape.code, famille)}">${LIBELLE_RENDEZ_VOUS}</a></li>`,
  ]
}
