import { CHEMINS, PARAMETRES_DEMANDE, type TypeDemande } from '../contrats/index.js'
import { html, type Html } from './html.js'
import { lienItineraire } from './itineraire.js'
import type { CadrePage } from './page.js'

export interface ActionBarreFixe {
  readonly libelle: string
  /**
   * Seconde ligne, plus discrète, toujours sur une seule ligne : le numéro, la
   * rue, ou le moment du rappel.
   */
  readonly precision: string | null
  readonly lien: string
  /** Vrai pour l'appel : le numéro devient la ligne la plus lisible du bouton. */
  readonly appel: boolean
}

export interface ActionsBarreFixe {
  readonly principale: ActionBarreFixe
  readonly secondaire: ActionBarreFixe
}

const TYPE_RAPPEL: TypeDemande = 'rappel'
const LIEN_RAPPEL = `${CHEMINS.demande}?${PARAMETRES_DEMANDE.type}=${TYPE_RAPPEL}`

/**
 * Réouverture annoncée par le statut du garage (contexte garage) :
 * « Fermé, ouvre à 8 h 30 », « Fermé, rouvre à 14 h », « Fermé
 * exceptionnellement, ouvre demain à 8 h 30 », « Fermé, ouvre le lundi 24 août
 * à 9 h ». Espaces ordinaires ou déjà insécables.
 */
const REOUVERTURE = /,\s*r?ouvre\s+(?:(.+?)\s+)?à\s+(\d{1,2}\s*h(?:\s*\d{2})?)\s*$/u
/** « le lundi 24 août » : la date suffit, le nom du jour allongerait la ligne. */
const DATE_ET_JOUR = /^le\s+\p{L}+\s+(\d.*)$/u
/** « demain vendredi » : le nom du jour suffit. */
const DEMAIN_ET_JOUR = /^demain\s+(\p{L}+)$/u

/**
 * Seconde ligne du bouton « Être rappelé » quand le garage est fermé : le
 * moment où le rappel devient possible, assez court pour tenir sur une ligne à
 * 320 px (« dès 8 h 30 », « demain 8 h 30 », « lundi 9 h », « le 24 août »).
 * Le bouton ne répète plus « Fermé » : la pastille de l'en-tête le dit, et on
 * ne lit plus que le service de rappel est fermé. Un libellé d'une autre forme
 * est repris tel quel ; la barre le coupe alors proprement, par des points de
 * suspension, et la pastille le donne en entier.
 */
export function momentDuRappel(libelle: string): string {
  const trouve = REOUVERTURE.exec(libelle)
  if (trouve === null) return libelle
  const [, jour, heure = ''] = trouve
  if (jour === undefined) return `dès ${heure}`
  const date = DATE_ET_JOUR.exec(jour)?.[1]
  if (date !== undefined) return `le ${date}`
  return `${DEMAIN_ET_JOUR.exec(jour)?.[1] ?? jour} ${heure}`
}

/**
 * L'action utile du moment, calculée depuis le statut (D7), au service de la
 * page quand elle fournit son propre lien de rappel (`VuePage.barreFixe`) :
 * - ouvert : appeler, puis venir (itinéraire), ou être rappelé si la page
 *   fournit son rappel (résultat du pré-diagnostic) ;
 * - fermé : être rappelé (à la réouverture), appeler restant possible ;
 * - horaires à confirmer : appeler d'abord, puisque rien ne dit que le garage
 *   est ouvert, et se faire rappeler sinon ; pas d'itinéraire vers une porte
 *   peut-être close.
 */
export function actionsBarreFixe(cadre: CadrePage, lienRappelPage?: string): ActionsBarreFixe {
  const { identite, statut } = cadre
  const appeler: ActionBarreFixe = {
    libelle: 'Appeler',
    precision: identite.telephone.affichable,
    lien: identite.telephone.lien,
    appel: true,
  }
  const etreRappele = (precision: string | null): ActionBarreFixe => ({
    libelle: 'Être rappelé',
    precision,
    lien: lienRappelPage ?? LIEN_RAPPEL,
    appel: false,
  })
  switch (statut.etat) {
    case 'ouvert':
      return {
        principale: appeler,
        secondaire:
          lienRappelPage === undefined
            ? {
                libelle: 'Itinéraire',
                precision: identite.adresse.voie,
                lien: lienItineraire(identite.adresse),
                appel: false,
              }
            : etreRappele(null),
      }
    case 'ferme':
      return { principale: etreRappele(momentDuRappel(statut.libelle)), secondaire: appeler }
    case 'a-confirmer':
      return { principale: appeler, secondaire: etreRappele(null) }
  }
}

/**
 * Un bouton : libellé, puis précision, chacun sur une ligne (CSS). Une virgule
 * masquée clôt le libellé pour les lecteurs d'écran : « Être rappelé, demain
 * 8 h 30 », et non « Être rappelé demain… » d'un seul tenant.
 */
function rendreAction(action: ActionBarreFixe, principale: boolean): Html {
  const classes = [
    'barre-fixe__action',
    principale ? 'barre-fixe__action--principale' : '',
    action.appel ? 'barre-fixe__action--appel' : '',
  ]
    .filter((classe) => classe !== '')
    .join(' ')
  const { precision } = action
  const separateur = precision !== null && html`<span class="visuellement-masque">,</span>`
  return html`<a class="${classes}" href="${action.lien}"><span class="barre-fixe__libelle">${action.libelle}${separateur}</span>${precision !== null && html`<span class="barre-fixe__precision">${precision}</span>`}</a>`
}

/**
 * Barre fixe basse du téléphone (masquée au-delà de 768 px, sur un écran très
 * bas et pendant la saisie). `lienRappelPage` : le rappel propre à la page.
 */
export function rendreBarreFixe(cadre: CadrePage, lienRappelPage?: string): Html {
  const { principale, secondaire } = actionsBarreFixe(cadre, lienRappelPage)
  return html`<nav class="barre-fixe barre-fixe--${cadre.statut.etat}" aria-label="Contact rapide">
  ${rendreAction(principale, true)}
  ${rendreAction(secondaire, false)}
</nav>`
}
