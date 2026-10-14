# Fiche juré J1, passe 2

Profil : conductrice de 34 ans, pressée, sur téléphone (390 x 844, tactile). Un bruit est apparu au freinage.
Session : jeudi 24/09/2026 à 03 h 32 (garage fermé). Serveur local, chargement de l'accueil en 157 ms, aucune erreur console.

## Notes

| # | Critère | Note | Observation qui fonde la note |
|---|---|---|---|
| 1 | Trouver le téléphone | 10 | Bouton orange « 06 05 92 28 38 » en en-tête, visible sans aucun geste (01-accueil-viewport.png). Barre fixe « Appeler 06 05 92 28 38 » en bas de chaque page. 1 geste pour appeler. |
| 2 | Savoir si c'est ouvert | 9 | Pastille « Fermé, ouvre à 8 h 30 » sous l'en-tête dès l'arrivée, sur toutes les pages, cohérente avec l'heure réelle (03 h 32). La barre du bas reprend « Être rappelé dès 8 h 30 ». 0 geste. |
| 3 | Pré-diagnostic (bruit au freinage) | 8 | Résultat en 5 gestes et 1 défilement, 4 questions, environ 2 s de chargements cumulés. Bandeau clair « Roulez prudemment et faites contrôler dans les prochains jours », 2 pistes (plaquettes au témoin d'usure, plaquettes ou disques durcis), ce que l'atelier vérifiera, schéma du frein. |
| 4 | Demander un rappel | 8 | Depuis le résultat : 9 gestes (barre « Être rappelé », prénom, téléphone, créneau, envoi, puis « Confirmer l'envoi »). Erreurs claires si envoi vide (« Le formulaire contient 3 erreurs », liens vers les champs). Confirmation « Nous vous rappelons ce matin », numéro appelant à enregistrer. |
| 5 | Comprendre le prix | 6,5 | Aucun prix sur la page de résultat. Il faut Menu, Tarifs, puis 2 écrans de défilement (4 gestes) pour lire « Plaquettes avant posées, à partir de 89 € TTC » et « Premier contrôle, à partir de 29 € TTC, déduit si réparation ». Tableau mobile mal composé (voir défauts). |
| 6 | Confiance | 7,5 | Méthode rassurante (« On explique, On chiffre : devis écrit avant travaux, Vous décidez »), pièces restituées, droits du client, continuité « Garage auto Choisy 94 devient BF Auto, même adresse, même numéro ». Mais aucune preuve sociale ni photo réelle. |
| 7 | Esthétique et finition | 7,5 | Style cohérent et soigné (en-tête sombre, orange, dessins techniques, cartes en ticket). Plusieurs accrocs de composition sur mobile, surtout la page Tarifs. |

**Moyenne : 8,1 / 10** (56,5 / 7)

## Temps et gestes (téléphone)

| Tâche | Gestes | Temps script | Parcours |
|---|---|---|---|
| Trouver le téléphone | 0 (1 pour appeler) | 0,16 s | Visible à l'arrivée |
| Savoir si c'est ouvert | 0 | 0,16 s | Pastille d'en-tête |
| Pré-diagnostic jusqu'au résultat | 5 + 1 défilement | env. 2 s | Accueil, « Un bruit inhabituel », « Aucun de ces signes » + « Continuer », « Quand je freine », « Un sifflement ou un grincement aigu » |
| Rappel depuis le résultat, envoyé | 9 + 1 défilement | 1,6 s | Barre du bas, formulaire, étape « Confirmez l'envoi », page « Demande enregistrée » |
| Coût de l'intervention | 4 | 1,5 s | Menu, Tarifs, défilement jusqu'à la ligne plaquettes |

## Confierais-je ma voiture ?

Oui, pour un premier contrôle : le prix plancher est affiché (29 € déduit de la réparation), le devis écrit précède les travaux et le garage appelle avant tout supplément. Avant de venir, j'irais toutefois lire les avis Google, car le site n'en montre aucun et ne montre ni l'atelier ni le mécanicien.

## Basiques manquantes

1. Prix indicatif sur la page de résultat du pré-diagnostic (premier contrôle 29 € déduit, plaquettes dès 89 €). C'est la question suivante immédiate de la conductrice.
2. Prix « plaquettes + disques » : le résultat évoque les disques, la grille ne les chiffre pas et ne dit pas « sur devis ».
3. Avis clients ou note Google.
4. Photo réelle de l'atelier ou de l'équipe, nom du mécanicien, ancienneté.
5. Garantie sur les travaux effectués et moyens de paiement acceptés.
6. Délai indicatif pour être pris en charge (« sous 48 h », « le jour même si urgent »).

## Défauts par gravité

### Majeur
- **Tarifs, tableau sur mobile** (05-tarifs-viewport.png, 05-tarifs-part1.png) : colonne de prix trop étroite, « À partir / de / 60,00 € / TTC » sur 4 lignes, « À par- / tir de / 89,00 € / TTC » coupé par une césure, en-tête « Prix / TTC » sur 2 lignes. C'est la page qui répond à la question du prix, elle est la moins lisible du site. Action : empiler libellé puis prix en pleine largeur sous 480 px, interdire la césure dans la cellule de prix.
- **Date des prix dans le futur** : « Prix au 1er octobre 2026 » sur chaque ligne alors qu'on est le 24/09/2026. On ne sait pas quel prix s'applique aujourd'hui. Action : dater au jour de mise en ligne ou écrire « prix en vigueur », une seule fois en tête de tableau.

### Moyen
- **Récapitulatif appauvri** : l'étape « Confirmez l'envoi » et la page « Demande enregistrée » affichent « Pré-diagnostic : Un bruit inhabituel », sans « au freinage, sifflement aigu ». On doute que le garage ait le détail. Action : afficher la dernière réponse ou la piste principale.
- **Étape de confirmation en plus** : après « Être rappelé », une seconde page « Confirmez l'envoi, Demande pas encore envoyée ». Un geste de plus et un risque d'abandon pour une personne pressée. Action : envoyer directement, avec « Modifier » sur la page de confirmation.
- **Point d'entrée ambigu à la question 1** : « Un bruit inhabituel » et « Le freinage a changé » conviennent tous deux à un bruit au freinage ; hésitation au premier geste. Action : sous-libellé « grincement, sifflement au freinage » sur l'une des deux, ou renvoi croisé.
- **Question 2 hétérogène** : les autres questions se valident d'un seul geste, celle-ci demande de cocher puis de trouver « Continuer », et « Aucun de ces signes » est sous la ligne de flottaison (03-bruit-01.png). Action : placer « Aucun de ces signes » en tête ou en bouton direct.

### Mineur
- Titres coupés trop tôt avec trait d'union : « Quand entendez- / vous ce bruit ? » alors que la ligne a de la place (03-bruit-02.png) ; idem « Remarquez-vous / l'un de ces signes ? ».
- Bouton « Continuer » en demi-largeur alors que les choix sont en pleine largeur (03-bruit-01.png).
- À l'ouverture du menu, « Menu » devient « Fermer », plus large : le bouton téléphone glisse d'environ 13 px vers la gauche (05-menu-ouvert.png).
- Légendes redondantes dans Tarifs : « Prestations courantes » puis « Prestations courantes, prix TTC » ; « Exemple : citadine essence » répété sur chaque ligne.
- Libellé « Pièces détachées » (menu et accueil) : laisse croire à une vente de pièces, alors que le garage répare. « Toutes les familles » relève du jargon de métier.
- Logo du pied de page (avec un chat sur le O) différent du logo d'en-tête.
- Pastille « Fermé » : point gris peu visible sur fond sombre, et « ouvre à 8 h 30 » ne précise pas « aujourd'hui ».

## Captures
01-accueil-viewport.png, 03-bruit-01.png, 03-bruit-02.png, 03-bruit-q4-01.png, 03-resultat-part1..3.png, 04-rappel-01.png, 04-form-part1..2.png, 04-rappel-vide-viewport.png, 04-rappel-confirmation.png, 04-rappel-envoye.png, 05-menu-ouvert.png, 05-tarifs-viewport.png, 05-tarifs-part1.png, 06-seg-0.png, 06-seg-a/b/c.png.

Données envoyées : une seule demande de rappel confirmée (« Test jury », 06 39 98 00 02). Un premier essai (06 39 98 00 01) s'est arrêté à l'étape « Confirmez l'envoi », sans être envoyé. Aucune fermeture exceptionnelle créée ou supprimée.
