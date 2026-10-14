/**
 * Serveur d'essai du design : la vraie couche web (mise en page, feuille de
 * style construite, sécurité) avec des blocs d'accueil FACTICES, écrits avec
 * les composants de docs/design/composants.md. Réservé aux tests navigateur et
 * aux captures de revue : aucun de ces contenus n'est livré sur le site.
 *
 * Usage autonome (captures) :
 *   PORT=4317 STATUT_FACTICE=ouvert pnpm exec tsx tests/e2e/design-factice.ts
 */
import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'
import type { EtatOuverture, StatutOuverture } from '../../src/contrats/index.js'
import {
  FIGURES_FAMILLES,
  html,
  rendreFigureTechnique,
  SYMBOLE,
  type CadrePage,
  type FigureTechnique,
  type ModuleContexte,
} from '../../src/web/index.js'
import { PROTECTION_FORMULAIRES_ESSAI } from '../../src/web/essai.js'
import { creerServeur } from '../../src/web/serveur.js'

const RACINE_PUBLIQUE = fileURLToPath(new URL('../../public', import.meta.url))
const HOTE = '127.0.0.1'

const LIBELLES_STATUT: Readonly<Record<EtatOuverture, string>> = {
  ouvert: 'Ouvert, ferme à 19 h 00',
  ferme: 'Fermé, ouvre demain à 9 h 00',
  'a-confirmer': 'Horaires à confirmer',
}

/** Statut long d'une fermeture exceptionnelle : il cassait la pastille et la barre fixe (jury, passe 1). */
export const STATUT_FERMETURE_EXCEPTIONNELLE: StatutOuverture = {
  etat: 'ferme',
  libelle: 'Fermé exceptionnellement, ouvre demain à 8 h 30',
}

export const ACTIVITES_FACTICES = 'Mécanique, entretien, carrosserie et peinture, toutes marques.'

/** Lien de rappel qu'une page fournit à la barre fixe (le résultat du pré-diagnostic, par exemple). */
export const LIEN_RAPPEL_FACTICE = '/demande?type=rappel&prediagnostic=ESSAI'

/** Un état (libellé d'essai associé) ou un statut complet. */
export function cadreFactice(statut: EtatOuverture | StatutOuverture): CadrePage {
  return {
    identite: {
      nom: 'BF Auto',
      accroche: 'Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez.',
      activites: ACTIVITES_FACTICES,
      adresse: { voie: '7 rue Demanieux', codePostal: '94600', ville: 'Choisy-le-Roi' },
      telephone: { affichable: '06 05 92 28 38', lien: 'tel:+33605922838' },
    },
    statut:
      typeof statut === 'string' ? { etat: statut, libelle: LIBELLES_STATUT[statut] } : statut,
  }
}

const REPONSES_Q1 = [
  ['voyant', 'Un voyant s’allume'],
  ['bruit', 'Un bruit inhabituel'],
  ['vibration', 'Ça vibre ou la voiture tire d’un côté'],
  ['odeur', 'Une odeur, une fumée ou une fuite'],
  ['demarrage', 'Elle démarre mal ou pas du tout'],
  ['freinage', 'Le freinage a changé'],
] as const

const FAMILLES = [
  ['freinage', 'Freinage', 'Plaquettes, disques, étriers'],
  ['batterie', 'Batterie', 'Contrôle et remplacement'],
  ['pneus', 'Pneus', 'Montage et équilibrage'],
  ['vidange-et-filtres', 'Vidange et filtres', 'Huile, filtres, niveaux'],
  ['distribution', 'Distribution', 'Courroie, galets, pompe'],
  ['embrayage', 'Embrayage', 'Disque, mécanisme, butée'],
  ['amortisseurs-et-suspension', 'Amortisseurs', 'Suspension et coupelles'],
  ['echappement', 'Échappement', 'Silencieux, pots, brides'],
  ['demarrage-et-charge', 'Démarrage et charge', 'Alternateur, démarreur'],
  ['climatisation', 'Climatisation', 'Recharge, condenseur'],
  ['eclairage', 'Éclairage', 'Ampoules, optiques'],
  ['essuie-glaces', 'Essuie-glaces', 'Balais et bras'],
] as const

const dessin = (slug: string, classe: string) =>
  html`<svg class="${classe}" viewBox="0 0 80 56" aria-hidden="true" focusable="false"><use href="${`/img/familles/${slug}.svg#dessin`}"></use></svg>`

