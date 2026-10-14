import { CHEMINS } from '../contrats/index.js'
import { html, type Html } from './html.js'
import { lienItineraire } from './itineraire.js'
import { LOGO_AVEC_CHAT, LOGO_SANS_CHAT } from './logo.js'
import type { CadrePage } from './page.js'
import { rendreStatutOuverture } from './statut.js'

/**
 * Pied de page commun : adresse, téléphone, horaires du jour, informations
 * légales, chacun dans son bloc (une fiche imprimée peut garder le téléphone et
 * masquer le statut du jour).
 */
export function rendrePied(cadre: CadrePage): Html {
  const { identite, statut } = cadre
  const { adresse, telephone, courriel } = identite
  return html`<footer class="pied">
  <div class="conteneur">
    <div class="pied__grille">
      <div class="pied__marque">
        ${LOGO_AVEC_CHAT}${LOGO_SANS_CHAT}
        <p>Garage automobile à ${adresse.ville}.</p>
      </div>
      <section class="pied__bloc" aria-labelledby="pied-adresse">
        <h2 class="pied__titre" id="pied-adresse">Adresse</h2>
        <address class="pied__adresse">${adresse.voie}<br>${adresse.codePostal} ${adresse.ville}</address>
        <p><a href="${lienItineraire(adresse)}">Itinéraire</a></p>
      </section>
      <section class="pied__bloc" aria-labelledby="pied-telephone">
        <h2 class="pied__titre" id="pied-telephone">Téléphone</h2>
        <p><a class="pied__telephone" href="${telephone.lien}">${telephone.affichable}</a></p>
        ${courriel !== undefined && html`<p><a class="pied__courriel" href="${`mailto:${courriel}`}">${courriel}</a></p>`}
      </section>
      <section class="pied__bloc" aria-labelledby="pied-horaires">
        <h2 class="pied__titre" id="pied-horaires">Horaires</h2>
        ${rendreStatutOuverture(statut, telephone)}
        <p><a href="${CHEMINS.acces}">Accès et horaires détaillés</a></p>
      </section>
      <nav class="pied__bloc" aria-labelledby="pied-informations">
        <h2 class="pied__titre" id="pied-informations">Informations</h2>
        <ul class="pied__liens">
          <li><a href="${CHEMINS.droits}">Vos droits chez nous</a></li>
          <li><a href="${CHEMINS.mentionsLegales}">Mentions légales</a></li>
          <li><a href="${CHEMINS.confidentialite}">Confidentialité</a></li>
        </ul>
      </nav>
    </div>
    <div class="pied__bas">
      <p>© ${identite.nom}</p>
      <p>Ce site ne dépose aucun cookie de suivi.</p>
    </div>
  </div>
</footer>`
}
