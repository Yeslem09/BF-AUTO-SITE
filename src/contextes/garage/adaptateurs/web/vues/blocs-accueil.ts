import {
  CHEMINS,
  PARAMETRES_DEMANDE,
  type PreDiagnosticPublie,
  type TarifPublie,
  type TarifsDuSocle,
  type TypeDemande,
} from '../../../../../contrats/index.js'
import { html, type Html } from '../../../../../web/index.js'
import type { CleEngagement, FicheGarage } from '../../../application/consulter-garage.js'
import { listerMoyensPaiement } from '../../../domaine/textes.js'
import { rendreDonneesStructurees } from '../json-ld.js'
import {
  encartNouveauNom,
  liensItineraire,
  lienLeTexte,
  ligneStatut,
  statutDuGarage,
  tableauHoraires,
} from './composants.js'
import { enLigne, manque, surligner } from './publication.js'
import { SOURCES } from './sources-juridiques.js'

const RENDEZ_VOUS: TypeDemande = 'rendez-vous'
const DEMANDE_RENDEZ_VOUS = `${CHEMINS.demande}?${PARAMETRES_DEMANDE.type}=${RENDEZ_VOUS}`

/** Première étape de la méthode : la seule qui ne soit pas un engagement du socle. */
const ETAPE_EXPLIQUER = 'Ce que nous avons constaté sur votre voiture, avant de parler de prix'
/** Les deux engagements du socle, dits comme les deux dernières étapes de la méthode. */
const CLES_METHODE: readonly CleEngagement[] = ['devisEcrit', 'appelAvantSupplement']

/** Une étape de la méthode « on explique, on chiffre, vous décidez » (Kano D7). */
interface EtapeMethode {
  readonly verbe: string
  readonly texte: string
  readonly aSurligner: boolean
}

/**
 * La méthode de l'accroche, dite en trois étapes : elle ne se publie que si les
 * deux engagements du socle le sont, comme l'accroche elle-même (Kano D7). Les
 * deux dernières étapes SONT ces engagements, mot pour mot.
 */
function etapesMethode(fiche: FicheGarage): readonly EtapeMethode[] | null {
  if (!fiche.engagementsDuSoclePublies) return null
  const engagement = (cle: CleEngagement) =>
    fiche.engagements.find((candidat) => candidat.cle === cle)
  const devis = engagement('devisEcrit')
  const appel = engagement('appelAvantSupplement')
  if (devis === undefined || appel === undefined) return null
  return [
    { verbe: 'On explique', texte: ETAPE_EXPLIQUER, aSurligner: false },
    { verbe: 'On chiffre', texte: devis.texte, aSurligner: devis.aSurligner },
    { verbe: 'Vous décidez', texte: appel.texte, aSurligner: appel.aSurligner },
  ]
}

/**
 * « Comment nous travaillons » : la méthode en trois étapes numérotées quand le
 * socle est publié, puis les autres engagements publiés (pièces restituées) ;
 * sinon, la seule liste des engagements publiés. Rien d'inventé.
 */
function commentNousTravaillons(fiche: FicheGarage): Html | null {
  const etapes = etapesMethode(fiche)
  const autres =
    etapes === null
      ? fiche.engagements
      : fiche.engagements.filter((engagement) => !CLES_METHODE.includes(engagement.cle))
  if (etapes === null && autres.length === 0) return null
  return html`<div class="pile-serree">
    <h3 class="titre-carte">Comment nous travaillons</h3>
    ${
      etapes !== null &&
      html`<ol class="garage-methode">
      ${etapes.map(
        (etape) =>
          html`<li class="garage-methode__etape"><span class="garage-methode__verbe">${etape.verbe}</span> <span class="garage-methode__texte">${surligner(`${etape.texte}.`, etape.aSurligner)}</span></li>`,
      )}
    </ol>`
    }
    ${
      autres.length > 0 &&
      html`<ul class="garage-engagements">
      ${autres.map((engagement) => html`<li>${surligner(engagement.texte, engagement.aSurligner)}</li>`)}
    </ul>`
    }
  </div>`
}

/**
 * Exemples de prix TTC des prestations courantes (vidange, révision,
 * plaquettes), lus dans le catalogue, seule source des prix (AE-05), au
 * format unique du site ; chacun mène à sa famille. Aucun exemple publié :
 * pas de tableau, jamais un montant d'attente. En relecture, un prix encore
 * proposé est surligné.
 */