const blocRecherchePieces = html`<section class="pile" aria-labelledby="factice-pieces">
  <h2 id="factice-pieces">Pièces détachées</h2>
  <form class="recherche" role="search" method="get" action="/pieces-et-reparations">
    <label class="champ__libelle" for="factice-recherche-bande">Quelle pièce cherchez-vous ?</label>
    <div class="recherche__ligne">
      <input class="champ__saisie" id="factice-recherche-bande" name="q" type="search" placeholder="Ex. plaquettes">
      <button class="bouton bouton--principal" type="submit">Chercher</button>
    </div>
  </form>
  <ul class="puces-familles">
    ${FAMILLES.slice(0, 6).map(([slug, nom]) => html`<li><a class="puce-famille" href="${`/pieces-et-reparations/${slug}`}">${dessin(slug, 'puce-famille__dessin')}<span>${nom}</span></a></li>`)}
  </ul>
</section>`

const blocCatalogueGrille = html`<section class="pile" aria-labelledby="factice-familles">
  <p class="surtitre">Pièces détachées et réparations</p>
  <h2 id="factice-familles">Toutes les familles</h2>
  <ul class="grille-familles">
    ${FAMILLES.map(([slug, nom, aide]) => html`<li><a class="carte-famille" href="${`/pieces-et-reparations/${slug}`}"><span class="carte-famille__planche">${dessin(slug, 'carte-famille__dessin')}</span><span class="carte-famille__nom">${nom}</span><span class="carte-famille__aide">${aide}</span></a></li>`)}
  </ul>
</section>`

const blocPreDiagnostic = html`<section class="pile" aria-labelledby="factice-q1">
  <p class="surtitre">Pré-diagnostic, question 1 sur 5 au plus</p>
  <h2 id="factice-q1">Que remarquez-vous ?</h2>
  <form method="get" action="/pre-diagnostic">
    <ul class="liste-choix liste-choix--colonnes">
      ${REPONSES_Q1.map(([valeur, libelle]) => html`<li><button class="bouton-choix" type="submit" name="remarque" value="${valeur}">${libelle}</button></li>`)}
      <li><button class="bouton-choix bouton-choix--incertain" type="submit" name="remarque" value="autre">Autre chose ou je ne sais pas</button></li>
    </ul>
  </form>
  <p class="texte-note"><strong>Orientation gratuite :</strong> le diagnostic se fait à l’atelier.</p>
</section>`

const blocInformation = html`<section class="pile" aria-labelledby="factice-atelier">
  <p class="surtitre">L’atelier</p>
  <h2 id="factice-atelier">Entretien et réparation, au 7 rue Demanieux</h2>
  <p class="texte-intro">Un atelier de quartier qui prend le temps d’expliquer : vous savez ce que nous avons constaté, et ce que cela coûte, avant de décider.</p>
  <table class="tableau-tarifs">
    <caption>Exemples de prix TTC, avant travaux</caption>
    <thead><tr><th scope="col">Prestation</th><th scope="col" class="tableau-tarifs__prix">Prix TTC</th></tr></thead>
    <tbody>
      <tr><th scope="row">Premier contrôle<span class="tableau-tarifs__detail">exemple : citadine essence</span></th><td class="tableau-tarifs__prix">00 €</td></tr>
      <tr><th scope="row">Taux horaire</th><td class="tableau-tarifs__prix">00 €</td></tr>
    </tbody>
  </table>
</section>`

const blocQuestions = html`<section class="pile" aria-labelledby="factice-questions">
  <p class="surtitre">Vos questions</p>
  <h2 id="factice-questions">Avant de nous confier votre voiture</h2>
  <div class="liste-volets">
    <details class="volet" open><summary class="volet__titre">Mon voyant est allumé : puis-je rouler ?</summary><div class="volet__contenu"><p>Un voyant rouge : arrêtez-vous dès que possible et appelez-nous.</p></div></details>
    <details class="volet"><summary class="volet__titre">Vais-je perdre la garantie de mon constructeur ?</summary><div class="volet__contenu"><p>Réponse d’essai.</p></div></details>
  </div>
</section>`

const blocGarage = html`<section class="pile" aria-labelledby="factice-garage">
  <p class="surtitre">Le garage</p>
  <h2 id="factice-garage" class="titre-carte">7 rue Demanieux, Choisy-le-Roi</h2>
  <p class="statut statut--ouvert">Ouvert, ferme à 19 h 00</p>
  <p><a href="tel:+33605922838">06 05 92 28 38</a></p>
</section>`

