# Brief projet : site internet du garage BF Auto

Document de cadrage commun à tous les agents du projet. À lire en entier avant
de produire quoi que ce soit.

## 1. Demande client (verbatim reformulé)

Anthony veut un site internet pour le garage automobile **BF Auto**, en
**architecture hexagonale** (ports et adaptateurs), à partir d'une maquette
dessinée à la main. Il demande :

1. une **analyse Kano** du besoin ;
2. une **étude de la concurrence** pour voir ce qui se fait de mieux ;
3. un **logo** « ultra bien fait dès le départ » ;
4. un site « nickel » ;
5. avant livraison, une **notation par un jury d'utilisateurs** qui regarde le
   site : la note doit être excellente.

## 2. Lecture de la maquette (`docs/maquette/maquette-client.jpg`)

Feuille A4 paysage, page « 1 ». Disposition en trois colonnes :

| Zone | Contenu dessiné | Interprétation |
|---|---|---|
| Haut gauche | LOGO | Logo BF Auto, cliquable vers l'accueil |
| Haut centre (bandeau) | « Phrase d'accroche » | Promesse de marque en tête de page |
| Colonne gauche, haut | « CATALOGUE : pièces garage » | Accès au catalogue de pièces détachées |
| Colonne gauche, bas | « ? » | Zone non définie par le client : aide, FAQ, ou autre (à trancher au Kano) |
| Centre (grand bloc) | « INFORMATION » | Présentation du garage, services |
| Centre, bas | « Diagnostic mécanique rapide avec question simple » | Assistant de diagnostic par questions simples |
| Colonne droite, bas | « Info garage : numéro, adresse, formulaire de contact » | Coordonnées + formulaire |

C'est une **inspiration**, pas un gabarit à recopier au forceps : garder
l'intention (catalogue, information, diagnostic par questions, contact
toujours à portée) et la hiérarchie, concevoir la mise en page pour ce
qu'elle communique, et la rendre excellente sur mobile.

## 3. Identité du garage (confirmée par Anthony le 2026-09-23)

Le garage est **BF Auto, à Choisy-le-Roi (Val-de-Marne, 94)** :

- adresse : **7 rue Demanieux, 94600 Choisy-le-Roi** ;
- téléphone : **06 05 92 28 38** (mobile) ;
- fermeture constatée à **19 h 00** (horaires complets : À VALIDER) ;
- fiche Google actuelle intitulée « Garage auto choisy 94 », catégorie Garage
  automobile, **bientôt renommée « BF Auto »** : le site doit porter le nom
  BF Auto et rester cohérent avec la fiche Google renommée (même nom, même
  adresse, même téléphone : cohérence NAP du référencement local) ;
- **aucun avis** Google à ce jour : fait structurant (un garage sans avis doit
  construire la confiance autrement, et le site peut aider à collecter les
  premiers avis).

Les autres garages nommés « BF Auto » en France (Roussillon 38, Erbrée 35,
Corbeil-Essonnes 91, Aspiran 34) **ne sont pas le client** : au mieux des
références concurrentielles. Concurrence pertinente : garages et centres auto
de Choisy-le-Roi et des communes voisines (Vitry-sur-Seine, Thiais, Orly,
Villeneuve-le-Roi, Créteil). Étude dédiée :
`docs/recherche/06-concurrence-locale-choisy.md` (à lire si présente).

Toute donnée d'identité (adresse, téléphone, horaires, SIRET, prestations,
prix) vit dans UN SEUL fichier de configuration ; ce qui n'est pas confirmé
ci-dessus reste marqué à valider. Ne jamais inventer un fait (avis client,
certification, prix réel, nombre d'années d'expérience) et le présenter comme
vrai.

## 4. Contraintes de goût et de qualité (non négociables)

- **Palette sobre, feutrée**, jamais de néon ni de couleur saturée criarde.
  Référence esthétique d'Anthony : tons navy, teal, sauge, or sourd, ratios
  de contraste AA au minimum, AAA sur le texte courant si possible.
- **Aucun halo** : pas de box-shadow diffuse, pas de glow, pas d'ombre portée
  marquée. Bordures fines (1 px) et aplats.
- **Aucun emoji ni pictogramme décoratif** dans l'interface. Les pastilles
  texte sobres sont admises. Les illustrations techniques au trait (style
  plan ou dessin industriel) sont admises si elles servent le contenu.
- **Aucun tiret cadratin ni demi-cadratin** (caractères U+2014 et U+2013)
  nulle part : textes, code, commentaires, documentation, commits.
- **Français** par défaut, sans anglicisme superflu.
- **Instantanéité perçue** : aucune police ni ressource distante (polices
  auto-hébergées), pages rendues côté serveur, JavaScript en amélioration
  progressive seulement, animations brèves (< 300 ms) respectant
  `prefers-reduced-motion`.
- **Simple et intuitif** : utilisable du premier coup par un non-informaticien
  sur téléphone. Champs à référentiel connu = listes ou choix contraints,
  jamais de texte libre nu quand un choix suffit.
- **Accessibilité** : WCAG 2.2 AA, navigation clavier complète, focus visible.
- **Craftsmanship** : SOLID, KISS, DRY, YAGNI appliqués concrètement ; tests
  citoyens de première classe ; aucune valeur magique.
- **Pièges de conception** à relire avant de concevoir un écran :
  `/Users/anthonybalou/Documents/Anthony - Memoire perso/wiki/07-Travail/AGATE/methodes/pieges-de-conception-logicielle.md`

## 5. Choix techniques arrêtés

- **TypeScript partout** (demande d'Anthony) : domaine, application,
  adaptateurs, serveur et scripts navigateur. `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`. Node 20, pnpm 9, modules ES.
- Alignement sur les conventions de MPermis Cloud (`~/Documents/mpermis-cloud`,
  lecture seule, à consulter pour l'esprit) : **Fastify** (+ `@fastify/static`,
  `@fastify/formbody`), **vitest**, **prettier**, **tsc --noEmit**,
  **dependency-cruiser** qui verrouille les frontières hexagonales en porte,
  **@playwright/test 1.62.1** (navigateur déjà installé sur la machine), `tsx`
  pour exécuter.
- **Rendu serveur** par fonctions TypeScript typées retournant du HTML via un
  gabarit étiqueté qui échappe tout par défaut (aucun moteur de gabarit
  externe). CSS écrit à la main (pas de framework CSS). JavaScript client
  écrit en TypeScript, compilé par esbuild, en **amélioration progressive** :
  chaque parcours fonctionne sans JavaScript.
- **Architecture hexagonale** par contextes bornés dans `src/contextes/<contexte>/`
  avec `domaine/` (TypeScript pur, aucun paquet externe), `application/` (cas
  d'usage, ne connaît que le domaine et ses ports), `adaptateurs/` (entrants
  et sortants). Les contextes ne s'importent jamais entre eux : les échanges
  passent par `src/contrats/`. Adaptateur entrant HTTP dans `src/web/`. Une
  racine de composition unique `src/composition.ts`. Données catalogue et
  diagnostic en fichiers versionnés validés au chargement, demandes en SQLite,
  notification courriel remplaçable par la console en développement.
- Déploiement cible : Render (aucun déploiement sans accord d'Anthony).

## 6. Arborescence des livrables de conception

- `docs/recherche/` : études concurrentielles et captures.
- `docs/conception/kano-site-bf-auto.md` : analyse Kano (tranche, ne décrit pas).
- `docs/logo/` : concepts, notation, logo final.
- `docs/jury/` : notations du jury utilisateurs.
