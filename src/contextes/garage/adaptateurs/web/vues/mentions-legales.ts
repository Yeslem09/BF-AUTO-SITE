import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { InformationsLegales } from '../../../application/consulter-informations-legales.js'
import type { Hebergeur, Mediateur } from '../../../domaine/garage.js'
import type { Publication } from '../../../domaine/valeur-publiee.js'
import { adresseSurUneLigne, entetePage } from './composants.js'
import { enLigne } from './publication.js'
import { SOURCES } from './sources-juridiques.js'

const LONGUEUR_SIREN = 9
const GROUPES_SIRET = /^(\d{3})(\d{3})(\d{3})(\d{5})$/

/** « 953 343 738 00019 » : SIREN par groupes de trois, puis le numéro d'établissement. */
function siretLisible(siret: string): string {
  return siret.replace(GROUPES_SIRET, '$1 $2 $3 $4')
}

interface Ligne {
  readonly terme: string
  readonly definition: Html | null
}

/** Une ligne n'apparaît que si sa valeur est publiée (ou, en relecture, pour signaler son manque). */
function lignes(liste: readonly Ligne[]): Html {
  return html`<dl class="liste-definitions">
    ${liste
      .filter((ligne): ligne is { terme: string; definition: Html } => ligne.definition !== null)
      .map((ligne) => html`<dt>${ligne.terme}</dt><dd>${ligne.definition}</dd>`)}
  </dl>`
}

const texte = (publication: Publication<string>): Html | null =>
  enLigne(publication, (valeur) => valeur)

/**
 * Mentions légales (LCEN art. 1-1 et 19). En production, chaque valeur est
 * validée : la porte de démarrage l'exige. Aucune n'est remplacée par un texte d'attente.
 */
export function vueMentionsLegales(legales: InformationsLegales): VuePage {
  const { adresse, telephone, nom } = legales
  const siret = legales.siret
  return {
    titre: `Mentions légales de ${nom}, garage à ${adresse.ville}`,
    description: `Éditeur, hébergeur et médiateur du site de ${nom}, garage automobile à ${adresse.ville}.`,
    chemin: CHEMINS.mentionsLegales,
    contenu: html`${entetePage({
      chemin: CHEMINS.mentionsLegales,
      titre: 'Mentions légales',
      surtitre: 'Informations légales',
      intro: `Qui édite ce site, qui l’héberge, et à qui vous adresser en cas de désaccord.`,
    })}
<div class="conteneur section">
  <div class="panneau garage-document texte-courant garage-texte">
    <section class="pile-serree" aria-labelledby="titre-editeur">
      <h2 id="titre-editeur">Éditeur du site</h2>
      ${lignes([
        { terme: 'Nom commercial', definition: html`${nom}` },
        { terme: 'Activité', definition: enLigne(legales.activites, (activites) => activites) },
        {
          terme: 'Site',
          definition: enLigne(legales.nomDeDomaine, (domaine) => `https://${domaine}`),
        },
        { terme: 'Dénomination sociale', definition: texte(legales.raisonSociale) },
        { terme: 'Forme juridique', definition: texte(legales.formeJuridique) },
        { terme: 'Capital social', definition: texte(legales.capital) },
        { terme: 'Siège social', definition: texte(legales.siege) },
        { terme: 'Immatriculation', definition: texte(legales.registre) },
        {
          terme: 'SIRET',
          definition: enLigne(
            siret,
            (valeur) =>
              html`${siretLisible(valeur)} (<a href="${SOURCES.registreEntreprises + valeur.slice(0, LONGUEUR_SIREN)}" rel="noopener">fiche publique de l’entreprise</a>)`,
          ),
        },
        { terme: 'TVA intracommunautaire', definition: texte(legales.tva) },
        { terme: 'Directeur de la publication', definition: texte(legales.directeurPublication) },
        { terme: 'Adresse', definition: html`${adresseSurUneLigne(adresse)}` },
        {
          terme: 'Téléphone',
          definition: html`<span class="garage-lien-isole"><a href="${telephone.lien}">${telephone.affichable}</a></span>`,
        },
        {
          terme: 'Courriel',
          definition: enLigne(
            legales.courriel,
            (courriel) =>
              html`<span class="garage-lien-isole"><a href="${`mailto:${courriel}`}">${courriel}</a></span>`,
          ),
        },
      ])}
    </section>
    <section class="pile-serree" aria-labelledby="titre-hebergement">
      <h2 id="titre-hebergement">Hébergement</h2>
      ${lignes([
        { terme: 'Hébergeur', definition: enLigne(legales.hebergeur, decrireHebergeur) },
        { terme: 'Lieu d’hébergement', definition: texte(legales.region) },
      ])}
    </section>
    <section class="pile-serree" aria-labelledby="titre-mediation">
      <h2 id="titre-mediation">Médiation de la consommation</h2>
      ${lignes([{ terme: 'Médiateur', definition: enLigne(legales.mediateur, decrireMediateur) }])}
      <p>En cas de désaccord persistant après une réclamation écrite auprès du garage, vous pouvez saisir gratuitement le médiateur de la consommation. <a href="${CHEMINS.droits}">Vos droits chez nous</a>.</p>
    </section>
    <section class="pile-serree" aria-labelledby="titre-donnees">
      <h2 id="titre-donnees">Données personnelles</h2>
      <p>Ce site ne dépose aucun cookie de suivi. Ce que deviennent les données d’une demande est décrit dans la page <a href="${CHEMINS.confidentialite}">Confidentialité</a>.</p>
    </section>
  </div>
</div>`,
  }
}

function decrireHebergeur(hebergeur: Hebergeur): Html {
  return html`${hebergeur.nom}, ${hebergeur.adresse}, ${hebergeur.telephone}`
}

function decrireMediateur(mediateur: Mediateur): Html {
  return html`${mediateur.nom}, ${mediateur.adresse}, <a href="${mediateur.site}" rel="noopener">${mediateur.site}</a>`
}
