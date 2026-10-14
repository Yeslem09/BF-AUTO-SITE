# Contexte accès

Entrée du garagiste dans son espace (Kano D5, US-33, US-49) : un seul compte, **aucun mot de passe**, un lien de connexion envoyé au seul canal configuré, une session de 90 jours glissants révocable, des formulaires protégés contre la falsification, un accueil de l'espace et le signalement d'un changement à Anthony.

## Ce que voit le garagiste

1. `/garagiste` sans session renvoie (303) vers `/garagiste/connexion?retour=/garagiste`.
2. Il touche **« Recevoir un lien de connexion »**. Aucune adresse n'est saisie : le lien part vers l'adresse configurée, quel que soit le contenu de la requête ; la réponse est donc la même pour tout le monde et ne révèle aucun compte. Le lien vaut **15 minutes** et **ne sert qu'une fois**. La page dit ce qu'est réellement devenu le lien (voir « Canaux d'envoi ») : jamais « parti » quand il n'a été écrit que dans le journal.
3. Le lien (`/garagiste/connexion/lien?jeton=...`) affiche **« Ouvrir mon espace garagiste »** : l'ouverture se fait par POST, si bien qu'un robot de messagerie qui prévisualise le lien ne le brûle pas (aucun GET ne change d'état). Réutilisé : « Ce lien a déjà servi : demandez-en un nouveau. » ; expiré : « Ce lien a expiré : demandez-en un nouveau. »
4. Il arrive sur la page demandée avant la connexion (`retour`, chemin local de l'espace uniquement, jamais une autre origine), sinon sur `/garagiste`.
5. `/garagiste` : raccourcis vers **Demandes des clients** (`/garagiste/demandes`), avec « 3 demandes à rappeler, dont 1 « Ne roulez pas » » lu par la capacité des demandes `compterDemandesARappeler` (contrat, dépendance facultative : absente ou en panne, l'accueil se tait et l'espace s'ouvre ; aucune mesure de délai), **Fermetures exceptionnelles** (`/garagiste/fermetures`) et **Signaler un changement**, rappel de mettre à jour la fiche Google, mode d'emploi pour poser l'espace sur l'écran d'accueil du téléphone, bouton **Se déconnecter**.
6. `/garagiste/signaler` : « Ce qui change » (horaires habituels, prix, prestation, autre) et un texte de 500 caractères au plus, retours à la ligne comptés pour un caractère comme le fait le champ (le CRLF envoyé par le navigateur est ramené à un seul caractère avant de compter) ; un message structuré part vers Anthony, la confirmation le récapitule, aucun fichier du site n'est modifié. Erreurs résumées en tête (focus sans script, résumé nommé par son titre) et reliées aux champs (`aria-describedby`, `aria-invalid="true"`, `"false"` tant qu'aucune erreur : un champ obligatoire vide n'est pas annoncé « invalide ») ; liens de retour de 44 px (`acces-lien-retour`) ; en cas d'échec d'envoi, le texte est conservé dans le formulaire ; sans adresse d'Anthony, il est rendu pour être copié.

Toute réponse à une adresse sous `/garagiste` porte `X-Robots-Tag: noindex` et `Cache-Control: no-store` : redirections, refus, adresses inconnues (404) et pages que d'autres contextes publient dans l'espace (demandes, fermetures) comprises, par un crochet `onRequest` posé par ce module. Les pages de l'accès portent aussi `<meta name="robots" content="noindex">`. Tout fonctionne sans JavaScript.

## Règles (domaine, testées)

| Règle                               | Valeur                                                                                                      | Fichier                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Durée d'un lien, usage unique       | 15 minutes                                                                                                  | `domaine/regles.ts`, `domaine/lien-connexion.ts` |
| Session                             | 90 jours glissants, réécrite en base une fois par jour au plus                                              | `domaine/session.ts`                             |
| Demandes de lien par adresse client | 5 par heure glissante, puis 429 avec l'attente (`Retry-After`)                                              | `domaine/limitation.ts`                          |
| Alerte globale                      | au-delà de 20 demandes par heure, Anthony est alerté une fois par heure ; le compte n'est jamais verrouillé | `domaine/limitation.ts`                          |
| Page de retour                      | chemin local sous `/garagiste`, hors connexion ; sinon `/garagiste`                                         | `domaine/chemin-retour.ts`                       |

## Sécurité

- **Jetons** : 256 bits d'aléa (`crypto.randomBytes`), stockés en base par leur **empreinte SHA-256** seulement (tables `acces_liens`, `acces_sessions` du fichier SQLite partagé). L'échange lien contre session est atomique : deux ouvertures simultanées n'ouvrent qu'une session.
- **Journal** : la page du lien (`/garagiste/connexion/lien?jeton=...`) est servie au niveau de journal `warn`, si bien que la ligne d'accès « incoming request », qui écrit l'adresse complète, n'y est jamais écrite : aucun lien encore valable ne se lit dans les journaux (Kano D9). Les autres adresses de l'espace ne portent rien de secret.
- **Cookie** `NOM_COOKIE_SESSION` (`bf_session`) : `HttpOnly`, `SameSite=Lax`, `Path=/garagiste`, `Max-Age` égal à l'échéance de la session (renouvelé à chaque visite de `/garagiste`), `Secure` dès que `URL_PUBLIQUE` est en https. `Lax` et non `Strict` : décision du Kano (D5, « Corrections de relecture écartées »), un lien ouvert depuis une messagerie web garde la session.
- **Anti-falsification**, sur tout POST de l'espace : en-tête `Origin` (ou, à défaut, `Referer`) égal à l'origine publique ou au même hôte que la requête, **et** jeton de formulaire signé HMAC-SHA256 : lié à la session pour les formulaires de l'espace, daté (24 heures) pour ceux d'avant la session. Le secret est tiré au premier démarrage puis gardé dans la table `acces_secrets`, comme les sessions : un déploiement n'invalide pas un formulaire ouvert, le texte en cours n'est pas perdu. Refus : page 403, rien n'est enregistré ni envoyé.
- **Adresse du lien** bâtie sur `URL_PUBLIQUE`, jamais sur l'en-tête `Host` de la requête.
- La clé de limitation est `request.ip` tel qu'établi par Fastify (voir `trustProxy` dans les besoins partagés).

## Canaux d'envoi (`adaptateurs/configuration/canaux.ts`)

Chaque canal dit ce que devient un message (`Remise` dans `application/ports.ts`), et la page le répète tel quel :

| Mode                  | Envoi                                         | Remise          | Ce que dit la page                                                                | Adresses absentes                                    |
| --------------------- | --------------------------------------------- | --------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| production, relecture | SMTP si `SMTP_HOTE`                           | `courriel`      | « Lien envoyé », « Signalement envoyé »                                           | canal fermé : la page le dit et n'offre aucun bouton |
| production, relecture | console (journal du serveur) sans `SMTP_HOTE` | `journal`       | « Lien non envoyé par courriel » : écrit dans le journal, prévenir Anthony        | idem                                                 |
| demonstration         | toujours console, jamais d'envoi réel         | `demonstration` | le lien s'affiche dans la page ; « Signalement de démonstration », aucun courriel | adresses `*@demonstration.invalid`                   |

Réglages (`adaptateurs/configuration/reglages.ts`) lus et validés par `src/configuration.ts`, transmis par la composition : `URL_PUBLIQUE`, `COURRIEL_GARAGISTE` (à défaut `COURRIEL_GARAGE`), `COURRIEL_RESPONSABLE_SITE` (Anthony : signalements et alertes), `SMTP_*`. Au démarrage, chaque réglage manquant est signalé dans le journal avec sa conséquence.

## Commandes d'exploitation

```sh
# développement
pnpm exec tsx src/contextes/acces/adaptateurs/cli/garagiste.ts reinitialiser
pnpm exec tsx src/contextes/acces/adaptateurs/cli/garagiste.ts lien
# serveur (après pnpm construire)
pnpm garagiste:reinitialiser
pnpm garagiste:lien
```

- `reinitialiser` : révoque **toutes** les sessions et les liens non utilisés (téléphone perdu, doute). Effet immédiat sur le site en marche.
- `lien` : affiche un lien de secours (mêmes règles : 15 minutes, usage unique) quand l'envoi est en panne ou pas encore configuré.

Elles lisent `BASE_SQLITE` (défaut `var/demandes.sqlite`) et `URL_PUBLIQUE`.

## Architecture

- `domaine/` : règles pures (lien, session, limitation, retour, signalement, textes des messages).
- `application/` : un cas d'usage par fichier (`demander-lien-connexion`, `examiner-lien`, `ouvrir-session`, `identifier-session`, `fermer-session`, `reinitialiser-acces`, `emettre-lien-secours`, `signaler-changement`) ; ports dans `ports.ts`.
- `adaptateurs/` : SQLite, registre des demandes en mémoire (aucune adresse client sur disque), jetons et empreintes, messageries console et SMTP, alerteur, configuration, commandes, web (routes, vues, anti-falsification, cookie, `styles.css` aux classes `acces-`).
- **Offre à la couche web** : `verifierSession(jeton)` (contrat `VerifierSessionGaragiste`), branchée par la composition dans `OptionsServeur.verifierSessionGaragiste` ; `protectionFormulairesGaragiste` (contrat `ProtectionFormulairesGaragiste`, mêmes règles que les formulaires de l'accès : provenance puis jeton lié à la session), branchée dans `OptionsServeur.protectionFormulairesGaragiste`. Les autres contextes protègent leurs routes `/garagiste/...` avec `outils.exigerGaragiste`, posent `outils.jetonFormulaireGaragiste(requete)` dans le champ `CHAMP_JETON_FORMULAIRE` de chaque formulaire et ajoutent `outils.exigerFormulaireGaragiste` sur chaque POST. Les adresses `CHEMINS.garagisteDemandes` et `CHEMINS.garagisteFermetures` du tableau de bord viennent des contrats.
- N'importe jamais un autre contexte. Fichiers à soi : ce dossier et `tests/e2e/acces*.spec.ts`.

## Point d'attention : l'écran d'accueil du téléphone

Le mode d'emploi de `/garagiste` fait poser un raccourci sur l'écran d'accueil. Sans manifeste d'application web, ce raccourci s'ouvre dans le navigateur et partage son cookie de session. **Ne pas ajouter de manifeste `display: standalone` (ni `apple-mobile-web-app-capable`) sans revoir la connexion** : sur iPhone, une application d'écran d'accueil a ses propres cookies, alors que le lien reçu par courriel s'ouvre dans Safari ; le garagiste ne pourrait plus se connecter depuis l'icône.

## Tests

- `pnpm exec vitest run src/contextes/acces` : domaine, cas d'usage sur le vrai moteur SQLite, adaptateurs, et chaque critère de US-33 et US-49 par `app.inject`.
- `adaptateurs/web/journal-acces.test.ts` : le journal d'accès réel (niveau info) ne contient jamais le jeton d'un lien.
- `tests/e2e/acces.spec.ts` : parcours au clic, bureau et iPhone 13, avec et sans JavaScript. Le fichier démarre son propre serveur en relecture, dont les canaux sont ceux de la production (adresse configurée, messagerie console ; la production elle-même refuse de démarrer sans serveur d'envoi) sur un port libre et une base jetable, lit le lien dans le journal du serveur comme Anthony le lirait, vérifie que la page dit « Lien non envoyé par courriel » et qu'aucune ligne d'accès du journal (niveau info) ne porte le jeton.