function exemplesDePrix(tarifs: TarifsDuSocle, relecture: boolean): Html | null {
  const { exemples } = tarifs
  if (exemples.length === 0) return null
  const proposes = !relecture && exemples.some((exemple) => exemple.aValider)
  return html`<table class="tableau-tarifs">
    <caption>Exemples de prix TTC</caption>
    <thead><tr><th scope="col">Prestation</th><th scope="col" class="tableau-tarifs__prix">Prix</th></tr></thead>
    <tbody>
      ${exemples.map(
        (exemple) =>
          html`<tr><th scope="row"><a href="${exemple.lien}">${exemple.intitule}</a><span class="tableau-tarifs__detail">${exemple.precision}</span></th><td class="tableau-tarifs__prix">${surligner(exemple.montant, exemple.aValider && relecture)}</td></tr>`,
      )}
    </tbody>
  </table>
  ${proposes && html`<p class="texte-note">${NOTE_PRIX_PROPOSES}</p>`}`
}

/**
 * Démonstration : des prix proposés, calés sur le marché, pas encore ceux du
 * garage ; la page le dit, comme les tarifs. Jamais en production, où le
 * catalogue n'offre aucune proposition.
 */
const NOTE_PRIX_PROPOSES =
  'Prix de démonstration calés sur le marché local, à confirmer par le garage.'

/**
 * Emplacement `information` (colonne centrale), sans cadre propre : la couche
 * web le pose dans un panneau et ajoute la Fig. 1 dessous. L'atelier, qui vous
 * accueille, la façade, la méthode et trois exemples de prix. Rien d'inventé :
 * chaque élément non publié est absent ; en relecture (`relecture`), un prix
 * encore proposé est surligné.
 */
export function blocInformation(
  fiche: FicheGarage,
  tarifs: TarifsDuSocle,
  relecture = false,
): Html {
  const { adresse } = fiche.identite
  const activites = enLigne(fiche.activites, (texte) => `${texte}.`)
  const accueil = enLigne(
    fiche.prenomGaragiste,
    (prenom) => `${prenom}, votre garagiste, vous accueille au ${adresse.voie}.`,
  )
  const { photoFacade } = fiche
  const photo = photoFacade.visible
    ? html`<figure class="garage-facade">
    <img src="${photoFacade.valeur.chemin}" alt="${photoFacade.valeur.texteAlternatif}" width="${photoFacade.valeur.largeur}" height="${photoFacade.valeur.hauteur}" decoding="async">
    <figcaption>${surligner(`La façade du garage, ${adresse.voie}.`, photoFacade.aSurligner)}</figcaption>
  </figure>`
    : manque(photoFacade.noteDeRelecture)
  return html`<section class="garage-information pile" aria-labelledby="titre-garage-information">
  <p class="surtitre">L’atelier</p>
  <h2 id="titre-garage-information">Entretien et réparation, au ${adresse.voie}</h2>
  ${(activites !== null || accueil !== null) && html`<p class="texte-intro">${activites}${activites !== null && accueil !== null && ' '}${accueil}</p>`}
  ${photo !== null && html`<div>${photo}</div>`}
  ${commentNousTravaillons(fiche)}
  ${exemplesDePrix(tarifs, relecture)}
  <p class="garage-lien-isole"><a href="${CHEMINS.tarifs}">Voir tous les tarifs</a></p>
</section>`
}

interface Question {
  readonly intitule: string
  readonly reponse: Html
}

/** Ce que « Vos questions » lit hors de la fiche du garage, auprès des autres contextes. */
export interface ContexteQuestions {
  readonly preDiagnosticPublie: PreDiagnosticPublie
  /** Prix du socle, lus dans le catalogue, seule source des prix (AE-05). */
  readonly tarifs: TarifsDuSocle
  /** Mode relecture : un prix encore proposé est surligné. */
  readonly relecture?: boolean
}

/**
 * Emplacement `questions` (Kano D2) : les questions d'un nouveau client, en
 * volets natifs qui se déplient sans JavaScript. Une question dont la réponse
 * repose sur une donnée non publiée n'apparaît pas : jamais de texte d'attente.
 */
export function blocQuestions(fiche: FicheGarage, contexte: ContexteQuestions): Html {
  const questions = [
    questionVoyant(fiche, contexte.preDiagnosticPublie),
    questionRendezVous(fiche, contexte.tarifs.premierControle),
    questionPremierControle(contexte.tarifs, contexte.relecture ?? false),
    questionTravauxSansAccord(fiche),
    questionGarantie(),
    questionPaiement(fiche),
  ].filter((question): question is Question => question !== null)
  return html`<section class="garage-questions pile" aria-labelledby="titre-garage-questions">
  <p class="surtitre">Vos questions</p>
  <h2 id="titre-garage-questions">Avant de nous confier votre voiture</h2>
  <div class="liste-volets">
    ${questions.map(
      (question, rang) => html`<details class="volet"${rang === 0 ? ' open' : ''}>
      <summary class="volet__titre">${question.intitule}</summary>
      <div class="volet__contenu">${question.reponse}</div>
    </details>`,
    )}
  </div>
  <p class="garage-lien-isole"><a href="${CHEMINS.droits}">Tous vos droits chez nous</a></p>
</section>`
}

