# Étude concurrentielle 01 : réseaux nationaux d'entretien et de réparation automobile (France, septembre 2026)

## Synthese

1. Le socle attendu en 2026 est net : fiche garage avec téléphone cliquable, itinéraire, horaires du jour et statut « ouvert / fermé jusqu'à », note moyenne avec nombre d'avis, et un moyen de demander un rendez-vous depuis le téléphone.
2. Les réseaux affichent des prix « à partir de » ou des prix moyens TTC et identifient le véhicule par plaque (modèle en repli) ; aucun ne propose une vraie orientation par questions simples sur un symptôme.
3. Leurs faiblesses sont récurrentes : promotions envahissantes, bandeaux cookies pleine page, compte ou coordonnées exigés avant l'estimation, pages de 1,4 à 11,7 Mo sur mobile.
4. BF Auto peut battre les réseaux sur la clarté, la rapidité, la franchise des prix et l'orientation par questions, sans copier leur lourdeur e-commerce.
5. Côté clients, l'intérêt pour la prise de rendez-vous en ligne (66 %) dépasse nettement l'offre réelle des ateliers (33 %) : c'est un attendu à couvrir simplement (étude Ipsos pour Dekra, échantillon allemand).

## Analyse par acteur

**Méthode et limites.** Observation directe le 2026-09-23 des sites publics, en navigateur Chromium (Playwright) émulant un ordinateur (1440 x 900) et un iPhone (390 x 844), cookies refusés à chaque fois que c'était possible. La commande `npx playwright screenshot` prévue n'a pas pu servir (le navigateur attendu par Playwright 1.63 n'est pas installé) : les captures ont été prises avec la même bibliothèque et un Chromium déjà présent sur le poste, sans rien télécharger. Les sites principaux norauto.fr et feuvert.fr renvoient une page de blocage aux navigateurs automatisés (« Accès temporairement restreint ») : aucun contournement n'a été tenté ; ces deux acteurs sont documentés par leurs centres d'aide, leurs sous-domaines accessibles et des résultats de recherche, avec la mention [A VERIFIER] quand l'information n'a pas été vue sur le site lui-même. Les poids de page sont mesurés une seule fois, sur mobile, cookies refusés (donc hors traceurs publicitaires chargés après consentement : ce sont des minorants). Les temps de chargement ne sont pas rapportés : la machine de mesure était très chargée pendant l'étude, ils ne seraient pas fiables.

### Tableau de synthèse

| Acteur | Taille annoncée | Prise de RDV en ligne | Identification véhicule | Prix affichés | Fiche centre (statut, itinéraire, tél.) | Avis visibles | Garantie affichée | Poids accueil mobile |
|---|---|---|---|---|---|---|---|---|
| Speedy | ~500 centres | Devis en 4 étapes, contact demandé avant l'estimation | Étape « Identification » [A VERIFIER : plaque ou modèle] | Promos en %, prix pneus | Excellente : statut du jour, horaires, itinéraire, RDV | 4,6 sur 303 avis (centre) ; 4,3 sur 114 375 (réseau) | 2 ans min. pièces et main d'oeuvre | 3,3 Mo, 65 requêtes |
| Midas | [A VERIFIER] | 2 entrées : « je connais / je ne connais pas le motif » | Plaque (AB123CD) | Oui (ex. diagnostic électronique 79 €) | Liste : horaires du jour, note, téléphone | 4,6/5 sur 1 919 avis (centre) | [A VERIFIER] | 1,9 Mo, 58 requêtes |
| AD | 2 300 adhérents | Devis immédiat en 3 étapes | Plaque ou modèle | « À partir de » par prestation | Statut « ouvre demain à 08:00 », tél., plan, courriel | 4,73/5 sur 4 833 avis (réseau) | Carrosserie à vie ; 2 ans selon garage | 1,4 Mo, 89 requêtes |
| Euromaster | 465 centres | RDV et devis estimatif | Plaque (AB-854-ER), dimension, modèle | Pneus « à partir de » | Très bonne : bouton « Appeler », statut, itinéraire | 4,5 sur 386 avis (centre) | [A VERIFIER] | 2,9 Mo, 103 requêtes |
| Norauto | 360+ centres | Achat de la prestation puis créneau, ou formulaire | Plaque (selon aide en ligne) | Oui [A VERIFIER sur site] | Très bonne : horaires centre et atelier séparés | 4,2 sur 166 avis (centre) | 2 ans sur pneus (crevaison) [A VERIFIER] | Non mesuré (bloqué) |
| Feu Vert | 328 à 354 centres selon sources [A VERIFIER] | En ligne pour prestations simples ; devis par le centre pour les complexes | Carte grise conseillée | [A VERIFIER] | [A VERIFIER] | [A VERIFIER] | 2 ans sauf géométrie [A VERIFIER] | Non mesuré (bloqué) |
| Point S | 690 centres | « Demande » de RDV, connexion proposée | [A VERIFIER] | Non vus | Horaires, tél., itinéraire ; ni statut ni note | Non vus sur la fiche | Non vue | 4,5 Mo, 114 requêtes |
| Vulco | [A VERIFIER] | Achat pneus en 4 étapes avec RDV | Dimension ou véhicule | Pneus | Recherche par position | [A VERIFIER] | [A VERIFIER] | 3,2 Mo, dont 2,3 Mo de JavaScript |
| Eurorepar Car Service | [A VERIFIER] | Devis en ligne puis RDV | Plaque, modèle ou numéro de série, plus kilométrage | « Devis en ligne & RDV » par prestation | [A VERIFIER] | Témoignages datés sur l'accueil | [A VERIFIER] | 11,7 Mo, 79 requêtes |
| Motrio (Renault, indépendants) | 1 500 réparateurs | RDV en ligne | [A VERIFIER] | Prix moyens TTC sur l'accueil | Horaires, tél., courriel, paiements acceptés ; pas de statut | 4,6 sur 6 523 avis Google (réseau) | Non vue | 1,4 Mo, 90 requêtes |
| Bosch Car Service | 600+ garages | Parcours en 6 étapes annoncé | [A VERIFIER] | Devis personnalisé à l'étape 3 | Recherche par ville | [A VERIFIER] | Code de conduite | 3,6 Mo, dont 1,6 Mo de polices |

### Speedy

- **Ce qu'il fait.** Accueil centré sur les pneus (sélecteur par dimensions en listes), promotion freins en tête, devis en ligne en 4 étapes affichées « Prestations, Identification, Contact, Estimation » (https://www.speedy.fr/devis). Téléphone d'aide sur la page devis (https://www.speedy.fr/devis). Fiches centres sur un sous-domaine dédié (https://centres-auto.speedy.fr/).
- **Ce qui est excellent.** La fiche centre mobile est la meilleure observée : note et nombre d'avis en tête, « Aujourd'hui : Ouvert » en vert avec l'horaire du jour, liste des horaires commençant par le jour courant, trois boutons empilés (itinéraire, rendez-vous, coupon), carte, centres voisins avec distance, consignes du jour J (pièce d'identité, carte grise) et mention « avec ou sans rendez-vous » (https://centres-auto.speedy.fr/garage/paris-bd-de-l-hopital-75013/63). Garanties claires et détaillées par famille : 2 ans minimum pièces et main d'oeuvre, kilométrage illimité, vitrage garanti à vie (https://www.speedy.fr/les-garanties-speedy). Preuves de confiance tierces : « Élu Service Client de l'Année 2026 » et note réseau 4,3 sur 5 sur 114 375 avis (https://www.speedy.fr/ ; https://www.speedy.fr/devis).
- **Ce qui est faible.** L'étape « Contact » précède l'« Estimation » : l'utilisateur doit donner ses coordonnées avant de voir un prix (https://www.speedy.fr/devis). Sur la fiche centre, un formulaire de collecte (nom, prénom, portable, courriel) pour un bon de réduction concurrence le rendez-vous (même URL). Pied de page de la fiche centre daté « © Speedy 2019 » (même URL), signe de gabarit non entretenu. Bandeau cookies avec 25 partenaires (https://www.speedy.fr/).
- **Capture.** `captures/speedy-fiche-centre-mobile.png`

### Midas

- **Ce qu'il fait.** Accueil organisé par intentions à la première personne : prendre un rendez-vous, chercher le prix d'une prestation, calculer la révision constructeur, rechercher ses pneus ; champ plaque d'immatriculation (exemple « AB123CD ») ; barre fixe en bas d'écran « Prendre RDV / Contactez-nous » avec le numéro 09 74 50 56 56 (https://www.midas.fr/). Page rendez-vous à deux portes : « je connais le motif de ma visite » ou « je ne connais pas le motif » (https://www.midas.fr/rendez-vous-midas). Pages symptômes et diagnostics gratuits par organe (freins, batterie, climatisation, embrayage, direction, échappement) et diagnostic électronique « voyant allumé » affiché 79 €, 129 € si le constructeur doit être consulté (https://www.midas.fr/entretien-auto/diagnostic-electronique).
- **Ce qui est excellent.** Les tuiles d'intention avec pictogrammes au trait parlent le langage du client, pas celui de l'atelier (https://www.midas.fr/). La porte « je ne connais pas le motif » reconnaît qu'une partie des clients arrive avec un symptôme, pas une prestation (https://www.midas.fr/rendez-vous-midas). La liste des centres affiche l'horaire du jour, la note et le nombre d'avis par centre (ex. 4,6/5 sur 1 919 avis) et le téléphone (https://www.midas.fr/centres-auto-midas/auvergne-rhone-alpes/isere/grenoble). Prix du diagnostic annoncé avant la visite, avec le cas de dépassement.
- **Ce qui est faible.** La porte « je ne connais pas le motif » n'ouvre qu'un champ de texte libre (« Veuillez préciser le motif de votre visite ») : aucune question guidée, aucun tri par urgence (https://www.midas.fr/rendez-vous-midas). Les étoiles de notation sont restituées en texte parasite répété (« (*) ★ ») pour les technologies d'assistance (https://www.midas.fr/centres-auto-midas/auvergne-rhone-alpes/isere/grenoble). Fenêtre de discussion qui s'ouvre d'elle-même et bandeau promotionnel en tête sur mobile.
- **Captures.** `captures/midas-accueil-mobile.png`, `captures/midas-rdv-motif-inconnu-desktop.png`

### AD (Autodistribution)

- **Ce qu'il fait.** Premier bloc « Trouvez votre garage AD, réservez votre RDV », moteur de devis par prestation avec raccourcis (entretien, distribution, pneus, amortisseurs) et explication en 3 étapes : « Je choisis ma prestation, J'obtiens un devis immédiat, Je prends rendez-vous » (https://www.ad.fr/). Identification par numéro d'immatriculation ou modèle (texte de l'accueil, https://www.ad.fr/). Prix « à partir de » par prestation (entretien 92,90 €, distribution 323,34 €, amortisseurs 189,90 €) (https://www.ad.fr/). Fiche garage avec statut d'ouverture, téléphone, plan, courriel, présentation du gérant (https://www.ad.fr/garage/garage-ad-expert-des-lices).
- **Ce qui est excellent.** Le triptyque en 3 étapes rend le parcours prévisible avant même de commencer. La note agrégée « 4.73/5 sur 4833 avis Goodays » est placée à côté du bouton de devis, au moment de la décision (https://www.ad.fr/). Statut « ouvre demain à 08:00 » sur la fiche garage (https://www.ad.fr/garage/garage-ad-expert-des-lices). Données structurées schema.org de type `AutoRepair` sur les listes de garages (https://www.ad.fr/garage-auto/ville/garage-rennes). Garantie « carrosserie à vie » et garantie pièces et main d'oeuvre mises en avant (https://www.ad.fr/nos-engagements).
- **Ce qui est faible.** Incohérence de prix sur la même page : la révision « débute à 79,90 € » dans le texte et « à partir de 92,90 € » dans l'encart (https://www.ad.fr/prestation/entretien-auto-revision-vidange). Accueil saturé : bandeau promotion, carrousel, véhicules d'occasion, recrutement, espace pro (https://www.ad.fr/). Fiche garage sans avis (« Pas encore d'avis pour ce garage ») et encombrée de voitures d'occasion (https://www.ad.fr/garage/garage-ad-expert-des-lices). Rouge saturé partout.
- **Capture.** `captures/ad-accueil-desktop.png`

### Euromaster

- **Ce qu'il fait.** Recherche pneus par plaque (exemple « AB-854-ER »), par dimension ou par modèle (« FIAT 500 L ») ; entretien par familles (révision, freinage, climatisation, distribution, électrique) ; trois blocs « Prendre RDV », « Obtenir un devis » (« devis estimatifs gratuitement en quelques clics »), « Trouver un centre » ; bandeau de réassurance « Devis gratuit, Livraison offerte, Diagnostic sécurité offert, Expertise et transparence, 465 centres, Paiement 100 % sécurisé » (https://www.euromaster.fr/).
- **Ce qui est excellent.** Fiche centre mobile avec un gros bouton « Appeler » juste sous l'adresse, note 4,5 sur 386 avis, lien « Rédiger un avis », « Itinéraire vers ce centre » et un statut précis : « Fermé jusqu'à jeudi 24/09/2026 8:00 » (https://www.euromaster.fr/centres/bretagne/rennes/euromaster-rennes-mail). Le statut dit quand revenir, pas seulement « fermé ». Déclaration d'accessibilité publiée en pied de page (https://www.euromaster.fr/).
- **Ce qui est faible.** Sur la fiche centre mobile, une bannière promotionnelle pousse les coordonnées sous le premier écran (même URL). Accueil centré vente de pneus, carrousel de 6 visuels, 24 partenaires cookies, 1,26 Mo de JavaScript (mesure de l'étude).
- **Capture.** `captures/euromaster-fiche-centre-mobile.png`

### Norauto

- **Ce qu'il fait.** Rendez-vous atelier par achat en ligne de la prestation (bouton « Ajouter », panier, choix du créneau, paiement en ligne, confirmation par courriel), ou par formulaire de contact traité par le service client, ou directement en centre (https://faq.norauto.com/hc/fr/articles/4404932317074-Comment-prendre-un-rendez-vous). Saisie de la plaque dans le parcours selon des sources secondaires [A VERIFIER] (https://www.norauto.fr/e/preparer-rdv-atelier.html). Fiches centres sur un sous-domaine accessible (https://centres.norauto.fr/).
- **Ce qui est excellent.** Fiche centre mobile sobre et hiérarchisée : nom, note 4,2 sur 166 avis avec lien, adresse, bouton « Itinéraire », bouton principal « Prendre RDV », carte, bouton téléphone ; horaires du centre et horaires de l'atelier distingués (https://centres.norauto.fr/ille-et-vilaine/rennes/9-allee-morvan-lebesque). Liste de prestations à jour avec les sujets récents (réglages ADAS, entretien hybride) (même URL). Palette marine proche de la référence esthétique d'Anthony.
- **Ce qui est faible.** Réserver en ligne passe par un paiement préalable, lourd pour une simple visite (https://faq.norauto.com/hc/fr/articles/4404932317074-Comment-prendre-un-rendez-vous). Le bandeau cookies couvre tout l'écran mobile de la fiche centre avant toute information (capture). Site principal inaccessible aux navigateurs automatisés : robustesse des parcours non vérifiée. Avis clients contrastés sur les retards et ventes additionnelles selon des agrégateurs [A VERIFIER] (https://fr.trustpilot.com/review/www.norauto.fr?page=2).
- **Captures.** `captures/norauto-fiche-centre-mobile.png`, `captures/norauto-bandeau-cookies-mobile.png`

### Feu Vert

- **Ce qu'il fait.** Distingue les prestations « simples » (révision, freinage, pneus), réservables en ligne, des prestations « complexes » (moteur, embrayage, turbo), qui passent par un devis personnalisé du centre avant tout rendez-vous ; conseille d'avoir le certificat d'immatriculation sous la main (https://aide.feuvert.fr/hc/fr/articles/5938091331601-Comment-prendre-rendez-vous). Rendez-vous en ligne avec paiement en centre (https://www.feuvert.fr/static/payez-en-centre-auto-13107.html) [A VERIFIER : page non consultable en direct].
- **Ce qui est excellent.** La séparation simple / complexe est honnête : on ne promet pas un prix en ligne pour un embrayage. Engagements annoncés : devis gratuits et détaillés, appel systématique avant tout travail supplémentaire, remise de 10 % si le temps annoncé est dépassé, garantie 2 ans pièces et main d'oeuvre sauf géométrie [A VERIFIER : lus dans des résultats de recherche, page https://www.feuvert.fr/static/les-engagements-feu-vert-3344.html bloquée].
- **Ce qui est faible.** Pour un symptôme ou une réparation lourde, le site renvoie vers le téléphone ou le centre sans outil d'orientation (https://aide.feuvert.fr/hc/fr/articles/5938091331601-Comment-prendre-rendez-vous). Nombre de centres incohérent selon les sources (328 ou 354) [A VERIFIER]. Site principal inaccessible aux navigateurs automatisés.
- **Capture.** Aucune (site bloqué).

### Point S

- **Ce qu'il fait.** Réseau d'indépendants (690 centres) ; bouton « Prendre rendez-vous, c'est parti » ; réassurance « Demande de rendez-vous en ligne, 690 centres, Paiement en magasin après prestation » ; « Garage Virtuel » gratuit avec rappels de révision (https://www.points.fr/).
- **Ce qui est excellent.** Le paiement après prestation et le rappel de prochaine révision sont deux promesses simples et rassurantes (https://www.points.fr/). Fiche centre complète sur l'essentiel : adresse, téléphone, horaires par jour, bouton « Obtenir l'itinéraire », liste des prestations du centre (https://www.points.fr/centre/garage-du-plateau-villemomble/).
- **Ce qui est faible.** Le rendez-vous est une « demande » et le clic ouvre d'abord une incitation à se connecter (« Connectez-vous dès maintenant pour gagner du temps ») (https://www.points.fr/). La fiche centre n'affiche ni statut ouvert / fermé, ni note, ni prix (https://www.points.fr/centre/garage-du-plateau-villemomble/). Textes génériques interchangeables d'un centre à l'autre. Page d'accueil la plus lourde en requêtes (114) de l'échantillon mesuré.
- **Capture.** Aucune.

### Vulco (réseau Goodyear)

- **Ce qu'il fait.** Achat de pneus en ligne expliqué en « Seulement 4 étapes » (pneus, prestations, rendez-vous, montage), sélecteurs de dimensions en listes, numéro d'aide 0 805 258 787 en tête de page, recherche de centre par position (https://www.vulco.fr/).
- **Ce qui est excellent.** Numéro d'aide visible dès la première ligne ; parcours annoncé et borné en étapes ; listes contraintes (largeur, profil, jante, indice de vitesse avec la vitesse en clair « V - 240 km/h ») (https://www.vulco.fr/).
- **Ce qui est faible.** 2,3 Mo de JavaScript sur l'accueil mobile (mesure de l'étude). Données structurées de l'organisation qui pointent vers Goodyear avec un téléphone et un courriel allemands et une URL mal formée (« https://www.vulco.fr/.html ») (code source de https://www.vulco.fr/). Entretien hors pneus peu développé.
- **Capture.** Aucune.

### Eurorepar Car Service (Stellantis)

- **Ce qu'il fait.** Accueil « Trouvez le garage le plus proche », chaque prestation porte « Devis en ligne & RDV » ; devis en 3 blocs : « Mon véhicule » (plaque, modèle ou numéro de série, plus kilométrage), « Mes prestations », « Localisation » (https://www.eurorepar.fr/ ; https://rendezvous.eurorepar.fr/devis?fastquote=true). Témoignages clients datés sur l'accueil et rubrique « Paroles de pro » (https://www.eurorepar.fr/).
- **Ce qui est excellent.** Champ plaque dessiné comme une vraie plaque française (bande bleue « F »), trois modes d'identification au choix, kilométrage demandé pour ajuster l'entretien (https://rendezvous.eurorepar.fr/devis?fastquote=true). Les témoignages racontent des cas concrets (panne de nuit, contre-visite) plus convaincants que des slogans (https://www.eurorepar.fr/).
- **Ce qui est faible.** Accueil mobile de 11,7 Mo, dont 4,5 Mo d'images (mesure de l'étude) : le plus lourd de l'échantillon. Fautes visibles (« Publié il y a 1 jours ») (https://www.eurorepar.fr/). Champ kilométrage sans unité ni exemple parlant (exemple « 123 ») (https://rendezvous.eurorepar.fr/devis?fastquote=true).
- **Capture.** `captures/eurorepar-devis-identification-mobile.png`

### Motrio (réseau Renault de garages indépendants multimarques)

- **Ce qu'il fait.** Accueil sobre : promesse, bouton unique « Prendre un rendez-vous », note Google 4,6 sur 6 523 avis, puis grille « Prestations atelier » avec prix moyens TTC (vidange 156 €, freinage 104 €, climatisation 106 €) et illustrations au trait ; bilan sécurité gratuit 38 points ; « Catalogue MOTRIO » de pièces (https://www.motrio.fr/). Fiche garage avec gérant nommé, services, « Demande personnalisée », moyens de paiement acceptés, horaires avec coupure de midi (https://www.motrio.fr/garage-reparateur/motrio-paris-19-sas-ejlj-3201).
- **Ce qui est excellent.** C'est le modèle le plus proche du besoin de BF Auto : un garage indépendant présenté avec clarté, des prix moyens assumés et des illustrations techniques au trait (https://www.motrio.fr/). Nommer le gérant humanise la fiche (https://www.motrio.fr/garage-reparateur/motrio-paris-19-sas-ejlj-3201). Accueil mobile parmi les plus légers mesurés (1,4 Mo).
- **Ce qui est faible.** Formats de prix incohérents sur la même grille (« 156€ TTC* » puis « € 274 TTC* ») et « Prix sur demande € » (https://www.motrio.fr/). Présentation de garage au ton générique et emphatique (« l'excellence automobile rencontre le service personnalisé ») (https://www.motrio.fr/garage-reparateur/motrio-paris-19-sas-ejlj-3201). Pas de statut ouvert / fermé sur la fiche. Coins très arrondis et rouge vif, loin de la palette voulue.
- **Capture.** `captures/motrio-accueil-prix-desktop.png`

### Bosch Car Service

- **Ce qu'il fait.** Réseau de plus de 600 garages indépendants en France ; parcours de rendez-vous décrit en 6 étapes (service, atelier, devis personnalisé, créneau, coordonnées, confirmation) ; code de conduite du réseau publié (https://www.boschcarservice.com/fr/fr/).
- **Ce qui est excellent.** Le devis personnalisé arrive avant le choix du créneau et avant les coordonnées : l'utilisateur sait ce qu'il paie avant de s'engager (https://www.boschcarservice.com/fr/fr/). Le code de conduite est une preuve de confiance écrite, vérifiable.
- **Ce qui est faible.** 6 étapes, c'est long sur mobile. 1,6 Mo de polices propriétaires chargées sur l'accueil mobile (mesure de l'étude). Jeu-concours en tête de page.
- **Capture.** Aucune.

### Mesure de poids des pages d'accueil (mobile, cookies refusés, 2026-09-23)

| Site | Requêtes | Poids total | JavaScript | Images | Polices | Domaines contactés |
|---|---|---|---|---|---|---|
| ad.fr | 89 | 1 415 Ko | 778 Ko | 300 Ko | 211 Ko | 7 |
| motrio.fr | 90 | 1 388 Ko | 1 019 Ko | 175 Ko | 33 Ko | 8 |
| midas.fr | 58 | 1 894 Ko | 715 Ko | 463 Ko | 511 Ko | 15 |
| euromaster.fr | 103 | 2 891 Ko | 1 259 Ko | 1 297 Ko | 75 Ko | 16 |
| vulco.fr | 47 | 3 178 Ko | 2 371 Ko | 592 Ko | 39 Ko | 10 |
| speedy.fr | 65 | 3 337 Ko | 686 Ko | 2 357 Ko | 187 Ko | 17 |
| boschcarservice.com/fr | 28 | 3 618 Ko | 1 161 Ko | 116 Ko | 1 580 Ko | 4 |
| points.fr | 114 | 4 479 Ko | 1 256 Ko | 2 809 Ko | 97 Ko | 12 |
| eurorepar.fr | 79 | 11 699 Ko | 1 219 Ko | 4 514 Ko | 35 Ko | 13 |
| bf-auto-pneus-pieces.com (site actuel du candidat de Roussillon, identité [A VERIFIER]) | 43 | 2 017 Ko | 364 Ko | 1 400 Ko | 178 Ko | 12 |

Lecture : aucun réseau ne descend sous 1,3 Mo ni sous 680 Ko de JavaScript. Un site rendu côté serveur, polices auto-hébergées et sans traceur tiers peut viser un ordre de grandeur de moins [A VERIFIER par mesure sur le site livré].

## Bonnes pratiques a reprendre pour BF Auto (classees par impact)

1. **Téléphone en un geste, partout.** Bouton « Appeler » pleine largeur sur mobile et barre fixe basse « Appeler / Rendez-vous » (Euromaster, Midas). Les canaux humains restent majeurs : 18 % préfèrent le téléphone et 19 % l'échange sur place (https://www.auto-infos.fr/article/les-automobilistes-attendent-davantage-de-services-numeriques-de-leur-atelier.293351, échantillon allemand).
2. **Statut d'ouverture calculé et parlant.** « Ouvert jusqu'à 19:00 » ou « Fermé, rouvre jeudi à 08:00 » plutôt que « Fermé » (Euromaster, Speedy, AD). Horaires listés en commençant par le jour courant (Speedy). Si l'atelier et l'accueil ont des horaires différents, les distinguer (Norauto) [A VERIFIER auprès du garage].
3. **Parcours de demande de rendez-vous annoncé et court.** Montrer les étapes avant de commencer (AD en 3 étapes, Vulco en 4) et viser 3 étapes au plus : véhicule, besoin, créneau souhaité et coordonnées. Coordonnées demandées en dernier, jamais avant l'information utile (contre-exemple Speedy).
4. **Identification du véhicule par choix contraints.** La plaque est le standard des réseaux (Midas, Euromaster, Eurorepar, AD) mais suppose un fournisseur de données véhicule, en général payant [A VERIFIER : coût et conditions]. Pour BF Auto : listes marque, modèle, motorisation, année, avec la plaque en option ultérieure. Kilométrage avec unité et exemple (contre-exemple Eurorepar).
5. **Prix indicatifs honnêtes pour les prestations courantes.** Grille de 6 à 8 prestations avec prix « à partir de » ou prix moyen TTC, conditions en une ligne et format unique (Motrio, AD, Midas). Prix réels du garage uniquement, sinon « sur devis » [A VERIFIER : grille tarifaire BF Auto].
6. **Preuve sociale sourcée, au bon endroit.** Note moyenne, nombre d'avis et source (Google par exemple) près du bouton d'action (AD, Motrio) et sur la fiche garage (Speedy, Norauto, Midas). Uniquement des avis réels, avec lien vers la source [A VERIFIER : existence et volume des avis BF Auto].
7. **Garanties et engagements écrits.** Garantie pièces et main d'oeuvre avec sa durée et ses exclusions (Speedy, Feu Vert), engagement « aucun travail supplémentaire sans votre accord » (Feu Vert, AD). À n'afficher que si BF Auto les pratique [A VERIFIER].
8. **Accueil par intentions, pas par organigramme.** Tuiles « Prendre rendez-vous », « Connaître un prix », « Ma voiture a un problème », « Trouver une pièce » (inspiration Midas), en cohérence avec la maquette (catalogue, information, diagnostic, contact).
9. **Porte « je ne sais pas ce que j'ai » assumée.** Garder l'idée Midas (deux portes : je connais / je ne connais pas le motif) mais la remplacer par des questions simples à choix (voir opportunités).
10. **Fiche pratique du jour J.** Documents à apporter (carte grise, pièce d'identité), « avec ou sans rendez-vous », moyens de paiement acceptés (Speedy, Motrio) [A VERIFIER auprès du garage].
11. **Données structurées locales.** Balisage schema.org `AutoRepair` avec adresse, horaires, téléphone et moyens de paiement (AD), pour que les moteurs de recherche affichent les bonnes informations.
12. **Illustrations techniques au trait.** Les pictogrammes filaires de Motrio et Midas prouvent qu'un style « plan » sert la lecture sans verser dans la décoration ; cohérent avec la contrainte du brief.

## A eviter absolument

- **Exiger des coordonnées avant de montrer une estimation** (Speedy, étape « Contact » avant « Estimation », https://www.speedy.fr/devis).
- **Imposer un compte ou une connexion** pour demander un rendez-vous (incitation Point S, https://www.points.fr/).
- **Imposer un paiement en ligne pour réserver** une visite d'atelier (Norauto, https://faq.norauto.com/hc/fr/articles/4404932317074-Comment-prendre-un-rendez-vous) : disproportionné pour un indépendant.
- **Un champ de texte libre comme seule aide au diagnostic** (Midas, https://www.midas.fr/rendez-vous-midas).
- **Des prix contradictoires ou mal formatés** sur une même page (AD 79,90 € contre 92,90 € ; Motrio « € 274 » contre « 156€ ») : ils ruinent la confiance que l'affichage des prix doit créer.
- **Bandeau cookies plein écran et dizaines de partenaires publicitaires** (Norauto, Speedy, Euromaster) : sans traceur tiers, BF Auto n'a pas besoin de bandeau de consentement [A VERIFIER : validation juridique de la liste des cookies réellement déposés].
- **Promotions, carrousels et coupons qui passent devant l'information utile** (AD, Euromaster, Speedy).
- **Fenêtre de discussion qui s'ouvre seule** (Midas) : un petit garage ne peut pas y répondre en continu, promesse non tenue.
- **Étoiles de notation lues comme du bruit** par les lecteurs d'écran (Midas) : toujours un texte alternatif du type « 4,6 sur 5, 1 919 avis ».
- **Textes génériques emphatiques** interchangeables d'un garage à l'autre (Motrio, Point S) : écrire des faits vérifiables, sinon rien.
- **Pages de plusieurs mégaoctets** (Eurorepar 11,7 Mo, Point S 4,5 Mo) et polices propriétaires lourdes (Bosch 1,6 Mo).
- **Gabarits non entretenus et données structurées fausses** (« © Speedy 2019 » sur une fiche 2026, données Vulco pointant vers Goodyear Allemagne).
- **Afficher une note, un avis, une garantie ou un prix non réels.** Les réseaux s'appuient sur des volumes d'avis vérifiés ; un indépendant qui inventerait perdrait tout (règle du brief).

## Opportunites de differenciation pour un garage independant

1. **Orientation par questions simples, vraiment guidée.** Aucun parcours observé ne propose un questionnaire symptôme par symptôme : Midas ouvre un texte libre, Feu Vert renvoie vers le centre pour les pannes « complexes », AD limite l'autodiagnostic aux pneus (lien « DIAGNOSTIC RAPIDE DE VOS PNEUS EN 3 CLICS », https://www.ad.fr/). BF Auto peut proposer 3 à 5 questions à choix (voyant allumé et couleur, bruit, où et quand, la voiture roule-t-elle) qui aboutissent à : niveau d'urgence, prestation probable, fourchette de prix si connue, et action immédiate (appeler, demander un rendez-vous). Le présenter comme une orientation, jamais comme un diagnostic, avec renvoi systématique vers l'atelier.
2. **Transparence radicale sur les prix.** L'affichage du taux horaire TTC et des forfaits est obligatoire dans l'établissement (arrêté du 27 mars 1987, https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000862823) mais aucun réseau observé ne le publie en ligne. Le mettre en ligne tel qu'affiché au garage est un marqueur de confiance simple [A VERIFIER : taux horaire réel].
3. **Catalogue de pièces en vitrine, sans e-commerce.** Les réseaux vendent en ligne avec panier et paiement ; BF Auto peut proposer une vitrine avec compatibilité par listes (marque, modèle, motorisation) et un bouton « demander la disponibilité et le prix posé », ce qui colle à la maquette et évite paiement en ligne, retours et droit de rétractation (YAGNI) [A VERIFIER : périmètre du catalogue réel].
4. **Rapidité perçue imbattable.** Tous les réseaux mesurés dépassent 1,3 Mo et 680 Ko de JavaScript sur mobile ; un rendu serveur avec JavaScript en amélioration progressive et zéro traceur peut s'afficher quasi instantanément, même en zone mal couverte.
5. **Humain et local.** Nommer l'équipe et le gérant (Motrio le fait), montrer le vrai atelier en photo, répondre en direct au téléphone : la force de l'indépendant face aux centres de marque [A VERIFIER : accord et photos du garage]. Tendance favorable : 44 % des automobilistes confient leur voiture à un indépendant en 2026 contre 36 % en 2024 (étude Ipsos pour Dekra, échantillon allemand, https://www.auto-infos.fr/article/les-automobilistes-attendent-davantage-de-services-numeriques-de-leur-atelier.293351).
6. **Engagement écrit « rien sans votre accord ».** Devis avant intervention et appel avant tout travail supplémentaire, en une phrase visible (inspiration Feu Vert), si BF Auto s'y engage [A VERIFIER].
7. **Accessibilité réelle.** Les microentreprises (moins de 10 salariés, 2 M€ au plus) sont exemptées de l'acte européen sur l'accessibilité pour les services (https://reciteme.com/news/european-accessibility-act-in-france/), mais viser WCAG 2.2 AA comme l'exige le brief distingue BF Auto des sites observés (étoiles illisibles, bandeaux qui masquent le contenu).
8. **Plus tard, si le garage suit : suivi et rappels.** Les attentes non couvertes sont fortes (suivi de l'avancement 65 % d'intérêt contre 27 % d'offre ; échéances en ligne 56 %) (même source Auto Infos). Point S propose déjà des rappels de révision (https://www.points.fr/). À garder hors du premier lot tant que le garage n'a pas l'organisation pour les tenir.

## Pre-classement Kano propose (basique / performance / attractive / indifferente / a eviter)

**Basique (absence = mécontentement, présence = normal)**
- Téléphone cliquable visible en permanence sur mobile : présent chez tous les acteurs observés, premier canal de contact.
- Adresse avec lien itinéraire ou carte : présent sur toutes les pages centres observées (bouton explicite chez Speedy, Euromaster, Norauto, Point S, AD).
- Horaires complets par jour : présents sur toutes les fiches centres détaillées observées (Speedy, Euromaster, Norauto, Point S, Motrio).
- Statut « ouvert maintenant / rouvre à » : présent sur 5 pages centres de réseau sur 7 observées (Speedy, Euromaster, AD, Norauto, Midas), c'est devenu la norme.
- Liste claire des prestations réalisées : présente partout ; le client doit savoir en 5 secondes si le garage traite son problème.
- Moyen de demander un rendez-vous depuis le site : offert par tous les réseaux ; 66 % d'intérêt selon l'étude Ipsos pour Dekra.
- Formulaire de contact simple : prévu à la maquette, indispensable hors horaires d'ouverture.
- Lisibilité mobile sans zoom : tous les réseaux sont adaptés au mobile, le contraire serait rédhibitoire.
- Mentions légales et politique de confidentialité : obligation légale, présente partout.

**Performance (plus c'est réussi, plus la satisfaction monte)**
- Nombre d'étapes et temps pour demander un rendez-vous : de 3 étapes (AD) à 6 (Bosch) ; moins il y en a, mieux c'est.
- Prix indicatifs TTC des prestations courantes : plus ils sont nombreux et cohérents, plus la confiance monte (Motrio, AD).
- Identification du véhicule par choix contraints (listes ou plaque) : réduit les erreurs et les allers-retours téléphoniques.
- Note moyenne et nombre d'avis sourcés : effet proportionnel au volume et à la fraîcheur des avis réels.
- Vitesse de chargement et légèreté : écart mesurable face aux 1,4 à 11,7 Mo des réseaux.
- Garantie et engagements affichés : plus ils sont précis (durée, exclusions), plus ils rassurent.
- Informations pratiques du jour J (documents, paiements acceptés, avec ou sans rendez-vous) : réduisent l'incertitude avant la visite.

**Attractive (inattendue, forte satisfaction, pas de mécontentement si absente)**
- Orientation par questions simples sur un symptôme avec niveau d'urgence et action proposée : aucun réseau observé ne le fait vraiment.
- Catalogue de pièces avec compatibilité et demande de disponibilité : rare chez un garage de proximité, demandé par la maquette.
- Taux horaire TTC publié en ligne : obligation en atelier, absent en ligne chez les réseaux observés.
- Engagement « aucun travail sans votre accord » formulé en une phrase : rassure sur la crainte principale des clients.
- Équipe et atelier réels présentés (noms, photos) : humanise face aux réseaux [A VERIFIER : accord du garage].
- Absence de bandeau cookies grâce à zéro traceur : le client arrive directement sur l'information.

**Indifférente (peu d'effet sur la satisfaction pour ce public)**
- Blog de conseils longs : utile au référencement des réseaux, peu lu par un client local pressé.
- Espace client avec compte : les usagers d'un garage de proximité n'en attendent pas pour une visite ponctuelle.
- Vente de véhicules d'occasion, recrutement, franchise : hors besoin exprimé par la maquette.
- Fenêtre de discussion en direct : sans équipe pour y répondre, elle n'apporte rien (voir aussi à éviter).

**À éviter (présence = mécontentement)**
- Coordonnées exigées avant toute estimation : bloque et fait fuir vers le téléphone ou un concurrent.
- Compte obligatoire ou paiement en ligne pour réserver : friction disproportionnée pour une visite d'atelier.
- Carrousels, bannières promotionnelles et coupons au premier écran : masquent l'information cherchée.
- Bandeau cookies plein écran : premier écran perdu sur mobile.
- Texte libre seul pour décrire une panne : laisse le client seul face à son vocabulaire.
- Avis, notes, garanties ou prix fictifs ou incohérents : perte de confiance immédiate et risque légal.
- Fenêtre de discussion qui s'ouvre seule : intrusive et promesse de disponibilité intenable.

## Sources

Sites observés directement le 2026-09-23 :
- Speedy : https://www.speedy.fr/ ; https://www.speedy.fr/devis ; https://www.speedy.fr/les-garanties-speedy ; https://centres-auto.speedy.fr/ ; https://centres-auto.speedy.fr/garage/paris-bd-de-l-hopital-75013/63
- Midas : https://www.midas.fr/ ; https://www.midas.fr/rendez-vous-midas ; https://www.midas.fr/entretien-auto/diagnostic-electronique ; https://www.midas.fr/centres-auto-midas/auvergne-rhone-alpes/isere/grenoble
- AD : https://www.ad.fr/ ; https://www.ad.fr/prestation/entretien-auto-revision-vidange ; https://www.ad.fr/garage-auto/ville/garage-rennes ; https://www.ad.fr/garage/garage-ad-expert-des-lices ; https://www.ad.fr/nos-engagements
- Euromaster : https://www.euromaster.fr/ ; https://www.euromaster.fr/centres/bretagne/rennes/euromaster-rennes-mail
- Norauto : https://centres.norauto.fr/ ; https://centres.norauto.fr/ille-et-vilaine/rennes/9-allee-morvan-lebesque ; https://faq.norauto.com/hc/fr/articles/4404932317074-Comment-prendre-un-rendez-vous ; https://www.norauto.fr/ (page de blocage aux navigateurs automatisés)
- Feu Vert : https://aide.feuvert.fr/hc/fr/articles/5938091331601-Comment-prendre-rendez-vous ; https://www.feuvert.fr/ (page de blocage aux navigateurs automatisés)
- Point S : https://www.points.fr/ ; https://www.points.fr/centre/garage-du-plateau-villemomble/
- Vulco : https://www.vulco.fr/
- Eurorepar Car Service : https://www.eurorepar.fr/ ; https://rendezvous.eurorepar.fr/devis?fastquote=true
- Motrio : https://www.motrio.fr/ ; https://www.motrio.fr/nos-garages/paris ; https://www.motrio.fr/garage-reparateur/motrio-paris-19-sas-ejlj-3201
- Bosch Car Service : https://www.boschcarservice.com/fr/fr/
- Site actuel du candidat BF Auto (identité [A VERIFIER]) : https://bf-auto-pneus-pieces.com/

Sources consultées par moteur de recherche (non lues en direct, informations marquées [A VERIFIER] dans le texte) :
- https://www.feuvert.fr/static/les-engagements-feu-vert-3344.html
- https://www.feuvert.fr/static/payez-en-centre-auto-13107.html
- https://www.feuvert.fr/static/rendez-vous-en-ligne-15582.html
- https://www.norauto.fr/e/preparer-rdv-atelier.html
- https://www.norauto.fr/e/panne-voyant-moteur-diagnostics.html
- https://fr.trustpilot.com/review/www.norauto.fr?page=2

Études et textes de référence :
- Étude Ipsos pour Dekra 2026 sur la digitalisation de l'après-vente (1 000 propriétaires, Allemagne), article Auto Infos du 04/09/2026 : https://www.auto-infos.fr/article/les-automobilistes-attendent-davantage-de-services-numeriques-de-leur-atelier.293351
- Arrêté du 27 mars 1987 relatif à la publicité des prix des prestations d'entretien et de réparation automobile : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000862823
- Acte européen sur l'accessibilité, exemption des microentreprises pour les services : https://reciteme.com/news/european-accessibility-act-in-france/

Captures (dossier `docs/recherche/captures/`) :
- `speedy-fiche-centre-mobile.png`
- `midas-accueil-mobile.png`
- `midas-rdv-motif-inconnu-desktop.png`
- `ad-accueil-desktop.png`
- `euromaster-fiche-centre-mobile.png`
- `norauto-fiche-centre-mobile.png`
- `norauto-bandeau-cookies-mobile.png`
- `eurorepar-devis-identification-mobile.png`
- `motrio-accueil-prix-desktop.png`
