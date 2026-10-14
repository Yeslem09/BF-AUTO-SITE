import { html, type Html, type VuePage } from '../../../../../web/index.js'
import {
  LIBELLE_AUCUN_SIGNE,
  LIBELLE_NE_SAIS_PAS,
  type ActionResultat,
} from '../../../domaine/arbre.js'
import type { BrancheAuLivret, Livret, ResultatAuLivret } from '../../../domaine/livret.js'
import { CONDUITES } from '../../../domaine/niveau.js'
import { CHEMIN_LIVRET } from '../adresses.js'
import { TITRE_ARRET } from './arret.js'
import {
  citer,
  LIBELLE_APPELER,
  LIBELLE_CE_QUE_VERIFIERA,
  LIBELLE_RAPPEL,
  LIBELLE_RAPPEL_FERME,
  rendreBoutonImprimer,
  SCRIPT_IMPRESSION,
} from './commun.js'
import { PHRASE_INSUFFISANTE } from './resultat.js'

export const TITRE_LIVRET = 'Livret de relecture du pré-diagnostic'

/** Les actions telles que le conducteur les lit, dites au garagiste. */
const LIBELLES_ACTIONS: Readonly<Record<ActionResultat, string>> = {
  appeler: `${citer(LIBELLE_APPELER)} (sauf quand le garage est fermé)`,
  rappel: `${citer(LIBELLE_RAPPEL)} (${citer(LIBELLE_RAPPEL_FERME)} quand le garage est fermé)`,
  imprimer: citer('Imprimer la fiche'),
}

/**
 * Le livret : l'arbre en français courant, une page imprimée par branche, une
 * case « D'accord » et une case « À changer » par résultat. Aucun code interne.
 */
export function vueLivret(livret: Livret): VuePage {
  const { arbre } = livret
  return {
    titre: TITRE_LIVRET,
    description: 'Document de travail : l’arbre du pré-diagnostic à relire avec le garagiste.',
    chemin: CHEMIN_LIVRET,
    rubrique: 'pre-diagnostic',
    indexable: false,
    scripts: [SCRIPT_IMPRESSION],
    contenu: html`<div class="conteneur section pile pre-diagnostic-livret">
  <p class="surtitre">Document de travail, jamais publié</p>
  <h1>${TITRE_LIVRET}</h1>
  <p class="texte-intro">
    À relire à voix haute avec le garagiste. Pour chaque résultat, cochez ${citer('D’accord')} ou
    ${citer('À changer')} et notez la correction. Les branches refusées ne donneront plus que :
    ${citer(PHRASE_INSUFFISANTE)}
  </p>
  <dl class="liste-definitions pre-diagnostic-livret__entete">
    <dt>Version de l’arbre</dt><dd>${arbre.version}</dd>
    <dt>Relu par</dt><dd>${arbre.relecture?.reluPar ?? html`<span class="pre-diagnostic-livret__ligne"></span>`}</dd>
    <dt>Le</dt><dd>${arbre.relecture?.reluLe ?? html`<span class="pre-diagnostic-livret__ligne"></span>`}</dd>
  </dl>
  <p>${rendreBoutonImprimer('Imprimer le livret')}</p>
  <section class="pre-diagnostic-livret__regles" aria-labelledby="pre-diagnostic-livret-regles">
    <h2 id="pre-diagnostic-livret-regles">Règles communes à toutes les branches</h2>
    <ul>
      <li>Première question : ${citer(arbre.premiereQuestion)}, avec un choix par branche ci-dessous.</li>
      <li>Deuxième question, toujours posée : ${citer(arbre.questionSignes)}, avec en plus ${citer(LIBELLE_AUCUN_SIGNE)} et ${citer(LIBELLE_NE_SAIS_PAS)}.</li>
      <li>Un seul signe coché arrête le questionnaire : écran ${citer(TITRE_ARRET)} (mise en sécurité et 112, assistance de l’assureur, rappel par le garage).</li>
      <li>${citer(LIBELLE_NE_SAIS_PAS)} à la deuxième question : jamais moins que ${citer(CONDUITES['a-controler'])}, et les signes de danger sont rappelés.</li>
      <li>${citer(LIBELLE_NE_SAIS_PAS)} à toutes les questions, dès la première : ${citer(PHRASE_INSUFFISANTE)}</li>
      <li>Un résultat ${citer(CONDUITES['ne-pas-rouler'])} reprend les consignes de l’écran ${citer(TITRE_ARRET)}</li>
      <li>Sous chaque résultat : ${citer(arbre.mention)}</li>
      <li>Actions proposées : ${arbre.actions.map((action) => LIBELLES_ACTIONS[action]).join(', ')}.</li>
    </ul>
  </section>
  ${livret.branches.map(rendreBranche)}
</div>`,
  }
}

function rendreBranche(entree: BrancheAuLivret): Html {
  const { branche } = entree
  return html`<section class="pre-diagnostic-livret__branche" aria-label="${`Branche : ${branche.libelle}`}">
  <h2>Premier choix : ${citer(branche.libelle)}</h2>
  ${entree.elaguee && html`<p class="message message--erreur">Branche refusée à la relecture précédente : ses résultats ne sont plus affichés.</p>`}
  <p>Jamais moins que : ${citer(CONDUITES[branche.plancher])}.</p>
  <h3>Signes de danger demandés</h3>
  <ul>${entree.signes.map((signe) => html`<li>${signe.libelle}</li>`)}</ul>
  <h3>Questions posées</h3>
  <ul>
    ${entree.questions.map(
      (question) => html`<li>
      <strong>${question.intitule}</strong>
      ${question.aide !== null && html`<br><em>${question.aide}</em>`}
      <br>Choix : ${question.choix.map((choix) => choix.libelle).join(' ; ')}.
    </li>`,
    )}
  </ul>
  <h3>Résultats</h3>
  ${entree.resultats.map(rendreResultat)}
</section>`
}

function rendreResultat(entree: ResultatAuLivret): Html {
  return html`<article class="pre-diagnostic-livret__resultat">
  <p class="pre-diagnostic-livret__conduite">${citer(CONDUITES[entree.niveau])}</p>
  <p>Quand le conducteur répond :</p>
  <ul>
    ${entree.chemins.map(
      (chemin) =>
        html`<li>${chemin.map((pas) => `${pas.question} ${citer(pas.reponse)}`).join(', puis ')}</li>`,
    )}
  </ul>
  <p>Pistes proposées :</p>
  <ul>
    ${entree.resultat.pistes.map(
      (piste) => html`<li>${piste.texte} ${LIBELLE_CE_QUE_VERIFIERA} ${piste.verification}</li>`,
    )}
  </ul>
  <p class="pre-diagnostic-livret__cases">
    <span class="pre-diagnostic-livret__case" aria-hidden="true"></span> D’accord
    <span class="pre-diagnostic-livret__case" aria-hidden="true"></span> À changer :
    <span class="pre-diagnostic-livret__ligne"></span>
  </p>
</article>`
}
