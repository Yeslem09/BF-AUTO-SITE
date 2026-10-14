import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html } from '../../../../../web/index.js'
import { MOMENTS_RAPPEL, MOTIFS_RAPPEL } from '../../../domaine/referentiels.js'
import { LONGUEUR_MAX_PRENOM } from '../../../domaine/validation.js'
import { CHAMPS_HTML } from '../adresses.js'
import { champListe, champTexte, groupeChoix } from './champs.js'
import { AIDE_TELEPHONE, champPiege, mentionDonnees, type GarageAffiche } from './communs.js'

/** Préfixe propre à l'accueil : ses identifiants ne croisent jamais ceux d'un autre bloc. */
const PREFIXE = 'rappel-accueil'
const id = (champ: string) => `${PREFIXE}-${champ}`

/**
 * Emplacement `rappel` de l'accueil : le formulaire court « Être rappelé »
 * (D4). Quatre champs, tous obligatoires : motif, prénom, téléphone et moment
 * où l'on peut répondre, en tuiles d'une colonne (la colonne est étroite au
 * bureau). Posé par l'accueil dans un panneau : le bloc n'a pas de cadre
 * propre. Seul formulaire de l'accueil (US-08, piège 10).
 * Une erreur réaffiche le formulaire complet `/demande`, valeurs conservées.
 */
export function blocRappel(garage: GarageAffiche, jeton: string): Html {
  return html`<section class="demandes-rappel" aria-labelledby="${id('titre')}">
  <h2 class="titre-carte" id="${id('titre')}">Être rappelé</h2>
  <p class="demandes-rappel__intro">Laissez votre numéro et le moment où vous pouvez répondre\u00a0: le garage vous rappelle.</p>
  <form class="demandes-rappel__formulaire" method="post" action="${CHEMINS.demande}" novalidate data-envoi-unique>
    <p class="champ__aide">Tous les champs sont obligatoires.</p>
    <input type="hidden" name="${CHAMPS_HTML.type}" value="rappel">
    <input type="hidden" name="${CHAMPS_HTML.jeton}" value="${jeton}">
    ${champPiege(PREFIXE)}
    ${champListe({
      id: id('motif'),
      nom: CHAMPS_HTML.motif,
      libelle: 'Motif de l’appel',
      exigence: 'obligatoire',
      valeur: '',
      options: MOTIFS_RAPPEL,
      invite: 'Choisissez un motif',
    })}
    ${champTexte({
      id: id('prenom'),
      nom: CHAMPS_HTML.prenom,
      libelle: 'Votre prénom',
      exigence: 'obligatoire',
      valeur: '',
      autocomplete: 'given-name',
      longueurMax: LONGUEUR_MAX_PRENOM,
    })}
    ${champTexte({
      id: id('telephone'),
      nom: CHAMPS_HTML.telephone,
      libelle: 'Votre téléphone',
      type: 'tel',
      exigence: 'obligatoire',
      aide: AIDE_TELEPHONE,
      valeur: '',
      autocomplete: 'tel-national',
      modeSaisie: 'tel',
    })}
    ${groupeChoix({
      id: id('moment'),
      nom: CHAMPS_HTML.moment,
      legende: 'Quand pouvez-vous répondre au téléphone ?',
      exigence: 'obligatoire',
      type: 'radio',
      options: MOMENTS_RAPPEL,
      cochees: [],
      colonnes: false,
    })}
    <button class="bouton bouton--principal demandes-rappel__bouton" type="submit">Être rappelé</button>
  </form>
  ${mentionDonnees(garage, PREFIXE, 3)}
</section>`
}