/** Le pré-diagnostic n'est lié que s'il est publié ; sinon, l'appel au garage (Kano D3). */
function questionVoyant(fiche: FicheGarage, preDiagnosticPublie: PreDiagnosticPublie): Question {
  const { telephone } = fiche.identite
  const suite = preDiagnosticPublie
    ? html`<a href="${CHEMINS.preDiagnostic}">Faire le pré-diagnostic</a>`
    : html`Un doute\u00a0? Appelez-nous au <a href="${telephone.lien}">${telephone.affichable}</a>.`
  return {
    intitule: 'Mon voyant est allumé : puis-je rouler ?',
    reponse: html`<p>Un voyant rouge qui reste allumé moteur tournant, ou le voyant moteur qui clignote : arrêtez-vous dès que vous pouvez le faire en sécurité.</p>
      <p class="garage-lien-isole">${suite}</p>`,
  }
}

/**
 * Le premier contrôle est défini là où il est nommé : ce qu'il comprend et sa
 * durée, tels que le catalogue les publie ; le prix est dans la question qui
 * suit. Sans tarif publié, la phrase reste générale, jamais un chiffre d'attente.
 */
function questionRendezVous(
  fiche: FicheGarage,
  premierControle: TarifPublie | null,
): Question | null {
  const { accueilSansRendezVous } = fiche
  if (!accueilSansRendezVous.visible) return null
  const definition =
    premierControle === null ? '' : ` (${definitionPremierControle(premierControle)})`
  const texte = accueilSansRendezVous.valeur
    ? `Pas pour un premier contrôle${definition} : passez sans rendez-vous aux heures d’ouverture. Pour une intervention plus longue, demandez un rendez-vous et nous vous rappelons pour fixer l’heure.`
    : 'Oui : demandez un rendez-vous en ligne ou par téléphone, nous vous rappelons pour fixer l’heure.'
  return {
    intitule: 'Faut-il prendre rendez-vous ?',
    reponse: html`<p>${surligner(texte, accueilSansRendezVous.aSurligner)}</p>
      <p class="garage-lien-isole"><a href="${DEMANDE_RENDEZ_VOUS}">Demander un rendez-vous</a></p>`,
  }
}

/** « écoute du bruit..., 30 minutes environ » : ce que comprend le premier contrôle et sa durée. */
function definitionPremierControle(premierControle: TarifPublie): string {
  return premierControle.duree === null
    ? premierControle.comprend
    : `${premierControle.comprend}, ${premierControle.duree}`
}

/**
 * Les prix viennent du catalogue, déjà mis en mots (AE-05) : ils ne peuvent
 * pas diverger de la page des tarifs. Le premier contrôle y est entièrement
 * défini : ce qu'il comprend, sa durée, son prix ou sa gratuité, et s'il est
 * déduit de la réparation. Un prix proposé n'est publié qu'en démonstration
 * et en relecture (surligné).
 */
function questionPremierControle(tarifs: TarifsDuSocle, relecture: boolean): Question | null {
  const { premierControle, tauxHoraire } = tarifs
  if (premierControle === null) return null
  const prix = premierControle.gratuit
    ? 'Le premier contrôle est gratuit.'
    : `Le premier contrôle coûte ${dansUnePhrase(premierControle.montant)} (prix au ${premierControle.dateEffet}).`
  const deduction =
    premierControle.gratuit || premierControle.deduitDeLaReparation === null
      ? null
      : premierControle.deduitDeLaReparation
        ? 'Il est déduit du prix de la réparation si vous nous la confiez.'
        : 'Il n’est pas déduit du prix de la réparation.'
  const taux =
    tauxHoraire === null
      ? null
      : `Au-delà, la main-d’œuvre est facturée ${dansUnePhrase(tauxHoraire.montant)} de l’heure (prix au ${tauxHoraire.dateEffet}).`
  return {
    intitule: 'Combien coûte un premier contrôle ?',
    reponse: html`<p>${surligner(prix, premierControle.aValider && relecture)} Il comprend : ${definitionPremierControle(premierControle)}.${deduction !== null && html` ${deduction}`}</p>
      ${taux !== null && html`<p>${surligner(taux, tauxHoraire?.aValider === true && relecture)}</p>`}
      <p class="garage-lien-isole"><a href="${CHEMINS.tarifs}">Voir les tarifs</a></p>`,
  }
}

