# Système de design du site BF Auto

Structure de la direction V3 (bande d'ouverture sombre, zones délimitées, greffes du jury),
palette graphite et orange atelier (décision finale d'Anthony,
`docs/conception/kano-couleurs.md`, graphite éclairci `#3A3935`), logo final « écrou » avec
chat (`docs/logo/final-ecrou`), pièces
détachées en tête, figure technique légendée en élément signature. Ce document dit, pour
chaque composant, la classe, le HTML attendu, les états et l'accessibilité.

Page d'essai vivante (blocs factices, jamais livrés) :
`PORT=4317 pnpm exec tsx tests/e2e/design-factice.ts`, puis `/`, `/composants`, `/champ`.

## 1. Règles communes

- **Couleurs : un seul fichier.** Toutes les couleurs vivent dans `public/css/jetons.css`.
  Aucune autre feuille, aucun gabarit, aucun SVG en ligne n'écrit de couleur : on emploie
  les **rôles** (`--texte`, `--fond-surface`, `--lien`, `--bordure-champ`...) ou
  `currentColor`. Portes : `src/web/feuilles-de-style.test.ts` (couleur en dur, propriété
  employée mais jamais définie, budget) et `src/web/contrastes.test.ts` (chaque paire de
  rôles, en zone claire et dans chaque zone sombre).
- **Zones.** Une zone sombre redéfinit les rôles : un composant posé dedans s'inverse seul.
  Zones sombres : `.entete`, `.ouverture`, `.enseigne`, `.panneau__bandeau`, `.pied`,
  `.barre-fixe`, `.menu__panneau`, `.zone-sombre`. Zones claires imbriquées : `.plaque`,
  `.zone-claire`. Changer une zone de camp : déplacer son sélecteur d'un bloc de rôles à
  l'autre dans `jetons.css`, et régler son fond à l'étage 3 du même fichier.
- **Orange atelier** : boutons principaux (texte graphite), filets, grands textes. Sur le
  graphite il ne fait que 3,48:1 : le petit texte orange y passe en orange clair
  (`--accent-texte`). Liens sur clair en orange foncé (AA).
- **Alertes du pré-diagnostic** (`--alerte-danger`, `--alerte-attention`,
  `--alerte-neutre`) : jamais l'orange de marque dans la zone de résultat, hors boutons.
- **Deux graisses** : `--graisse-normale` (400), `--graisse-demi` (600).
- **Aucune ombre, aucun halo, aucun dégradé visible** ; bordures de 1 px ; rayons
  `--rayon-1` (4 px) et `--rayon-2` (6 px).
- **Espacements** `--espace-1` à `--espace-8` (4 à 64 px). **Mouvement** `--duree` (200 ms),
  `--duree-rapide` (150 ms), nuls sous `prefers-reduced-motion`.
- **Cibles** : `--cible-tactile` (44 px) au minimum, `--cible-confort` (48 px) pour les
  boutons et les choix.
- **Tailles de texte (public âgé, jury de la passe 1)** : texte courant `--taille-base`
  à 16 px sur téléphone et 18 px dès 1024 px ; rien d'utile sous 16 px (`--taille-petite` :
  statut, horaires, aides, légendes, sous-titres) ; `--taille-mini` (14 px) réservée aux
  capitales espacées (surtitres, titres du pied). Portes : `src/web/tailles.test.ts`
  (jetons) et `tests/e2e/design.spec.ts` (texte rendu, pages d'essai et pages réelles).
- **Toucher** : aucun reflet bleu de Chrome Android (`-webkit-tap-highlight-color`
  neutralisé sur `html`) ; chaque commande a son état d'appui (`:active`) : bouton orange
  en orange clair (`--bouton-fond-appui`), cadres et tuiles en bord foncé et fond
  `--fond-survol`, liens comme au survol. Porte : `feuilles-de-style.test.ts`.
- **Préfixes** : un contexte préfixe ses classes par son nom et compose les classes
  ci-dessous sans les écraser.

## 2. Couche commune (rendue par `src/web`, rien à faire dans les contextes)

| Élément | Rendu | Comportement |
|---|---|---|
| En-tête `.entete` | logo avec chat à 40 px dès 768 px, sans chat à 32 px sur téléphone (24 px sous 384 px, 20 px sous 360 px) ; navigation cinq entrées (Pièces détachées d'abord, « Accès et horaires » en dernier, dès 1024 px) ou menu `<details class="menu">` ; bouton d'appel `.bouton-appel` orange avec le numéro en chiffres (16 px au moins, jamais coupé), sauf rubrique `garagiste` (aucun appel poussé dans l'espace) | le verbe « Appeler » s'affiche dès 1280 px ; le lien « Pré-diagnostic » disparaît quand `CadrePage.preDiagnosticPublie` vaut faux ; la ligne tient dans ses gouttières de 320 à 767 px, menu ouvert compris, et sur une ligne de 1024 à 1440 px (tests navigateur) ; Échap ferme le menu ouvert et rend le focus au bouton « Menu » (`src/web/client/modules/menu.ts`, amélioration progressive : sans script, le menu s'ouvre et se ferme quand même) |
| Ligne de statut `.entete__statut` | pastille `statut--pastille`, adresse courte, Itinéraire (dès 768 px) | s'efface sur l'accueil si le bloc `statut` est fourni ; un point masqué clôt la pastille : le lecteur d'écran annonce le statut, marque la pause, puis l'adresse |
| Bandeau de mode `.bandeau-mode` | démonstration ou relecture, rien en production ; posé en tête de l'en-tête, donc dans le repère « banner » (aucun texte hors repère, règle `region` d'axe-core), zone claire (`jetons.css`) | |
| Pied `.pied` | logo avec chat, puis un bloc chacun : adresse et itinéraire, téléphone, horaires (statut et lien), informations légales | une fiche imprimée peut garder le téléphone et masquer les horaires |
| Impression | menu, barre fixe, bandeau de mode et lien d'évitement masqués ; les zones sombres repassent en encre sur papier (`jetons.css`) | |
| Barre du navigateur | `<meta name="theme-color">` lue au démarrage dans la feuille construite (jeton `--couleur-theme`, graphite) | |
| Barre fixe `.barre-fixe` | téléphone seulement (moins de 768 px de large, 480 px de haut au moins : ni téléphone couché, ni zoom à 400 %), toutes les pages sauf rubrique `garagiste` et page qui la masque (`VuePage.barreFixe`, ci-dessous) | ouvert : Appeler (numéro) et Itinéraire ; fermé : Être rappelé, avec le moment du rappel en une ligne courte calculée depuis le statut (« dès 8 h 30 », « demain 8 h 30 », « lundi 9 h », « le 24 août » ; `momentDuRappel`), et Appeler ; à confirmer : Appeler et Être rappelé. Hauteur fixe : libellé et précision tiennent chacun sur une ligne, points de suspension au pire, de 320 à 767 px (test navigateur, statut long compris). Une virgule masquée sépare libellé et précision dans le nom accessible. Masquée tant qu'un champ texte a le focus ; `scroll-padding-bottom` égal à sa hauteur |
| Pages 404, 500, 4xx, connexion requise | surtitre, titre, explication, bouton, puis les trois intentions en `liste-choix` | sans pré-diagnostic publié, les tarifs remplacent son lien |
| Typographie (`src/web/typographie.ts`) | à l'envoi de chaque page : espace insécable avant « : », « ? », « ! » ; heure liée (« 19 h », « 8 h 30 ») ; nombre lié à son unité (« 12 € », « 5 km », « 1 200 km », « 2,5 bar ») | nœuds de texte seulement : jamais un attribut, ni `script`, `style`, `textarea`, `pre` ; rien à faire dans les contextes, qui écrivent des espaces ordinaires. Le numéro du garage ne se coupe jamais dans le bouton d'appel, la barre fixe et le pied (`white-space: nowrap`, test navigateur) ; dans un texte d'un contexte, le lier soi-même (espaces insécables ou lien `tel:` court) |

### Barre fixe au service de la page : `VuePage.barreFixe`

Champ facultatif de la vue qu'une route remet à `envoyerPage` (type `BarreFixePage`,
exporté par `src/web/index.ts`). Absent : la barre calculée depuis le statut.

| Valeur | Effet | Pages qui l'emploient |
|---|---|---|
| `{ lienRappel: '/demande?type=rappel&prediagnostic=<code>' }` | le bouton « Être rappelé » de la barre mène à ce chemin local au lieu du formulaire vide ; garage ouvert, ce rappel remplace l'Itinéraire à côté d'Appeler | résultat du pré-diagnostic : la demande emporte les réponses, rien n'est à réexpliquer |
| `'masquee'` | aucune barre (et plus de marge réservée en bas) ; le bouton d'appel de l'en-tête reste | formulaires de demande, écran « Confirmez l'envoi », confirmation d'envoi : rien ne détourne de l'action de la page ni n'ouvre un second formulaire vide |

```ts
outils.envoyerPage(reponse, {
  titre, description, chemin, contenu,
  barreFixe: { lienRappel: `/demande?type=rappel&prediagnostic=${code}` },
})
outils.envoyerPage(reponse, { titre, description, chemin, contenu, barreFixe: 'masquee' })
```

Offert aux contextes par `src/web/index.ts` : `rendreStatutOuverture`,
`rendrePastilleStatut`, `lienItineraire(adresse)`, `SYMBOLE`, `rendreFigureTechnique` et
`FIGURES_FAMILLES` (types `FigureTechnique`, `OptionsFigure`). La Fig. 1 de l'accueil
(`FIGURE_FREIN_A_DISQUE`) reste propre à la couche web. Le logo n'existe que dans
`src/web/logo.ts` (tracés) et `src/web/ressources.ts` avec `public/` (icônes).

## 3. Accueil par emplacements

Ordre du document, celui du téléphone : `statut`, `pre-diagnostic`, `recherche-pieces`,
`catalogue`, `information`, `questions`, `garage`, `rappel`, `encart`.

| Emplacement | Fourni par | Où, au bureau | Ce que la couche web ajoute |
|---|---|---|---|
| `statut` | garage | tête de la bande d'ouverture | efface la ligne de statut de l'en-tête sur l'accueil |
| `pre-diagnostic` | pré-diagnostic | bande d'ouverture, à droite | la **plaque** (`.plaque` > `.plaque__filet`) : ne pas en remettre une |
| `recherche-pieces` | catalogue | bande d'ouverture, à gauche | les raccourcis Rendez-vous et Tarifs dessous (sans ce bloc : Pièces détachées, Rendez-vous, Tarifs) |
| `catalogue` | catalogue | pleine largeur, juste sous la bande | rien : le bloc porte sa grille de cartes |
| `information` | garage | colonne gauche, en haut | panneau blanc, et la **Fig. 1** (frein à disque légendé) en grand à la fin du bloc |
| `questions` | garage | colonne gauche, sous l'atelier | panneau blanc |
| `garage`, `rappel` | garage, demandes | colonne droite | panneau blanc chacun |
| `encart` | garage | colonne droite, sous le rappel | rien : le bloc est un `encart` |

Deux colonnes dès 768 px (1,05 et 1) : à gauche l'atelier puis les questions, à droite
le garage, le rappel puis l'encart. Les trois colonnes d'avant laissaient un écran et demi
vide sous les questions et l'atelier (jury de la passe 1) ; depuis les prix d'exemple de
l'atelier, l'encart sous les questions laissait encore 500 px vides sous le rappel, d'où sa
place sous le rappel. Mesuré sur l'accueil réel de 768 à 1440 px, les deux pieds de colonne
sont à moins de 180 px l'un de l'autre (porte : un tiers d'écran au plus,
`tests/e2e/design.spec.ts`). L'ordre du clavier suit l'ordre de
lecture, une colonne puis l'autre ; une colonne seule prend toute la largeur.

La bande porte aussi le titre de page (`h1`, visible dès 768 px), l'accroche de
l'identité sur une ligne (lieu, promesse, dernier membre après la dernière virgule à
l'accent, en orange clair sur téléphone pour tenir 4,5:1, en orange atelier dès 768 px
où elle devient un grand texte), puis les activités du garage (`IdentiteGaragePublique.activites`,
« Mécanique, entretien, carrosserie et peinture, toutes marques. »), rien si l'identité
ne les fournit pas. Un bloc absent n'est pas rendu, une colonne vide non plus. Un bloc peut
renvoyer `null` (`RendreBlocAccueil`) quand il n'a rien à montrer à cet instant :
l'emplacement est alors absent de la page pour cette requête, sans cadre vide ni texte
d'attente.

## 4. Composants

### Surtitre en ligne de cote : `.surtitre`
`<p class="surtitre">Catalogue</p>` avant un titre : capitales espacées précédées d'un trait
à talons. Couleur `--texte-repere` (orange foncé sur clair, orange clair sur graphite), AA.

### Boutons : `.bouton` avec `.bouton--principal` ou `.bouton--secondaire`
`<a class="bouton bouton--principal" href="...">Être rappelé</a>` ou `<button class="bouton
bouton--principal" type="submit">`. Principal : aplat orange atelier, texte graphite, survol
orange clair ; identique sur clair et sur graphite (C-P2). Secondaire : cadre 1 px.
Désactivé : `aria-disabled="true"` ou `disabled`. Hauteur 48 px. Groupe :
`<ul class="liste-actions">` (pleine largeur sous 480 px).

### Liste de choix en boutons bordés : `.liste-choix` > `li` > `.bouton-choix`
Toute réponse, option ou raccourci : un vrai bouton ou un lien, cadré, 48 px de haut.
```html
<form method="get" action="/pre-diagnostic">
  <ul class="liste-choix liste-choix--colonnes">
    <li><button class="bouton-choix" type="submit" name="remarque" value="voyant">Un voyant s’allume</button></li>
    <li><button class="bouton-choix bouton-choix--incertain" type="submit" name="remarque" value="autre">Autre chose ou je ne sais pas</button></li>
  </ul>
</form>
```
Deux lignes : `<span class="bouton-choix__titre">` puis `<span class="bouton-choix__aide">`.
États : survol (bord foncé, fond `--fond-survol`), focus visible 3 px, appui.
**Courant** : `aria-current` (`page` pour l'onglet ou la page affichée, `step`, `true` pour
la réponse déjà donnée) ou `aria-pressed="true"` (bouton à bascule) : aspect d'une tuile
cochée, bord doublé et fond `--fond-survol`, le focus restant visible par-dessus ;
`aria-current="false"` et `aria-pressed="false"` gardent l'aspect ordinaire.
`--incertain` : cadre en tirets. `--colonnes` : colonnes automatiques dès 14 rem. Aucun
chevron : le cadre dit « cliquable ».
```html
<ul class="liste-choix">
  <li><a class="bouton-choix" href="/demande?type=devis" aria-current="page">Devis</a></li>
  <li><a class="bouton-choix" href="/demande?type=rappel">Être rappelé</a></li>
</ul>
```

### Option à cocher en tuile : `.choix-tuile`
`<label class="choix-tuile"><input type="radio" name="moment" value="matin"> <span>Le matin</span></label>`
dans une `.liste-choix`, sous un `<fieldset class="champ"><legend class="champ__libelle">`.
Coché : bord doublé, fond `--fond-survol` ; focus sur la tuile entière. Case isolée
(consentement) : `.choix`, sans cadre.

**Groupe de champs** : `<fieldset class="champ">` et sa `<legend>`. Le socle donne à la
légende l'aspect d'un libellé (`champ__libelle` facultatif) et la rend flottante : elle
devient un enfant ordinaire de la grille, si bien que l'écart de `.champ` (8 px)
s'applique sous elle comme sous le libellé d'un champ seul. Aide et erreur du groupe :
`aria-describedby` sur le `fieldset`.

### Champs : `.champ`, `.champ__libelle`, `.champ__saisie`, `.champ__aide`, `.champ__erreur`
```html
<div class="champ">
  <label class="champ__libelle" for="telephone">Téléphone</label>
  <input class="champ__saisie" id="telephone" name="telephone" type="tel"
         aria-describedby="telephone-aide telephone-erreur" aria-invalid="true">
  <p class="champ__aide" id="telephone-aide">Exemple : 06 12 34 56 78</p>
  <p class="champ__erreur" id="telephone-erreur">Numéro incomplet : dix chiffres attendus.</p>
</div>
```
`<select class="champ__saisie">` : flèche tracée en CSS. Erreur : `aria-invalid="true"`
(bord doublé rouge) et message relié par `aria-describedby`. Un champ reste blanc même dans
une zone sombre. Un champ texte qui a le focus masque la barre fixe basse.

### Recherche par mot : `form.recherche` > `.recherche__ligne`
`<form class="recherche" role="search" method="get" action="/pieces-et-reparations">` avec
un `label.champ__libelle`, puis `<div class="recherche__ligne">` : `input.champ__saisie`
(type search) et `button.bouton.bouton--principal`. Les deux se replient sur deux lignes
quand la place manque.

### Puces de familles : `ul.puces-familles` > `li` > `a.puce-famille`
Pour la bande d'ouverture : lien bordé de 48 px, petite figure au trait et nom.
```html
<li><a class="puce-famille" href="/pieces-et-reparations/freinage">
  <svg class="puce-famille__dessin" viewBox="0 0 80 56" aria-hidden="true" focusable="false"><use href="/img/familles/freinage.svg#dessin"></use></svg>
  <span>Freinage</span></a></li>
```

### Grille des familles : `ul.grille-familles` > `li` > `a.carte-famille`
Pour la section pleine largeur : carte blanche, figure au trait sur quadrillage, nom,
précision ; toute la carte est le lien.
```html
<li><a class="carte-famille" href="/pieces-et-reparations/freinage">
  <span class="carte-famille__planche"><svg class="carte-famille__dessin" viewBox="0 0 80 56" aria-hidden="true" focusable="false"><use href="/img/familles/freinage.svg#dessin"></use></svg></span>
  <span class="carte-famille__nom">Freinage</span>
  <span class="carte-famille__aide">Plaquettes, disques, étriers</span></a></li>
```
La planche garde sa taille ; dans une rangée plus haute, la place en trop va sous le
texte (`align-content: start`). Survol : bord foncé, dessin à l'accent.

### Figure technique (élément signature) : `rendreFigureTechnique(figure, { numero, id })`
Dessin au trait à l'encre graphite sur quadrillage millimétré discret, repères numérotés
reliés par des traits de rappel, légende « Fig. N » qui nomme chaque repère et signale les
parties cachées (en tirets). La légende est le nom accessible du dessin (`role="img"`,
`aria-labelledby`). Numéros et légende naissent des mêmes données : ils ne peuvent pas se
contredire.
```ts
rendreFigureTechnique(FIGURES_FAMILLES['freinage'], { numero: 1, id: 'figure-freinage' })
rendreFigureTechnique(FIGURES_FAMILLES['batterie'], { numero: 2, id: 'figure-batterie', reperes: false })
```
`reperes: false` : dessin seul, légende sans numéros. L'`id` doit être unique dans la page.
Dix-huit figures de familles, clés = identifiants des familles du catalogue (freinage,
batterie, pneus, vidange-et-filtres, distribution, embrayage, amortisseurs-et-suspension,
echappement, demarrage-et-charge, climatisation, eclairage, essuie-glaces,
moteur-et-injection, boite-de-vitesses, diagnostic-electronique, pare-brise-et-vitrage,
carrosserie, peinture) ; dessins dans `public/img/familles/<identifiant>.svg`, trait en
`currentColor`, groupe `#dessin`. Catalogue et pré-diagnostic les lisent au même endroit :
une même famille montre la même figure partout.

### Illustration technique (vignette, sans légende numérotée) : `figure.illustration-technique`
`<svg class="illustration-technique__dessin" viewBox="0 0 80 56">` avec `<use>` vers le
dessin, puis `figcaption.illustration-technique__legende`. Grille :
`<ul class="grille-illustrations">`.

### Conduites à tenir du pré-diagnostic : `.alerte`
```html
<div class="alerte alerte--danger" role="status"><p class="alerte__titre">Ne roulez pas : appelez-nous.</p><p>…</p></div>
<div class="alerte alerte--attention" role="status"><p class="alerte__titre">À faire contrôler dans les prochains jours.</p><p>…</p></div>
<div class="alerte" role="status"><p class="alerte__titre">Pas d’urgence.</p><p>…</p></div>
```
Rouge plein et texte blanc ; cadre ambre épais sur fond pâle ; cadre gris. Le titre écrit
toujours le sens (C-B2).

### Cartes : `.carte`, `.carte--lien` avec `.lien-etendu`, `.grille-cartes`
Surface blanche à bordure fine ; carte entièrement cliquable par le lien du titre en
`.lien-etendu`, seul élément focalisable.

### Panneau : `.panneau`, `.panneau__bandeau`
Surface blanche à bordure nette posée sur le béton ; bandeau graphite facultatif en tête
(`<div class="panneau__bandeau"><h2>…</h2></div>`, zone sombre). Les zones des colonnes de
l'accueil sont déjà mises en panneau.

### Plaque : `.plaque` > `.plaque__filet`
Panneau blanc à filet orange intérieur et angles rentrants (`corner-shape: scoop` là où le
navigateur le sait). Réservée à la question du pré-diagnostic (l'accueil la pose d'office).

### Bande sombre : `.enseigne` (ou `.zone-sombre`)
Aplat graphite, trame de plan à peine visible ; tout composant posé dedans s'inverse.

### Encart : `.encart` (`.encart__symbole`, `.encart__corps`, `.encart__surtitre`, `.encart__titre`)
```html
<aside class="encart" aria-labelledby="titre-nouveau-nom">
  <div class="encart__symbole">${SYMBOLE}</div>
  <div class="encart__corps">
    <p class="encart__surtitre">Nouveau nom, même atelier</p>
    <h2 class="encart__titre" id="titre-nouveau-nom">« Garage auto Choisy 94 » devient BF Auto</h2>
    <p>Même adresse, même numéro. Déjà venu chez nous ? <a href="/avis">Laissez un avis Google</a>.</p>
  </div>
</aside>
```

### Volets : `.liste-volets` > `details.volet` > `summary.volet__titre` et `.volet__contenu`
`<details>` natif, signe plus ou moins en deux traits, 48 px, clavier natif.

### Statut d'ouverture : `.statut` (`--ouvert`, `--ferme`, `--a-confirmer`, `--pastille`)
Toujours par `rendreStatutOuverture` (paragraphe) ou `rendrePastilleStatut` (pastille en
ligne, suivie d'un point masqué qui la sépare de l'adresse pour les lecteurs d'écran). Le
point de couleur double le texte, jamais seul : vert (témoin) ouvert, gris fermé ou à
confirmer. Il est posé dans la marge, centré sur la première ligne : un statut long
(« Fermé exceptionnellement, ouvre demain à 8 h 30 ») passe sur deux lignes sans laisser
le point seul ; la pastille devient alors un cadre arrondi. Heures insécables par la
typographie commune.

### Tableau de tarifs : `table.tableau-tarifs`
`caption`, `thead` (`th.tableau-tarifs__prix` à droite), `tbody` avec `th scope="row"`,
véhicule de référence en `span.tableau-tarifs__detail`, prix en `td.tableau-tarifs__prix`.

### Fil d'Ariane : `nav.fil-ariane` et en-tête de page : `.entete-page`
`<nav class="fil-ariane" aria-label="Fil d’Ariane"><ol><li><a href="/">Accueil</a></li><li><a aria-current="page">…</a></li></ol></nav>` ;
séparateur « / » posé en CSS, non lu. Chaque lien offre une cible de 44 px de haut sans
épaissir la ligne (marge négative égale au surplus) : liens, séparateurs et page
courante restent sur la même ligne de base ; replié sur deux lignes, les cibles se
touchent sans se chevaucher. Aucun correctif local à ajouter dans un contexte. `.entete-page` : bande claire à filet, avec fil
d'Ariane, surtitre, `h1`, `p.texte-intro`.

### Autres
`.message` (`--succes`, `--erreur`), `.pastille`, `.liste-definitions`, `.a-valider`
(relecture seulement : surlignée, jamais soulignée), utilitaires `.visuellement-masque`,
`.texte-courant`, `.texte-note`, `.conteneur`, `.section`, `.pile`, `.pile-serree`.

## 5. Ce que chaque contexte doit adapter

- **garage** : fournir `statut` (pastille et adresse courte), `encart` (« Nouveau nom »,
  lien `/avis`) ; renseigner `activites` dans l'identité publique (la ligne sous
  l'accroche) ; bloc `information` sans cadre propre (panneau et Fig. 1 ajoutés) ;
  `lienItineraire(adresse)` au lieu de sa propre URL ; horaires sans soulignement
  pointillé (greffe 6) ; les valeurs à valider en `.a-valider` en relecture seulement.
- **pre-diagnostic** : bloc d'accueil sans plaque : `.surtitre`, `h2`, formulaire GET avec
  `ul.liste-choix` de `button.bouton-choix` (dernier en `--incertain`), mention en
  `.texte-note`. Résultats en `.alerte`, jamais l'orange ; figure de la famille par
  `rendreFigureTechnique`. Page de résultat : `barreFixe: { lienRappel }` avec le lien de
  rappel prérempli du code, sinon le bouton le plus visible perd le pré-diagnostic.
- **catalogue** : fournir `recherche-pieces` (titre « Pièces détachées », `form.recherche`,
  `ul.puces-familles` des familles principales) et `catalogue` (surtitre, titre,
  `ul.grille-familles` de `a.carte-famille`) ; page de famille avec
  `rendreFigureTechnique` ; tarifs en `tableau-tarifs` ; libellé de navigation « Pièces
  détachées ».
- **demandes** : `.champ`, choix contraints en `choix-tuile`, consentement en `.choix`,
  envoi en `bouton--principal`, messages `.message` ; `modalite=retrait` ou `pose`
  (`PARAMETRES_DEMANDE.modalite`) pré-coche le retrait ou la pose du devis ;
  `barreFixe: 'masquee'` sur les formulaires, l'écran « Confirmez l'envoi » et la
  confirmation d'envoi.
- **acces** : `.entete-page` et `.champ` ; rubrique `garagiste` (sans barre fixe).
- **Tous** : aucune couleur en dur ; les anciens jetons (`--couleur-navy-800`,
  `--couleur-petrole-700`...) n'existent plus, la porte le signale.

## 6. Mesures

- Feuille assemblée (socle et cinq contextes, correction 1 de la couche web) : 61,5 Ko
  minifiés, 10,7 Ko compressés
  (sortie de `feuilles-de-style.test.ts`, porte P-02 : 15 Ko
  compressés). La cible de 25 Ko non compressés n'est pas tenue : les noms de jetons
  français pèsent environ 11 Ko ; les raccourcir à l'assemblage la tiendrait, au prix de
  feuilles illisibles dans l'inspecteur. Décision laissée à l'orchestrateur.
- Polices : deux fichiers préchargés (400 et 600, 13 Ko chacun).
- Logo : tracés posés une fois par page puis réutilisés par `<use>`.
- Aucune ressource d'un autre domaine (test navigateur).
