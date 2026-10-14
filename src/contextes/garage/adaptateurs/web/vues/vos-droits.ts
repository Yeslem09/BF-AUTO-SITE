import {
  CHEMINS,
  CODES_ORGANES_EXCLUS,
  ORGANES_EXCLUS_DU_REEMPLOI,
} from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { FicheGarage } from '../../../application/consulter-garage.js'
import type { InformationsLegales } from '../../../application/consulter-informations-legales.js'
import type { Mediateur } from '../../../domaine/garage.js'
import { QUESTION_TRAVAUX_SANS_ACCORD, REPONSE_TRAVAUX_SANS_ACCORD } from './blocs-accueil.js'
import { entetePage, lienLeTexte } from './composants.js'
import { enLigne, surligner } from './publication.js'
import { SOURCES } from './sources-juridiques.js'

/**
 * « des trains roulants, de la direction, du freinage et des éléments de
 * liaison au sol... » : les organes exclus, lus dans le référentiel UNIQUE des
 * contrats, que le catalogue applique aussi (pièces neuves uniquement).
 */
export function organesExclusEnToutesLettres(): string {
  const complements = CODES_ORGANES_EXCLUS.map(
    (code) => ORGANES_EXCLUS_DU_REEMPLOI[code].complement,
  )
  const dernier = complements.at(-1) ?? ''
  return complements.length <= 1 ? dernier : `${complements.slice(0, -1).join(', ')} et ${dernier}`
}

/**
 * Catégories de pièces pour lesquelles le client peut choisir des pièces issues
 * de l'économie circulaire, et cas où le garage n'est pas tenu de les proposer
 * (code de la consommation, R224-22 à D224-25-5 ; relecture juridique au lot 6).
 */
const CATEGORIES_PIECES = [
  'les pièces de carrosserie amovibles ;',
  'les pièces de garnissage intérieur et de sellerie ;',
  'les vitrages non collés ;',
  'les pièces optiques ;',
  `les pièces mécaniques ou électroniques, sauf celles ${organesExclusEnToutesLettres()}.`,
] as const

const EXCEPTIONS_PIECES = [
  'l’intervention est gratuite, faite sous garantie contractuelle ou dans le cadre d’un rappel du constructeur ;',
  'ces pièces ne sont pas disponibles dans un délai compatible avec la durée d’immobilisation de votre véhicule ;',
  'le garage estime qu’elles présentent un risque important pour l’environnement, la santé publique ou la sécurité routière.',
] as const

/**
 * « Vos droits chez nous » (Kano AT-2, B-10, B-11) : chaque obligation écrite
 * comme la réponse à une question de client, sa source dans un lien secondaire
 * « Le texte », jamais dans la phrase de réponse.
 */