const blocRappel = html`<section class="pile" aria-labelledby="factice-rappel">
  <h2 id="factice-rappel" class="titre-carte">Être rappelé</h2>
  <form class="pile" method="post" action="/demande">
    <div class="champ"><label class="champ__libelle" for="factice-prenom">Prénom</label><input class="champ__saisie" id="factice-prenom" name="prenom" autocomplete="given-name"></div>
    <div class="champ"><label class="champ__libelle" for="factice-telephone">Téléphone</label><input class="champ__saisie" id="factice-telephone" name="telephone" type="tel" aria-describedby="factice-telephone-aide factice-telephone-erreur" aria-invalid="true"><p class="champ__aide" id="factice-telephone-aide">Exemple : 06 12 34 56 78</p><p class="champ__erreur" id="factice-telephone-erreur">Numéro incomplet : dix chiffres attendus.</p></div>
    <fieldset class="champ"><legend class="champ__libelle">Moment préféré</legend><div class="liste-choix">
      <label class="choix-tuile"><input type="radio" name="moment" value="matin" checked> <span>Le matin</span></label>
      <label class="choix-tuile"><input type="radio" name="moment" value="apres-midi"> <span>L’après-midi</span></label>
    </div></fieldset>
    <label class="choix"><input type="checkbox" name="consentement"> <span>J’accepte d’être rappelé à ce numéro.</span></label>
    <button class="bouton bouton--principal" type="submit">Être rappelé</button>
  </form>
</section>`

const blocEncart = html`<aside class="encart" aria-labelledby="factice-nom">
  <div class="encart__symbole">${SYMBOLE}</div>
  <div class="encart__corps">
    <p class="encart__surtitre">Nouveau nom, même atelier</p>
    <h2 class="encart__titre" id="factice-nom">« Garage auto Choisy 94 » devient BF Auto</h2>
    <p>Même adresse, même numéro. Déjà venu chez nous ? <a href="/avis">Laissez un avis Google</a>.</p>
  </div>
</aside>`

const pageComposants = html`<div class="entete-page">
  <div class="conteneur">
    <nav class="fil-ariane" aria-label="Fil d’Ariane"><ol><li><a href="/">Accueil</a></li><li><a href="/composants" aria-current="page">Composants</a></li></ol></nav>
    <p class="surtitre">Système de design</p>
    <h1>Composants</h1>
    <p class="texte-intro">Page d’essai : chaque composant dans ses états.</p>
  </div>
</div>
<div class="conteneur section pile">
  <ul class="liste-actions"><li><a class="bouton bouton--principal" href="/">Principal</a></li><li><a class="bouton bouton--secondaire" href="/">Secondaire</a></li><li><span class="bouton bouton--principal" aria-disabled="true">Indisponible</span></li></ul>
  <p class="message message--succes">Demande envoyée.</p>
  <p class="message message--erreur">Deux champs sont à corriger.</p>
  <p><span class="pastille">Freinage</span> <span class="a-valider">9 h 00 à 19 h 00</span></p>
  <div class="alerte alerte--danger" role="status"><p class="alerte__titre">Ne roulez pas : appelez-nous.</p><p>Un signe de danger suffit.</p></div>
  <div class="alerte alerte--attention" role="status"><p class="alerte__titre">À faire contrôler dans les prochains jours.</p><p>Roulez prudemment.</p></div>
  <div class="alerte" role="status"><p class="alerte__titre">Pas d’urgence.</p><p>À vérifier lors d’un prochain passage.</p></div>
  <ul class="liste-choix liste-choix--colonnes" id="factice-choix-courant">
    <li><a class="bouton-choix" href="/composants" aria-current="page">Choix courant</a></li>
    <li><a class="bouton-choix" href="/">Autre choix</a></li>
    <li><button class="bouton-choix" type="button" aria-pressed="true">Option enfoncée</button></li>
    <li><button class="bouton-choix" type="button" aria-pressed="false">Option relâchée</button></li>
  </ul>
  <fieldset class="champ" id="factice-groupe"><legend>Retrait ou pose</legend><div class="liste-choix">
    <label class="choix-tuile"><input type="radio" name="factice-modalite" value="retrait"> <span>Retrait au garage</span></label>
    <label class="choix-tuile"><input type="radio" name="factice-modalite" value="pose"> <span>Pose à l’atelier</span></label>
  </div></fieldset>
  ${rendreFigureTechnique(FIGURES_FAMILLES['freinage'] as FigureTechnique, { numero: 1, id: 'factice-fig-freinage' })}
  <div class="enseigne section"><div class="conteneur pile"><p class="surtitre">Zone sombre</p><ul class="liste-actions"><li><a class="bouton bouton--principal" href="/">Principal</a></li><li><a class="bouton bouton--secondaire" href="/">Secondaire</a></li></ul></div></div>
</div>`

