import { CHAMP_JETON_FORMULAIRE, CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { EtatFermetures } from '../../../application/lister-fermetures.js'
import type { RappelPromisLu } from '../../../application/ports.js'
import {
  LIBELLES_MOTIF,
  MOTIFS_FERMETURE,
  dateSaisissable,
  periodeEnLettres,
  type ChampPeriode,
  type ErreursPeriode,
  type Fermeture,
  type PeriodeFermeture,
  type SaisiePeriode,
} from '../../../domaine/fermeture.js'
import { dateEnLettres, majusculeInitiale } from '../../../domaine/dates-francaises.js'
import { LIBELLE_JOUR_FERME_EXCEPTIONNELLEMENT } from '../../../domaine/description-horaires.js'
import { comparerDates, dateIso, lireDateIso } from '../../../domaine/temps-local.js'
import { entreGuillemets } from '../../../domaine/textes.js'
import type { Publication } from '../../../domaine/valeur-publiee.js'
import { CHEMINS_FERMETURES, cheminSuppression, type CompteRendu } from '../chemins-garagiste.js'
import { entetePage } from './composants.js'

const TITRE = 'Fermetures exceptionnelles'
const SURTITRE = 'Espace garagiste'
const ESPACE_GARAGISTE = { chemin: CHEMINS.garagiste, libelle: SURTITRE } as const
export const STATUT_SAISIE_INVALIDE = 422

export interface EcranFermetures {
  readonly etat: EtatFermetures
  readonly compteRendu: CompteRendu | null
  /** Fermeture que le garagiste vient de supprimer : « Annuler » la rétablit (J4, passe 2). */
  readonly supprimee?: PeriodeFermeture | null
  /** Lien vers les horaires exceptionnels de la fiche Google, s'il est publié. */
  readonly lienFicheGoogle: Publication<string>
  /** Jeton anti-falsification de la session, posé dans chaque formulaire de la page. */
  readonly jetonFormulaire: string
  /** Saisie refusée à réafficher, avec ses erreurs. */
  readonly saisie?: SaisiePeriode
  readonly erreurs?: ErreursPeriode
  /** Rappels déjà promis pendant chaque fermeture prévue, par identifiant ; absent : aucun connu. */
  readonly rappelsPromis?: ReadonlyMap<number, readonly RappelPromisLu[]>
}

const IDENTIFIANTS_CHAMPS: Readonly<Record<ChampPeriode, string>> = {
  du: 'garage-fermeture-du',
  au: 'garage-fermeture-au',
  motif: 'garage-fermeture-motif',
}

/** Page de l'espace garagiste : imprévu du jour, période, fermetures prévues (Kano D5, US-31). */
export function vueFermetures(ecran: EcranFermetures): VuePage {
  const erreurs = ecran.erreurs ?? {}
  return {
    titre: TITRE,
    description: 'Déclarer les jours où le garage est fermé en dehors de ses horaires habituels.',
    chemin: CHEMINS_FERMETURES.liste,
    rubrique: 'garagiste',
    indexable: false,
    ...(Object.keys(erreurs).length > 0 && { statutHttp: STATUT_SAISIE_INVALIDE }),
    contenu: html`${entetePage({
      chemin: CHEMINS_FERMETURES.liste,
      titre: TITRE,
      surtitre: SURTITRE,
      intro:
        'Les jours où le garage est fermé en dehors de ses horaires habituels : le site les affiche et ne promet aucun rappel ces jours-là.',
      parents: [ESPACE_GARAGISTE],
    })}
<div class="conteneur section pile garage-fermetures">
  ${rendreCompteRendu(ecran)}
  ${rendreResumeErreurs(erreurs)}
  <section class="panneau pile" aria-labelledby="titre-imprevu">
    <h2 id="titre-imprevu" class="titre-carte">Fermé aujourd’hui ?</h2>
    ${
      ecran.etat.fermetureDuJour === null
        ? html`<p>Un imprévu ? Le site affichera ${entreGuillemets(LIBELLE_JOUR_FERME_EXCEPTIONNELLEMENT)} jusqu’à ce soir, et plus aucun rappel ne sera promis pour aujourd’hui.</p>
    <p><a class="bouton bouton--principal" href="${CHEMINS_FERMETURES.imprevu}">Imprévu aujourd’hui</a></p>`
        : carteFermeDuJour(ecran.etat.fermetureDuJour, ecran.etat.aujourdhui, ecran.jetonFormulaire)
    }
  </section>
  <section class="panneau pile" aria-labelledby="titre-periode">
    <h2 id="titre-periode" class="titre-carte">Déclarer une période</h2>
    ${formulairePeriode(ecran, erreurs)}
  </section>
  <section class="pile" aria-labelledby="titre-prevues">
    <h2 id="titre-prevues" class="titre-carte">Fermetures prévues</h2>
    ${
      ecran.etat.prevues.length === 0
        ? html`<p>Aucune fermeture prévue : le site suit les horaires habituels.</p>`
        : html`<ul class="garage-fermetures__liste">${ecran.etat.prevues.map((fermeture) => rendreFermeture(fermeture, ecran.jetonFormulaire, ecran.rappelsPromis?.get(fermeture.identifiant) ?? []))}</ul>`
    }
  </section>
  <p class="garage-lien-isole"><a href="${CHEMINS.garagiste}">Retour à l’espace garagiste</a></p>
</div>`,
  }
}

/**
 * Le garage est fermé aujourd'hui : « Rouvrir le garage » sur la carte du haut
 * (J4, passe 2 du jury), sans chercher la fermeture dans la liste. Rouvrir
 * met fin à la fermeture entière ; « Annuler » la rétablit.
 */
function carteFermeDuJour(
  fermeture: Fermeture,
  aujourdhui: EtatFermetures['aujourdhui'],
  jeton: string,
): Html {
  const surPlusieursJours = comparerDates(fermeture.du, fermeture.au) !== 0
  const suite = comparerDates(fermeture.au, aujourdhui) > 0
  return html`<p>Le garage est déclaré fermé aujourd’hui (${LIBELLES_MOTIF[fermeture.motif].toLowerCase()})${surPlusieursJours && ` : fermeture ${periodeEnLettres(fermeture)}`}.</p>
    ${suite && html`<p class="champ__aide">Rouvrir met fin à toute cette fermeture : le site suit de nouveau les horaires habituels dès aujourd’hui.</p>`}
    <form method="post" action="${cheminSuppression(fermeture.identifiant)}" data-envoi-unique>
      ${champJeton(jeton)}
      <button class="bouton bouton--principal" type="submit">Rouvrir le garage</button>
    </form>`
}

/** Période en champs cachés : « Annuler » une suppression la déclare de nouveau, telle quelle. */
function formulaireRetablir(periode: PeriodeFermeture, jeton: string): Html {
  return html`<form method="post" action="${CHEMINS_FERMETURES.liste}" data-envoi-unique>
      ${champJeton(jeton)}
      <input type="hidden" name="du" value="${dateIso(periode.du)}">
      <input type="hidden" name="au" value="${dateIso(periode.au)}">
      <input type="hidden" name="motif" value="${periode.motif}">
      <input type="hidden" name="${CHAMP_RETABLIR}" value="1">
      <button class="bouton bouton--secondaire" type="submit">Annuler</button>
    </form>`
}

/** Champ caché du formulaire « Annuler » d'une suppression : le compte rendu dit « rétablie ». */
export const CHAMP_RETABLIR = 'retablir'

function rendreCompteRendu(ecran: EcranFermetures): Html | null {
  switch (ecran.compteRendu) {
    case null:
      return null
    case 'enregistree':
    case 'deja-fermee': {
      const phrase =
        ecran.compteRendu === 'enregistree'
          ? `Fermeture enregistrée : le site affiche ${entreGuillemets(LIBELLE_JOUR_FERME_EXCEPTIONNELLEMENT)} ces jours-là.`
          : 'Le garage était déjà déclaré fermé aujourd’hui : rien n’a changé.'
      return html`<div class="message message--succes pile-serree" role="status">
    <p><strong>${phrase}</strong></p>
    <p>${
      ecran.lienFicheGoogle.visible
        ? html`<a href="${ecran.lienFicheGoogle.valeur}" rel="noopener">Déclarez aussi cette fermeture sur votre fiche Google</a> (horaires exceptionnels), pour que la fiche et le site disent la même chose.`
        : 'Déclarez aussi cette fermeture sur votre fiche Google (horaires exceptionnels), pour que la fiche et le site disent la même chose.'
    }</p>
  </div>`
    }
    case 'supprimee': {
      const periode = ecran.supprimee ?? null
      return html`<div class="message message--succes pile-serree garage-compte-rendu" role="status">
    <p><strong>${periode === null ? 'Fermeture supprimée' : `Fermeture ${periodeEnLettres(periode)} supprimée`}</strong> : le site suit de nouveau les horaires habituels ces jours-là.</p>
    ${periode !== null && formulaireRetablir(periode, ecran.jetonFormulaire)}
  </div>`
    }
    case 'retablie':
      return html`<p class="message message--succes" role="status"><strong>Fermeture rétablie</strong> : le site affiche de nouveau ${entreGuillemets(LIBELLE_JOUR_FERME_EXCEPTIONNELLEMENT)} ces jours-là.</p>`
    case 'introuvable':
      return html`<p class="message" role="status">Cette fermeture n’existe plus : elle a déjà été supprimée.</p>`
  }
}

function rendreResumeErreurs(erreurs: ErreursPeriode): Html | null {
  const liste = (Object.entries(erreurs) as [ChampPeriode, string][]).map(
    ([champ, message]) => html`<li><a href="#${IDENTIFIANTS_CHAMPS[champ]}">${message}</a></li>`,
  )
  if (liste.length === 0) return null
  return html`<div class="message message--erreur pile-serree" role="alert">
    <p><strong>La fermeture n’a pas été enregistrée.</strong></p>
    <ul>${liste}</ul>
  </div>`
}

function champDate(
  champ: 'du' | 'au',
  libelle: string,
  valeur: string,
  erreur: string | undefined,
): Html {
  const id = IDENTIFIANTS_CHAMPS[champ]
  const idErreur = `${id}-erreur`
  return html`<div class="champ">
      <label class="champ__libelle" for="${id}">${libelle}</label>
      ${erreur !== undefined && html`<p class="champ__erreur" id="${idErreur}">${erreur}</p>`}
      <input class="champ__saisie" type="text" inputmode="numeric" autocomplete="off" placeholder="jj/mm/aaaa" maxlength="10" id="${id}" name="${champ}" value="${valeur}" aria-describedby="${idAideDates}${erreur !== undefined ? ` ${idErreur}` : ''}" required${erreur !== undefined ? html` aria-invalid="true"` : ''}>
    </div>`
}

/** Aide des deux dates : le format, toujours à la française (jamais celui du navigateur). */
const idAideDates = 'garage-fermeture-dates-aide'

/** Champ caché anti-falsification, exigé par `exigerFormulaireGaragiste` sur tout envoi. */
function champJeton(jeton: string): Html {
  return html`<input type="hidden" name="${CHAMP_JETON_FORMULAIRE}" value="${jeton}">`
}

function formulairePeriode(ecran: EcranFermetures, erreurs: ErreursPeriode): Html {
  // Jour/mois/année, heure de Paris : le champ ne dépend jamais de la langue du navigateur (J4).
  const aujourdhui = dateSaisissable(ecran.etat.aujourdhui)
  const saisie = ecran.saisie ?? { du: aujourdhui, au: aujourdhui, motif: 'conges' }
  const idMotif = IDENTIFIANTS_CHAMPS.motif
  const erreurMotif = erreurs.motif
  return html`<form class="pile" method="post" action="${CHEMINS_FERMETURES.liste}" novalidate data-envoi-unique>
    ${champJeton(ecran.jetonFormulaire)}
    <p class="champ__aide" id="${idAideDates}">Du premier au dernier jour de fermeture, inclus, sous la forme jj/mm/aaaa (par exemple ${aujourdhui}).</p>
    <div class="garage-fermetures__dates">
      ${champDate('du', 'Du', saisie.du, erreurs.du)}
      ${champDate('au', 'Au', saisie.au, erreurs.au)}
    </div>
    <div class="champ">
      <label class="champ__libelle" for="${idMotif}">Motif</label>
      ${erreurMotif !== undefined && html`<p class="champ__erreur" id="${idMotif}-erreur">${erreurMotif}</p>`}
      <select class="champ__saisie" id="${idMotif}" name="motif" required${erreurMotif !== undefined ? html` aria-invalid="true" aria-describedby="${idMotif}-erreur"` : ''}>
        ${MOTIFS_FERMETURE.map(
          (motif) =>
            html`<option value="${motif}"${motif === saisie.motif ? ' selected' : ''}>${LIBELLES_MOTIF[motif]}</option>`,
        )}
      </select>
    </div>
    <p><button class="bouton bouton--principal" type="submit">Enregistrer la fermeture</button></p>
  </form>`
}

function rendreFermeture(
  fermeture: Fermeture,
  jetonFormulaire: string,
  rappels: readonly RappelPromisLu[],
): Html {
  const periode = periodeEnLettres(fermeture, true)
  const unJour = dateIso(fermeture.du) === dateIso(fermeture.au)
  return html`<li class="panneau garage-fermetures__element">
    <p><strong>${majusculeInitiale(periode)}</strong> <span class="pastille">${LIBELLES_MOTIF[fermeture.motif]}</span></p>
    <form method="post" action="${cheminSuppression(fermeture.identifiant)}" data-envoi-unique>
      ${champJeton(jetonFormulaire)}
      <button class="bouton bouton--secondaire" type="submit">Supprimer<span class="visuellement-masque"> la fermeture ${periode}</span></button>
    </form>
    ${rendreRappelsPromis(rappels, unJour ? 'ce jour-là' : 'ces jours-là', !unJour)}
  </li>`
}

/**
 * Alerte des rappels déjà promis aux clients pendant une fermeture : chacun
 * avec son prénom, le moment promis, l'urgence, un appel en un geste et sa
 * demande. Rien si aucun rappel n'est promis ou si la capacité manque.
 */
export function rendreRappelsPromis(
  rappels: readonly RappelPromisLu[],
  quand: string,
  avecDate: boolean,
): Html | null {
  if (rappels.length === 0) return null
  const nombre = rappels.length
  const titre =
    nombre === 1
      ? `1 client attend votre rappel ${quand} : prévenez-le.`
      : `${nombre} clients attendent votre rappel ${quand} : prévenez-les.`
  return html`<div class="message message--erreur pile-serree garage-rappels-promis" role="alert">
    <p><strong>${titre}</strong></p>
    <ul class="garage-rappels-promis__liste">
      ${rappels.map((rappel) => {
        const date = lireDateIso(rappel.date)
        const moment =
          avecDate && date !== null ? `${dateEnLettres(date)}, ${rappel.quand}` : rappel.quand
        return html`<li class="garage-rappels-promis__client">
        <p><strong>${rappel.prenom}</strong>, promis ${moment}${rappel.neRoulezPas && html` <span class="pastille">Ne roulez pas</span>`}</p>
        <p class="garage-rappels-promis__gestes"><a class="bouton bouton--secondaire" href="${rappel.telephone.lien}">Appeler le <span class="garage-numero">${insecable(rappel.telephone.affichable)}</span></a> <a class="garage-rappels-promis__demande" href="${rappel.chemin}">Voir la demande</a></p>
      </li>`
      })}
    </ul>
  </div>`
}

/** Numéro de téléphone jamais coupé en fin de ligne. */
function insecable(numero: string): string {
  return numero.replace(/ /g, '\u00a0')
}

/**
 * Deuxième geste de « Imprévu aujourd'hui » : confirmer, ou revenir. Le bouton
 * « Confirmer la fermeture » est visible avant la liste des clients à
 * prévenir (J4, passe 2 du jury), et répété sous une longue liste ; chaque
 * client s'appelle d'un bouton de 44 px.
 */
export function vueConfirmationImprevu(
  aujourdhui: EtatFermetures['aujourdhui'],
  jetonFormulaire: string,
  rappelsPromis: readonly RappelPromisLu[] = [],
): VuePage {
  return {
    titre: 'Fermer le garage aujourd’hui',
    description: 'Confirmer la fermeture imprévue du garage pour aujourd’hui.',
    chemin: CHEMINS_FERMETURES.imprevu,
    rubrique: 'garagiste',
    indexable: false,
    contenu: html`${entetePage({
      chemin: CHEMINS_FERMETURES.imprevu,
      titre: 'Fermer le garage aujourd’hui ?',
      surtitre: SURTITRE,
      intro: `Le site affichera ${entreGuillemets(LIBELLE_JOUR_FERME_EXCEPTIONNELLEMENT)} toute la journée du ${dateEnLettres(aujourdhui, { annee: true })}.`,
      parents: [ESPACE_GARAGISTE, { chemin: CHEMINS_FERMETURES.liste, libelle: TITRE }],
    })}
<div class="conteneur section pile garage-fermetures">
  ${gestesImprevu(jetonFormulaire)}
  ${rendreRappelsPromis(rappelsPromis, 'aujourd’hui', false)}
  ${rappelsPromis.length > REPETER_GESTES_AU_DELA && gestesImprevu(jetonFormulaire)}
</div>`,
  }
}

/** Au-delà de ce nombre de clients à prévenir, les gestes se répètent sous la liste. */
const REPETER_GESTES_AU_DELA = 2

function gestesImprevu(jeton: string): Html {
  return html`<form method="post" action="${CHEMINS_FERMETURES.imprevu}" data-envoi-unique>
    ${champJeton(jeton)}
    <ul class="liste-actions">
      <li><button class="bouton bouton--principal" type="submit">Confirmer la fermeture</button></li>
      <li><a class="bouton bouton--secondaire" href="${CHEMINS_FERMETURES.liste}">Annuler</a></li>
    </ul>
  </form>`
}
