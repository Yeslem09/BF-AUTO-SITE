import { html, type Html } from '../../../../../web/index.js'
import type { Choix } from '../../../domaine/referentiels.js'
import { insecables } from './typographie.js'

/**
 * Champs de formulaire accessibles (WCAG 2.2 AA) : libellé relié, mention
 * « facultatif » écrite, aide et erreur reliées par `aria-describedby` et
 * posées sous la saisie (docs/design/composants.md), `aria-invalid="true"` sur
 * un champ en erreur et `"false"` sur les autres : sans lui, un navigateur
 * annonce « invalide » un champ obligatoire encore vide (J5, passe 1 du jury). Dans un groupe de tuiles, elles restent sous la légende :
 * la liste peut être longue, l'erreur se lit avant les options. Les classes viennent du socle.
 * Libellés, aides et erreurs passent par la typographie française (espaces
 * insécables) ; les valeurs saisies, jamais.
 */

/**
 * `alternative` : ni requis ni facultatif pris seul, parce qu'un autre champ
 * peut le remplacer (la plaque, ou marque, modèle, année et énergie) ;
 * l'aide du groupe le dit.
 */
export type Exigence = 'obligatoire' | 'facultatif' | 'alternative'

interface BaseChamp {
  readonly id: string
  readonly nom: string
  readonly libelle: string
  readonly exigence: Exigence
  readonly erreur?: string | undefined
  readonly aide?: string | Html | undefined
}

export interface ChampTexte extends BaseChamp {
  readonly valeur: string
  readonly type?: 'text' | 'tel'
  readonly autocomplete?: string
  readonly modeSaisie?: 'text' | 'tel' | 'numeric'
  readonly longueurMax?: number
}

export interface ChampListe extends BaseChamp {
  readonly valeur: string
  readonly options: readonly Choix<string>[]
  /** Première ligne, sans valeur : « Choisissez... ». */
  readonly invite: string
  readonly autocomplete?: string
}

export interface ChampZoneTexte extends BaseChamp {
  readonly valeur: string
  readonly longueurMax: number
}

export interface GroupeChoix {
  readonly id: string
  readonly nom: string
  readonly legende: string
  readonly exigence: Exigence
  readonly type: 'checkbox' | 'radio'
  readonly options: readonly Choix<string>[]
  readonly cochees: readonly string[]
  readonly erreur?: string | undefined
  readonly aide?: string | undefined
  /** Tuiles côte à côte dès que la place le permet (défaut) ; faux : une seule colonne. */
  readonly colonnes?: boolean
}

export const idAide = (id: string) => `${id}-aide`
export const idErreur = (id: string) => `${id}-erreur`

export function mentionFacultatif(exigence: Exigence): Html | false {
  return exigence === 'facultatif' && html`<span class="champ__facultatif"> (facultatif)</span>`
}

function aideEtErreur(
  id: string,
  aide: string | Html | undefined,
  erreur: string | undefined,
): Html {
  const aideAffichee = typeof aide === 'string' ? insecables(aide) : aide
  return html`${aideAffichee !== undefined && html`<p class="champ__aide" id="${idAide(id)}">${aideAffichee}</p>`}
${erreur !== undefined && html`<p class="champ__erreur" id="${idErreur(id)}"><span class="visuellement-masque">Erreur\u00a0: </span>${insecables(erreur)}</p>`}`
}

/** « invalide » seulement quand le serveur a signalé une erreur. */
function etatInvalide(erreur: string | undefined): Html {
  return html` aria-invalid="${erreur === undefined ? 'false' : 'true'}"`
}

/** Attributs communs : description reliée, état invalide, champ requis. */
function attributsEtat(champ: {
  readonly id: string
  readonly exigence: Exigence
  readonly aide?: string | Html | undefined
  readonly erreur?: string | undefined
}): Html {
  const decrit = [
    champ.aide === undefined ? null : idAide(champ.id),
    champ.erreur === undefined ? null : idErreur(champ.id),
  ].filter((id): id is string => id !== null)
  return html`${decrit.length > 0 && html` aria-describedby="${decrit.join(' ')}"`}${etatInvalide(champ.erreur)}${champ.exigence === 'obligatoire' && html` required`}`
}

