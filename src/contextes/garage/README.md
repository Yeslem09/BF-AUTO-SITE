# Contexte garage

Identité, horaires, statut d'ouverture, fermetures exceptionnelles, contenus de confiance et pages légales du garage (Kano D2, D5 côté garage, D6, D7, D8, D10, D12, D13).

## Ce que voit le public

- **Accueil**, cinq emplacements (`ModuleContexte.blocsAccueil`), écrits avec les composants de `docs/design/composants.md` :
  - `statut` : pastille du statut du jour, adresse courte et itinéraire (`lienItineraire`), en tête de la bande d'ouverture ; la ligne de statut de l'en-tête s'efface alors sur l'accueil. Sur téléphone, statut et rue sur une rangée.
  - `information` : bloc atelier sans cadre propre (la couche web le pose en panneau et ajoute la Fig. 1 du frein à disque dessous) : surtitre « L'atelier », ce que fait l'atelier (`identite.activites`), qui vous accueille (prénom), la façade, « Comment nous travaillons » (la méthode « on explique, on chiffre, vous décidez » en trois étapes, publiée seulement avec les deux engagements du socle, comme l'accroche), trois exemples de prix TTC lus dans le catalogue (vidange, révision, plaquettes avant posées ; `tableau-tarifs`, chacun relié à sa famille, absent tant qu'aucun n'est publié ; en démonstration, la note des prix de démonstration ; en relecture, un prix proposé surligné).
  - `questions` : « Vos questions » en volets du composant (`liste-volets`, `details.volet`), la première (le voyant) dépliée, dépliables sans JavaScript (D2). Une question dont la réponse repose sur une donnée non publiée disparaît, jamais de texte d'attente. Le premier contrôle est défini là où il est nommé : « Faut-il prendre rendez-vous ? » dit ce qu'il comprend et sa durée, « Combien coûte un premier contrôle ? » son prix ou sa gratuité, sa date, ce qu'il comprend et s'il est déduit de la réparation.
  - `garage` : adresse en titre, statut exact à l'heure de Paris (fermetures comprises), « Passez sans rendez-vous » si c'est ouvert et validé, téléphone en chiffres, liens d'itinéraire Google Maps et Plans d'Apple (aucune carte chargée), horaires des sept prochains jours aujourd'hui en tête (filets pleins, sans pointillés), données structurées `AutoRepair`. Aucun bouton d'appel : le rappel suit dessous (AE-36).
  - `encart` : composant `.encart` « Nouveau nom » (« même atelier » si validé, lien `/avis` si validé), sous les colonnes ; l'emplacement n'est pas fourni sans ancien nom publiable.
- **Pages**, en-tête de page (fil d'Ariane, surtitre, titre, chapeau) et panneaux : `/acces-et-horaires` (panneau « Horaires d’ouverture », distinct de la région « Horaires » du pied de page ; « En transports en commun » : arrêts relevés dans les données ouvertes d'Île-de-France Mobilités), `/vos-droits` (économie circulaire, dont les organes exclus lus dans le référentiel unique des contrats `ORGANES_EXCLUS_DU_REEMPLOI`, que le catalogue applique aussi ; garantie constructeur, prix, médiateur, sources en lien « Le texte »), `/mentions-legales`, `/confidentialite` (« votre prénom », comme les formulaires), `/avis` (redirection 302 vers le formulaire d'avis de la fiche Google si le lien est validé, sinon 404).
- **Statut** : la prochaine ouverture nomme le jour dès qu'elle n'est pas aujourd'hui (« Fermé, ouvre vendredi à 8 h 30 »), jamais « demain », qui se lit mal la nuit.
- **Cadre** : `fournirCadre()` donne à la mise en page l'identité publique (accroche seulement si les deux engagements du socle sont publiés, sinon « BF Auto, garage automobile à Choisy-le-Roi », qui ne restreint pas l'atelier à la mécanique ; `activites` une fois publiées, champ facultatif du contrat que la couche web affiche sous l'accroche) et le statut.
- **Ce que fait l'atelier** : `identite.activites` (« Mécanique, entretien, carrosserie et peinture, toutes marques », validé par Anthony le 2026-09-24), dit à l'identique sur l'atelier, Accès, Vos droits et les mentions légales (« Activité »).
- **Relecture** : les valeurs à valider sont surlignées par la classe commune `.a-valider`, en mode relecture seulement.

## Ce que fait le garagiste (`/garagiste/fermetures`)

Routes protégées par `outils.exigerGaragiste`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`, envois protégés par l'anti-falsification partagée de l'espace (`outils.exigerFormulaireGaragiste` : provenance `Origin`, à défaut `Referer`, et jeton lié à la session, dans chaque formulaire par `outils.jetonFormulaireGaragiste`) ; un envoi refusé répond 403 et ne modifie rien :

- **Imprévu aujourd'hui** : le bouton, puis « Confirmer » (deux gestes). Un double appui n'ajoute rien. L'écran de confirmation montre d'abord les rappels déjà promis pour aujourd'hui (prénom, moment, « Ne roulez pas », appel en un geste, lien vers la demande) ; la liste des fermetures le fait pour chaque période prévue. Source : la capacité « rappels promis pour une date » des demandes (contrat `ListerRappelsPromis`), dépendance facultative `listerRappelsPromis`, branchée par la racine de composition (appel différé vers les demandes, assemblées après le garage) ; sans elle, aucune alerte.
- **Déclarer une période** : du, au, motif (congés, jour férié, imprévu). Une période qui en chevauche une autre est refusée ; 92 jours au plus ; dans les douze mois.
- **Lister, supprimer**. Après chaque action, retour à la liste avec un compte rendu en code fermé (`?fait=enregistree`), jamais un texte libre de l'adresse. La confirmation rappelle de déclarer la fermeture sur la fiche Google.

## Ce qu'il lit chez les autres (contrats)

- `consulterTarifsDuSocle` (catalogue, seule source des prix, AE-05) : les exemples de prix TTC du bloc atelier et « Combien coûte un premier contrôle ? » citent le premier contrôle et le taux horaire tels que le catalogue les publie ; le tableau et la question disparaissent tant qu'ils ne sont pas validés.
- `preDiagnosticPublie` (pré-diagnostic) : « Faire le pré-diagnostic » s'il est publié, sinon l'appel au garage.

## Ce que le contexte offre aux autres (contrats)

- `proposerDemiJournees(maintenant)` : les 10 prochaines demi-journées d'ouverture qui n'ont pas commencé, horaires publiés moins fermetures ; vide si aucune semaine n'est publiable.
- `annoncerRappel(envoi, moment)` : selon le moment où le client peut répondre (contrat `MomentReponse`), « Nous vous rappelons jeudi matin. », « jeudi, à midi », « jeudi, en fin de journée » ; la première demi-journée voulue qui n'a pas commencé, jamais une heure, fermetures comprises ; `null` si le délai de rappel ou les horaires ne sont pas publiables, ou si aucune ouverture n'est en vue.

## Données : `donnees/garage.json`, une valeur, un statut

Chaque valeur est `{ statut, valeur, source, note }` : `valide` (avec sa source) ou `a_valider` (avec une note ; une valeur non nulle est alors une proposition, source « proposition »). Politique de publication (`domaine/valeur-publiee.ts`) :

| Mode            | Valeur validée | Proposition                             | Inconnue                      |
| --------------- | -------------- | --------------------------------------- | ----------------------------- |
| `production`    | affichée       | jamais rendue ni transmise              | rien                          |
| `demonstration` | affichée       | affichée normalement (bandeau du socle) | rien                          |
| `relecture`     | affichée       | surlignée                               | « À valider : note » surligné |

**Porte de démarrage** (`domaine/porte-publication.ts`) : toute donnée bloquante non validée (identité, courriel, horaires, socle de confiance, éditeur, hébergement, transferts, médiateur, nom de domaine et recherche d'antériorité de la marque) est recensée dans `ContexteGarage.donneesBloquantesAValider`, une ligne nommée par manque ; un engagement du socle refusé (valide mais faux) rouvre la décision. La racine de composition agrège ces lignes avec celles du catalogue et du canal de notification en une porte unique : en production, une seule ligne arrête le site. Le vrai fichier ne peut donc pas partir en production aujourd'hui : c'est voulu. Démonstration : `PORT=4311 MODE_SITE=demonstration BASE_SQLITE=var/demo-garage.sqlite pnpm run demarrer`.

## Architecture

- **Domaine pur** : valeurs à statut et politique de publication, validation du fichier (chaque problème nommé par son chemin), calendrier (semaine type et fermetures), statut d'ouverture, demi-journées, rappel, dates en toutes lettres, porte de publication.
- **Application** : un cas d'usage par fichier (consulter la fiche, les informations légales, le lien de fiche Google ; proposer les demi-journées ; annoncer le rappel ; déclarer une période, un imprévu ; lister, supprimer).
- **Ports** : `SourceIdentiteGarage` (fichier JSON), `DepotFermetures` (SQLite, tables `garage_*` dans la base partagée, WAL ; une ligne illisible, modifiée à la main par exemple, est écartée de la liste et signalée au journal du serveur, jamais la page entière), `Horloge` (système ou fixe).
- **Adaptateurs web** : routes publiques et garagiste, vues, JSON-LD neutralisé contre toute fermeture de l'élément script, styles `garage-*`.
- **Essais** : `essais/garage-valide.json` est une configuration entièrement fictive et validée (horaires d'essai du Kano), `essais/*.ts` ses outils. Tests : domaine, application sur SQLite réel en mémoire, HTTP complet, point d'entrée lancé dans un processus (porte de démarrage), parcours navigateur `tests/e2e/garage.spec.ts` (dont : aucune requête tierce ni cookie sur chaque page, cible tactile de 44 px pour chaque lien seul sur sa ligne, volets de questions qui disent leur état). Chaque garde-fou (porte, publication, session, origine, fermetures, échappement) a été vu rouge par injection d'une régression.

## Provisoire, à trancher par l'orchestrateur

- L'encart « Nouveau nom » vit à la fin du bloc `garage`, faute d'emplacement d'accueil sous les colonnes.