function moduleFactice(): ModuleContexte {
  const bloc = (contenu: ReturnType<typeof html>) => async () => contenu
  return {
    nom: 'factice',
    enregistrer: (app, outils) => {
      app.get('/composants', async (_requete, reponse) =>
        outils.envoyerPage(reponse, {
          titre: 'Composants',
          description: 'Page d’essai du système de design.',
          chemin: '/composants',
          contenu: pageComposants,
          indexable: false,
        }),
      )
      app.get('/figures', async (_requete, reponse) =>
        outils.envoyerPage(reponse, {
          titre: 'Figures',
          description: 'Page d’essai : les figures techniques des familles.',
          chemin: '/figures',
          contenu: html`<div class="conteneur section"><ul class="grille-cartes">${Object.entries(FIGURES_FAMILLES).map(([slug, figure], index) => html`<li>${rendreFigureTechnique(figure, { numero: index + 1, id: `factice-${slug}` })}</li>`)}</ul></div>`,
          indexable: false,
        }),
      )
      app.get('/barre-masquee', async (_requete, reponse) =>
        outils.envoyerPage(reponse, {
          titre: 'Barre masquée',
          description: 'Page d’essai : un formulaire qui masque la barre fixe.',
          chemin: '/barre-masquee',
          contenu: html`<div class="conteneur section">${blocRappel}</div>`,
          indexable: false,
          barreFixe: 'masquee',
        }),
      )
      app.get('/barre-rappel', async (_requete, reponse) =>
        outils.envoyerPage(reponse, {
          titre: 'Barre au service de la page',
          description: 'Page d’essai : la barre fixe mène au rappel de la page.',
          chemin: '/barre-rappel',
          contenu: html`<div class="conteneur section"><h1>Résultat d’essai</h1></div>`,
          indexable: false,
          barreFixe: { lienRappel: LIEN_RAPPEL_FACTICE },
        }),
      )
      app.get('/champ', async (_requete, reponse) =>
        outils.envoyerPage(reponse, {
          titre: 'Champ',
          description: 'Page d’essai : un seul champ.',
          chemin: '/champ',
          contenu: html`<div class="conteneur section">${blocRappel}</div>`,
          indexable: false,
        }),
      )
    },
    blocsAccueil: {
      'pre-diagnostic': bloc(blocPreDiagnostic),
      information: bloc(blocInformation),
      'recherche-pieces': bloc(blocRecherchePieces),
      catalogue: bloc(blocCatalogueGrille),
      questions: bloc(blocQuestions),
      garage: bloc(blocGarage),
      rappel: bloc(blocRappel),
      encart: bloc(blocEncart),
    },
  }
}

export interface ServeurFactice {
  readonly origine: string
  readonly app: FastifyInstance
}

/** Démarre le serveur d'essai sur le port donné (0 : un port libre). */
export async function demarrerServeurFactice(
  statut: EtatOuverture | StatutOuverture,
  port = 0,
): Promise<ServeurFactice> {
  const cadre = cadreFactice(statut)
  const app = await creerServeur({
    modules: [moduleFactice()],
    fournirCadre: async () => cadre,
    urlPublique: `http://${HOTE}:${port}`,
    racinePublique: RACINE_PUBLIQUE,
    niveauJournal: 'warn',
    verifierSessionGaragiste: async () => false,
    protectionFormulairesGaragiste: PROTECTION_FORMULAIRES_ESSAI,
    maintenant: () => new Date(),
    mode: 'demonstration',
    preDiagnosticPublie: true,
  })
  const adresse = await app.listen({ port, host: HOTE })
  return { origine: adresse, app }
}

if (import.meta.url === `file://${process.argv[1] ?? ''}`) {
  const etat = (process.env['STATUT_FACTICE'] ?? 'ouvert') as EtatOuverture
  const { origine } = await demarrerServeurFactice(etat, Number(process.env['PORT'] ?? 0))
  console.log(`Serveur factice du design sur ${origine}`)
}
