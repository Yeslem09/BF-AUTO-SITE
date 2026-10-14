import {
  CHEMINS,
  TYPES_DEMANDE,
  type DemiJourneeProposee,
  type ResumePreDiagnostic,
  type TypeDemande,
} from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { FormulaireDemande } from '../../../application/preparer-formulaire.js'
import { champsObligatoires, type ChampDemande } from '../../../domaine/champs.js'
import { detailDuSujet, type ContenuDemande } from '../../../domaine/demande.js'
import {
  estPrestation,
  occasionPossible,
  piecesProposees,
  prixIndicatifDe,
  sansPiece,
} from '../../../domaine/famille.js'
import {
  CODE_ANNEE_ANCIENNE,
  CRENEAUX_MAXIMUM,
  CRENEAUX_TOUJOURS_PROPOSES,
  ENERGIES,
  LIBELLE_ANNEE_ANCIENNE,
  LIBELLE_MODALITE,
  MODALITES_PIECE,
  MARQUES,
  MOMENTS_RAPPEL,
  MOTIFS_RAPPEL,
  OBJETS_DEMANDE,
  PIECE_INCONNUE,
  enLettres,
  libelleDe,
  type Choix,
} from '../../../domaine/referentiels.js'
import { decrireVehicule } from '../../../domaine/vehicule.js'
import { conclusionSansVerdict, lignesDuResume } from '../../../domaine/resume-sans-redite.js'
import {
  LONGUEUR_MAX_PRECISIONS,
  LONGUEUR_MAX_PRENOM,
  gammesProposees,
  type ErreursSaisie,
  type SaisieDemande,
} from '../../../domaine/validation.js'
import { EXEMPLE_PLAQUE_FNI, EXEMPLE_PLAQUE_SIV } from '../../../domaine/plaque.js'
import { LONGUEUR_MAX_MODELE, anneesProposees } from '../../../domaine/vehicule.js'
import { CHAMPS_HTML } from '../adresses.js'
import {
  champListe,
  champTexte,
  champZoneTexte,
  groupeChoix,
  idAide,
  idErreur,
  idPremiereCase,
  mentionFacultatif,
  type Exigence,
} from './champs.js'
import {
  AIDE_TELEPHONE,
  PHRASE_SECURITE,
  alerteUrgence,
  appelerLeGarage,
  champPiege,
  mentionDonnees,
  type GarageAffiche,
} from './communs.js'
import { enTetePage } from './entete-page.js'
import { insecables } from './typographie.js'

/** Préfixe des identifiants du formulaire complet (l'accueil a le sien). */
const PREFIXE = 'demande'
const id = (champ: string) => `${PREFIXE}-${champ}`

/** Le formulaire, cible des boutons de type posés dans l'en-tête de page. */
const ID_FORMULAIRE = id('formulaire')

const STATUT_SAISIE_INVALIDE = 422
const LONGUEUR_MAX_PLAQUE = 12

export type EtapeFormulaire = 'saisie' | 'confirmation'

export interface PageFormulaire {
  readonly formulaire: FormulaireDemande
  readonly valeurs: SaisieDemande
  readonly erreurs: ErreursSaisie
  readonly etape: EtapeFormulaire
  /**
   * Écran « Confirmez l'envoi » d'un formulaire qui a déjà servi à une autre
   * demande (retour arrière) : la page dit pourquoi on lui demande de confirmer.
   */
  readonly formulaireDejaEnvoye: boolean
  readonly garage: GarageAffiche
  /** Écran « Confirmez l'envoi » : la demande validée, résumée en deux lignes au-dessus du bouton. */
  readonly contenuAConfirmer?: ContenuDemande | null
  /** Vrai quand le client vient de changer de type : le focus revient sur le type choisi. */
  readonly typeChange?: boolean
}

/**
 * Première saisie affichée : vide, sauf la pièce et le retrait ou la pose que
 * l'adresse demande de pré-cocher (lien d'un tarif ou d'une famille, J2).
 */
export function saisieInitiale(formulaire: FormulaireDemande): SaisieDemande {
  return {
    ...saisieVide(formulaire.type),
    pieces: formulaire.piecesPreselectionnees,
    modalite: formulaire.modalitePreselectionnee ?? '',
  }
}

export function saisieVide(type: TypeDemande): SaisieDemande {
  return {
    type,
    objet: '',
    motif: '',
    creneaux: [],
    pieces: [],
    plaque: '',
    marque: '',
    modele: '',
    annee: '',
    energie: '',
    gamme: '',
    modalite: '',
    precisions: '',
    prenom: '',
    telephone: '',
    moment: '',
  }
}

interface TexteType {
  readonly onglet: string
  /** Titre de l'onglet du navigateur : chaque type a le sien (lecteur d'écran, historique). */
  readonly titre: string
  readonly intro: string
  readonly bouton: string
}

