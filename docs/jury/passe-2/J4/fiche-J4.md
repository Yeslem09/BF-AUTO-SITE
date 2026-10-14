# Passe 2, juré J4 : le garagiste de BF Auto, mains occupées, sur téléphone (390 x 844)

Date : 24 septembre 2026, de 3 h 32 à 3 h 45 (13 min). Fermeture de test créée puis supprimée, session garagiste fermée. Scripts Playwright jetables `s*.mjs`, captures `NN-*.png` dans ce dossier.
Aucune erreur console ni HTTP sur tout le parcours. Chaque page se charge en 0,6 à 1 s.

## Notes (critères propres)

| Critère | Note | Fondement |
|---|---|---|
| Lecture de la demande | 9 | `19-liste-demandes.png` : la demande urgente arrive en tête de liste, cadre et pastille rouges « Ne roulez pas ». On y lit le symptôme et le signe exact (« La pédale de frein est molle ou s'enfonce »), « Promis au client : ce matin », la disponibilité et l'heure de réception. Le bouton d'appel de 48 px est visible sans défiler. La fiche (`20-fiche-urgente.png`) redonne la consigne transmise au client (« ne pas rouler, [...] le 112 ») et ses réponses mot pour mot. |
| Gestion de la fermeture | 7,5 | La déclaration, l'alerte (« 7 clients attendent votre rappel aujourd'hui : prévenez-les. »), l'affichage public et le retour à la normale fonctionnent tous. Mais pour confirmer puis supprimer, il faut chaque fois descendre sous la ligne de flottaison (défauts 1, 2 et 4). |
| Confiance dans l'outil | 8,5 | Chaque action affiche un retour horodaté : « Appel sans réponse noté pour Test jury à 3 h 39 : la demande reste à rappeler », puis « rangée dans « Traitées » » avec un bouton Annuler, « Fermeture enregistrée », « Fermeture supprimée ». La pastille d'en-tête change aussitôt. Retenu : pas d'annulation après « Pas de réponse » ni après « Supprimer ». |
| Usage d'une main | 7,5 | Appeler se fait en 1 geste (`tel:+33639980041`) avec des boutons pleine largeur de 48 px. Mais les liens de l'alerte de fermeture ne font que 21 px, le bouton « Confirmer » est à y = 1059 px et « Supprimer » à y = 1300 px, et l'en-tête public occupe environ 165 px sur chaque écran. |
| Esthétique et finition | 8 | La charte est cohérente (anthracite, orange, crème) et le rouge est réservé au danger. Défauts : fil d'Ariane sur 2 ou 3 lignes, pastille « Fermé exceptionnellement » dans le même gris qu'une fermeture ordinaire, trois pastilles empilées avant le nom du client. |

**Moyenne J4 : 8,1 / 10**

## Temps et gestes (temps du script, gestes = appuis, frappes et défilements)

| Tâche | Gestes | Temps |
|---|---|---|
| Client : pré-diagnostic « Le freinage a changé », puis « pédale molle », puis « Ne roulez pas », puis « Être rappelé à l'ouverture » et confirmation | 12 | 5,3 s |
| Client : demande de prix pour une batterie (neuve, posée, plaque, confirmation) | 15 (+1 aller-retour d'erreur de ma part : véhicule non renseigné, alors que la règle est bien expliquée) | 4,4 s |
| Connexion : « Recevoir un lien », « Ouvrir le lien », « Ouvrir mon espace garagiste » (le lien s'affiche dans la page) | 3 | 1,6 s |
| Ouvrir la liste des demandes puis la fiche urgente | 2 | 1,4 s |
| Appeler | 1 | immédiat |
| « Pas de réponse » | 1 | 0,65 s |
| « Marquer Traitée » (il faut rouvrir la fiche) | 2 | 1,35 s |
| Déclarer l'imprévu du jour (carte, « Imprévu aujourd'hui », défilement, Confirmer) | 4 | 2,0 s |
| Vérifier l'affichage public fermé | 0 (la pastille est visible dès l'arrivée) | 1,0 s |
| Supprimer la fermeture (carte, défilement, Supprimer) | 3 | 1,5 s |

Contrôles de bout en bout :
- **Pendant la fermeture :** l'accueil affiche « Fermé exceptionnellement, ouvre vendredi à 8 h 30 » et la barre du bas « Être rappelé vendredi 8 h 30 ». La page des horaires affiche « Jeudi (aujourd'hui) Fermé exceptionnellement » et « Le jeudi 24 septembre : imprévu ».
- **Après la suppression :** le mot « exceptionnellement » n'apparaît plus nulle part (0 occurrence), la barre repasse à « Être rappelé, dès 8 h 30 » et le jeudi redevient « 8 h 30 à 12 h, 14 h à 19 h ».