export function champTexte(champ: ChampTexte): Html {
  return html`<div class="champ">
  <label class="champ__libelle" for="${champ.id}">${insecables(champ.libelle)}${mentionFacultatif(champ.exigence)}</label>
  <input class="champ__saisie" id="${champ.id}" name="${champ.nom}" type="${champ.type ?? 'text'}" value="${champ.valeur}"${champ.autocomplete !== undefined && html` autocomplete="${champ.autocomplete}"`}${champ.modeSaisie !== undefined && html` inputmode="${champ.modeSaisie}"`}${champ.longueurMax !== undefined && html` maxlength="${champ.longueurMax}"`}${attributsEtat(champ)}>
  ${aideEtErreur(champ.id, champ.aide, champ.erreur)}
</div>`
}

export function champListe(champ: ChampListe): Html {
  const options = champ.options.map(
    (option) =>
      html`<option value="${option.code}"${option.code === champ.valeur && html` selected`}>${option.libelle}</option>`,
  )
  return html`<div class="champ">
  <label class="champ__libelle" for="${champ.id}">${insecables(champ.libelle)}${mentionFacultatif(champ.exigence)}</label>
  <select class="champ__saisie" id="${champ.id}" name="${champ.nom}"${champ.autocomplete !== undefined && html` autocomplete="${champ.autocomplete}"`}${attributsEtat(champ)}>
    <option value="">${champ.invite}</option>
    ${options}
  </select>
  ${aideEtErreur(champ.id, champ.aide, champ.erreur)}
</div>`
}

export function champZoneTexte(champ: ChampZoneTexte): Html {
  return html`<div class="champ">
  <label class="champ__libelle" for="${champ.id}">${insecables(champ.libelle)}${mentionFacultatif(champ.exigence)}</label>
  <textarea class="champ__saisie" id="${champ.id}" name="${champ.nom}" maxlength="${champ.longueurMax}" rows="4"${attributsEtat(champ)}>${champ.valeur}</textarea>
  ${aideEtErreur(champ.id, champ.aide, champ.erreur)}
</div>`
}

/** Identifiant de la première case d'un groupe : cible du lien du récapitulatif d'erreurs. */
export const idPremiereCase = (id: string) => `${id}-1`

/**
 * Groupe de tuiles `.choix-tuile` (boutons radio ou cases) sous une légende :
 * toute la tuile est cliquable, 48 px au moins. Un groupe obligatoire porte
 * `required` sur sa première case, ce qui suffit au navigateur pour tout le
 * groupe de boutons radio et ne compte qu'une fois.
 */
export function groupeChoix(groupe: GroupeChoix): Html {
  const requis = groupe.exigence === 'obligatoire' && groupe.type === 'radio'
  const cases = groupe.options.map(
    (option, index) => html`<label class="choix-tuile" for="${`${groupe.id}-${index + 1}`}">
      <input type="${groupe.type}" id="${`${groupe.id}-${index + 1}`}" name="${groupe.nom}" value="${option.code}"${groupe.cochees.includes(option.code) && html` checked`}${etatInvalide(groupe.erreur)}${requis && index === 0 && html` required`}>
      <span>${insecables(option.libelle)}</span>
    </label>`,
  )
  const decrit = [
    groupe.aide === undefined ? null : idAide(groupe.id),
    groupe.erreur === undefined ? null : idErreur(groupe.id),
  ].filter((id): id is string => id !== null)
  const classesListe =
    groupe.colonnes === false ? 'liste-choix' : 'liste-choix liste-choix--colonnes'
  return html`<fieldset class="champ demandes-groupe" id="${groupe.id}"${decrit.length > 0 && html` aria-describedby="${decrit.join(' ')}"`}>
  <legend class="champ__libelle">${insecables(groupe.legende)}${mentionFacultatif(groupe.exigence)}</legend>
  ${aideEtErreur(groupe.id, groupe.aide, groupe.erreur)}
  <div class="${classesListe}">
    ${cases}
  </div>
</fieldset>`
}
