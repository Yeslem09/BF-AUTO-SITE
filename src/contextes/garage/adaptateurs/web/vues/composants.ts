import type { AdressePostale } from '../../../../../contrats/index.js'
import { CHEMINS } from '../../../../../contrats/index.js'
import {
  html,
  lienItineraire,
  rendrePastilleStatut,
  rendreStatutOuverture,
  SYMBOLE,
  type Html,
} from '../../../../../web/index.js'
import type { FicheGarage, HorairesPublies } from '../../../application/consulter-garage.js'
import { decrireLigne, type LigneHoraire } from '../../../domaine/description-horaires.js'
import { entreGuillemets } from '../../../domaine/textes.js'
import { enLigne, surligner } from './publication.js'

const ITINERAIRE_APPLE = 'https://maps.apple.com/?daddr='
export const PHRASE_SANS_RENDEZ_VOUS = 'Passez sans rendez-vous aux heures d’ouverture.'

export function adresseSurUneLigne(adresse: AdressePostale): string {
  return `${adresse.voie}, ${adresse.codePostal} ${adresse.ville}`
}

/**
 * En-tête d'une page de contenu (composant `.entete-page`) : fil d'Ariane
 * jusqu'à la page, surtitre, titre et chapeau. Le dernier maillon est la page
 * elle-même, marquée `aria-current`.
 */
export interface EntetePage {
  readonly chemin: string
  readonly titre: string
  readonly surtitre: string
  readonly intro?: Html | string
  /** Maillons intermédiaires entre l'accueil et la page (espace garagiste). */
  readonly parents?: readonly { readonly chemin: string; readonly libelle: string }[]
}

export function entetePage(entete: EntetePage): Html {
  const parents = entete.parents ?? []
  return html`<div class="entete-page">
  <div class="conteneur">
    <nav class="fil-ariane" aria-label="Fil d’Ariane">
      <ol>
        <li><a href="${CHEMINS.accueil}">Accueil</a></li>
        ${parents.map((parent) => html`<li><a href="${parent.chemin}">${parent.libelle}</a></li>`)}
        <li><a href="${entete.chemin}" aria-current="page">${entete.titre}</a></li>
      </ol>
    </nav>
    <p class="surtitre">${entete.surtitre}</p>
    <h1>${entete.titre}</h1>
    ${entete.intro !== undefined && html`<p class="texte-intro">${entete.intro}</p>`}
  </div>
</div>`
}

/**
 * Liens d'itinéraire externes (Kano B-02, D10) : la fiche Google d'abord, par
 * le lien commun du site, Plans d'Apple en second. Ils ne chargent rien tant
 * qu'on ne les suit pas : aucune carte intégrée ni image de carte.
 */
export function liensItineraire(adresse: AdressePostale): Html {
  const destination = encodeURIComponent(adresseSurUneLigne(adresse))
  return html`<ul class="garage-itineraire">
  <li><a href="${lienItineraire(adresse)}" rel="noopener">Itinéraire avec Google Maps</a></li>
  <li><a href="${ITINERAIRE_APPLE + destination}" rel="noopener">ou avec Plans d’Apple</a></li>
</ul>`
}

/**
 * Emplacement `statut` de l'accueil : le statut du jour en pastille, l'adresse
 * courte et l'itinéraire, en tête de la bande (premier bloc sur téléphone). La
 * ligne de statut de l'en-tête s'efface alors sur l'accueil.
 */
export function ligneStatut(fiche: FicheGarage): Html {
  const { adresse } = fiche.identite
  return html`<p class="garage-statut">
  ${rendrePastilleStatut(fiche.statut)}
  <span class="garage-statut__adresse">${adresse.voie}<span class="garage-statut__ville">, ${adresse.codePostal} ${adresse.ville}</span></span>
  <a class="garage-statut__itineraire" href="${lienItineraire(adresse)}" rel="noopener">Itinéraire<span class="visuellement-masque"> jusqu’au ${adresseSurUneLigne(adresse)}</span></a>
</p>`
}