const TYPES: Readonly<Record<TypeDemande, TexteType>> = {
  'rendez-vous': {
    onglet: 'Rendez-vous',
    titre: 'Faire une demande de rendez-vous',
    intro:
      'Ce n’est pas une réservation : proposez de une à trois possibilités, nous vous appelons pour fixer l’heure.',
    bouton: 'Demander un rendez-vous',
  },
  devis: {
    onglet: 'Devis',
    titre: 'Faire une demande de devis',
    intro:
      'Indiquez votre besoin et votre véhicule : le garage vous rappelle pour établir le devis.',
    bouton: 'Demander un prix',
  },
  rappel: {
    // Un nom, comme les deux autres : le verbe « Être rappelé » reste au bouton d'envoi.
    onglet: 'Rappel',
    titre: 'Faire une demande de rappel',
    intro: 'Laissez votre numéro et le moment où vous pouvez répondre : le garage vous rappelle.',
    bouton: 'Être rappelé',
  },
}

/** Ancre de chaque champ, pour les liens du récapitulatif d'erreurs. */
const ANCRES: Readonly<Record<ChampDemande, string>> = {
  type: id('types'),
  objet: id('objet'),
  motif: idPremiereCase(id('motif')),
  creneaux: idPremiereCase(id('creneaux')),
  pieces: idPremiereCase(id('pieces')),
  gamme: idPremiereCase(id('gamme')),
  modalite: idPremiereCase(id('modalite')),
  precisions: id('precisions'),
  vehicule: id('plaque'),
  plaque: id('plaque'),
  marque: id('marque'),
  modele: id('modele'),
  annee: id('annee'),
  energie: id('energie'),
  prenom: id('prenom'),
  telephone: id('telephone'),
  moment: idPremiereCase(id('moment')),
}

/** Ordre des champs dans le formulaire : celui du récapitulatif d'erreurs. */
const ORDRE_CHAMPS = Object.keys(ANCRES) as ChampDemande[]

/** Rappel après pré-diagnostic : le résumé est déjà là, seules les coordonnées restent à remplir. */
function apresPreDiagnostic(formulaire: FormulaireDemande): ResumePreDiagnostic | null {
  return formulaire.type === 'rappel' ? (formulaire.preDiagnostic?.resume ?? null) : null
}

/** Formulaire unique `/demande` : saisie, réaffichage avec erreurs, écran « Confirmez l'envoi ». */
export function vueFormulaireDemande(page: PageFormulaire): VuePage {
  const { formulaire, erreurs, etape } = page
  const enErreur = Object.keys(erreurs).length > 0
  const titre = etape === 'confirmation' ? 'Confirmez l’envoi' : TYPES[formulaire.type].titre
  return {
    titre: enErreur ? `Erreur : ${titre}` : titre,
    description:
      'Rendez-vous, devis ou rappel : laissez votre demande en ligne, sans compte ni paiement. Le garage vous rappelle.',
    chemin: CHEMINS.demande,
    ...(formulaire.type === 'rendez-vous' ? { rubrique: 'rendez-vous' as const } : {}),
    indexable: etape === 'saisie' && !enErreur,
    ...(enErreur ? { statutHttp: STATUT_SAISIE_INVALIDE } : {}),
    // Rien ne détourne de l'envoi (J1) : ni saisie, ni erreurs, ni « Confirmez
    // l'envoi » n'ont de barre fixe basse ; l'appel de l'en-tête reste.
    barreFixe: 'masquee',
    contenu: etape === 'confirmation' ? pageConfirmation(page) : pageSaisie(page),
  }
}

function pageSaisie(page: PageFormulaire): Html {
  const { formulaire, erreurs } = page
  const resume = apresPreDiagnostic(formulaire)
  return html`${enteteSaisie(formulaire, page.typeChange === true)}
<div class="conteneur section demandes-page demandes-page--avec-aparte">
  <div class="demandes-colonne pile">
    ${ceQueNousNeFaisonsPas(formulaire.ceQueNousNeFaisonsPas)}
    ${Object.keys(erreurs).length > 0 && recapitulatifErreurs(erreurs)}
    ${resume !== null && html`<div class="demandes-conduite">${alerteUrgence(resume.urgence, false)}</div>`}
    ${formulaireDemande(page)}
    ${mentionDonnees(page.garage, PREFIXE)}
  </div>
  ${aparteEnsuite(page.garage)}
</div>`
}

/**
 * Types de demande : trois boutons qui envoient le formulaire au serveur, qui
 * le renvoie au type choisi avec la saisie déjà faite (J2), avec ou sans
 * script. Un bouton d'envoi invisible les précède : la touche Entrée dans un
 * champ envoie la demande, jamais un changement de type.
 */
function enteteSaisie(formulaire: FormulaireDemande, typeChange: boolean): Html {
  const types = TYPES_DEMANDE.map((type) => {
    const courant = type === formulaire.type
    return html`<li><button class="bouton-choix demandes-types__lien" type="submit" form="${ID_FORMULAIRE}" name="${CHAMPS_HTML.changerType}" value="${type}" aria-pressed="${courant ? 'true' : 'false'}"${courant && typeChange && html` autofocus`}>${TYPES[type].onglet}</button></li>`
  })
  // Après un pré-diagnostic, le formulaire dit lui-même ses trois champs : le
  // chapeau, redondant, laisserait les coordonnées plus bas (J1).
  const intro =
    apresPreDiagnostic(formulaire) === null ? { intro: TYPES[formulaire.type].intro } : {}
  return enTetePage({
    fil: [{ libelle: 'Faire une demande', chemin: CHEMINS.demande }],
    surtitre: 'Sans compte ni paiement',
    titre: 'Faire une demande',
    ...intro,
    suite: html`<div class="demandes-types" id="${ANCRES.type}" role="group" aria-label="Type de demande">
  <button class="visuellement-masque" type="submit" form="${ID_FORMULAIRE}" tabindex="-1" aria-hidden="true">${TYPES[formulaire.type].bouton}</button>
  <ul class="liste-choix demandes-types__liste">
    ${types}
  </ul>
</div>`,
  })
}

