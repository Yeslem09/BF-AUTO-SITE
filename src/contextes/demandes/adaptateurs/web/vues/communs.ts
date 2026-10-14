import type {
  IdentiteGaragePublique,
  NiveauUrgence,
  ResumePreDiagnostic,
} from '../../../../../contrats/index.js'
import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html } from '../../../../../web/index.js'
import { DUREE_CONSERVATION_MOIS } from '../../../domaine/conservation.js'
import { consigneDonnee, libelleUrgence } from '../../../domaine/message-notification.js'
import { conclusionSansVerdict, lignesDuResume } from '../../../domaine/resume-sans-redite.js'
import { CHAMPS_HTML } from '../adresses.js'
import { insecables } from './typographie.js'

/** Ce que les vues publiques savent du garage (identité fournie par le contexte garage). */
export interface GarageAffiche {
  readonly identite: IdentiteGaragePublique
}

/** Phrase de sécurité d'un pré-diagnostic « Ne roulez pas » (US-18). */
export const PHRASE_SECURITE =
  'Si vous êtes immobilisé ou en danger, n’attendez pas notre rappel : appelez votre assistance ou le 112.'

/** Aide du champ téléphone (B-12, US-14) : à quoi il sert, et à quoi il ne servira pas. */
export const AIDE_TELEPHONE =
  'Il sert uniquement à vous rappeler pour cette demande. Aucune sollicitation commerciale sans votre accord préalable.'

export function nomDuGarage(garage: GarageAffiche): string {
  return garage.identite.nom
}

/**
 * Champ piège (D9, US-15) : hors du flux visuel, ignoré au clavier et par les
 * lecteurs d'écran, jamais proposé au remplissage automatique.
 */
export function champPiege(prefixe: string): Html {
  const id = `${prefixe}-reference-garage`
  return html`<div class="demandes-piege" aria-hidden="true">
  <label for="${id}">Ne pas remplir ce champ</label>
  <input id="${id}" name="${CHAMPS_HTML.piege}" type="text" value="" autocomplete="off" tabindex="-1" aria-hidden="true">
</div>`
}

/**
 * Information de premier niveau sous chaque formulaire (B-12, US-14) :
 * responsable, finalité, durée, droits, lien vers la politique de confidentialité.
 * Aucune case de consentement : répondre à la demande du client ne l'exige pas,
 * et aucune sollicitation commerciale n'est faite.
 */
export function mentionDonnees(garage: GarageAffiche, prefixe: string, niveau: 2 | 3 = 2): Html {
  const { telephone } = garage.identite
  const idTitre = `${prefixe}-donnees-titre`
  const titre =
    niveau === 2
      ? html`<h2 class="demandes-donnees__titre" id="${idTitre}">Vos données</h2>`
      : html`<h3 class="demandes-donnees__titre" id="${idTitre}">Vos données</h3>`
  return html`<section class="demandes-donnees" aria-labelledby="${idTitre}">
  ${titre}
  <p>${nomDuGarage(garage)}, responsable du traitement, utilise ces informations uniquement pour répondre à votre demande, puis les supprime au bout de ${DUREE_CONSERVATION_MOIS} mois.</p>
  <p>Pour les consulter, les corriger, les supprimer ou vous opposer à leur usage, appelez le garage au <a class="demandes-telephone" href="${telephone.lien}">${telephone.affichable}</a>\u00a0; vous pouvez aussi saisir la CNIL. <a href="${CHEMINS.confidentialite}">Politique de confidentialité</a></p>
</section>`
}

/** Forme de chaque conduite à tenir (composant `.alerte`) : jamais l'orange de marque. */
const CLASSES_ALERTE: Readonly<Record<NiveauUrgence, string>> = {
  'ne-pas-rouler': 'alerte alerte--danger',
  'a-controler': 'alerte alerte--attention',
  'sans-urgence': 'alerte',
}

/**
 * Conduite à tenir du pré-diagnostic, en alerte du système de design : le
 * titre écrit le sens, la forme le double. Pour le client, « Ne roulez pas »
 * porte la phrase de sécurité (US-18) ; sans elle, l'alerte tient en une ligne.
 */
export function alerteUrgence(urgence: NiveauUrgence, consigneAuClient = true): Html {
  return html`<div class="${CLASSES_ALERTE[urgence]}">
  <p class="alerte__titre">${insecables(libelleUrgence(urgence))}</p>
  ${consigneAuClient && urgence === 'ne-pas-rouler' && html`<p>${insecables(PHRASE_SECURITE)}</p>`}
</div>`
}

/**
 * La même alerte, lue par le garagiste : ce qui a été dit au client, pas la
 * phrase qui s'adresse à lui (J4, passe 1 du jury).
 */
export function alerteConsigneDonnee(urgence: NiveauUrgence): Html {
  return html`<div class="${CLASSES_ALERTE[urgence]}">
  <p class="alerte__titre">${insecables(consigneDonnee(urgence))}</p>
</div>`
}

export interface OptionsResume {
  readonly idTitre: string
  readonly titre: string
  /** Ce que devient ce résumé, dit sous son titre. */
  readonly note?: string
  /** Faux sur la fiche du garagiste : la phrase de sécurité s'adresse au client. */
  readonly consigneAuClient?: boolean
}

/**
 * Résumé du pré-diagnostic, en lecture seule : il est transmis tel quel au
 * garagiste (AT-1, US-22), aucun champ ne permet de le modifier. Ses textes
 * viennent du pré-diagnostic : la typographie française leur est appliquée
 * ici, à l'affichage.
 */
export function resumePreDiagnostic(resume: ResumePreDiagnostic, options: OptionsResume): Html {
  const conclusion = conclusionSansVerdict(resume)
  const auClient = options.consigneAuClient ?? true
  return html`<section class="demandes-resume" aria-labelledby="${options.idTitre}">
  <h2 class="titre-carte" id="${options.idTitre}">${insecables(options.titre)}</h2>
  ${options.note !== undefined && html`<p class="champ__aide">${insecables(options.note)}</p>`}
  ${auClient ? alerteUrgence(resume.urgence) : alerteConsigneDonnee(resume.urgence)}
  <dl class="liste-definitions demandes-resume__reponses">
    ${reponsesLisibles(resume)}
  </dl>
  ${conclusion !== null && html`<p>${insecables(conclusion)}</p>`}
</section>`
}

/**
 * Questions et réponses du pré-diagnostic, en toutes lettres (client et
 * garagiste), le symptôme en tête seulement si aucune réponse ne le dit déjà.
 */
export function reponsesLisibles(resume: ResumePreDiagnostic): Html[] {
  return lignesDuResume(resume).map(
    (ligne) => html`<dt>${insecables(ligne.question)}</dt><dd>${insecables(ligne.reponse)}</dd>`,
  )
}

/** Lien d'appel du garage. */
export function appelerLeGarage(garage: GarageAffiche, invite: string): Html {
  const { telephone } = garage.identite
  return html`${insecables(invite)} au <a class="demandes-telephone" href="${telephone.lien}">${telephone.affichable}</a>.`
}
