# Fiche du juré J4, passe 1 : le garagiste, mains occupées, sur téléphone

- **Rôle** : garagiste de BF Auto, une main libre, téléphone 390 x 844 (isMobile, hasTouch), Chromium piloté par Playwright. Deux profils de navigateur séparés : « client » et « garagiste ».
- **Quand** : jeudi 24 septembre 2026, de 1 h 37 à 1 h 57, heure de Paris. Le garage était donc fermé (nuit) : « Fermé, ouvre à 8 h 30 » au départ.
- **Méthode** : en aveugle, aucun fichier du projet lu. Jugement sur captures regardées une à une. Le lien de connexion s'affichait dans la page en démonstration : la commande `pnpm garagiste:lien` n'a pas servi.
- **Temps** : les « temps de script » comprennent une attente de stabilité de 0,6 s après chaque tap. La vitesse réelle du site est bien meilleure : réponse du serveur en 3 à 5 ms, page chargée en 11 à 37 ms, 4 à 8 Ko de HTML (mesure locale, `09-vitesse.json`). Aucune erreur console ni réponse HTTP en erreur sur toute la session.

## Note : 7,4 / 10

| Critère | Note | En une phrase |
|---|---|---|
| Lecture de la demande | 8 | Cas compris sans rappeler (1 tap + 1 défilement), mais premier écran encombré de redites et précisions du client sous la ligne de flottaison |
| Gestion de la fermeture | 8 | 3 taps sans saisie, confirmation datée, effet immédiat partout, promesses décalées ; mais pas d'alerte sur le rappel déjà promis aujourd'hui, et barre basse publique rognée |
| Confiance dans l'outil | 7 | Traçabilité, annulation, urgences en tête, zéro erreur ; mais l'outil fait des promesses au client que le garagiste ne voit jamais |
| Facilité d'usage d'une main | 7 | Gros boutons pleine largeur, appel en 1 geste ; mais « Traitée » tout en bas de la fiche, retour par un fil d'Ariane de 18 px en haut d'écran |
| Esthétique et finition | 7 | Identité nette et cohérente ; défauts visibles dès qu'un texte s'allonge (pastille, barre basse, coupure « 1 / h 46 ») |

## Chronométrage des tâches