/**
 * « Ce que nous ne faisons pas », lu dans le catalogue, dit avant que le client
 * ne remplisse : il ne perd pas un rappel pour s'entendre dire non (US-44).
 */
function ceQueNousNeFaisonsPas(exclusions: readonly string[]): Html | null {
  if (exclusions.length === 0) return null
  return html`<section class="panneau demandes-exclusions" aria-labelledby="${id('exclusions-titre')}">
  <h2 class="titre-carte" id="${id('exclusions-titre')}">Ce que nous ne faisons pas</h2>
  <ul class="demandes-exclusions__liste">
    ${exclusions.map((exclusion) => html`<li>${insecables(exclusion)}</li>`)}
  </ul>
</section>`
}

/**
 * Récapitulatif d'erreurs : un groupe nommé par son titre, qui reçoit le focus
 * au chargement (sans script) ; chaque ligne mène à son champ.
 */
function recapitulatifErreurs(erreurs: ErreursSaisie): Html {
  const liste = ORDRE_CHAMPS.flatMap((champ) => {
    const message = erreurs[champ]
    return message === undefined
      ? []
      : [html`<li><a href="#${ANCRES[champ]}">${insecables(message)}</a></li>`]
  })
  const nombre = liste.length
  return html`<div class="message message--erreur demandes-erreurs" id="${id('erreurs')}" role="group" tabindex="-1" autofocus aria-labelledby="${id('erreurs-titre')}">
  <h2 class="demandes-erreurs__titre" id="${id('erreurs-titre')}">${nombre === 1 ? 'Le formulaire contient une erreur' : `Le formulaire contient ${nombre} erreurs`}</h2>
  <ul class="demandes-erreurs__liste">
    ${liste}
  </ul>
</div>`
}

function exigences(formulaire: FormulaireDemande): (champ: ChampDemande) => Exigence {
  const obligatoires = new Set<ChampDemande>(
    champsObligatoires(formulaire.type, {
      familleCitee: formulaire.famille !== null,
      preDiagnostic: formulaire.preDiagnostic !== null,
    }),
  )
  return (champ) => (obligatoires.has(champ) ? 'obligatoire' : 'facultatif')
}

/**
 * Champs cachés : type, jeton, piège, et les références retrouvées par le
 * serveur (famille, pré-diagnostic), gardées d'un type de demande à l'autre.
 */
function champsCaches(formulaire: FormulaireDemande): Html {
  const { famille, prediagnostic, prestation } = formulaire.rattachements
  return html`<input type="hidden" name="${CHAMPS_HTML.type}" value="${formulaire.type}">
  <input type="hidden" name="${CHAMPS_HTML.jeton}" value="${formulaire.jeton}">
  ${famille !== null && html`<input type="hidden" name="${CHAMPS_HTML.famille}" value="${famille}">`}
  ${prestation !== null && html`<input type="hidden" name="${CHAMPS_HTML.prestation}" value="${prestation}">`}
  ${prediagnostic !== null && html`<input type="hidden" name="${CHAMPS_HTML.prediagnostic}" value="${prediagnostic}">`}
  ${champPiege(PREFIXE)}`
}

function formulaireDemande(page: PageFormulaire): Html {
  const { formulaire } = page
  const resume = apresPreDiagnostic(formulaire)
  return html`<form class="demandes-formulaire panneau" id="${ID_FORMULAIRE}" method="post" action="${CHEMINS.demande}" novalidate data-envoi-unique>
  <p class="champ__aide">${insecables(resume === null ? 'Tous les champs sont obligatoires, sauf ceux marqués « facultatif ».' : 'Trois champs à remplir : votre prénom, votre téléphone et le moment où vous pouvez répondre.')}</p>
  ${champsCaches(formulaire)}
  ${resume === null ? blocsDeLaDemande(page) : blocsApresPreDiagnostic(page, resume)}
  <div class="demandes-envoi">
    <button class="bouton bouton--principal demandes-envoi__bouton" type="submit">${TYPES[formulaire.type].bouton}</button>
  </div>
  ${resume?.urgence === 'ne-pas-rouler' && html`<p class="demandes-securite">${insecables(PHRASE_SECURITE)}</p>`}
</form>`
}

