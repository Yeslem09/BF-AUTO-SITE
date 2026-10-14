# Site du garage BF Auto

Site du garage BF Auto, 7 rue Demanieux, 94600 Choisy-le-Roi. Rendu serveur en
TypeScript (Fastify), JavaScript en amélioration progressive, architecture
hexagonale par contextes. Cadrage complet : `docs/BRIEF.md`.

## Démarrer

```sh
pnpm install
pnpm dev                 # ressources client surveillées + serveur relancé à chaque modification
pnpm construire          # ressources client + compilation dans dist/
pnpm demarrer            # lance dist/demarrer.js (après construire)
pnpm garagiste:lien      # lien de connexion de secours à l'espace garagiste (après construire)
pnpm garagiste:reinitialiser # révoque toutes les sessions de l'espace garagiste (après construire)
```

Configuration par variables d'environnement, toutes documentées en tête de
`src/configuration.ts` : `PORT`, `HOTE`, `URL_PUBLIQUE`, `CHEMIN_DONNEES`,
`CHEMIN_PUBLIC`, `BASE_SQLITE`, `COURRIEL_GARAGE`, `COURRIEL_GARAGISTE`,
`COURRIEL_RESPONSABLE_SITE`, `NIVEAU_JOURNAL`, `MODE_SITE`, `TRUST_PROXY` (1 sur Render).
Courriel, lecture de la boîte et SMS : `COURRIEL_FOURNISSEUR` (Gmail par défaut),
`SMTP_*`, `IMAP_*`, `SMS_*`, décrits dans `docs/exploitation/courriel-et-sms.md` ;
`pnpm courriel:tester` et `pnpm sms:tester` vérifient les canaux.

En production (mode par défaut), la racine de composition refuse de démarrer
tant qu'une donnée bloquante manque : garage, catalogue et canal de
notification des demandes (Gmail : `SMTP_UTILISATEUR` et `SMTP_MOT_DE_PASSE`),
tous listés d'un coup. Pour voir le site avec les propositions à valider :

```sh
MODE_SITE=demonstration BASE_SQLITE=var/demo.sqlite pnpm dev
```

L'identité du garage (adresse, téléphone, horaires) vit dans le seul fichier
`donnees/garage.json`.

## Porte de qualité

```sh
pnpm run ci              # lint (prettier, frontières, interdits) + typecheck + client + tests
pnpm run e2e             # parcours navigateur, bureau et iPhone 13 (port : PORT_E2E, 4178 par défaut)
pnpm run captures -- http://127.0.0.1:3000 docs/captures/essai / /demande
```

`scripts/verifier-interdits.mjs` refuse les tirets cadratin et demi-cadratin,
les emoji, les ombres et halos CSS et le texte SVG dans `public/`.

## Architecture

```
src/contrats/        formes d'échange entre contextes (types, chemins publics), sans dépendance
src/contextes/<c>/   domaine/ (pur), application/ (cas d'usage et ports), adaptateurs/, module.ts
src/web/             adaptateur HTTP partagé : gabarit html, mise en page, serveur ; aucun contexte
src/composition.ts   racine de composition unique ; src/demarrer.ts point d'entrée
public/              fichiers statiques ; css/bf-auto.css et js/ sont générés
donnees/             données versionnées, validées au chargement
```

Les frontières sont vérifiées par `dependency-cruiser` : domaine pur, application
sans adaptateur, contextes étanches, contrats sans dépendance, web sans contexte,
composition au sommet, aucun cycle, aucun import non résolu.

## Ajouter à un contexte sans toucher aux fichiers partagés

Chaque contexte ne modifie que son dossier `src/contextes/<c>/` (plus ses
données `donnees/<c>*`, ses images `public/img/<c>/` et ses parcours
`tests/e2e/<c>*.spec.ts`).

- **Routes** : dans `module.ts`, la fonction `assembler<C>(dépendances)` crée ses
  adaptateurs et cas d'usage, puis renvoie un `ModuleContexte` dont
  `enregistrer(app, outils)` déclare les routes Fastify. Chaque route répond par
  `outils.envoyerPage(reponse, vue)` : la couche web ajoute en-tête, navigation,
  pied de page, statut d'ouverture, sécurité, cache et typographie française
  (espace insécable avant « : », « ? » et « ! » dans tout texte affiché). Dans l'espace garagiste :
  `outils.exigerGaragiste` sur chaque route, `outils.jetonFormulaireGaragiste`
  dans chaque formulaire (champ `CHAMP_JETON_FORMULAIRE`) et
  `outils.exigerFormulaireGaragiste` sur chaque POST.
- **Vues** : fonctions qui renvoient une `VuePage` (`titre`, `description`,
  `chemin`, `contenu` écrit avec le gabarit `html`, `rubrique`, `scripts`,
  `indexable`, `statutHttp`), importées depuis `src/web/index.ts`. Le gabarit
  échappe tout ; `brut()` est réservé au HTML de confiance.
- **Styles** : `adaptateurs/web/styles.css`, classes préfixées par le nom du
  contexte. La construction les assemble dans la feuille unique
  `/css/bf-auto.css`, après `jetons.css` et `site.css` (dont on réutilise les
  jetons et composants : `.conteneur`, `.section`, `.pile`, `.bouton`, `.carte`,
  `.champ`, `.message`, `.pastille`).
- **Scripts navigateur** : chaque fichier `adaptateurs/web/client/<nom>.ts` devient
  `/js/<c>/<nom>.js`, à citer dans `VuePage.scripts`. Les modules importés vivent
  dans un sous-dossier. Un formulaire marqué `data-envoi-unique` est protégé du
  double envoi par le script commun.
- **Tests** : `creerServeurEssai([module])` (`src/web/essai.ts`) monte le serveur
  complet pour `app.inject()`.

Seul `src/composition.ts` reste à modifier si un contexte a besoin d'une
nouvelle variable d'environnement ou d'une capacité offerte par un autre.