| Tâche | Gestes | Temps de script | Observation |
|---|---|---|---|
| Client « Ne roulez pas » : accueil, « Le freinage a changé », « pédale molle », Continuer, « Être rappelé à l'ouverture », 5 champs, envoi | 10 (11 avec l'étape « Confirmez l'envoi ») | 7,2 s | L'étape « Confirmez l'envoi » n'est apparue que parce que mon script remplissait en 1,3 s (garde anti-robot). À rythme humain, envoi direct (vérifié sur la demande batterie). |
| Client prix batterie : accueil, « Batterie », « Demander un prix », Neuve, Pose, précisions, plaque, prénom, téléphone, créneau, envoi | 10 | 5,6 s | Intervention « Batterie » pré-remplie. Promesse affichée : « Nous vous rappelons aujourd'hui, en fin de journée ». |
| Connexion à l'espace garagiste | 3 dans le site (+ ouverture du courriel en réel) | 4,6 s | Pas de mot de passe, lien valable 15 min, session 90 jours : à faire une fois par trimestre. |
| Ouvrir les demandes depuis l'accueil de l'espace | 1 | 0,7 s | Toute la carte est touchable (vérifié au doigt hors du titre). |
| Lire la demande urgente | 1 tap + 1 défilement | 0,7 s | Le signe de danger est au bas du 1er écran, les précisions du client au 2e. |
| Appeler Karim | **1** | instantané | Le tap ouvre `tel:+33611223344`, depuis la liste comme depuis la fiche. |
| Marquer la demande traitée | 3 depuis la liste, 2 depuis la fiche | 3,1 s | Voir la fiche, défiler jusqu'en bas, « Marquer « Traitée » ». |
| Fermeture imprévue aujourd'hui | **3**, aucune saisie | 4,0 s | Fermetures exceptionnelles, « Imprévu aujourd'hui », « Confirmer ». |
| Vérifier que le site public affiche fermé | 0 | immédiat | Visible dans le bandeau de toutes les pages. |
| Scénario garagiste complet (de l'accueil de l'espace jusqu'à la fermeture) | environ 10 | environ 7 s | Demandes, fiche, défiler, appeler, défiler, traitée, retour, fermetures, imprévu, confirmer. |

## 1. Lecture de la demande : 8 / 10

**Ce qui marche**
- Liste « Demandes reçues » : la demande urgente saute aux yeux (liseré rouge, pastille rouge « Ne roulez pas », `T4-liste-t0.png`). Le bouton « Appeler le 06 11 22 33 44 » est sur le premier écran (755 à 803 px sur 844).
- Les urgences sont épinglées en tête. Preuve : liste triée du plus récent au plus ancien, et pourtant Karim (reçu à 1 h 40) reste au-dessus de demandes reçues à 1 h 47, 1 h 50 et 1 h 53 (`T16b-ordre-liste.png`).
- La fiche (`T5-fiche-t0.png`, `T5-fiche-t1.png`) donne tout pour comprendre sans rappeler : signe coché (« La pédale de frein est molle ou s'enfonce »), consigne donnée au client (ne pas rouler, assistance, 112), véhicule, précisions du client, créneau joignable, suivi horodaté. J'ai compris le cas (pédale au plancher depuis la veille, Clio immobilisée au pied de chez le client, joignable le matin) sans avoir à rappeler pour poser des questions.
- « Fiche pas encore ouverte » sur la carte, et « Fiche ouverte la première fois : 1 h 45 » dans le suivi : on sait ce qu'on a déjà lu.

**Ce qui gêne (où, quoi, pourquoi, correction)**
- Fiche, premier écran : « Le freinage a changé » apparaît **3 fois** (titre « Pré-diagnostic : … », « Symptôme », « Que remarquez-vous ? ») et « Ne roulez pas » 3 fois (pastille, bandeau rouge, consigne). Ces redites repoussent au 2e écran les **précisions du client**, l'information la plus riche. Correction : supprimer la ligne « Symptôme » en double et placer en tête le signe de danger, les précisions et le véhicule.
- Carte de la liste : on lit « Le freinage a changé », pas le signe grave (« pédale molle ») ni le véhicule. Correction : ajouter une ligne « Signe : pédale de frein molle · Renault ».
- Bandeau rouge « Ne roulez pas : appelez-nous » dans la fiche garagiste : c'est la phrase adressée au client, qui sonne faux côté pro. Correction : « Consigne donnée au client : ne pas rouler ».
- Informations absentes pour un véhicule immobilisé : le formulaire de rappel ne demande que la marque (pas le modèle ni la plaque, que le formulaire de devis demande pourtant), et jamais **où se trouve la voiture**. Je ne connais le lieu que parce que je l'ai tapé en texte libre. Correction : si « Ne roulez pas », demander le modèle et le lieu (« La voiture est : chez moi / sur la route / au travail »).

## 2. Gestion de la fermeture : 8 / 10

**Ce qui marche**
- Page claire (`T8a-fermetures-t0.png`) : « Fermé aujourd'hui ? Un imprévu ? Le site affichera « Fermé exceptionnellement » jusqu'à ce soir, et plus aucun rappel ne sera promis pour aujourd'hui. » Un gros bouton « Imprévu aujourd'hui ».
- Confirmation explicite et datée (`T8b-imprevu-t0.png`) : « Fermer le garage aujourd'hui ? … toute la journée du jeudi 24 septembre 2026 », avec Confirmer et Annuler pleine largeur.
- Retour clair après confirmation (`T8c-apres-confirmer-t0.png`) : « Fermeture enregistrée » plus un lien pour faire la même chose sur la fiche Google. La fermeture est listée avec un bouton « Supprimer ».
- Site public mis à jour **immédiatement et partout** (`T9-accueil-public.png`, `T9-horaires-t0.png`, `T9-horaires-t1.png`, `T15-accueil-ordinateur-ferme.png`) : pastille « Fermé exceptionnellement, ouvre demain à 8 h 30 », barre d'actions basse, pied de page, tableau « Jeudi (aujourd'hui) : Fermé exceptionnellement » en rouge, rubrique « Le jeudi 24 septembre : imprévu ». Sur ordinateur, tout tient sur une ligne.
- La promesse faite au client suit la fermeture : un rappel demandé après la fermeture affiche « Nous vous rappelons vendredi matin » (`T12-confirmation.png`). L'annonce de l'outil est tenue.

**Ce qui gêne**
- **Aucune alerte sur les rappels déjà promis pour aujourd'hui.** Sophie a lu « Nous vous rappelons aujourd'hui, en fin de journée » ; après ma fermeture, sa carte reste identique, sans avertissement, ni à la confirmation ni dans la liste (`T11-liste-t0.png`). Correction : sur l'écran « Fermer le garage aujourd'hui ? », afficher « 1 client attend votre rappel aujourd'hui : Sophie, en fin de journée [Appeler] ».
- **Barre d'actions basse rognée sur téléphone après la fermeture** (`T9-barre-basse-fermeture.png`) : le sous-titre « Fermé exceptionnellement, ouvre demain à 8 h 30 » passe sur 3 lignes dans le bouton « Être rappelé » ; les deux boutons font 68 px et descendent à 849 px pour un écran de 844, si bien que « demain à 8 h 30 » est coupé. Avant la fermeture, ils faisaient 55 px et tenaient. Correction : sous-titre court (« Fermé aujourd'hui, rappel demain ») et barre ancrée au bas de l'écran, marge de sécurité iPhone comprise.
- Fermeture à la journée seulement : pas de choix « fermé cet après-midi » ou « de retour à 14 h », cas courant d'imprévu.
- L'accueil de l'espace ne montre pas l'état en cours (`T11-espace-apres-fermeture.png`) : la carte « Fermetures exceptionnelles » ne dit pas « Fermé aujourd'hui (imprévu) ».

