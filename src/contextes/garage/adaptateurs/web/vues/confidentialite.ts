import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { InformationsLegales } from '../../../application/consulter-informations-legales.js'
import type { PrestataireEnvoi, RolePrestataire } from '../../../domaine/garage.js'
import { adresseSurUneLigne, entetePage } from './composants.js'
import { enLigne, manque, surligner } from './publication.js'
import { SOURCES } from './sources-juridiques.js'

/** Durée de conservation d'une demande (Kano D5 : purge à 12 mois). */
export const DUREE_CONSERVATION_MOIS = 12

const ROLES: Readonly<Record<RolePrestataire, string>> = {
  courriel: 'envoi des courriels',
  sms: 'envoi des SMS',
}

/**
 * Politique de confidentialité (RGPD art. 13, Kano B-12, US-14) : responsable,
 * données, finalités, durée, destinataires, hébergement, transferts et droits.
 * Zéro cookie de suivi sur les pages publiques (Kano D9).
 */
export function vueConfidentialite(legales: InformationsLegales): VuePage {
  const { nom, adresse, telephone } = legales
  const responsable = enLigne(
    legales.raisonSociale,
    (raison) => `${raison} (nom commercial ${nom})`,
  )
  const courriel = enLigne(
    legales.courriel,
    (valeur) => html`par courriel à <a href="${`mailto:${valeur}`}">${valeur}</a>, `,
  )
  return {
    titre: `Confidentialité, ${nom} à ${adresse.ville}`,
    description: `Ce que deviennent vos données sur le site de ${nom}, garage à ${adresse.ville} : aucun cookie de suivi, données des demandes conservées ${DUREE_CONSERVATION_MOIS} mois.`,
    chemin: CHEMINS.confidentialite,
    contenu: html`${entetePage({
      chemin: CHEMINS.confidentialite,
      titre: 'Confidentialité',
      surtitre: 'Informations légales',
      intro:
        'Ce site ne dépose aucun cookie de suivi, n’utilise aucun outil de mesure d’audience et ne charge aucune ressource d’un autre site. Il n’a donc pas de bandeau de consentement.',
    })}
<div class="conteneur section">
  <div class="panneau garage-document texte-courant garage-texte">
    <section class="pile-serree" aria-labelledby="titre-responsable">
      <h2 id="titre-responsable">Qui traite vos données</h2>
      <p>${responsable ?? nom}, ${adresseSurUneLigne(adresse)}, téléphone <a href="${telephone.lien}">${telephone.affichable}</a>.</p>
    </section>
    <section class="pile-serree" aria-labelledby="titre-donnees">
      <h2 id="titre-donnees">Ce que nous recueillons, et pourquoi</h2>
      <p>Quand vous envoyez une demande de rendez-vous, de devis ou de rappel, nous recueillons ce que vous saisissez : votre prénom, votre téléphone, le moment où vous pouvez répondre, votre véhicule (plaque, ou marque, modèle, année et énergie), le motif et vos précisions, et, si vous l’avez fait, les réponses de votre pré-diagnostic.</p>
      <p>Ces données servent uniquement à répondre à votre demande : vous rappeler, établir un devis, fixer un rendez-vous. Ce traitement repose sur les mesures précontractuelles prises à votre demande (article 6.1.b du RGPD).</p>
      <p>Votre numéro de téléphone sert uniquement à répondre à votre demande : aucune sollicitation commerciale n’aura lieu sans votre consentement préalable.</p>
      <p class="garage-source"><a href="${SOURCES.demarchageTelephonique}" rel="noopener">Le texte<span class="visuellement-masque"> : code de la consommation, article L223-2</span></a></p>
    </section>
    <section class="pile-serree" aria-labelledby="titre-duree">
      <h2 id="titre-duree">Combien de temps</h2>
      <p>Une demande est supprimée automatiquement ${DUREE_CONSERVATION_MOIS} mois après son envoi, ou ${DUREE_CONSERVATION_MOIS} mois après son dernier traitement par le garage si celui-ci est plus récent.</p>
    </section>
    <section class="pile-serree" aria-labelledby="titre-destinataires">
      <h2 id="titre-destinataires">Qui y a accès</h2>
      <p>Le garagiste de ${nom}, dans un espace protégé par une connexion. Vos données ne sont ni vendues ni cédées.</p>
      ${hebergement(legales)}
      ${prestataires(legales)}
      ${paragraphe(legales.encadrementTransferts, (valeur) => `Transferts hors de l’Union européenne : ${valeur}`)}
    </section>
    <section class="pile-serree" aria-labelledby="titre-cookies">
      <h2 id="titre-cookies">Cookies</h2>
      <p>Aucun cookie n’est déposé sur les pages publiques. Seul l’espace réservé au garagiste pose un cookie de session, strictement nécessaire à sa connexion.</p>
    </section>
    <section class="pile-serree" aria-labelledby="titre-droits">
      <h2 id="titre-droits">Vos droits</h2>
      <p>Vous pouvez accéder à vos données, les faire rectifier ou effacer, vous opposer à leur traitement, en demander la limitation ou la portabilité : ${courriel}par téléphone au <a href="${telephone.lien}">${telephone.affichable}</a>, ou par courrier au garage.</p>
      <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL.</p>
      <p class="garage-source"><a href="${SOURCES.reclamationCnil}" rel="noopener">Adresser une réclamation à la CNIL</a></p>
    </section>
  </div>
</div>`,
  }
}

function hebergement(legales: InformationsLegales): Html | null {
  const hebergeur = enLigne(legales.hebergeur, (valeur) => `${valeur.nom}, ${valeur.adresse}`)
  if (hebergeur === null) return null
  const region = enLigne(legales.region, (valeur) => valeur)
  return html`<p>Le site et ses données sont hébergés par ${hebergeur}${region !== null && html`, à ${region}`}.</p>`
}

function prestataires(legales: InformationsLegales): Html | null {
  const { prestatairesEnvoi } = legales
  if (!prestatairesEnvoi.visible) {
    const note = manque(prestatairesEnvoi.noteDeRelecture)
    return note === null ? null : html`<p>${note}</p>`
  }
  return html`<p>Les messages qui vous répondent ou préviennent le garage passent par :</p>
      <ul>${prestatairesEnvoi.valeur.map(
        (prestataire: PrestataireEnvoi) =>
          html`<li>${surligner(
            `${prestataire.nom} (${ROLES[prestataire.role]}), données traitées ${prestataire.lieuTraitement}`,
            prestatairesEnvoi.aSurligner,
          )}</li>`,
      )}</ul>`
}

function paragraphe(
  publication: InformationsLegales['encadrementTransferts'],
  rendu: (valeur: string) => string,
): Html | null {
  const contenu = enLigne(publication, rendu)
  return contenu === null ? null : html`<p>${contenu}</p>`
}