/** Le besoin d'abord, le véhicule, puis les coordonnées (B-07). */
function blocsDeLaDemande(page: PageFormulaire): Html {
  const { formulaire } = page
  const exigence = exigences(formulaire)
  // Carrosserie, peinture : le client décrit le dégât (une révision garde le volet des précisions).
  const degat = formulaire.type === 'devis' && estPrestation(formulaire.famille)
  return html`<fieldset class="demandes-bloc">
    <legend class="demandes-bloc__titre">${TITRES_BESOIN[formulaire.type]}</legend>
    ${blocBesoin(page, exigence)}
    ${degat ? champDegat(page) : voletPrecisions(page)}
  </fieldset>
  ${blocVehicule(page, exigence('vehicule') === 'obligatoire')}
  ${blocCoordonnees(page)}`
}

/**
 * Le facultatif replié sous « Ajouter des précisions » (J6, passe 2 du
 * jury) : le formulaire tient en moins d'écrans ; ouvert dès qu'il porte une
 * saisie ou une erreur, pour ne rien cacher de ce qui a été écrit.
 */
function voletPrecisions(page: PageFormulaire): Html {
  const { valeurs, erreurs, formulaire } = page
  const gamme =
    formulaire.type === 'devis' && !sansPiece(formulaire.famille, formulaire.prestation)
      ? choixGamme(page)
      : null
  const rempli =
    valeurs.precisions.trim() !== '' ||
    (formulaire.type === 'devis' && valeurs.gamme !== '') ||
    erreurs.precisions !== undefined ||
    erreurs.gamme !== undefined
  return html`<details class="volet demandes-volet demandes-facultatif"${rempli && html` open`}>
    <summary class="volet__titre"><span>Ajouter des précisions <span class="champ__facultatif">(facultatif)</span></span></summary>
    <div class="volet__contenu pile">
      ${gamme}
      ${champPrecisions(page)}
    </div>
  </details>`
}

/**
 * Prestation (carrosserie, peinture, diagnostic : J3, passe 2 du jury) : ni
 * pièce à commander ni retrait, le client décrit le dégât, et une photo
 * envoyée par SMS au garage aide à chiffrer.
 */
function champDegat(page: PageFormulaire): Html {
  const { telephone } = page.garage.identite
  const sms = telephone.lien.replace(/^tel:/, 'sms:')
  return html`${champZoneTexte({
    id: id('precisions'),
    nom: CHAMPS_HTML.precisions,
    libelle: 'Décrivez le dégât ou le besoin',
    exigence: 'facultatif',
    aide: 'Par exemple : portière avant droite rayée, pare-chocs enfoncé.',
    erreur: page.erreurs.precisions,
    valeur: page.valeurs.precisions,
    longueurMax: LONGUEUR_MAX_PRECISIONS,
  })}
  <p class="demandes-photo">${insecables('Une photo aide le garage à chiffrer : envoyez-la par SMS au')} <a class="demandes-telephone" href="${sms}">${telephone.affichable}</a>${insecables(', avec votre prénom.')}</p>`
}

/**
 * Rappel après pré-diagnostic (J1, passe 1 du jury) : les trois champs
 * obligatoires d'abord, le résumé ensuite, replié et sans redite (la conduite
 * à tenir est au-dessus du formulaire, sur une ligne), puis le facultatif.
 */
function blocsApresPreDiagnostic(page: PageFormulaire, resume: ResumePreDiagnostic): Html {
  return html`${blocCoordonnees(page)}
  ${voletPreDiagnostic(resume)}
  <fieldset class="demandes-bloc">
    <legend class="demandes-bloc__titre">Pour le garage</legend>
    ${champPrecisions(page)}
    ${champMarque(page, 'Marque de votre voiture', 'facultatif')}
  </fieldset>`
}

/** Le résumé transmis, en lecture seule, replié : le client le relit s'il le veut. */
function voletPreDiagnostic(resume: ResumePreDiagnostic): Html {
  const conclusion = conclusionSansVerdict(resume)
  return html`<details class="volet demandes-volet">
    <summary class="volet__titre">Votre pré-diagnostic, transmis au garage</summary>
    <div class="volet__contenu demandes-resume">
      <p class="champ__aide">${insecables('Transmis tel quel avec votre demande : vous n’aurez pas à tout réexpliquer.')}</p>
      <dl class="liste-definitions demandes-resume__reponses">
        ${lignesDuResume(resume).map((ligne) => html`<dt>${insecables(ligne.question)}</dt><dd>${insecables(ligne.reponse)}</dd>`)}
      </dl>
      ${conclusion !== null && html`<p>${insecables(conclusion)}</p>`}
    </div>
  </details>`
}

function champPrecisions(page: PageFormulaire): Html {
  return champZoneTexte({
    id: id('precisions'),
    nom: CHAMPS_HTML.precisions,
    libelle: 'Précisions',
    exigence: 'facultatif',
    aide: 'Ce que vous avez remarqué, ou ce que le garage doit savoir avant de vous rappeler.',
    erreur: page.erreurs.precisions,
    valeur: page.valeurs.precisions,
    longueurMax: LONGUEUR_MAX_PRECISIONS,
  })
}

function champMarque(page: PageFormulaire, libelle: string, exigence: Exigence): Html {
  return champListe({
    id: id('marque'),
    nom: CHAMPS_HTML.marque,
    libelle,
    exigence,
    erreur: page.erreurs.marque,
    valeur: page.valeurs.marque,
    options: MARQUES,
    invite: 'Choisissez une marque',
  })
}

