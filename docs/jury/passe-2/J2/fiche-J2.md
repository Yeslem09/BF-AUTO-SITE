# Fiche juré J2, passe 2

Profil : 29 ans, je cherche des plaquettes de frein et un prix, je compare avec Oscaro et Norauto. Téléphone 390 x 844 puis ordinateur 1440 x 900. Session du 24/09/2026 à 03 h 32 (garage fermé). Durée : 9 minutes. Aucune erreur console, 40 liens internes testés, aucun lien mort.

## Notes

| Critère | Note | Fondement |
|---|---|---|
| 1. Trouver le téléphone | 9,5 | 0 geste : bouton orange « 06 05 92 28 38 » dans l'en-tête et barre fixe « Appeler 06 05 92 28 38 » en bas de chaque page (m01) ; « Appeler » en haut à droite sur ordinateur (d01). |
| 2. Ouvert maintenant | 9 | 0 geste : pastille « Fermé, ouvre à 8 h 30 » dans l'en-tête de chaque page, juste à 03 h 32 un jeudi (m01, d01) ; page Accès avec les 7 prochains jours à partir d'« aujourd'hui » et la coupure de midi. Autre heure non testable, le statut est calculé par le serveur. |
| 3. Pré-diagnostic | 8,5 | 5 gestes depuis l'accueil, 1,3 s de serveur : « Roulez prudemment et faites contrôler dans les prochains jours », piste « plaquettes arrivées à leur témoin d'usure » et ce que l'atelier vérifiera (m15). La recherche « freins qui grincent » propose le pré-diagnostic (m05-3). |
| 4. Devis ou rendez-vous | 7 | Demande envoyée : « Demande enregistrée, nous vous rappelons ce matin », avec un récapitulatif complet (m12). Le parcours est long et contient une contradiction, voir les défauts. |
| 5. Comprendre les prix | 7,5 | Prix trouvés en 2 gestes (Menu puis Tarifs, 605 ms) : plaquettes avant posées dès 89 €, premier contrôle dès 29 € (30 min, déduit de la réparation), vidange dès 69 €, main-d'œuvre 60 €/h, tout en TTC. Aucun prix pour la pièce seule. |
| 6. Confiance | 7 | Bons signes : « Nous vous appelons avant tout travail supplémentaire », pièces rendues sur demande, FAQ sur la garantie constructeur, page « Vos droits », accès en transports. Il manque des avis clients et une photo du garage (0 image sur l'accueil). |
| 7. Esthétique et finition | 8 | Identité « plan technique » cohérente, zones tactiles de 48 px, pages servies en moins de 1 s. Plusieurs défauts de mise en page, surtout sur la page Tarifs au téléphone. |

**Moyenne : 8,1 / 10** (56,5 / 7)

## Temps et gestes (téléphone)

| Tâche | Gestes | Temps serveur | Résultat |
|---|---|---|---|
| Recherche « plaquettes » | 5 (2 glissements, champ, saisie, Chercher) puis +2 pour voir le prix | 349 ms + 1 004 ms | Seule la famille « Freinage » ressort, sans le prix 89 € |
| « plaquette avant » | idem | 347 ms | Même résultat : « avant » n'est pas exploité |
| « freins qui grincent » | idem | 350 ms | Pré-diagnostic + Freinage : très bon |
| Retrait ou pose | 2 glissements sur la page Freinage | / | Bloc « Retrait ou pose : à vous de choisir » clair |
| Demande de prix plaquettes avant | environ 22 (15 saisies, 5 glissements, 2 envois) | 554 ms + 656 ms | Envoyée, récapitulatif exact |
| Prix du premier contrôle et de la vidange | 5 (Menu, Tarifs, 3 glissements) | 605 ms | 29 € et 69 € |
| Téléphone / ouvert | 0 | / | Visibles tout de suite |
| Ordinateur | / | accueil 914 ms, recherche 742 ms, tarifs 526 ms | Même contenu |

## Défauts par gravité

**Majeurs**
1. Contradiction sur l'occasion. La page Freinage dit « Pièces neuves uniquement. La loi ne prévoit pas de pièces d'occasion pour le freinage » (m06-03). Or le formulaire de devis Freinage propose « D'occasion ou reconditionnée (pièce issue de l'économie circulaire) » (m07-02). À corriger : masquer cette option pour les familles réservées au neuf.
2. Le formulaire ne reprend pas mon choix. Depuis la carte « Plaquettes avant posées, à partir de 89 € » puis « Demander un prix », ni « Plaquettes » ni « Pose à l'atelier » ne sont cochés (m07-02/03). Seuls les liens texte « Retrait au garage » et « Pose à l'atelier » cochent la modalité. Il n'y a pas non plus de choix avant ou arrière : j'ai dû écrire « avant » dans les précisions. À corriger : cocher d'office Plaquettes et Pose depuis cette carte, et ajouter « avant / arrière / je ne sais pas ».
3. La recherche ne mène pas au prix. « plaquettes » et « plaquette avant » ne renvoient que la carte de famille, puis la liste « Toutes les familles » recommence par Freinage (m05-1). Il faut 2 gestes de plus pour lire 89 €. Oscaro ou Norauto affichent le prix dès le résultat. À corriger : afficher en tête « Plaquettes avant posées, dès 89 € TTC » avec les boutons « Demander un prix » et « Rendez-vous ».

