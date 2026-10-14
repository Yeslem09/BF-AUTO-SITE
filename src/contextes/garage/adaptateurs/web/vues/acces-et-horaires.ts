import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { FicheGarage } from '../../../application/consulter-garage.js'
import { LIBELLES_MOTIF, periodeEnLettres } from '../../../domaine/fermeture.js'
import { majusculeInitiale } from '../../../domaine/dates-francaises.js'
import { rendreDonneesStructurees } from '../json-ld.js'
import {
  adresseSurUneLigne,
  encartNouveauNom,
  entetePage,
  liensItineraire,
  statutDuGarage,
  tableauHoraires,
} from './composants.js'
import { enLigne, manque, surligner } from './publication.js'

/**
 * Titre du panneau des horaires : distinct du bloc « Horaires » du pied de
 * page, pour qu'un lecteur d'écran n'entende pas deux régions du même nom.
 */
export const TITRE_HORAIRES = 'Horaires d’ouverture'

/**
 * Page « Accès et horaires » (Kano D7, B-02, B-03) : en-tête de page, trois
 * panneaux (horaires, venir, sur place), l'encart « Nouveau nom ». Aucune
 * carte, des liens d'itinéraire.
 */
export function vueAccesEtHoraires(fiche: FicheGarage): VuePage {
  const { adresse, telephone, nom } = fiche.identite
  const activites = enLigne(fiche.activites, (texte) => `${texte}.`)
  return {
    titre: `Accès et horaires de ${nom}, garage à ${adresse.ville}`,
    description: `Adresse, itinéraire et horaires de ${nom}, ${adresseSurUneLigne(adresse)}. Téléphone : ${telephone.affichable}.`,
    chemin: CHEMINS.acces,
    rubrique: 'acces',
    contenu: html`${entetePage({
      chemin: CHEMINS.acces,
      titre: 'Accès et horaires',
      surtitre: 'Le garage',
      intro: html`${nom}, ${adresseSurUneLigne(adresse)}.${activites !== null && html` ${activites}`}`,
    })}
<div class="conteneur section garage-acces">
  <div class="garage-acces__grille">
    <section class="panneau pile" aria-labelledby="titre-horaires">
      <h2 id="titre-horaires" class="titre-carte">${TITRE_HORAIRES}</h2>
      ${statutDuGarage(fiche)}
      ${
        fiche.horaires === null
          ? html`<p>Horaires à confirmer : <a href="${telephone.lien}">appelez-nous au ${telephone.affichable}</a>.</p>`
          : tableauHoraires(fiche.horaires)
      }
      ${fermeturesAVenir(fiche)}
    </section>
    <section class="panneau pile" aria-labelledby="titre-venir">
      <h2 id="titre-venir" class="titre-carte">Venir au garage</h2>
      <address class="garage-adresse">
        ${adresse.voie}<br>
        ${adresse.codePostal} ${adresse.ville}
      </address>
      <p class="garage-coordonnees__telephone"><a href="${telephone.lien}">${telephone.affichable}</a></p>
      ${liensItineraire(adresse)}
      ${liste(fiche.reperes, 'Repères')}
      ${liste(fiche.transports, 'En transports en commun')}
      ${paragraphe(fiche.stationnement, 'Stationnement')}
      ${paragraphe(fiche.enseigneActuelle, 'Sur la façade')}
    </section>
    <section class="panneau pile" aria-labelledby="titre-sur-place">
      <h2 id="titre-sur-place" class="titre-carte">Sur place</h2>
      ${liste(fiche.documentsAApporter, 'Documents à apporter')}
      ${paragraphe(fiche.attenteSurPlace, 'Attendre pendant l’intervention')}
      <div class="pile-serree">
        <h3 class="garage-sous-titre">Pour préparer votre venue</h3>
        <ul class="garage-renvois">
          <li><a href="${CHEMINS.tarifs}">Les tarifs</a></li>
          <li><a href="${CHEMINS.droits}">Vos droits chez nous</a></li>
        </ul>
      </div>
    </section>
  </div>
  ${encartNouveauNom(fiche)}
  ${rendreDonneesStructurees(fiche)}
</div>`,
  }
}

function fermeturesAVenir(fiche: FicheGarage): Html | null {
  if (fiche.fermeturesAVenir.length === 0) return null
  return html`<h3 class="garage-sous-titre">Fermetures exceptionnelles</h3>
  <ul class="garage-fermetures-publiques">
    ${fiche.fermeturesAVenir.map(
      (fermeture) =>
        html`<li>${majusculeInitiale(periodeEnLettres(fermeture))} : ${LIBELLES_MOTIF[fermeture.motif].toLowerCase()}.</li>`,
    )}
  </ul>`
}

function paragraphe(publication: FicheGarage['stationnement'], titre: string): Html | null {
  const contenu = enLigne(publication, (texte) => texte)
  return contenu === null
    ? null
    : html`<div class="pile-serree"><h3 class="garage-sous-titre">${titre}</h3><p>${contenu}</p></div>`
}

function liste(publication: FicheGarage['reperes'], titre: string): Html | null {
  const contenu = publication.visible
    ? html`<ul class="garage-liste">${publication.valeur.map(
        (element) =>
          html`<li>${surligner(majusculeInitiale(element), publication.aSurligner)}</li>`,
      )}</ul>`
    : manque(publication.noteDeRelecture)
  return contenu === null
    ? null
    : html`<div class="pile-serree"><h3 class="garage-sous-titre">${titre}</h3>${contenu}</div>`
}