/** Titre du premier bloc du formulaire : ce que le client demande. */
const TITRES_BESOIN: Readonly<Record<TypeDemande, string>> = {
  'rendez-vous': 'Votre rendez-vous',
  devis: 'Votre devis',
  rappel: 'Votre demande',
}

function blocBesoin(page: PageFormulaire, exigence: (champ: ChampDemande) => Exigence): Html {
  const { formulaire, valeurs, erreurs } = page
  if (formulaire.type === 'rappel') {
    return groupeChoix({
      id: id('motif'),
      nom: CHAMPS_HTML.motif,
      legende: 'Pourquoi souhaitez-vous être rappelé ?',
      exigence: exigence('motif'),
      type: 'radio',
      options: MOTIFS_RAPPEL,
      cochees: valeurs.motif === '' ? [] : [valeurs.motif],
      erreur: erreurs.motif,
    })
  }
  const prix = prixIndicatifDe(formulaire.famille, formulaire.prestation)
  const sujet =
    formulaire.famille !== null
      ? html`<p class="demandes-famille"><span class="demandes-famille__libelle">Intervention</span> <strong>${insecables(formulaire.prestation ?? formulaire.famille.libelle)}</strong>${prix !== null && html` <span class="demandes-famille__prix">${insecables(prix)}</span>`}</p>`
      : champListe({
          id: id('objet'),
          nom: CHAMPS_HTML.objet,
          libelle: 'Pour quelle intervention ?',
          exigence: exigence('objet'),
          erreur: erreurs.objet,
          valeur: valeurs.objet,
          options: OBJETS_DEMANDE,
          invite: 'Choisissez une intervention',
        })
  if (formulaire.type === 'devis') {
    // Une prestation (carrosserie, révision, géométrie) n'a ni pièce à
    // commander, ni gamme, ni retrait au comptoir (J3).
    if (sansPiece(formulaire.famille, formulaire.prestation)) return sujet
    const { engagementVerification } = formulaire.offrePieces
    return html`${sujet}
${choixPieces(page)}
${formulaire.offrePieces.venteAuComptoir && choixModalite(page)}
${engagementVerification !== null && html`<p class="demandes-engagement">${insecables(engagementVerification)}</p>`}`
  }
  return html`${sujet}
${choixCreneaux(page, exigence('creneaux'))}`
}

/**
 * Type de pièce, facultatif : jamais « d'occasion ou reconditionnée » pour une
 * famille exclue du réemploi, comme le freinage (J2, passe 2 du jury).
 */
function choixGamme(page: PageFormulaire): Html {
  const { formulaire, valeurs, erreurs } = page
  return groupeChoix({
    id: id('gamme'),
    nom: CHAMPS_HTML.gamme,
    legende: 'Type de pièce souhaitée',
    exigence: 'facultatif',
    type: 'radio',
    options: gammesProposees(occasionPossible(formulaire.famille)),
    cochees: valeurs.gamme === '' ? [] : [valeurs.gamme],
    erreur: erreurs.gamme,
  })
}

/**
 * Pièces de la famille (J6, passe 1 du jury) : des cases, noms du catalogue,
 * et « Je ne sais pas » ; facultatives. Absentes si le catalogue n'en publie pas.
 */
function choixPieces(page: PageFormulaire): Html | null {
  const pieces = piecesProposees(page.formulaire.famille)
  if (pieces.length === 0) return null
  return groupeChoix({
    id: id('pieces'),
    nom: CHAMPS_HTML.pieces,
    legende: 'Quelles pièces ?',
    exigence: 'facultatif',
    type: 'checkbox',
    options: [...pieces.map((piece) => ({ code: piece, libelle: piece })), PIECE_INCONNUE],
    cochees: page.valeurs.pieces,
    aide: 'Cochez celles qui vous concernent. Dans le doute, « Je ne sais pas » : le garage vérifie.',
    erreur: page.erreurs.pieces,
  })
}

/** Une journée proposée : son nom et ses deux demi-journées, chacune à sa colonne. */
interface JourPropose {
  readonly nom: string
  readonly matin: DemiJourneeProposee | null
  readonly apresMidi: DemiJourneeProposee | null
}

/** Code (`2026-09-24-matin`) et libellé (« Jeudi 24 septembre, matin ») du contrat. */
const CODE_DEMI_JOURNEE = /^(\d{4}-\d{2}-\d{2})-(matin|apres-midi)$/
const SEPARATEUR_LIBELLE = ', '

/**
 * Les demi-journées rangées par jour, dans leur ordre ; `null` si un code ou
 * un libellé ne se lit pas : la liste simple s'affiche alors, rien ne se perd.
 */
function joursProposes(
  demiJournees: readonly DemiJourneeProposee[],
): readonly JourPropose[] | null {
  const jours = new Map<string, JourPropose>()
  for (const demiJournee of demiJournees) {
    const code = CODE_DEMI_JOURNEE.exec(demiJournee.code)
    const coupure = demiJournee.libelle.lastIndexOf(SEPARATEUR_LIBELLE)
    const date = code?.[1]
    if (date === undefined || coupure <= 0) return null
    const jour = jours.get(date) ?? {
      nom: demiJournee.libelle.slice(0, coupure),
      matin: null,
      apresMidi: null,
    }
    jours.set(
      date,
      code?.[2] === 'matin' ? { ...jour, matin: demiJournee } : { ...jour, apresMidi: demiJournee },
    )
  }
  return [...jours.values()]
}