**Moyens**
4. Aucun prix pour la pièce seule. Le bloc « Retrait au garage » dit « Vous pouvez aussi acheter la pièce seule » sans aucun ordre de prix ni délai. Je ne peux donc pas comparer avec Oscaro (m06-03).
5. Colonne des prix trop étroite sur la page Tarifs au téléphone. On lit « À par- / tir de / 89,00 € / TTC » sur 4 lignes avec une césure, et l'en-tête « Prix / TTC » tient sur 2 lignes (m13-02/03). Le même tableau sur l'accueil tient sur 2 lignes (m04-y4050) : il faut aligner les deux.
6. « Prix au 1er octobre 2026 », répété sur chaque ligne, est une date future (nous sommes le 24/09). On se demande si le prix actuel est différent. À écrire une seule fois en tête du tableau, avec une date passée ou « en vigueur ».
7. L'étape « Confirmez l'envoi » récapitule seulement « Devis : Freinage. Test jury, 06…, dès que possible » (m10). La pièce, la pose et le véhicule sont cachés sous « Vérifier ou modifier ma demande ». Cela ajoute un envoi de plus sans montrer l'essentiel.
8. Pas d'avis clients ni de photo du garage, de l'atelier ou de l'équipe. Ce sont des basiques face à Norauto. Seule la mention « Garage auto Choisy 94 devient BF Auto » rassure, et elle est cachée en bas de la page Accès.

**Mineurs**
9. Tarifs : « Exemple : citadine essence » accolé au taux horaire n'a pas de sens. Les légendes répètent le titre : « Main-d'œuvre et premier contrôle » puis « Taux horaire et premier contrôle, prix TTC ».
10. Climatisation : seul le gaz R134a est chiffré. Les voitures récentes utilisent du R1234yf, plus cher, et l'attente de prix risque d'être fausse.
11. Sur ordinateur, le tableau des tarifs n'occupe qu'environ 60 % de la largeur et laisse la droite vide (d04). L'accueil garde un grand vide sous « Demander un rendez-vous / Consulter les tarifs » (d01).
12. Le logo change selon l'écran : chat sur le « O » dans l'en-tête ordinateur et dans le pied de page, mais pas dans l'en-tête téléphone.
13. Les cartes « Retrait au garage » et « Pose à l'atelier », avec leur liseré orange, ont l'air cliquables mais ne le sont pas. Seuls les liens de la phrase en dessous le sont.
14. Résultat du pré-diagnostic : les liens sont noirs alors qu'ils sont orange partout ailleurs. Aucun prix indicatif n'accompagne « Demander un prix pour ces pièces ». La question 2 se valide avec des cases et « Continuer » alors que les autres questions se valident d'un seul toucher.
15. Au téléphone, les puces de familles sous la recherche forment une marge droite irrégulière (m04-y880).

## Verdict

Je confierais mes plaquettes à ce garage : 89 € posées, c'est lisible, le rappel est annoncé et le ton est honnête. Pour battre Oscaro et Norauto sur ma tâche, il reste trois points. La recherche doit donner le prix directement. Le formulaire doit reprendre « plaquettes avant, pose ». L'option « occasion » doit disparaître du freinage.

Demande de test envoyée : « Test jury », 06 39 98 00 02, devis Freinage, Peugeot 208 2019 essence. Aucune fermeture exceptionnelle créée.