## 3. Confiance dans l'outil : 7 / 10

**Ce qui marche**
- Connexion sans mot de passe, bien expliquée (lien valable 15 min, à usage unique, session de 90 jours), avec une page « Ouvrir mon espace garagiste » qui empêche un logiciel de messagerie de consommer le lien à votre place.
- Traçabilité : reçue le, fiche ouverte la première fois, notification envoyée, traitée le.
- Retour arrière possible : « Remettre « À rappeler » » sur une fiche traitée (`T7b-fiche-traitee-t2.png`).
- Tout a fonctionné du premier coup, sans erreur ni lenteur. Bandeau de démonstration honnête.

**Ce qui gêne**
- **Promesses invisibles pour le garagiste.** Le site promet au client un moment précis (« ce matin », « aujourd'hui, en fin de journée », « vendredi matin ») mais la fiche garagiste n'affiche que « Joignable : le matin » ou « Dès que possible » (`T5-fiche-t1.png`). On peut reprocher au garagiste une promesse qu'il n'a jamais vue. Correction : afficher « Promis au client : ce matin (jeudi 24) » sur la carte et la fiche, en rouge une fois l'échéance passée.
- Accueil de l'espace sans compteur (`T3-tableau-t0.png`) : rien n'indique « 3 à rappeler, dont 1 Ne roulez pas ». Il faut entrer dans la liste pour savoir. Correction : compteur sur la carte et bandeau rouge dès qu'une urgence attend.
- Doublons non signalés : deux demandes « Jeanne », même numéro, même minute (1 h 53), et deux « Test jury J1 » au même numéro (1 h 47, 1 h 50) apparaissent comme quatre demandes distinctes. Correction : regrouper par numéro (« 2 demandes de ce numéro »).
- Aucune trace d'une tentative d'appel : après le tap sur « Appeler », rien n'est noté ; en cas de messagerie, impossible d'inscrire « pas de réponse à 9 h 05 ». Correction : bouton « Pas de réponse » horodaté qui laisse la demande à rappeler.
- Avis « 1 envoi non confirmé cette semaine » (puis 3) en tête de liste : inquiétant (« ai-je perdu un client ? ») mais sans rien de faisable, et formulé en jargon (« envoyés trop vite, remplis par un robot »). Correction : le déplacer en bas de page ou le rendre utile (numéro laissé, s'il existe).
- Pas de message après « Marquer « Traitée » » : la liste se recharge et la carte a disparu, sans « Karim : traitée. Annuler ». Et « Remettre « À rappeler » » reste sur la fiche alors que « Traitée » renvoie à la liste : deux comportements pour deux gestes symétriques.
- Canal de la notification non précisé (« Notification : Envoyée le … à 1 h 40 ») : SMS ou courriel ? Et mentionne-t-elle l'urgence ? Non vérifiable en démonstration.

## 4. Facilité d'usage d'une main : 7 / 10

**Ce qui marche**
- Boutons d'action hauts de 48 px et pleine largeur (« Appeler », 303 à 355 px de large ; « Voir la fiche » ; « Confirmer » et « Annuler »).
- Appel en **un seul geste** depuis la liste, bouton dans le tiers bas de l'écran, au pouce.
- Aucune saisie au clavier dans tout le parcours garagiste : pas de mot de passe, fermeture en 3 taps.
- Aide claire pour poser l'espace sur l'écran d'accueil, iPhone et Android (`T14-ecran-accueil-aide.png`).

**Ce qui gêne**
- « Marquer « Traitée » » est tout en bas de la fiche (à 1 770 px, soit 2 écrans sous le bouton d'appel), et absent de la liste : 3 gestes après chaque appel. Correction : barre collée en bas de la fiche « Appeler | Traitée », ou bouton « Traitée » dans la carte de la liste.
- Le seul moyen de revenir en arrière dans l'espace, hors geste du navigateur, est le fil d'Ariane en haut d'écran : liens de **18 px de haut** (sous les 44 px recommandés), hors de portée du pouce. Sur la page de confirmation, ce fil s'étale sur 3 lignes. Correction : bouton « Retour aux demandes » en bas, ou barre d'onglets basse « Demandes | Fermetures ».
- L'en-tête public reste affiché dans l'espace pro : bandeau démo, logo, **gros bouton orange « 06 05 92 28 38 » qui appelle le garage lui-même**, menu public, pastille, adresse. La première carte d'action commence à 408 px (accueil de l'espace) et la première demande à 497 px (liste) sur un écran de 844. Correction : en-tête pro compact, statut public affiché en petit.
- « Imprévu aujourd'hui » (195 px) et « Supprimer » (126 px) ne sont pas pleine largeur et sont collés à gauche : moins confortables au pouce droit.

## 5. Esthétique et finition : 7 / 10

**Ce qui marche** : identité forte et cohérente, du public au pro (en-tête sombre quadrillé façon plan, orange de marque, fond crème, cartes à filet fin, coins « ticket » pour les encarts spéciaux, rouge réservé au danger, petit chat sur le logo du pied de page). Typographie lisible, hiérarchie claire.

**Défauts visibles**
- Pastille de statut : le point se retrouve **seul sur sa ligne** dès que le texte s'allonge (bandeau « Fermé exceptionnellement, ouvre demain à 8 h 30 », `T8c-apres-confirmer-t0.png`), et dans le pied de page « Horaires » **quel que soit l'état** (`02c-resultat-t2.png`), ainsi que dans la carte Horaires (`T9-horaires-t0.png`). Correction : point et texte sur la même ligne.
- Barre d'actions basse rognée après la fermeture (voir critère 2).
- « Traitée depuis le jeudi 24 septembre à 1 » puis « h 46 » à la ligne (`T7b-fiche-traitee-t2.png`). Correction : espace insécable entre l'heure et « h ».
- Tableau « Traitées ces 30 derniers jours » : légende « la plus récente d'abord » avec une colonne « Traitée le », mais Lina (traitée à 1 h 52) figure avant Karim (traité à 1 h 56). Le tri suit la date de réception. Correction : trier sur « Traitée le » ou corriger la légende.
- Redites dans la fiche (critère 1) et en-tête public dans l'espace pro (critère 4).
- Vocabulaire : le bouton « Demander un prix » (page Batterie) mène à « Votre devis » puis « Demander un devis ».

## Remarques côté client (hors critères J4, pour information)
- Écran « Ne roulez pas » très bon : bloc rouge, 3 étapes numérotées, 112 cliquable, réponses rappelées, fiche imprimable (`02b-resultat.png`, `02c-resultat-t1.png`).
- Le récapitulatif client de la demande urgente n'affiche pas le signe coché (« pédale molle »), seulement « Le freinage a changé » et « Ne roulez pas » (`T1-envoye-t1.png`).
- Le formulaire de rappel ne rappelle pas la fermeture dans son corps : seul le bandeau du haut la signale (`T10-form-rappel-t0.png`).

## Non retenu (artefacts de mon outil)
- Une capture en taille réduite prise pendant une transition de page (`02a-artefact-capture-pendant-transition-NON-RETENU.png`) : rechargée directement, la page est parfaite (zoom 1, aucun débordement horizontal).
- Dates affichées au format 09/24/2026 dans les champs de date : format imposé par la langue de mon navigateur de test, pas par le site.
- Étape « Confirmez l'envoi » : déclenchée par la vitesse de mon script, invisible à rythme humain.

## Non vérifié
- Contenu et canal de la notification reçue par le garagiste.
- Bouton « Supprimer » d'une fermeture : non touché, pour ne pas rouvrir le site pendant que les autres jurés le testent.

## État laissé dans la base de démonstration
- Karim (« Ne roulez pas », 06 11 22 33 44) : **traitée**. Je l'ai remise « À rappeler » puis de nouveau « Traitée » (1 h 56) pour vérifier l'ordre de la liste.
- Sophie (prix batterie, 07 22 33 44 55) : **à rappeler**.
- Lina (06 44 55 66 77, précisions « Vérification jury J4 ») : demande de test créée après la fermeture pour lire la promesse, puis marquée **traitée**.
- **Fermeture imprévue du jeudi 24 septembre 2026 : active** (le site public affiche « Fermé exceptionnellement »). À retirer via Espace garagiste, Fermetures exceptionnelles, « Supprimer » si les autres jurés doivent voir l'état normal.
- Demandes des autres jurés (J1, « Jeanne ») : non ouvertes, non modifiées.

## Fichiers
Captures `*.png` (préfixes `T1` à `T16` pour les tâches chronométrées), journal horodaté `chrono.log`, mesures `09-vitesse.json`, scripts jetables `lib.mjs`, `pas.mjs`, `0*-*.mjs`.