/** Statut d'ouverture, et l'accueil sans rendez-vous quand c'est ouvert (US-45). */
export function statutDuGarage(fiche: FicheGarage): Html {
  return html`${rendreStatutOuverture(fiche.statut, fiche.identite.telephone)}
  ${fiche.passerSansRendezVous && html`<p class="garage-sans-rendez-vous">${PHRASE_SANS_RENDEZ_VOUS}</p>`}`
}

/** Contenu d'une ligne : chaque plage insécable, pour qu'une plage ne se coupe jamais en deux. */
function detailLigne(ligne: LigneHoraire): Html {
  if (ligne.fermeExceptionnellement || ligne.plages.length === 0)
    return html`${decrireLigne(ligne)}`
  return html`${ligne.plages.map(
    (plage, index) =>
      html`${index > 0 ? ', ' : ''}<span class="garage-horaires__plage">${plage}</span>`,
  )}`
}

/** Les sept prochains jours, aujourd'hui en tête et dit en toutes lettres (US-40). */
export function tableauHoraires(horaires: HorairesPublies): Html {
  const lignes = horaires.semaineGlissante.map((ligne) => {
    const classes = [
      ligne.aujourdhui && 'garage-horaires__aujourdhui',
      ligne.fermeExceptionnellement && 'garage-horaires__exception',
    ]
      .filter(Boolean)
      .join(' ')
    const jour = ligne.aujourdhui
      ? html`${ligne.jour} <span class="garage-horaires__repere">(aujourd’hui)</span>`
      : html`${ligne.jour}`
    return html`<tr${classes === '' ? '' : html` class="${classes}"`}><th scope="row">${jour}</th><td>${surligner(detailLigne(ligne), horaires.aSurligner)}</td></tr>`
  })
  return html`<table class="garage-horaires">
  <caption class="visuellement-masque">Horaires des sept prochains jours, à partir d’aujourd’hui</caption>
  <tbody>
    ${lignes}
  </tbody>
</table>`
}

/**
 * Encart « Nouveau nom » (composant `.encart`, Kano D6, US-10) : pour les
 * habitués de l'ancienne fiche, en bas de l'accueil et de la page Accès.
 * « même atelier » seulement si le même exploitant est publié ; le lien d'avis
 * seulement s'il est validé. Aucune note ni témoignage.
 */
export function encartNouveauNom(fiche: FicheGarage): Html | null {
  if (!fiche.ancienNom.visible) return null
  const memeAtelier = fiche.memeExploitant.visible && fiche.memeExploitant.valeur
  return html`<aside class="encart garage-nouveau-nom" aria-labelledby="titre-nouveau-nom">
  <div class="encart__symbole">${SYMBOLE}</div>
  <div class="encart__corps">
    <p class="encart__surtitre">Nouveau nom${memeAtelier ? html`, ${surligner('même atelier', fiche.memeExploitant.aSurligner)}` : ''}</p>
    <h2 class="encart__titre" id="titre-nouveau-nom"><span class="garage-nouveau-nom__ancien">${enLigne(fiche.ancienNom, entreGuillemets)}</span> devient <span class="garage-insecable">${fiche.identite.nom}</span></h2>
    <p>Même adresse, même numéro.${fiche.lienAvis !== null && html` Déjà venu chez nous ? <a href="${CHEMINS.avis}">Laissez un avis Google</a>.`}</p>
  </div>
</aside>`
}

/** Lien secondaire vers la source juridique d'une réponse (Kano AT-2) : jamais dans la phrase. */
export function lienLeTexte(adresse: string, precision: string): Html {
  return html`<p class="garage-source"><a href="${adresse}" rel="noopener">Le texte<span class="visuellement-masque"> : ${precision}</span></a></p>`
}