/**
 * « Quand pouvez-vous venir ? » (J3, passe 1 du jury) : une ligne par jour,
 * le matin toujours dans la première colonne et l'après-midi dans la seconde,
 * même quand une demi-journée manque ; « Le plus tôt possible » et « Une autre
 * date » dessous. Chaque case dit son jour au lecteur d'écran.
 */
function choixCreneaux(page: PageFormulaire, exigence: Exigence): Html {
  const { formulaire, valeurs, erreurs } = page
  const groupe = id('creneaux')
  const erreur = erreurs.creneaux
  const jours = joursProposes(formulaire.demiJournees)
  const toujours: readonly Choix<string>[] = CRENEAUX_TOUJOURS_PROPOSES
  if (jours === null) {
    return groupeChoix({
      id: groupe,
      nom: CHAMPS_HTML.creneaux,
      legende: 'Quand pouvez-vous venir ?',
      exigence,
      type: 'checkbox',
      options: [...formulaire.demiJournees, ...toujours],
      cochees: valeurs.creneaux,
      aide: aideCreneaux(),
      erreur,
    })
  }
  let rang = 0
  const caseDe = (choix: Choix<string>, visible: string, contexte: string | null, classe = '') => {
    rang += 1
    const identifiant = `${groupe}-${rang}`
    return html`<label class="choix-tuile${classe}" for="${identifiant}">
      <input type="checkbox" id="${identifiant}" name="${CHAMPS_HTML.creneaux}" value="${choix.code}"${valeurs.creneaux.includes(choix.code) && html` checked`} aria-invalid="${erreur === undefined ? 'false' : 'true'}">
      <span>${insecables(visible)}${contexte !== null && html`<span class="visuellement-masque"> du ${contexte}</span>`}</span>
    </label>`
  }
  const lignes = jours.map(
    (jour) => html`<div class="demandes-jour">
    <p class="demandes-jour__nom" aria-hidden="true">${jour.nom}</p>
    ${jour.matin !== null && caseDe(jour.matin, 'Matin', jour.nom.toLocaleLowerCase('fr-FR'), ' demandes-jour__case demandes-jour__case--matin')}
    ${jour.apresMidi !== null && caseDe(jour.apresMidi, 'Après-midi', jour.nom.toLocaleLowerCase('fr-FR'), ' demandes-jour__case demandes-jour__case--apres-midi')}
  </div>`,
  )
  const autres = toujours.map((choix) => caseDe(choix, choix.libelle, null))
  const decrit = [idAide(groupe), ...(erreur === undefined ? [] : [idErreur(groupe)])]
  return html`<fieldset class="champ demandes-groupe demandes-creneaux" id="${groupe}" aria-describedby="${decrit.join(' ')}">
  <legend class="champ__libelle">${insecables('Quand pouvez-vous venir ?')}${mentionFacultatif(exigence)}</legend>
  <p class="champ__aide" id="${idAide(groupe)}">${insecables(aideCreneaux())}</p>
  ${erreur !== undefined && html`<p class="champ__erreur" id="${idErreur(groupe)}"><span class="visuellement-masque">Erreur\u00a0: </span>${insecables(erreur)}</p>`}
  <div class="demandes-jours">
    ${lignes}
  </div>
  <div class="liste-choix liste-choix--colonnes">
    ${autres}
  </div>
</fieldset>`
}

function aideCreneaux(): string {
  return `Cochez de une à ${enLettres(CRENEAUX_MAXIMUM)} possibilités. Nous confirmons l’heure au téléphone.`
}

/**
 * Vente au comptoir publiée (arbitrage 4 du Kano) : la pièce se retire au
 * garage ou se pose à l'atelier. Facultatif, rien de pré-coché sauf demande de
 * l'adresse (`saisieInitiale`) : le garagiste en parle au rappel. La
 * vérification vaut dans les deux cas.
 */
function choixModalite(page: PageFormulaire): Html {
  const { valeurs, erreurs } = page
  return groupeChoix({
    id: id('modalite'),
    nom: CHAMPS_HTML.modalite,
    legende: 'Retrait ou pose',
    exigence: 'facultatif',
    type: 'radio',
    options: MODALITES_PIECE,
    cochees: valeurs.modalite === '' ? [] : [valeurs.modalite],
    aide: 'Dans les deux cas, nous vérifions que la pièce convient à votre véhicule avant de la commander.',
    erreur: erreurs.modalite,
  })
}