## Défauts par gravité

### Majeurs (gênent la tâche mains occupées)

1. **« Supprimer » est introuvable sans défiler** (`32-bouton-supprimer.png`).
   - Constat : le bouton est à y = 1300 px, sous tout le formulaire « Déclarer une période ». Pendant ce temps, la carte du haut « Fermé aujourd'hui ? » dit « Le garage est déclaré fermé aujourd'hui (imprévu) » mais ne propose aucun bouton pour rouvrir.
   - Action : ajouter « Rouvrir aujourd'hui » dans cette carte.
2. **La suppression est immédiate, sans confirmation ni Annuler**, alors que « Traitée » propose Annuler.
   - Conséquence : pour des congés sur plusieurs jours, un mauvais appui oblige à ressaisir les dates.
   - Action : un bandeau « Fermeture supprimée » avec un bouton Annuler.
3. **Les liens d'appel de l'alerte « 7 clients attendent votre rappel » sont trop petits** (`25-imprevu-etape.png`, même problème sous « Fermetures prévues »).
   - Constat : ce sont des liens texte de 21 px de haut. Le numéro est coupé sur deux lignes (« Appeler le 06 39 98 00 / 05 ») et « voir la demande » est collé sur la même ligne.
   - Action : un bouton de 48 px par client, comme dans la liste des demandes.

### Moyens

4. **« Confirmer » la fermeture se trouve sous la liste des clients** (y = 1059 px avec 7 clients). Il descend d'autant plus qu'il y a de clients à prévenir. Action : placer Confirmer au-dessus de la liste, ou dans une barre fixe en bas.
5. **Une fois le garage fermé, rien ne le signale hors de la page Fermetures** (`27-tableau-apres-fermeture.png`).
   - Constat : le tableau de bord affiche « 7 demandes à rappeler » et une carte Fermetures inchangée. Chaque carte de la liste garde « Promis au client : ce matin ».
   - Action : un bandeau « Fermé aujourd'hui : 7 rappels promis à prévenir » sur le tableau de bord et sur la liste.
6. **« Pas de réponse » ne s'annule pas**, et il se trouve 8 px sous « Appeler ».
   - Constat : depuis la fiche, ce bouton renvoie à la liste. Pour marquer la demande traitée, il faut donc rouvrir la fiche.
   - Action : proposer Annuler, et soit rester sur la fiche, soit ajouter « Traitée » sur la carte de la liste.

### Mineurs

7. **L'espace garagiste gaspille le haut de l'écran.**
   - Constat : l'en-tête public (bandeau démo, logo, pastille horaires, adresse, soit environ 165 px) est répété sur chaque écran. Le fil d'Ariane prend 2 lignes sur la fiche (« / Test jury » seul sur sa ligne) et 3 lignes sur « Fermer le garage aujourd'hui ? ».
   - Action : un en-tête compact propre à l'espace garagiste.
8. **« Test jury, le matin » est ambigu dans l'alerte de fermeture.** Ce libellé s'affiche pour toutes les demandes, y compris celles marquées « Joignable : dès que possible ». On le lit comme une disponibilité alors que c'est la promesse faite au client. Action : écrire « promis ce matin ».
9. **Côté public, la fermeture exceptionnelle ne se distingue pas visuellement** (`29-public-accueil-ferme.png`). La pastille « Fermé exceptionnellement » a le même gris que la fermeture ordinaire, donc l'exception ne saute pas aux yeux. Action : une couleur distincte.
10. **La ligne « 8 envois non confirmés cette semaine [...] » est incompréhensible pour un garagiste.** Elle apparaît en bas de la liste des demandes, sans action possible. Action : la retirer ou la mettre en retrait.
11. **Les champs Du et Au s'affichent « 09/24/2026 », au format américain.** C'est probablement propre à mon navigateur de test : à vérifier sur un vrai téléphone réglé en français.
12. **Côté client, le récapitulatif après envoi omet le signe coché** (la pédale molle) et ne dit que « Pré-diagnostic : Le freinage a changé ». La fiche garagiste, elle, l'affiche bien.

## Points forts

- La demande urgente est tout en haut, avec un compteur « 8 demandes à rappeler, dont 1 « Ne roulez pas » » dès le tableau de bord.
- Connexion sans mot de passe en 3 gestes. Une page intermédiaire protège le lien à usage unique, et l'espace peut être ajouté à l'écran d'accueil du téléphone.
- Doublons détectés automatiquement (« Même numéro, moins de 30 minutes d'écart »).
- Rappel de mettre à jour la fiche Google après chaque fermeture.
- Cohérence parfaite entre l'espace garagiste et le site public, à la fermeture comme au retour à la normale.