export function vueVosDroits(fiche: FicheGarage, legales: InformationsLegales): VuePage {
  const { nom, adresse } = fiche.identite
  return {
    titre: `Vos droits chez nous, ${nom} à ${adresse.ville}`,
    description: `Pièces issues de l’économie circulaire, garantie constructeur, prix, médiateur de la consommation : vos droits chez ${nom}, garage à ${adresse.ville}.`,
    chemin: CHEMINS.droits,
    rubrique: 'droits',
    contenu: html`${entetePage({
      chemin: CHEMINS.droits,
      titre: 'Vos droits chez nous',
      surtitre: 'Avant de confier votre voiture',
      intro:
        'Les réponses aux questions que l’on se pose avant de confier sa voiture à un garage qu’on ne connaît pas encore.',
    })}
<div class="conteneur section garage-droits">
  ${aPropos(fiche)}
  <div class="panneau garage-document texte-courant garage-texte">
    <section class="pile-serree" aria-labelledby="titre-pieces">
      <h2 id="titre-pieces">Puis-je choisir des pièces d’occasion ?</h2>
      <p>Oui : pour certaines pièces, vous pouvez choisir des pièces issues de l’économie circulaire à la place de pièces neuves. Ce sont des pièces de réemploi, prélevées sur des véhicules hors d’usage par un centre agréé, ou des pièces remises en état selon les spécifications du constructeur (échange standard).</p>
      <p>Les pièces concernées :</p>
      <ul>${CATEGORIES_PIECES.map((categorie) => html`<li>${categorie}</li>`)}</ul>
      <p>Le garage n’est pas tenu de vous les proposer quand :</p>
      <ul>${EXCEPTIONS_PIECES.map((exception) => html`<li>${exception}</li>`)}</ul>
      ${lienLeTexte(SOURCES.piecesEconomieCirculaire, 'code de la consommation, articles R224-22 à D224-25-5')}
    </section>
    ${
      fiche.engagementsDuSoclePublies &&
      html`<section class="pile-serree" aria-labelledby="titre-accord">
      <h2 id="titre-accord">${QUESTION_TRAVAUX_SANS_ACCORD}</h2>
      <p>${surligner(
        REPONSE_TRAVAUX_SANS_ACCORD,
        fiche.engagements.some((engagement) => engagement.aSurligner),
      )}</p>
    </section>`
    }
    <section class="pile-serree" aria-labelledby="titre-garantie">
      <h2 id="titre-garantie">Vais-je perdre la garantie de mon constructeur ?</h2>
      <p>Non, si l’entretien suit les préconisations du constructeur avec des pièces de qualité équivalente : votre garantie d’origine reste valable. Seules certaines extensions de garantie offertes par un réseau de marque peuvent exiger un entretien dans ce réseau : vérifiez votre contrat.</p>
      ${lienLeTexte(SOURCES.exemptionAutomobile, 'règlements (UE) n° 461/2010 et 2023/822, sur EUR-Lex')}
      <p class="garage-source"><a href="${SOURCES.garantieDgccrf}" rel="noopener">La fiche de la DGCCRF</a></p>
    </section>
    <section class="pile-serree" aria-labelledby="titre-prix">
      <h2 id="titre-prix">Les prix sont-ils affichés ?</h2>
      <p>Oui, c’est une obligation : le taux horaire et les forfaits doivent être affichés toutes taxes comprises à l’accueil du garage, et vous pouvez demander un devis écrit avant toute intervention. L’ordre de réparation que vous signez décrit les travaux demandés.</p>
      ${lienLeTexte(SOURCES.affichagePrix, 'arrêté du 27 mars 1987 relatif à la publicité des prix')}
      <p class="garage-source"><a href="${SOURCES.ordreReparation}" rel="noopener">La fiche de la DGCCRF sur l’ordre de réparation</a></p>
    </section>
    <section class="pile-serree" aria-labelledby="titre-mediateur">
      <h2 id="titre-mediateur">Que faire en cas de désaccord ?</h2>
      <p>Parlez-nous d’abord : la plupart des désaccords se règlent au comptoir. S’il persiste après une réclamation écrite auprès du garage, vous pouvez saisir gratuitement le médiateur de la consommation.</p>
      ${paragrapheMediateur(legales)}
      ${lienLeTexte(SOURCES.mediationL612, 'code de la consommation, articles L612-1 et R616-1')}
    </section>
    <p class="garage-document__pied"><a href="${CHEMINS.mentionsLegales}">Mentions légales</a> et <a href="${CHEMINS.confidentialite}">confidentialité</a>.</p>
  </div>
</div>`,
  }
}

/**
 * Panneau d'ouverture : ce que fait l'atelier, et comment il travaille (les
 * engagements publiés). Absent si rien de tout cela n'est publié.
 */
function aPropos(fiche: FicheGarage): Html | null {
  const activites = enLigne(fiche.activites, (texte) => `${texte}.`)
  const travail = engagements(fiche)
  if (activites === null && travail === null) return null
  return html`<aside class="panneau pile garage-droits__apropos" aria-labelledby="titre-apropos">
    <h2 id="titre-apropos" class="titre-carte">${fiche.identite.nom}, ${fiche.identite.adresse.voie}</h2>
    ${activites !== null && html`<p>${activites}</p>`}
    ${travail}
  </aside>`
}

function engagements(fiche: FicheGarage): Html | null {
  if (fiche.engagements.length === 0) return null
  return html`<section class="pile-serree" aria-labelledby="titre-engagements">
      <h3 id="titre-engagements" class="garage-sous-titre">Comment nous travaillons</h3>
      <ul class="garage-engagements">
        ${fiche.engagements.map((engagement) => html`<li>${surligner(engagement.texte, engagement.aSurligner)}</li>`)}
      </ul>
    </section>`
}

/** Coordonnées du médiateur et adresse de son site (R616-1), visibles et lisibles. */
function paragrapheMediateur(legales: InformationsLegales): Html | null {
  const coordonnees = enLigne(
    legales.mediateur,
    (mediateur: Mediateur) =>
      html`Le médiateur du garage : ${mediateur.nom}, ${mediateur.adresse}. Son site : <a href="${mediateur.site}" rel="noopener">${mediateur.site}</a>.`,
  )
  return coordonnees === null ? null : html`<p class="garage-mediateur">${coordonnees}</p>`
}
