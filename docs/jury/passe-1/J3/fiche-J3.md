# Fiche du juré J3, passe 1

- **Profil** : retraité de 68 ans, peu à l'aise avec le numérique. Je prépare la révision de ma voiture et je veux faire reprendre une portière rayée.
- **Poste** : ordinateur, fenêtre de 1440 x 900, puis zoom du navigateur à 200 % (émulé par une fenêtre de 720 x 450 px CSS à pixels doublés, soit le rendu de Ctrl + sur l'écran 1440 x 900).
- **Quand** : jeudi 24 septembre 2026, de 01 h 37 à 02 h 10 (heure de Paris), Chromium piloté par Playwright, site http://127.0.0.1:4500.
- **Pièces** : captures `*.png` et scripts `NN-*.mjs` de ce dossier.

**Deux précautions de lecture**

1. L'état du site a changé pendant ma visite. À 01 h 37, la pastille disait « Fermé, ouvre à 8 h 30 ». Vers 01 h 45, elle est devenue « Fermé exceptionnellement, ouvre demain à 8 h 30 », avec la mention « Fermetures exceptionnelles : Le jeudi 24 septembre : imprévu. ». Je n'ai rien déclaré moi-même : c'est vraisemblablement un autre testeur côté garage. J'ai jugé les deux états.
2. Je n'ai envoyé aucune demande. Dans mes scripts, tout envoi de formulaire était bloqué et aucune donnée ne quittait le navigateur. J'ai rempli le formulaire de rendez-vous jusqu'au bouton final : les messages d'erreur et l'écran de confirmation n'ont donc pas été vus par J3.

## Note : 6,7 / 10

| Critère | Note |
|---|---|
| 1. Trouver le téléphone | 9 |
| 2. Savoir si c'est ouvert maintenant | 7 |
| 3. Obtenir une orientation pour un souci (pré-diagnostic) | 8 |
| 4. Demander un devis ou un rendez-vous | 7 |
| 5. Comprendre les prix | 4 |
| 6. Confiance | 6 |
| 7. Esthétique et finition | 6 |
| **Moyenne** | **6,7** |

## Tâches chronométrées

Un geste = un clic, une saisie de champ ou un cran de molette (100 px). Le temps est celui du script (machine), pas celui d'un senior : à mon rythme, compter environ 3 s par clic, 1 s par cran de molette et 1 s par lettre tapée, plus la lecture.

| Tâche | Ordinateur 1440 x 900 | Zoom 200 % | Résultat |
|---|---|---|---|
| Trouver le téléphone | 0 geste, 0,04 s : bouton orange en haut à droite, chiffres en 22 px gras | 0 geste : en haut, et répété dans la barre fixe du bas | Réussi |
| Trouver les horaires par le menu | clic « Accès » + 1 cran, 0,4 s | « Menu » + « Accès » + 5 crans, 0,9 s | Réussi, à condition de deviner que « Accès » contient les horaires |
| Trouver les horaires en descendant l'accueil | 19 crans, 1,0 s | 45 crans, 2,3 s | Réussi, pénible au zoom |
| Savoir si c'est ouvert | 0 geste : pastille du premier écran, en 15 px | 0 geste : pastille du premier écran | Réussi |
| Demander un rendez-vous pour une révision (jusqu'au bouton final, non envoyé) | 8 clics dont 2 saisies + 15 crans, 6,1 s | 8 clics + 25 crans, 7,5 s | Réussi jusqu'à l'envoi |
| Savoir si le garage fait la carrosserie, en descendant | 9 crans, 0,5 s (carte « Carrosserie ») | 22 crans, 1,1 s | Réussi, rien au premier écran |
| Même question avec la recherche « portière rayée » | 3 clics + 1 saisie, 1,1 s | 3 clics + 1 saisie + 14 crans, 1,7 s | Réussi : la recherche comprend mes mots |
| Comprendre les prix (page Tarifs jusqu'en bas) | 1 clic + 15 crans, 1,1 s | 2 clics + 19 crans, 1,6 s | Échec : aucun chiffre |
| Confiance : « travaux sans mon accord ? » et « garantie constructeur ? » | 2 clics + 21 crans, 1,7 s | 2 clics + 39 crans, 2,6 s | Réussi, réponses nettes |
| Pré-diagnostic pour ma rayure | 5 gestes, 3,5 s | parcours « freinage » vérifié au zoom : 3 gestes, 2,2 s | Réussi |

Rapidité et robustesse : chaque page s'affiche en 66 à 201 ms (serveur local), aucune erreur dans la console, aucune requête en échec. 40 pages atteintes par les liens internes, toutes en statut 200 : aucun lien mort. Au zoom 200 %, aucune des 10 pages principales ne déborde en largeur (720 px).

## Critère par critère

### 1. Trouver le téléphone : 9/10

- Fondement du 9 : sur `A-1440-ecran1.png`, « 06 05 92 28 38 » est en haut à droite dans un bouton orange, en 22 px gras (contraste 5,2:1), lisible sans aucun geste. Au zoom 200 % (`B-zoom200-ecran1.png`), il reste en haut et revient dans une barre fixée en bas de l'écran. Il est répété dans le pied de page et sur la page « Accès et horaires ».
- Pourquoi pas 10 : sur un ordinateur, le bouton dit « Appeler » alors qu'il s'agit d'un lien d'appel téléphonique, qui ne compose rien sur un poste sans téléphonie ou ouvre une application inattendue. Sur grand écran, écrire « Appelez le 06 05 92 28 38 » sans action, et mettre « Être rappelé » à côté.

### 2. Savoir si c'est ouvert maintenant : 7/10

- Bien : la pastille est au premier écran aux deux zooms, sans geste, et elle annonce la suite (« ouvre à 8 h 30 », puis « ouvre demain à 8 h 30 »). La fermeture exceptionnelle se propage partout : ligne « Jeudi (aujourd'hui) : Fermé exceptionnellement » en rouge, raison « imprévu », et les créneaux de jeudi disparaissent du formulaire de rendez-vous. L'état est calculé par le site, pas par l'horloge de mon ordinateur.
- Trop petit pour moi à 1440 : l'information la plus importante tient en 15 px, précédée d'un petit point gris ; aucune couleur ne distingue « fermé » d'« ouvert » (`W-statut-accueil.png`).
- « Fermé, ouvre à 8 h 30 » à 1 h 37 du matin : ajouter « aujourd'hui » lèverait le doute.
- Mise en page cassée quand le message s'allonge. Sur la page Accès à 1440, le point est seul sur sa ligne et l'heure est coupée en deux, « ouvre demain à 8 » puis « h 30 » à la ligne (`V-acces-statut-coupe.png`). Même point orphelin dans la carte « Le garage » de l'accueil et dans le pied de page (`Q-bloc-horaires-maintenant.png`, `P-acces-exceptionnel-1440-02.png`). Correctif : espaces insécables dans « 8 h 30 », point collé au premier mot.
- La pastille n'est pas cliquable, alors qu'on s'attend à ce qu'elle mène au tableau des horaires.
- Le mot « Horaires » n'est pas dans le menu : il faut deviner que « Accès » les contient. Renommer en « Horaires et accès ».

### 3. Obtenir une orientation pour un souci (pré-diagnostic) : 8/10

- Bien : questions en langage courant, gros boutons, « Question 1 sur 5 au plus », « Aucune inscription ni coordonnée n'est demandée pour voir le résultat ». Pour ma rayure, 5 gestes : « Autre chose ou je ne sais pas », puis « Aucun de ces signes » et « Continuer », puis « Un choc, une bosse ou une rayure sur la carrosserie », puis « Une rayure ou un éclat de peinture, sans plus ». Résultat (`L-prediag-nsp-05.png`) : « Pas d'urgence : à vérifier lors d'un prochain passage », piste « Un dégât de peinture, à traiter avant que la rouille ne gagne la tôle mise à nu », rappel de mes réponses et « Imprimer la fiche ». Au zoom, le cas grave « pédale de frein molle » affiche un bandeau rouge « Ne roulez pas. » et la marche à suivre, 112 compris (`Y-prediag-frein-zoom-03.png`) : rassurant.
- À revoir : la carrosserie n'apparaît pas à la question 1 ; il faut passer par « Autre chose » et une liste de signes de danger avant d'y arriver.
- Le résultat « sans urgence » ne propose que « Être rappelé à l'ouverture » et « Imprimer la fiche » : ni « Demander un devis », ni « Prendre rendez-vous », et il ne dit pas « nous réparons les rayures ».

### 4. Demander un devis ou un rendez-vous : 7/10

- Bien : bouton « Demander un rendez-vous » au premier écran à 1440 ; choix « Un entretien ou une révision » ; « Ce n'est pas une réservation » dit clairement ; seuls le prénom et le téléphone sont obligatoires, sans compte ni courriel ; « Le plus tôt possible » et « Une autre date » proposés ; encadré « Et ensuite ? » en 3 étapes ; usage des données expliqué.
- Long : 4 écrans à 1440 (15 crans), 25 crans au zoom (`H-rdv-1440-01.png` à `H-rdv-1440-04.png`).
- Grille des créneaux difficile à lire : deux colonnes remplies en zigzag. Après le samedi, « Samedi 26 septembre, matin » se retrouve à côté de « Lundi 28 septembre, matin » et les jours ne sont plus alignés ; « Vendredi 25 septembre, après- » puis « midi » est coupé en fin de ligne (`H-rdv-1440-02.png`). Proposer une ligne par jour avec deux cases « Matin » et « Après-midi ».
- « Pour quelle intervention ? » n'offre pas « Carrosserie ou peinture » : pour ma portière, je dois choisir entre « Une réparation déjà identifiée » et « Autre chose ».
- Le formulaire « Devis » est pensé pour les pièces (« Type de pièce souhaitée », « Retrait ou pose ») : hors sujet pour une révision ou une rayure, et il ne permet pas de joindre une photo de la rayure (`U-devis-1440-02.png`).
- Au zoom 200 %, la barre fixe du bas (gros bouton orange « Être rappelé » et « Appeler ») reste affichée pendant que je remplis le formulaire : elle prend 16 % de la hauteur de l'écran et concurrence le bouton « Demander un rendez-vous » (`T-rdv-zoom200-complet-02-rempli.png`).
- Non vu par J3 (envoi bloqué volontairement) : messages d'erreur et confirmation. Aucune vérification n'a lieu dans le navigateur : un formulaire vide part tel quel au serveur.

### 5. Comprendre les prix : 4/10

- Page Tarifs (`E-tarifs-1440-01.png` à `E-tarifs-1440-03.png`) : « Taux horaire de main-d'œuvre : Sur demande », « Premier contrôle à l'atelier : Sur demande », puis 18 lignes identiques « Prix sur devis ». Aucun chiffre sur tout le site.
- Le mot « révision » n'apparaît pas sur la page Tarifs : il est caché sous « Vidange et filtres ». Carrosserie : « Prix sur devis ».
- Promesse non tenue : le bouton de l'accueil annonce « Consulter les tarifs, Taux horaire et prix TTC », et l'on trouve « Sur demande ».
- Contradiction qui me fait tiquer : la page « Vos droits chez nous » répond « Les prix sont-ils affichés ? Oui, c'est une obligation : le taux horaire et les forfaits doivent être affichés toutes taxes comprises », alors que le site n'en affiche aucun. Le tableau s'intitule « Forfaits par intervention » sans contenir un seul forfait.
- Ce qui sauve la note : le principe est clair (prix TTC, devis écrit avant travaux, « Sur demande » expliqué). Si les prix attendent la validation du garage, afficher au moins le taux horaire TTC et des prix « à partir de » pour la révision, la vidange, les plaquettes et la retouche de rayure. Sinon, remplacer les 18 lignes par une phrase et un bouton.

### 6. Confiance : 6/10

- Bien : « on explique, on chiffre, vous décidez » ; « Devis écrit avant travaux », « Nous vous appelons avant tout travail supplémentaire », « Pièces remplacées restituées sur demande ». Mes deux questions ont une réponse nette sur l'accueil : « Faites-vous des travaux sans mon accord ? Non : vous recevez un devis écrit avant les travaux » et « Vais-je perdre la garantie de mon constructeur si je fais l'entretien ici ? Non, si l'entretien suit les préconisations du constructeur » (`J-faq-3.png`), avec les textes officiels (EUR-Lex, DGCCRF). SIRET dans les mentions légales, « Ce site ne dépose aucun cookie de suivi », changement de nom expliqué (« Même adresse, même numéro »).
- Mais je ne vois ni le garage, ni le garagiste : aucune photo sur les pages parcourues (uniquement des dessins), aucun prénom, aucun avis de client.
- Basiques absentes pour moi : le tampon du carnet d'entretien (ma preuve pour la garantie), les moyens de paiement (chèque, carte), la prise en charge par l'assurance en carrosserie, le nom et les coordonnées du médiateur de la consommation (cité sans être nommé, dans « Vos droits » comme dans les mentions légales), le nom de l'hébergeur (seule la ville est donnée).
- Textes de gabarit qui sonnent faux : sur « Peinture » et « Diagnostic électronique », on me propose « Retrait au garage : Vous pouvez aussi acheter la pièce seule » et de choisir une pièce « neuve, d'occasion ou reconditionnée » pour un diagnostic. « Les pièces, repère par repère : Boîtier, Broches, Câble » pour un diagnostic ; « Les signes d'usure » pour une bosse après un choc.
- Les liens « Le texte » ne disent pas de quel texte il s'agit à l'écran (le nom de la loi n'est lu que par les lecteurs d'écran).
- Confierais-je ma voiture ? Pour la révision, oui, après un coup de téléphone : les engagements écrits me rassurent. Pour la portière, j'irais d'abord voir sur place, faute de photo, d'avis et de prix.

### 7. Esthétique et finition : 6/10

- Bien : identité cohérente et soignée (papier millimétré, dessins techniques, orange et anthracite), le petit chat du logo, composants homogènes. Au zoom 200 %, tout passe sur une colonne sans débordement et devient très lisible.
- Lisibilité à 1440, jugée sévèrement : 71 blocs de texte de l'accueil sur 177 (40 %) sont en 15 px ou moins, dont la pastille d'état, le tableau des horaires, le fil d'Ariane, les descriptions des familles et les aides des formulaires. Les sur-titres (« VOS QUESTIONS », « LE GARAGE », « PIÈCES DÉTACHÉES ET RÉPARATIONS », titres du pied de page) sont en 13 px, majuscules espacées, orange : fatigants. Le texte courant est en 16 à 17 px ; à mon âge il faudrait 18 px. Les contrastes, eux, sont bons (5,2:1 et plus).
- Accueil à 1440 : sur les écrans 4 et 5, les trois quarts gauches restent vides à côté du formulaire « Être rappelé », serré dans une colonne d'environ 300 px (`C-accueil-1440-04.png`, `C-accueil-1440-05.png`). La colonne des questions n'offre qu'environ 240 px de texte : 3 à 5 mots par ligne, « rendez- » puis « vous » coupé (`J-faq-3.png`). Le grand dessin de frein occupe un écran entier au zoom sans rien m'apprendre d'utile.
- Fautes : « Élément filtrant (cachée, en tirets sur la figure) » sur la page Vidange et filtres (écrire « caché ») ; « Garage auto choisy 94 » avec « choisy » en minuscule dans le bandeau « Nouveau nom ».
- Détails : « Fermé exceptionnellement » élargit le tableau des horaires de l'accueil et colle au bord droit de la carte (`R-debord-1440-0.png`) ; le chat disparaît du logo de l'en-tête au zoom 200 % ; le menu ouvert au zoom ne se ferme pas avec la touche Échap (`O-zoom-menu-apres-echap.png`).

## Ce qui me perd dans l'organisation

- Le premier onglet du menu et le premier bloc de l'accueil sont « Pièces détachées », avec « Quelle pièce cherchez-vous ? ». Je ne cherche pas une pièce : je veux une révision et une carrosserie. Les pastilles du premier écran (Freinage, Batterie, Pneus, Vidange et filtres, Distribution, Embrayage) ne citent ni la révision ni la carrosserie.
- La carrosserie est rangée sous « Pièces détachées » (fil d'Ariane « Accueil / Pièces détachées / Carrosserie » et sur-titre « PIÈCES DÉTACHÉES »).
- La phrase qui répond à ma question, « Mécanique, entretien, carrosserie et peinture, toutes marques. », n'arrive qu'au troisième écran de l'accueil (septième au zoom). La placer sous le titre du premier écran.
- En revanche la recherche est très bonne : « révision », « revision » sans accent, « carrosserie », « rayure » et « portière rayée » trouvent la bonne famille (`M-recherche-4-resultat.png`).

## Priorités d'amélioration, dans l'ordre de J3

1. Prix : taux horaire TTC et quelques prix « à partir de » (révision, vidange, plaquettes, retouche de rayure), une ligne « Révision » visible, et la promesse du bouton d'accueil corrigée.
2. Lisibilité à 1440 : texte courant à 18 px, informations clés (état, horaires, aides) à 17 ou 18 px, sur-titres à 15 px sans espacement des lettres ; pastille d'état colorée et cliquable vers les horaires.
3. Premier écran : « Entretien et révision » et « Carrosserie et peinture » parmi les pastilles, la phrase « Mécanique, entretien, carrosserie et peinture, toutes marques » sous le titre, menu « Horaires et accès ».
4. Confiance : photo de la façade et de l'atelier, prénom du garagiste, avis de clients, moyens de paiement, assurance en carrosserie, tampon du carnet d'entretien, médiateur nommé.
5. Formulaire de rendez-vous : une ligne par jour (Matin, Après-midi), option « Carrosserie ou peinture », barre fixe du bas masquée sur les pages de demande.
6. Finition : espaces insécables dans les heures, point collé au texte d'état, colonne des questions élargie, vide de l'accueil comblé, blocs « Retrait ou pose » et « gamme de pièce » retirés des familles de service (Peinture, Diagnostic électronique), fautes corrigées.
7. Pré-diagnostic : « Un choc ou une rayure » dès la question 1, bouton « Demander un devis » sur les résultats sans urgence.

## Principales captures

- Accueil à 1440 : `A-1440-ecran1.png`, `C-accueil-1440-01.png` à `C-accueil-1440-06.png`. Au zoom 200 % : `B-zoom200-ecran1.png`, `N-accueil-zoom200-01.png` à `N-accueil-zoom200-17.png`, menu `O-zoom-menu-ouvert.png`.
- Horaires : `D-acces-1440-01.png` (avant la fermeture exceptionnelle), `P-acces-exceptionnel-1440-01.png` et `P-acces-exceptionnel-1440-02.png` (après), `V-acces-statut-coupe.png`, `Q-bloc-horaires-maintenant.png`, `O-zoom-acces-horaires.png`.
- Tarifs : `E-tarifs-1440-01.png` à `E-tarifs-1440-04.png`, `X-tache-zoom200-F-prix.png`.
- Carrosserie : `F-carrosserie-1440-01.png` à `F-carrosserie-1440-03.png`, recherche `M-recherche-4-resultat.png`.
- Rendez-vous et devis : `H-rdv-1440-01.png` à `H-rdv-1440-04.png`, `T-rdv-1440-complet-02-rempli.png`, `T-rdv-zoom200-complet-02-rempli.png`, `U-devis-1440-01.png` à `U-devis-1440-04.png`.
- Pré-diagnostic : `L-prediag-nsp-00.png` à `L-prediag-nsp-05.png`, `Y-prediag-frein-zoom-03.png`.
- Confiance : `J-faq-3.png`, `I-droits-1440-01.png` à `I-droits-1440-03.png`.
- Tâches chronométrées : `X-tache-*.png` (script `18-taches.mjs`), rendez-vous `13-rdv.mjs`, mesures de taille et de contraste `16-lisibilite.mjs` et `22-contraste-cles.mjs`.