/** Question des engagements du garage, posée à l'accueil et sur « Vos droits chez nous » (J3). */
export const QUESTION_TRAVAUX_SANS_ACCORD = 'Faites-vous des travaux sans mon accord ?'
/** Sa réponse, tirée des engagements du socle (devis écrit, appel avant tout supplément). */
export const REPONSE_TRAVAUX_SANS_ACCORD =
  'Non : vous recevez un devis écrit avant les travaux, et nous vous appelons avant tout travail supplémentaire.'

/**
 * Un montant du catalogue au milieu d'une phrase (J6) : « coûte à partir de
 * 29 € TTC », jamais « coûte À partir de ». Le montant reste le même, seule
 * son initiale s'adapte à la phrase.
 */
export function dansUnePhrase(montant: string): string {
  return montant.charAt(0).toLocaleLowerCase('fr') + montant.slice(1)
}

function questionTravauxSansAccord(fiche: FicheGarage): Question | null {
  if (!fiche.engagementsDuSoclePublies) return null
  const aSurligner = fiche.engagements.some((engagement) => engagement.aSurligner)
  return {
    intitule: QUESTION_TRAVAUX_SANS_ACCORD,
    reponse: html`<p>${surligner(REPONSE_TRAVAUX_SANS_ACCORD, aSurligner)}</p>`,
  }
}

function questionGarantie(): Question {
  return {
    intitule: 'Vais-je perdre la garantie de mon constructeur si je fais l’entretien ici ?',
    reponse: html`<p>Non, si l’entretien suit les préconisations du constructeur avec des pièces de qualité équivalente : votre garantie d’origine reste valable. Seules certaines extensions de garantie offertes par un réseau de marque peuvent exiger un entretien dans ce réseau : vérifiez votre contrat.</p>
      ${lienLeTexte(SOURCES.exemptionAutomobile, 'règlements (UE) n° 461/2010 et 2023/822, sur EUR-Lex')}`,
  }
}

function questionPaiement(fiche: FicheGarage): Question | null {
  const { moyensPaiement } = fiche
  if (!moyensPaiement.visible) return null
  return {
    intitule: 'Comment puis-je payer ?',
    reponse: html`<p>${surligner(
      `Au garage, par ${listerMoyensPaiement(moyensPaiement.valeur)}.`,
      moyensPaiement.aSurligner,
    )}</p>`,
  }
}
/**
 * Emplacement `garage` (colonne droite) : adresse, statut, téléphone,
 * itinéraire, horaires des sept prochains jours (aujourd'hui en tête) et
 * données structurées. Aucun bouton « Appeler » : fermé, le geste utile est le
 * rappel, dont le formulaire suit juste dessous (AE-36), et la barre fixe du
 * téléphone porte l'action du moment.
 */
export function blocGarage(fiche: FicheGarage): Html {
  const { adresse, telephone } = fiche.identite
  return html`<section class="garage-coordonnees pile" aria-labelledby="titre-coordonnees">
  <p class="surtitre">Le garage</p>
  <h2 id="titre-coordonnees" class="titre-carte">${adresse.voie}, <span class="garage-insecable">${adresse.codePostal} ${adresse.ville}</span></h2>
  <div class="garage-coordonnees__statut">${statutDuGarage(fiche)}</div>
  <p class="garage-coordonnees__telephone"><a href="${telephone.lien}">${telephone.affichable}</a></p>
  ${liensItineraire(adresse)}
  <h3 class="garage-coordonnees__intertitre">Horaires</h3>
  ${
    fiche.horaires === null
      ? html`<p>Horaires à confirmer : <a href="${telephone.lien}">appelez-nous</a>.</p>`
      : tableauHoraires(fiche.horaires)
  }
  <p class="garage-lien-isole"><a href="${CHEMINS.acces}">Accès et horaires détaillés</a></p>
  ${rendreDonneesStructurees(fiche)}
</section>`
}

/** Emplacement `statut` : en tête de la bande d'ouverture, premier bloc sur téléphone. */
export function blocStatut(fiche: FicheGarage): Html {
  return ligneStatut(fiche)
}

/** Emplacement `encart` : « Nouveau nom », sous les colonnes ; absent sans ancien nom publié. */
export function blocEncart(fiche: FicheGarage): Html | null {
  return encartNouveauNom(fiche)
}