function blocVehicule(page: PageFormulaire, obligatoire: boolean): Html {
  const { formulaire, valeurs, erreurs } = page
  // Seul le devis en a besoin en entier (P-07) ; ailleurs, deux champs facultatifs suffisent.
  const exigence: Exigence = obligatoire ? 'alternative' : 'facultatif'
  const modele = champTexte({
    id: id('modele'),
    nom: CHAMPS_HTML.modele,
    libelle: 'Modèle',
    exigence,
    erreur: erreurs.modele,
    valeur: valeurs.modele,
    autocomplete: 'off',
    longueurMax: LONGUEUR_MAX_MODELE,
  })
  switch (formulaire.type) {
    case 'rappel':
      return blocTitre('Votre véhicule', champMarque(page, 'Marque de votre voiture', exigence))
    case 'rendez-vous':
      return blocTitre(
        'Votre véhicule',
        html`<div class="demandes-grille">
  ${champMarque(page, 'Marque de votre voiture', exigence)}
  ${modele}
</div>`,
      )
    case 'devis':
      return blocVehiculeComplet(page, champMarque(page, 'Marque', exigence), modele)
  }
}

/** Bloc titré du formulaire : un `fieldset` dont la légende est l'intertitre. */
function blocTitre(titre: string, contenu: Html): Html {
  return html`<fieldset class="demandes-bloc">
  <legend class="demandes-bloc__titre">${titre}</legend>
  ${contenu}
</fieldset>`
}

/** Devis : la plaque, ou à défaut marque, modèle, année et énergie (P-07, US-28). */
function blocVehiculeComplet(page: PageFormulaire, marque: Html, modele: Html): Html {
  const { formulaire, valeurs, erreurs } = page
  const exigence: Exigence = 'alternative'
  const annees: readonly Choix<string>[] = [
    ...anneesProposees(formulaire.anneeCourante).map((annee) => ({
      code: String(annee),
      libelle: String(annee),
    })),
    { code: CODE_ANNEE_ANCIENNE, libelle: LIBELLE_ANNEE_ANCIENNE },
  ]
  const idAideVehicule = id('vehicule-aide')
  const idErreurVehicule = id('vehicule-erreur')
  const decrit = [idAideVehicule, ...(erreurs.vehicule === undefined ? [] : [idErreurVehicule])]
  return html`<fieldset class="demandes-bloc" id="${id('vehicule')}" aria-describedby="${decrit.join(' ')}">
  <legend class="demandes-bloc__titre">Votre véhicule</legend>
  <p class="champ__aide" id="${idAideVehicule}">La plaque suffit. Sans elle, indiquez la marque, le modèle (par exemple Clio, 308, Golf), l’année et l’énergie.</p>
  ${erreurs.vehicule !== undefined && html`<p class="champ__erreur" id="${idErreurVehicule}"><span class="visuellement-masque">Erreur\u00a0: </span>${insecables(erreurs.vehicule)}</p>`}
  ${champTexte({
    id: id('plaque'),
    nom: CHAMPS_HTML.plaque,
    libelle: 'Plaque d’immatriculation',
    exigence,
    aide: `Exemple : ${EXEMPLE_PLAQUE_SIV} ou ${EXEMPLE_PLAQUE_FNI}.`,
    erreur: erreurs.plaque,
    valeur: valeurs.plaque,
    autocomplete: 'off',
    longueurMax: LONGUEUR_MAX_PLAQUE,
  })}
  <details class="volet demandes-volet demandes-sans-plaque"${sansPlaqueOuvert(page) && html` open`}>
  <summary class="volet__titre">${insecables('Pas de plaque sous la main ? Marque, modèle, année, énergie')}</summary>
  <div class="volet__contenu demandes-grille">
    ${marque}
    ${modele}
    ${champListe({
      id: id('annee'),
      nom: CHAMPS_HTML.annee,
      libelle: 'Année',
      exigence,
      erreur: erreurs.annee,
      valeur: valeurs.annee,
      options: annees,
      invite: 'Choisissez une année',
    })}
    ${champListe({
      id: id('energie'),
      nom: CHAMPS_HTML.energie,
      libelle: 'Énergie',
      exigence,
      erreur: erreurs.energie,
      valeur: valeurs.energie,
      options: ENERGIES,
      invite: 'Choisissez une énergie',
    })}
  </div>
  </details>
</fieldset>`
}

/** Le véhicule sans plaque se déplie dès qu'il porte une saisie ou une erreur. */
function sansPlaqueOuvert(page: PageFormulaire): boolean {
  const { valeurs, erreurs } = page
  return (
    [valeurs.marque, valeurs.modele, valeurs.annee, valeurs.energie].some((v) => v !== '') ||
    ['vehicule', 'marque', 'modele', 'annee', 'energie'].some(
      (champ) => erreurs[champ as ChampDemande] !== undefined,
    )
  )
}

/**
 * Ce qui se passe après l'envoi (B-08), dit avant d'envoyer : rien n'y est
 * promis que le site ne tienne (ni délai ni heure, AE-24, AE-36).
 */
function aparteEnsuite(garage: GarageAffiche): Html {
  return html`<aside class="panneau demandes-aparte" aria-labelledby="${id('ensuite-titre')}">
  <h2 class="titre-carte" id="${id('ensuite-titre')}">Et ensuite\u00a0?</h2>
  <ol class="demandes-etapes">
    <li>Votre demande arrive au garage, avec tout ce que vous avez indiqué.</li>
    <li>Le garage vous rappelle\u00a0; il sait quand vous pouvez répondre.</li>
    <li>Pour un rendez-vous, l’heure se fixe ensemble au téléphone.</li>
  </ol>
  <p>${appelerLeGarage(garage, 'Vous préférez parler à quelqu’un ? Appelez le garage')}</p>
</aside>`
}

