# Fiche juré J6, passe 1

**Profil** : habitant de Choisy-le-Roi qui compare les garages avant de choisir, sur téléphone et sur ordinateur.
**Session** : jeudi 24 septembre 2026, de 01 h 37 à 02 h 20 (heure de Paris).
**Conditions** : Chromium piloté par Playwright ; téléphone 390 × 844 (mobile, tactile), ordinateur 1440 × 900. Chaque capture a été regardée. Bandeaux cookies des concurrents : refus systématique, compté comme 1 geste.

**Sites comparés**

| Site | Adresse | Nature |
|---|---|---|
| BF Auto | http://127.0.0.1:4500 | site du garage (démonstration, servi en local) |
| Europe Auto 94 | https://www.europe-auto94.fr/ | agent Citroën et Peugeot, 1 rue du Docteur Roux, Choisy-le-Roi |
| Speedy Thiais | https://centres-auto.speedy.fr/garage/thiais-94320/560 | centre de réseau national, Belle Épine |
| Vroomly, Po Mécanique Auto | https://www.vroomly.com/garages/po-mecanique-auto-94400-bert/ | fiche de plateforme, 6 rue Alphonse Brault, Choisy-le-Roi |

**Précautions de lecture**

1. BF Auto est servi en local : ses chargements (0,1 à 0,3 s) ne sont pas comparables à ceux des concurrents servis par Internet (2 à 13 s). Je compare surtout les gestes.
2. Le site BF a changé pendant la session : vers 02 h 13, fermeture exceptionnelle du jour affichée, et 6 illustrations sur 18 en erreur 404 (présentes à 01 h 37). J'ai jugé les deux états ; captures horodatées.
3. Aucun formulaire envoyé (BF compris), aucune immatriculation saisie chez Speedy et Vroomly : écrans de confirmation et montants des concurrents non vus. [À VALIDER : tester l'envoi BF en passe 2, sur un environnement qui ne notifie pas le vrai garage]

---

## 1. Chronométrage BF Auto

| Tâche | Téléphone | Ordinateur | Constat |
|---|---|---|---|
| Trouver le téléphone | 0 geste, écran 1 | 0 geste, écran 1 | en-tête orange + barre fixe « Appeler » ; lien tel:+33605922838 |
| Savoir si c'est ouvert | 0 geste, écran 1 | 0 geste, écran 1 | 01 h 37 : « Fermé, ouvre à 8 h 30 » ; 02 h 13 : « Fermé exceptionnellement, ouvre demain à 8 h 30 » |
| Pré-diagnostic, bruit au freinage | 5 gestes, 3,6 s | 5 gestes, 3,8 s | Le freinage a changé > Aucun de ces signes > Continuer > Un bruit > Sifflement aigu ; l'entrée « Un bruit inhabituel » mène aussi au freinage (« Quand je freine ») |
| Demander le prix des plaquettes | formulaire en 2 gestes (0,55 s) ; prêt à envoyer en 8 gestes (1,3 s de script, hors frappe) + 1 pour envoyer | idem | puce Freinage > « Demander un prix » ; intervention Freinage préremplie |
| Comprendre « premier contrôle » | Menu > Tarifs, 2 gestes : aucune définition | 1 clic : aucune définition | seule occurrence sur les 65 pages parcourues : /tarifs |
| Comprendre « vidange » | 1 geste (puce Vidange et filtres) | 1 clic | définition + ce que fait l'atelier ; « Prix sur devis » |
| Parcours complet | 65 pages en 200, aucun lien interne mort | | 404 sur 6 images à partir de 02 h 13 |

## 2. Chronométrage des concurrents (téléphone)

| Site | Chargement | Cookies | Numéro de téléphone | Statut d'ouverture |
|---|---|---|---|---|
| Europe Auto 94 | 2,3 à 2,9 s | modale plein écran (9 partenaires), 1 geste | 4 gestes + 1 appui, 7,4 s ; chiffres jamais écrits sur téléphone (« APPELEZ-NOUS ») ; sur ordinateur, clic sur « APPELEZ-NOUS » page Contact pour voir 01 46 82 46 03 | aucun, horaires statiques |
| Speedy Thiais | 7,6 à 13,4 s | modale plein écran, 1 geste | écran 1, 01 46 86 90 07, visible à 8,7 s | « Aujourd'hui : Ouvert » affiché à 01 h 57 : **faux** |
| Vroomly Po Mécanique | 3,7 à 4,2 s | modale, 1 geste | 3e écran, 5,1 s, 3 gestes ; trois numéros relais différents vus (01 72 89 51 49, 01 72 37 30 38, 01 84 80 77 23) | « actuellement fermé », juste, au 3e écran, sans heure de réouverture |

---

## 3. Notes BF Auto

| # | Critère | Note | Observation qui fonde la note |
|---|---|---|---|
| 1 | Trouver le téléphone | **9** | 06 05 92 28 38 visible dès l'écran 1 à deux endroits (bouton orange de l'en-tête, barre fixe « Appeler »), 0 geste, lien d'appel direct, sur téléphone comme sur ordinateur. Seul accroc : dans le résultat du pré-diagnostic, le numéro est en texte simple, non cliquable, coupé sur deux lignes (« 06 05 92 / 28 38 »). |
| 2 | Savoir si c'est ouvert | **8,5** | À 01 h 37 un jeudi : « Fermé, ouvre à 8 h 30 », exact, écran 1, 0 geste, répété dans la barre fixe. À 02 h 13 : « Fermé exceptionnellement, ouvre demain à 8 h 30 », jeudi en rouge et motif « imprévu » sur la page Accès. Retenue : avec ce texte long, le bouton « Être rappelé » de la barre fixe passe sur 4 lignes et sa dernière ligne est coupée (bas du bouton à 849 px pour un écran de 844), et la pastille grise se retrouve seule sur sa ligne. |
| 3 | Pré-diagnostic | **9** | 5 gestes, 3,6 s. Question de sécurité d'abord (pédale molle, voyant rouge, fumée). Verdict gradué en encadré jaune « Roulez prudemment et faites contrôler dans les prochains jours ». Pistes sans fausse certitude (« Sans ordre de probabilité »), « Ce que l'atelier vérifiera », figure légendée, fiche imprimable, réponses transmises au garage avec la demande de rappel (« vous n'aurez pas à tout réexpliquer »). Manque : aucune fourchette de prix, aucun bouton « Demander un prix » dans le résultat. |
| 4 | Devis ou rendez-vous | **7** | Formulaire atteint en 2 gestes, Freinage prérempli, choix de gamme (neuve, occasion, reconditionnée), retrait ou pose, plaque ou marque/modèle/année/énergie, clavier téléphonique sur le champ numéro, sans compte ni courriel, « Et ensuite ? » en 3 étapes ; le rendez-vous annonce honnêtement « Ce n'est pas une réservation ». Mais on obtient un rappel, ni prix ni créneau ferme ; « plaquettes avant ou arrière » seulement en texte libre ; formulaire de devis long sur téléphone (environ 5 écrans). |
| 5 | Comprendre les prix | **5** | Page Tarifs : 20 lignes, zéro chiffre (« Sur demande », « Prix sur devis »), bien expliquées (TTC, devis avant travaux). Le bouton d'accueil promet pourtant « Taux horaire et prix TTC ». « Premier contrôle à l'atelier » n'est défini nulle part. La vidange est bien expliquée (huile préconisée par le constructeur, filtres du carnet, remise à zéro de l'indicateur). Je ne pénalise pas les montants en attente de validation ; je note ce qu'un visiteur comprend aujourd'hui. Avec le taux horaire, le premier contrôle et 3 ou 4 « à partir de », ce critère passerait à 8. |
| 6 | Confiance | **6** | Points forts réels : « Devis écrit avant travaux », « Nous vous appelons avant tout travail supplémentaire », pièces restituées sur demande, page « Vos droits chez nous » avec les textes cités, SIRET en mentions légales, annonce du changement de nom, aucun cookie de suivi. Mais aucun avis client, aucune photo du garage ni de l'équipe, aucune garantie de réparation annoncée, ni ancienneté, ni moyens de paiement. **Confierais-je ma voiture ?** Oui pour un devis, après avoir lu des avis ailleurs, parce que le site ne m'en montre aucun. |
| 7 | Esthétique et finition | **6,5** | Identité forte et cohérente (anthracite et orange, dessins techniques légendés « Fig. 1 »), typographie nette, grandes cibles tactiles, pas de bandeau cookies. Défauts : zone vide d'environ 1 000 × 1 300 px à gauche du formulaire de rappel sur l'accueil ordinateur ; 6 illustrations sur 18 vides depuis 02 h 13 (la Fig. 1 de Carrosserie n'a plus que des repères qui pointent dans le vide) ; pastille de statut orpheline ; barre fixe coupée ; logo avec un chat sur l'en-tête ordinateur et le pied de page, sans chat sur l'en-tête téléphone. |

**Moyenne BF Auto : 7,3 / 10** (9 + 8,5 + 9 + 7 + 5 + 6 + 6,5 = 51 ; 51 / 7 = 7,29)

---

## 4. BF face à chaque concurrent, critère par critère

### Critère 1, trouver le téléphone
| Concurrent | Verdict BF | Pourquoi |
|---|---|---|
| Europe Auto 94 | **Mieux** | EA : modale cookies, puis menu > Contact > défiler > « APPELEZ-NOUS » (4 gestes + appui, 7,4 s), chiffres jamais écrits sur téléphone ; sur ordinateur, le numéro est caché derrière un clic. |
| Speedy Thiais | **Mieux** | Speedy montre le numéro à l'écran 1, mais après une modale cookies et 7,6 s de chargement, en petit, sans bouton d'appel fixe. |
| Vroomly | **Mieux** | Sur téléphone, le bouton du haut est « Se faire rappeler » ; les chiffres sont au 3e écran et changent d'un chargement à l'autre (numéros relais de la plateforme, pas la ligne du garage). |

### Critère 2, savoir si c'est ouvert
| Concurrent | Verdict BF | Pourquoi |
|---|---|---|
| Europe Auto 94 | **Mieux** | Aucun statut ; deux grilles (atelier, commercial) en colonne étroite en pied de page ; avis « fortes chaleurs » de juin toujours en ligne (« horaires pourront évoluer au jour le jour »). |
| Speedy Thiais | **Mieux** | Speedy affiche « Aujourd'hui : Ouvert » à 01 h 57 : faux et trompeur. BF dit juste, fermeture exceptionnelle et motif compris. |
| Vroomly | **Mieux** | Vroomly dit juste (« actuellement fermé ») mais au 3e écran, sans heure de réouverture ; BF le dit à l'écran 1, avec l'heure. |

### Critère 3, pré-diagnostic (bruit au freinage)
| Concurrent | Verdict BF | Pourquoi |
|---|---|---|
| Europe Auto 94 | **Mieux** | Rien : texte générique « évaluation et diagnostic détaillés ». |
| Speedy Thiais | **Mieux** | Pas d'orientation ; la page Freinage cite les grincements comme signe d'alerte, le devis en ligne propose une ligne « Diagnostic freinage ». |
| Vroomly | **Mieux** | Rien : un catalogue de prestations, il faut déjà savoir ce qu'on veut. |

### Critère 4, demander un devis ou un rendez-vous (prix des plaquettes)
| Concurrent | Verdict BF | Pourquoi |
|---|---|---|
| Europe Auto 94 | **Mieux** | EA : formulaire de contact générique, courriel obligatoire ; « Prendre RDV », « Tous nos avis clients » et « Nos avis Google » mènent tous à /contact ; réservation en ligne réservée aux Citroën et Peugeot. |
| Speedy Thiais | **Pareil** | Pour des raisons opposées : Speedy propose un devis en ligne en 4 étapes avec une ligne « Plaquettes Avant » et « -30 % exclu web », prix après la plaque et rendez-vous en ligne, mais lent et chargé ; BF est plus simple (ni compte, ni courriel, ni captcha) mais ne donne qu'un rappel. |
| Vroomly | **Moins bien** | « Voir les prix dans ce garage » dès l'écran 1, plaque ou modèle, « devis instantané » et rendez-vous en ligne ; BF ne donne ni prix ni créneau ferme. |

### Critère 5, comprendre les prix (premier contrôle, vidange)
| Concurrent | Verdict BF | Pourquoi |
|---|---|---|
| Europe Auto 94 | **Mieux** | Pas de chiffre non plus, mais EA se contente de nommer des « forfaits vidange / freinage » sans contenu ; BF explique TTC, devis avant travaux, le sens de « sur demande », et détaille la vidange. |
| Speedy Thiais | **Moins bien** | Speedy structure ses forfaits (Basic : vidange + filtre à huile ; Total : + filtre à air ; Intégral ; Révision constructeur) et explique ses contrôles (19 et 135 points) ; prix après la plaque [À VALIDER : montants non vus]. BF ne définit pas son « premier contrôle ». |
| Vroomly | **Moins bien** | Prix propres au garage après choix du véhicule, promesse « vous n'avancerez pas un euro de plus que le prix communiqué sur le devis » [À VALIDER : montants non vus]. |

### Critère 6, confiance
| Concurrent | Verdict BF | Pourquoi |
|---|---|---|
| Europe Auto 94 | **Moins bien** | EA : « depuis 40 ans », réparateur agréé Citroën et Peugeot, photo réelle de la façade, avis clients, carte. Bémols : promotion « portes ouvertes du 11 au 14 septembre » périmée, avis de juin encore affiché. |
| Speedy Thiais | **Moins bien** | 4,6/5 sur 68 avis vérifiés (dernier du 14/09/2026, norme NF ISO 20488), réseau national, garanties, moyens de paiement. Bémols : statut « Ouvert » faux, « © Speedy 2019 », prénom mal encodé « SAÃ¯D ». |
| Vroomly | **Moins bien** | 4,8/5 sur 26 avis avec 5 sous-notes, label « Garage d'Exception », garantie 1 an pièces et main-d'œuvre, photo de la façade, gérant nommé, 5 mécaniciens, 12 ans d'expérience, moyens de paiement. Bémols : numéros relais, texte type qui place le garage « à Vitry-sur-Seine » (94400). |

BF garde l'avantage sur l'honnêteté du processus et la vie privée (aucun bandeau cookies, aucun traceur), mais la preuve sociale et les photos lui manquent face aux trois.

### Critère 7, esthétique et finition
| Concurrent | Verdict BF | Pourquoi |
|---|---|---|
| Europe Auto 94 | **Mieux** | EA : modale cookies, pastille « Paramètres des cookies » qui masque le texte en bas à gauche sur tout le parcours, pied de page écrasé dans une colonne étroite (« COMMERCI / AL »), menu ordinateur qui passe sur deux lignes, carrousel de voitures neuves. |
| Speedy Thiais | **Mieux** | Gabarit daté, bloc coupon avec reCAPTCHA, image en 404, 8 à 13 s de chargement. |
| Vroomly | **Moins bien, de peu** | Vroomly est net et moderne, mais sans identité propre, avec un en-tête translucide qui chevauche le texte au défilement et un mur de texte type. BF a plus de caractère ; ses défauts du jour (illustrations vides, zone vide, barre coupée) le font passer juste derrière. |

---

## 5. Notes des quatre sites (même grille)

| Critère | BF Auto | Vroomly Po Mécanique | Speedy Thiais | Europe Auto 94 |
|---|---|---|---|---|
| 1. Téléphone | 9 | 6 | 7 | 3 |
| 2. Ouvert maintenant | 8,5 | 7 | 3 | 3 |
| 3. Pré-diagnostic | 9 | 2 | 3 | 1 |
| 4. Devis ou rendez-vous | 7 | 8 | 7 | 3 |
| 5. Prix | 5 | 7 | 6 | 2 |
| 6. Confiance | 6 | 8 | 8 | 7 |
| 7. Esthétique | 6,5 | 7 | 4 | 5 |
| **Moyenne** | **7,3** | **6,4** | **5,4** | **3,4** |

## 6. Classement final

1. **BF Auto, 7,3** : le meilleur pour s'orienter et joindre le garage (téléphone immédiat, statut exact, seul pré-diagnostic des quatre). Perd sur la preuve (aucun avis, aucune photo) et sur les prix (aucun chiffre, « premier contrôle » non défini).
2. **Vroomly, Po Mécanique Auto, 6,4** : le plus rassurant et le plus rapide vers un prix, mais aucune orientation et des numéros qui changent.
3. **Speedy Thiais, 5,4** : avis vérifiés et devis en ligne structuré, mais lent, daté, et un « Ouvert » faux en pleine nuit.
4. **Europe Auto 94, 3,4** : solide sur l'ancienneté, mais un site de concession tourné vers la vente de voitures, sans numéro visible, sans statut, sans prix.

**Mon choix de client** : pour mon bruit de freins, j'appellerais BF Auto à l'ouverture, parce que c'est le seul site qui m'a dit quoi faire (rouler prudemment, faire contrôler sous quelques jours) et ce que l'atelier allait vérifier. Avant de confier la voiture, j'irais lire des avis ailleurs et je demanderais le prix des plaquettes au téléphone. Si Vroomly m'affiche un prix ferme plus vite, BF risque de perdre le client à ce moment-là.

---

## 7. Défauts BF à corriger, par priorité

| # | Où | Quoi | Pourquoi c'est gênant | Correction proposée |
|---|---|---|---|---|
| 1 | Accueil et catalogue, téléphone et ordinateur | Depuis 02 h 13, 6 illustrations sur 18 vides : 404 sur /img/catalogue/moteur-et-injection.svg, boite-de-vitesses.svg, diagnostic-electronique.svg, pare-brise-et-vitrage.svg, carrosserie.svg, peinture.svg ; la Fig. 1 de Carrosserie n'a plus que ses repères | régression en cours de session (images présentes à 01 h 37), le site paraît cassé | restaurer les fichiers ; contrôle automatique de toutes les images référencées avant mise en ligne |
| 2 | Barre fixe, téléphone | Avec « Fermé exceptionnellement, ouvre demain à 8 h 30 », le bouton « Être rappelé » passe sur 4 lignes, déborde de l'écran (849 px pour 844) et la dernière ligne est coupée ; les deux boutons ne sont plus alignés | le bouton le plus visible du site devient illisible | libellé court réservé à la barre (« Rouvre vendredi 8 h 30 ») ou 2 lignes au maximum |
| 3 | Tarifs | « Premier contrôle à l'atelier » n'est défini nulle part | le visiteur ne sait pas ce qu'il paie, ni si c'est payant | une phrase : contenu, durée, prix ou gratuité, déduction éventuelle de la facture |
| 4 | Accueil, bouton « Consulter les tarifs » | Promet « Taux horaire et prix TTC » ; la page n'a aucun chiffre | promesse non tenue ; ironie : la page « Vos droits » rappelle que taux horaire et forfaits doivent être affichés | afficher taux horaire, premier contrôle et 3 ou 4 « à partir de » (vidange, plaquettes avant, diagnostic), ou renommer le bouton |
| 5 | Accueil, ordinateur | Zone vide d'environ 1 000 × 1 300 px à gauche du formulaire de rappel | page qui paraît inachevée | rééquilibrer la grille (horaires et rappel côte à côte, ou formulaire pleine largeur) |
| 6 | Pastille de statut (en-tête téléphone avec texte long, pied de page, carte Horaires) | La pastille grise est seule sur sa ligne, au-dessus du texte | décalage visible sur l'élément clé | rendre la pastille et le premier mot insécables |
| 7 | Résultat du pré-diagnostic | Numéro non cliquable et coupé ; aucun bouton vers un prix | le parcours bruit > prix s'arrête | lien d'appel insécable ; bouton « Demander un prix pour le freinage » prérempli avec le diagnostic |
| 8 | Demande de prix, famille Freinage | Aucun choix « plaquettes avant, plaquettes arrière, disques » | l'essentiel de la demande passe en texte libre | cases à cocher des pièces courantes, par famille |
| 9 | Recherche « plaquettes » | Renvoie seulement la carte de la famille Freinage | un geste de plus pour rien | aller directement à Freinage, ou proposer « Plaquettes de frein : demander un prix » |
| 10 | Logo | Chat sur l'en-tête ordinateur et le pied de page, absent de l'en-tête téléphone ; troisième variante carrée « BF » | marque incohérente d'un écran à l'autre | une seule version |
| 11 | Page Accès | Ni carte, ni photo de l'entrée, ni RER C, bus ou stationnement ; repère « À environ 600 m de Vitry-sur-Seine » peu parlant | trouver le garage reste abstrait, les trois concurrents ont une carte | plan, photo de façade, gare RER C de Choisy-le-Roi, stationnement |
| 12 | Formulaire de rappel après diagnostic | « Symptôme : Le freinage a changé » répété juste sous « Que remarquez-vous ? » | redondance | supprimer la ligne Symptôme |
| 13 | Mentions légales | Hébergeur réduit à « Francfort (Allemagne) », médiateur non nommé | mentions obligatoires incomplètes | nom et adresse de l'hébergeur, nom et coordonnées du médiateur |
| 14 | Accueil, téléphone | 7 700 à 7 850 px, 18 cartes de familles avant l'atelier, la FAQ et le garage | on défile longtemps avant les informations de confiance | 6 familles puis « Voir toutes les familles » |

## 8. Basiques absents chez BF (présents chez au moins un concurrent)

- Avis clients, note et nombre (Speedy 4,6 sur 68 ; Vroomly 4,8 sur 26).
- Photos réelles : façade, atelier, équipe (les trois).
- Garantie des réparations (Vroomly : 1 an pièces et main-d'œuvre ; Speedy : garanties du réseau).
- Moyens de paiement (Speedy, Vroomly).
- Ancienneté et équipe (Europe Auto : 40 ans ; Vroomly : 5 mécaniciens, 12 ans).
- Carte intégrée (les trois).
- Prix indicatifs ou prix en ligne (Speedy, Vroomly).
- Rendez-vous ferme en ligne (Speedy, Vroomly).
- Contact écrit (courriel) : BF ne propose que le téléphone et le rappel.

## 9. Ce que BF est seul à faire

- Pré-diagnostic gradué, avec consigne de sécurité, transmis au garage.
- Statut d'ouverture exact, heure de réouverture, fermeture exceptionnelle motivée.
- « Vos droits chez nous » : réponses sourcées (garantie constructeur, pièces d'occasion, affichage des prix, médiation).
- Aucun bandeau cookies, aucun traceur : un geste de moins que les trois concurrents à chaque visite.
- Choix de gamme de pièce (neuve, occasion, reconditionnée) et retrait au comptoir.

---

## 10. Captures principales (dossier J6)

**BF Auto**
- Écran 1 à 01 h 38 : `bf-accueil-tel-scroll-00.png`, `bf-accueil-pc-scroll-00.png` ; état 02 h 14 (fermeture exceptionnelle) : `bf-statut-tel-maintenant.png`, `bf-statut-pc-maintenant.png`
- Barre fixe coupée et pastille orpheline : `bf-zoom-tel-barre-basse-exception.png`, `bf-zoom-tel-puce-exception.png`, `bf-zoom-tel-footer.png`
- Pré-diagnostic : `bf-diag-frein-tel-01.png` à `-05.png`, `bf-diag-resultat-tel-et-maintenant.png`, `bf-diag-resultat-pc-haut.png`, suite : `bf-diag-suite-rappel-tel-01.png`, `-02.png`
- Prix : `bf-freinage-tel-scroll-01.png`, `bf-tarifs-tel-scroll-00.png`, `bf-tarifs-tel-scroll-01.png`, `bf-tarifs-pc-scroll-00.png`
- Demande de prix prête à envoyer : `bf-devis-plaquettes-tel-avant-envoi.png`
- Zone vide ordinateur : `bf-accueil-pc-scroll-03.png`, `bf-accueil-pc-scroll-04.png`
- Illustrations en 404 : `bf-accueil-tel-cartes-images-404.png`, `bf-accueil-pc-cartes-images-404.png`, `bf-carrosserie-tel-figure-haut.png`
- Logo : `bf-zoom-pc-logo.png` ; Accès : `bf-acces-pc-scroll-00.png`, `bf-acces-tel-horaires-exception.png`

**Europe Auto 94** : `eu-tel-00-arrivee.png` (modale), `eu-tel-01-ecran1.png`, `eu-pc-01-ecran1.png`, `eu-pc-hero-2.png`, `eu-tel-02-menu.png`, `eu-tel-p0-01.png` (« APPELEZ-NOUS »), `eu-pc-04-appelez-clic.png`, `eu-tel-scroll-07.png` (boutons d'avis vers /contact), `eu-tel-scroll-10.png` (pied de page écrasé)

**Speedy Thiais** : `sp-tel-00-arrivee.png`, `sp-tel-01-ecran1.png` (« Ouvert » à 01 h 57), `sp-pc-01-ecran1.png`, `sp-tel-p2-00.png` (forfaits), `sp-tel-devis-freinage.png`

**Vroomly** : `vr-tel-00-arrivee.png`, `vr-tel-01-ecran1.png`, `vr-pc-01-ecran1.png`, `vr-tel-scroll-01.png` (avis), `vr-tel-scroll-03.png` (fermé, numéro, photo), `vr-tel-scroll-04.png` (expérience), `vr-tel-prix-01.png` (véhicule demandé avant les prix)

Scripts jetables : `lib.mjs`, `s*.mjs` (BF Auto), `c*.mjs` (concurrents).