function blocCoordonnees(page: PageFormulaire): Html {
  const { valeurs, erreurs } = page
  return html`<fieldset class="demandes-bloc">
  <legend class="demandes-bloc__titre">Vos coordonnées</legend>
  ${champTexte({
    id: id('prenom'),
    nom: CHAMPS_HTML.prenom,
    libelle: 'Votre prénom',
    exigence: 'obligatoire',
    erreur: erreurs.prenom,
    valeur: valeurs.prenom,
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
    erreur: erreurs.telephone,
    valeur: valeurs.telephone,
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
    cochees: valeurs.moment === '' ? [] : [valeurs.moment],
    erreur: erreurs.moment,
  })}
</fieldset>`
}

/**
 * Écran « Confirmez l'envoi » (D9 ; J1, passe 1 du jury) : court, le bouton
 * « Confirmer l'envoi » dans le premier écran du téléphone, sous trois lignes
 * qui résument la demande. Le formulaire complet reste dans un volet replié,
 * pour vérifier ou corriger : ses champs partent avec la confirmation.
 */
function pageConfirmation(page: PageFormulaire): Html {
  const { formulaire } = page
  const resume = apresPreDiagnostic(formulaire)
  return html`${enTetePage({
    fil: [{ libelle: 'Confirmez l’envoi', chemin: CHEMINS.demande }],
    surtitre: 'Dernière étape',
    titre: 'Confirmez l’envoi',
  })}
<div class="conteneur section demandes-page demandes-page--confirmer">
  <div class="demandes-colonne pile">
    <form class="demandes-formulaire demandes-confirmer" id="${ID_FORMULAIRE}" method="post" action="${CHEMINS.demande}" novalidate data-envoi-unique>
      <div class="message demandes-a-confirmer" id="${id('a-confirmer')}" tabindex="-1" autofocus>
        <p><strong>Demande pas encore envoyée.</strong></p>
        ${page.formulaireDejaEnvoye && html`<p>Ce formulaire a déjà servi à envoyer une autre demande, que le garage a bien reçue. Confirmez pour envoyer aussi celle-ci.</p>`}
        ${page.contenuAConfirmer !== undefined && page.contenuAConfirmer !== null && resumeAConfirmer(page.contenuAConfirmer)}
      </div>
      ${champsCaches(formulaire)}
      <div class="demandes-confirmer__envoi">
        <button class="bouton bouton--principal demandes-envoi__bouton" type="submit">Confirmer l’envoi</button>
      </div>
      <details class="volet demandes-volet panneau">
        <summary class="volet__titre">Vérifier ou modifier ma demande</summary>
        <div class="volet__contenu demandes-confirmer__detail">
          ${resume === null ? blocsDeLaDemande(page) : blocsApresPreDiagnostic(page, resume)}
          <p class="champ__aide">${insecables('Vos corrections partent avec le bouton « Confirmer l’envoi », plus haut.')}</p>
        </div>
      </details>
    </form>
    ${mentionDonnees(page.garage, PREFIXE)}
  </div>
</div>`
}

/**
 * Tout ce qui partira, relu avant de confirmer (J2 et J3, passe 2 du jury) :
 * le type et le sujet, les pièces, le retrait ou la pose, le véhicule, les
 * jours choisis, puis qui rappeler et quand. Les saisies restent telles quelles.
 */
function resumeAConfirmer(contenu: ContenuDemande): Html {
  const { contact } = contenu
  const rappel = libelleDe(MOMENTS_RAPPEL, contact.moment).toLocaleLowerCase('fr-FR')
  const lignes: Html[] = [
    html`<dt>${TYPES[contenu.type].onglet}</dt><dd>${insecables(detailDuSujet(contenu.sujet))}</dd>`,
  ]
  if (contenu.pieces.length > 0)
    lignes.push(html`<dt>Pièces</dt><dd>${contenu.pieces.join(', ')}</dd>`)
  if (contenu.modalite !== null) {
    lignes.push(
      html`<dt>${LIBELLE_MODALITE}</dt><dd>${libelleDe(MODALITES_PIECE, contenu.modalite)}</dd>`,
    )
  }
  if (contenu.vehicule !== null)
    lignes.push(html`<dt>Véhicule</dt><dd>${decrireVehicule(contenu.vehicule)}</dd>`)
  if (contenu.creneaux.length > 0) {
    lignes.push(
      html`<dt>Jours choisis</dt><dd>${insecables(contenu.creneaux.map((creneau) => creneau.libelle).join(' ; '))}</dd>`,
    )
  }
  lignes.push(
    html`<dt>Coordonnées</dt><dd>${contact.prenom}, <span class="demandes-numero">${contact.telephone.affichable}</span>, ${insecables(`rappel souhaité ${rappel}`)}</dd>`,
  )
  return html`<dl class="liste-definitions demandes-a-confirmer__resume">${lignes}</dl>`
}
