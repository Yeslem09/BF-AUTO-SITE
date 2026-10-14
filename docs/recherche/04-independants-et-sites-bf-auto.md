# Étude 04 : garages indépendants de référence et sites existants « BF Auto »

Consultation des sources : 23 septembre 2026. Captures dans `docs/recherche/captures/`.
Méthode de capture : la commande `npx --no-install playwright screenshot` a échoué (build de navigateur absent pour la version 1.63), les captures ont donc été prises avec le Chromium déjà installé, via un script Node aux mêmes réglages (fenêtre 1440 x 900 ou profil « iPhone 13 », attente 3000 ms). Neuf captures prises, une en échec (Mez'Auto 25, délai dépassé).

## Synthèse

1. Le seul « BF Auto » doté d'un site propre est BF AUTO Pneus & Pièces détachées à Roussillon (Simplébo) : bonne base (téléphone cliquable, pages par service et par ville, vraie photo de façade) mais mentions légales vides, aucun prix, nom commercial incohérent (cinq variantes), données structurées génériques et fautives, fautes jusque dans l'accroche.
2. Les autres « BF Auto » (Erbrée, Corbeil-Essonnes, Aspiran, Satillieu) n'ont pas de site propre identifié : fiche de réseau AD ou annuaires. L'homonymie impose d'ancrer l'identité « BF Auto + ville » partout.
3. Chez les indépendants qui inspirent confiance, cinq choix reviennent : photos réelles de l'atelier et des personnes, prix chiffrés et datés, téléphone et horaires visibles sans chercher, preuves sociales vérifiables, un seul appel à l'action principal.
4. Le référencement local repose sur la fiche Google (pertinence, distance, popularité), la cohérence du nom, de l'adresse et du téléphone, une page par service et un balisage schema.org précis (AutoPartsStore et TireShop plutôt que LocalBusiness).
5. Différenciation accessible : transparence chiffrée sur les pneus d'occasion (grille d'usure), commande de pièce en moins de 24 h, diagnostic par questions qui oriente sans promettre, site sans bandeau cookies car sans traceur tiers.

## Analyse par acteur

### A. Sites et fiches existants « BF Auto »

#### A1. BF AUTO Pneus & Pièces détachées, Roussillon (38) : https://bf-auto-pneus-pieces.com/

Captures : `captures/bf-auto-roussillon-desktop.png`, `captures/bf-auto-roussillon-mobile.png`.

**Ce qu'il fait (état actuel)**
- Site vitrine Simplébo (« Création et référencement du site par Simplébo », pied de page, ©2025). Menu : Accueil, Nos produits (Pneus neufs et d'occasions, Pièces détachées, Additifs et Fluide, Nettoyage et detailing, Climatisation), Le garage, Contact, bouton téléphone. Source : https://bf-auto-pneus-pieces.com/
- Titre de page : « BF AUTO garage automobile, pièces détachées à Roussillon ». Coordonnées : 252 N7, 38150 Roussillon, 04 74 11 61 70. Horaires : lundi 14h-18h ; mardi à jeudi et samedi 9h-12h / 14h-18h ; vendredi 9h-12h / 15h-18h ; dimanche fermé. Source : page d'accueil et https://bf-auto-pneus-pieces.com/contact-bf-auto-access-pneus-neufs-pieces-detachees-a-roussillon
- Entité juridique : SAS BF AUTO PNEUS & PIECES DETACHEES, SIREN 981 962 459, créée le 24 novembre 2023, activité déclarée de commerce de détail de pièces, accessoires et pneumatiques, capital 1 000 €. Source : https://www.pappers.fr/entreprise/bf-auto-pneus-pieces-detachees-981962459
- Prestations de service repérées ailleurs : montage, équilibrage, valves, permutation, réparation de crevaison (Allopneus, centre « BF AUTO-ACCESS », 9,9/10 sur 5 avis). Source : https://www.allopneus.com/montage-pneu/isere-38/roussillon/bf-auto-access-25434 . Vroomly : « BF AUTO ACCESS », 4,8/5 sur 1 avis. Source : https://www.vroomly.com/garages/bf-auto-access-38150-n7/ . Note Google : [A VERIFIER] (un résumé de moteur de recherche annonce 5/5 sur 15 avis, non confirmé à la source).
- Mesure indicative (un seul passage, profil iPhone 13 émulé, réseau non bridé, pas un audit Lighthouse) : 32 requêtes, environ 3,3 Mo transférés, 11 domaines appelés dont Google Fonts (via axept.io) et le gestionnaire de consentement Axeptio, événement « load » à 11,4 s. Source : mesure locale du 23/09/2026 [A VERIFIER par un audit Lighthouse avant toute comparaison chiffrée].

**Ce qui est excellent (à conserver)**
- Téléphone cliquable (`tel:0474116170`, trois occurrences) et, sur mobile, barre d'actions sous l'en-tête : appeler, itinéraire, menu. Source : capture mobile et code de la page.
- Une page par famille de produits avec la ville dans l'adresse : `/pneus-neuf-et-occasion-a-roussillon-38150`, `/pieces-detachees-a-roussillon-38150`, `/recharge-climatisation-a-roussillon-38150`, etc. Ces adresses sont un capital de référencement : les conserver ou les rediriger en 301. Source : liens de la page d'accueil.
- Une vraie photo de la façade (section 2 de l'accueil). Source : capture desktop.
- Un contenu singulier et utile : les pneus d'occasion classés en trois gammes selon la profondeur de sculpture (2 à 4 mm, 4 à 6 mm, plus de 6 mm) et une liste de marques. Source : https://bf-auto-pneus-pieces.com/pneus-neuf-et-occasion-a-roussillon-38150
- Une promesse de service forte, enfouie dans le texte : pièce non disponible commandée pour une réception en moins de 24 h, selon la référence. Source : https://bf-auto-pneus-pieces.com/pieces-detachees-a-roussillon-38150
- Positionnement clair « professionnels ou particuliers » et retrait rapide en magasin (méta-description). Source : page d'accueil.
- Des données structurées existent déjà (WebSite, LocalBusiness avec `sameAs` vers Facebook, Instagram, LinkedIn et la fiche Google Maps). Source : code de la page d'accueil.

**Ce qui est faible (à corriger)**
- Mentions légales vides : la page ne contient qu'un formulaire de signalement d'abus ; ni forme juridique, ni capital, ni SIREN, ni coordonnées de l'hébergeur. Or ces mentions sont obligatoires pour une société (amende jusqu'à 375 000 €). Sources : https://bf-auto-pneus-pieces.com/mentions-legales et https://entreprendre.service-public.gouv.fr/vosdroits/F37351
- Nom commercial incohérent : sur le site même « BF AUTO », « BF AUTO-PNEU », « BF AUTO-PNEUS », « BF-AUTO-ACCESS » ; ailleurs « BF AUTO-ACCESS » (Allopneus), « BF AUTO ACCESS » (Vroomly), « BF AUTO PNEUS » (https://www.grip500.fr/montage/isere/roussillon/41357), comptes sociaux « bf.auto.access ». L'enseigne sur la photo de façade semble porter « BF-AUTO-ACCESS » [A VERIFIER]. Le nom à afficher est une décision client [A VERIFIER].
- Fautes visibles dès l'accroche : « Toutes vos pièces & pneus a porté de main ! », « Pneus neuf & d'occasion », « ont vous accompagnent », « réception en mois de 24h », « Entré de gamme ». Sources : accueil, page pièces, page pneus.
- Accroche peu distinctive : La Maison Mécanique utilise la même idée (« La mécanique à portée de main ! »). Source : https://lamaisonmecanique.fr/
- Données structurées génériques et fautives : type `LocalBusiness` au lieu du sous-type le plus précis recommandé par Google ; horaires en `openingHours` avec une chaîne concaténée invalide (« Mo-Th 14:00-18:00Sa-Sa 14:00-18:00 ») ; image de banque d'images (« adobestock_220965574 ») légendée « BF Auto garage à Roussillon ». Sources : code de la page, https://developers.google.com/search/docs/appearance/structured-data/local-business
- Deux balises H1 sur l'accueil. Source : code de la page.
- Aucun prix nulle part (pneus neufs, pneus d'occasion, clim, pièces). Aucun catalogue consultable : descriptions de familles seulement, commande par téléphone ou en magasin. Sources : pages produits.
- Formulaire de contact : six champs en texte libre (Nom, Prénom, Email, Téléphone, Sujet, Message), aucun choix contraint pour le sujet, aucune mention d'information sur les données personnelles visible. Source : page contact (lecture automatique) [A VERIFIER à l'œil].
- Visuels principaux de banque d'images (pneus en fumée, pièces chromées) ; sur mobile, l'encart blanc du bandeau occupe tout le premier écran sans afficher horaires ni adresse. Source : captures.
- Page climatisation : allégations non étayées (réfrigérant HC-12A présenté comme « le plus efficace du marché », « garantie constructeur » préservée, ajout possible sans vidanger le circuit). La page cite elle-même la classe A3, soit un fluide peu toxique mais très inflammable selon ISO 817. Ne rien reprendre de ces allégations sans validation technique et juridique du garage. Sources : https://bf-auto-pneus-pieces.com/recharge-climatisation-a-roussillon-38150 et https://iifiir.org/en/encyclopedia-of-refrigeration/hydrocarbon-refrigerants [A VERIFIER]
- Dépendances tierces (polices distantes, gestionnaire de consentement, statistiques) et bouton de consentement flottant qui recouvre le contenu en bas à gauche. Source : mesure et captures.

#### A2. Garage AD BF Auto, Erbrée (35) : fiche réseau https://www.ad.fr/garage/garage-ad-bf-auto

Capture : `captures/ad-bf-auto-erbree-desktop.png`.

- **Ce qu'il fait** : pas de site propre identifié ; fiche du réseau AD (mécanique multimarque, carrosserie, vitrage, pneus, véhicules d'occasion et sans permis). Dirigeants nommés, 25 ans d'expérience annoncés. Page Facebook : https://www.facebook.com/GarageBfAuto/ . Source : fiche AD.
- **Excellent** : note visible en en-tête (4,84/5 sur 111 avis Goodays) ; prix « à partir de » chiffrés (distribution à partir de 323,34 €, géométrie à partir de 69 €) ; devis et rendez-vous en ligne ; statut « ouvre demain à 08:30 » ; garantie de 6 mois annoncée sur les véhicules d'occasion. Source : fiche AD et capture.
- **Faible** : fenêtre cookies bloquante avec « Tout accepter » en gros bouton rouge et « Continuer sans accepter » en petit lien, alors que la CNIL exige de pouvoir refuser « avec le même degré de simplicité » (https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi) ; bandeau promotionnel du réseau en tête ; pictogrammes de services sans libellé ; identité du garage noyée dans la charte du réseau.
- **Leçon** : une fiche de réseau fait mieux que le site Simplébo sur la preuve sociale et les prix, et moins bien sur l'identité propre.

#### A3. BF Auto Corbeil-Essonnes (91), Aspiran (34), Satillieu (07)

- **Corbeil-Essonnes** : vente de véhicules d'occasion, fiche annuaire, aucun site propre trouvé. Sources : https://www.autocadre.com/garage/773539 , https://www.societe.com/societe/bf-auto-848616215.html [A VERIFIER].
- **Aspiran** : garage mécanique et carrosserie (16 rue Souville selon Mappy), page Facebook, aucun site propre trouvé. Sources : https://www.facebook.com/BFAuto34800/ , https://fr.mappy.com/poi/684e2fd568fb3d3b7af928a0 [A VERIFIER].
- **Satillieu** : « BF Auto-Services », présent seulement dans les annuaires. Sources : https://www.pagesjaunes.fr/pros/56571279 , https://mecazen.fr/garage/garage-bf-auto-services [A VERIFIER].
- **Leçon** : au moins cinq entreprises « BF Auto » coexistent en France. Une recherche « BF Auto » seule ne mène pas au bon garage : titre, H1, balisage et fiche Google doivent toujours associer le nom à la ville.

### B. Garages indépendants de référence

#### B1. Ottohaus of Charleston (États-Unis, spécialiste des marques allemandes) : https://www.ottohausofcharleston.com/

Captures : `captures/ottohaus-desktop.png`, `captures/ottohaus-mobile.png`.

- **Ce qu'il fait** : garage indépendant spécialisé (Audi, Volkswagen, BMW, Mercedes, Porsche), deux adresses, fondé en 2015. Source : page d'accueil.
- **Excellent** : logo mémorable et signifiant (une barbe dessinée en clés plates, sous-titre « The German Mechanic ») ; photo réelle et large de l'atelier ; barre « Call Now » fixée en bas d'écran sur mobile ; tarif de diagnostic affiché (160 $) ; nombreux avis Google mis en avant (547 annoncés). Source : captures et page d'accueil.
- **Faible** : sur mobile, le bandeau de recrutement et l'en-tête occupent presque tout le premier écran, la promesse n'apparaît qu'au second ; fond noir intégral et typographie très chargée.
- **Leçon** : un logo avec une idée graphique forte et une photo d'atelier réelle suffisent à poser l'identité ; l'appel téléphonique fixe en bas d'écran est le geste mobile de référence.

#### B2. La Maison Mécanique (Argenteuil, atelier collaboratif deux-roues) : https://lamaisonmecanique.fr/

Captures : `captures/maison-mecanique-desktop.png`, `captures/maison-mecanique-mobile.png`.

- **Ce qu'il fait** : atelier où l'on répare soi-même avec accompagnement, ou confie l'intervention ; réservation en ligne, devis, magasin de pièces. Analogue de modèle, pas concurrent direct (deux-roues). Source : page d'accueil.
- **Excellent** : vidéo réelle de l'atelier avec clients ; grille de prix très détaillée et explicite (vidange 35 €, montage et équilibrage 37 € par jante, mention « Prix affichés TTC hors pièces ») ; règle du jeu écrite (pas de montage de pièces non achetées sur place) ; un seul bouton « Réserver » constant. Source : page d'accueil.
- **Faible** : compteurs animés qui valent « 0 » dans le HTML sans JavaScript (« 0 Ponts élévateurs ») : un zéro qui ment ; sur mobile, le logo déborde de l'en-tête sur la vidéo ; accroche identique à celle de BF Auto.
- **Leçon** : la transparence tarifaire chiffrée et la règle du jeu explicite sont les meilleurs arguments d'un petit atelier. Aucun chiffre ne doit dépendre du JavaScript pour être juste.

#### B3. M&V Tech (Bouloc, nord de Toulouse) : https://www.garagemvtech.com/

Capture : `captures/mv-tech-desktop.png`.

- **Ce qu'il fait** : garage indépendant multimarque (mécanique, diagnostic électronique, boîte automatique, pneus, équipements). Source : page d'accueil.
- **Excellent** : barre utilitaire en haut de page avec horaires, deux téléphones et courriel ; vidéo aérienne du vrai bâtiment ; appel à l'action unique « Prenez votre rdv » ; grille tarifaire datée (« entré en vigueur le 1er janvier 2026 »), taux horaires HT et TTC par niveau de complexité (85 € et 95 € TTC), montage de pneus par taille (25 € ou 35 € TTC) ; fondateur présenté ; balisage schema.org `AutoRepair`. Source : code et texte de la page d'accueil.
- **Faible** : bandeau cookies « En poursuivant votre navigation, vous acceptez » que la CNIL juge insuffisant (la poursuite de navigation ne vaut pas consentement, https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi) ; page d'accueil lourde (HTML d'environ 890 Ko) ; bouton rouge avec ombre portée.
- **Leçon** : la date d'effet sur une grille de prix transforme une promesse de transparence en preuve. À reprendre tel quel.

#### B4. Mez'Auto 25 (Besançon) : https://www.mezauto25.fr/

Capture : échec (délai dépassé), non retentée.

- **Ce qu'il fait** : garage indépendant fondé en décembre 2022, menu court (Accueil, Prestations, Tarifs, Recrutement, Contact), mentions des communes voisines pour le référencement local. Source : page d'accueil.
- **Excellent** : photo réelle de l'équipe, trois techniciens présentés ; navigation minimale.
- **Faible** : entrée « Tarifs » sans aucun chiffre sur l'accueil, promesse de « tarification transparente » non tenue [A VERIFIER sur la page Tarifs].
- **Leçon** : annoncer la transparence sans chiffres produit l'effet inverse.

#### B5. Stress-Free Auto Care (États-Unis, réseau de plus de 30 ateliers, donc pas indépendant) : https://www.stressfree.com/

Capture : `captures/stressfree-desktop.png`. Retenu comme référence de transparence, pas comme modèle d'indépendant.

- **Excellent** : module « Check Our Pricing » en premier écran : atelier, prestation, année, marque, modèle en listes déroulantes, puis prix, durée et prochain créneau ; quatre tuiles de réassurance courtes (garantie 24 mois ou 24 000 miles, techniciens certifiés, ouvert 7 jours sur 7, jusqu'à 30 % moins cher que la concession) ; photos d'inspection numérique envoyées au client. Source : page d'accueil et capture.
- **Faible** : bandeau promotionnel avec compte à rebours (urgence artificielle) ; couleurs saturées (violet, orange, cyan) ; bulle de discussion flottante ; ombres portées.
- **Leçon** : des choix contraints qui mènent à un prix affiché sont le patron d'interaction à transposer au diagnostic et à la demande de pièce de BF Auto, sans le décor commercial.

#### B6. Recueils d'exemples consultés

- Colorlib, 24 exemples de sites de garages (liste d'indépendants américains, critères génériques : appels à l'action visibles, photos réelles, témoignages). Source : https://colorlib.com/wp/auto-repair-website-examples/
- CyberOptik (accès refusé, 403) et mycodelesswebsite (vérification anti-robot) : non exploitables.
- Palmarès « Top 10 Auto Repair Website Awards » : page source introuvable (404), critères non vérifiés [A VERIFIER]. Les distinctions Awwwards du secteur automobile concernent des configurateurs 3D et des concessions, pas des garages de proximité (https://www.awwwards.com/websites/automotive/) : inspiration hors sujet pour BF Auto.

### C. Référencement local : règles vérifiées

- **Fiche Google (Google Business Profile)** : le classement local repose sur trois facteurs, « pertinence, distance et popularité ». Conseils officiels : informations complètes et à jour (adresse, horaires, catégorie), réponse aux avis, photos, produits. Source : https://support.google.com/business/answer/7091?hl=fr
- **Données structurées** : propriétés obligatoires `name` et `address` ; recommandées `openingHoursSpecification`, `geo`, `telephone`, `priceRange`, `url` ; utiliser le sous-type le plus précis ; `review` et `aggregateRating` réservés aux sites qui collectent des avis sur d'autres commerces (pas d'avis sur soi-même). Source : https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=fr
- **Sous-types pertinents** : `AutoPartsStore` (sous `Store` et `AutomotiveBusiness`), `TireShop` (sous `Store`), `AutoRepair` (sous `AutomotiveBusiness`). Sources : https://schema.org/AutoPartsStore , https://schema.org/TireShop , https://schema.org/AutomotiveBusiness . Pour Roussillon : `AutoPartsStore` et `TireShop` correspondent à l'activité déclarée ; `AutoRepair` seulement si des prestations d'atelier sont confirmées (montage, clim) [A VERIFIER].
- **Avis** : sur 1 002 consommateurs américains, 97 % lisent les avis des commerces locaux, 74 % cherchent des avis de moins de trois mois, 80 % se disent enclins à choisir un commerce qui répond à tous ses avis, 45 % utilisent des outils d'IA pour trouver un commerce local. Échantillon américain, transposition à la France prudente. Source : https://www.brightlocal.com/research/local-consumer-review-survey/
- **Affichage d'avis sur son propre site** : obligation d'indiquer près des avis s'ils sont contrôlés, la date de l'avis et de l'expérience, et les critères de classement (articles L111-7-2 et D111-17 du code de la consommation). Sources : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049571119 , https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035724934/2023-03-28

### D. Obligations propres au métier (à intégrer au contenu)

- **Affichage des prix** : taux horaires TTC et prix TTC des forfaits affichés à l'entrée et à l'accueil, liste détaillée des opérations comprises dans les forfaits tenue à disposition (arrêté du 27 mars 1987). Obligation physique ; reprendre ces prix en ligne est une bonne pratique. Source : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000862823
- **Pièces issues de l'économie circulaire** : tout professionnel de l'entretien et de la réparation doit permettre au client d'opter pour ces pièces (article L224-67 du code de la consommation) et, depuis le 1er octobre 2024, informer de leurs prix notamment sur son site internet (décret 2024-824). Applicabilité à BF Auto Roussillon selon ses prestations d'atelier [A VERIFIER]. Sources : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226565/ , https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000050000999
- **Mentions légales d'une société** : dénomination, forme, siège, capital, RCS ou SIREN, TVA, courriel et téléphone, identité de l'hébergeur. Source : https://entreprendre.service-public.gouv.fr/vosdroits/F37351
- **Cookies** : consentement par action positive, refus aussi simple que l'acceptation, exemption possible pour la mesure d'audience sous conditions. Source : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi
- **Pneus** : profondeur minimale légale de sculpture 1,6 mm, repère utile pour expliquer la grille des pneus d'occasion. Source : https://www.continental-tires.com/fr/fr/tire-knowledge/tread-depth/

## Bonnes pratiques à reprendre pour BF Auto (classées par impact)

1. **Téléphone, adresse et horaires sans chercher** : barre d'appel fixe en bas d'écran sur mobile (Ottohaus), barre utilitaire horaires et téléphone en haut sur ordinateur (M&V Tech), statut « ouvert maintenant » ou « ouvre à 9h » calculé côté serveur (fiche AD). Horaires tirés d'une source unique, la même que le balisage.
2. **Prix chiffrés et datés** : grille « à partir de » TTC avec date d'effet (M&V Tech), mention de ce qui est inclus ou non (La Maison Mécanique). Pour BF Auto : montage et équilibrage, recharge clim, et surtout pneus d'occasion par gamme d'usure. Valeurs fournies et validées par le garage [A VERIFIER].
3. **Photos réelles uniquement** : façade, comptoir, stock de pneus, personnes (avec leur accord). Retirer toute image de banque d'images présentée comme le garage (Ottohaus, M&V Tech, Mez'Auto le font).
4. **Identité unique et cohérente** : un seul nom commercial, identique sur le site, la fiche Google, les annuaires (Allopneus, Vroomly, Grip500) et les réseaux, toujours associé à « Roussillon ».
5. **Balisage schema.org exact** : `AutoPartsStore` et `TireShop` (plus `AutoRepair` si confirmé), `openingHoursSpecification` structuré jour par jour, `geo`, `telephone`, `sameAs`, sans note auto-déclarée. Généré depuis le fichier de configuration unique.
6. **Un appel à l'action principal par écran** (« Appeler », ou « Demander une pièce ») plutôt qu'une dispersion de boutons (M&V Tech, La Maison Mécanique).
7. **Choix contraints plutôt que texte libre** : sujet de demande en liste, marque, modèle, année en listes, créneau de rappel en choix (patron Stress-Free). Moins d'erreurs, demande directement exploitable.
8. **Pages par service et par ville conservées** : garder les adresses existantes ou poser des redirections 301, une page par famille (pneus, pièces, fluides, clim, detailing) avec prix, délai, questions fréquentes.
9. **Preuve sociale vérifiable** : lien vers la fiche Google et nombre d'avis, plutôt qu'avis recopiés ; si des avis sont affichés sur le site, respecter L111-7-2 et D111-17 (contrôle, dates, classement).
10. **Promesses de service mises en avant** : commande de pièce en moins de 24 h selon référence, retrait en magasin, particuliers et professionnels : aujourd'hui enfouies dans les textes.
11. **Mentions légales complètes et page de confidentialité** : obligation, et signal de sérieux.
12. **Réponse aux avis** : routine à proposer au garage (80 % des consommateurs préfèrent un commerce qui répond, BrightLocal).

## A éviter absolument

- Bandeaux promotionnels et comptes à rebours (fiche AD, Stress-Free) : urgence artificielle, contraire à une image de confiance.
- Fenêtre cookies bloquante ou asymétrique (AD), ou « poursuite de navigation vaut accord » (M&V Tech) : non conforme CNIL. Mieux : aucun traceur soumis à consentement, donc aucun bandeau.
- Compteurs animés qui affichent « 0 » sans JavaScript (La Maison Mécanique) : chiffre faux pour une partie des visiteurs et des robots d'indexation.
- Notes ou avis auto-déclarés dans les données structurées : exclus par Google.
- Allégations superlatives ou techniques non prouvées (page clim actuelle) : risque juridique et de sécurité. Rien sans validation.
- Images de banque d'images légendées comme le garage (site actuel).
- Accroche générique copiée du secteur (« à portée de main ») et fautes d'orthographe dans l'accroche.
- En-tête géant qui repousse la promesse sous le premier écran mobile (Ottohaus).
- Formulaire long entièrement en texte libre (site actuel).
- Polices et scripts distants, pages de plusieurs mégaoctets (site actuel) : contraire à l'instantanéité perçue exigée par le brief.
- Couleurs saturées, ombres portées, bulle de discussion flottante (Stress-Free, M&V Tech) : contraires à la charte du brief.
- Pictogrammes sans libellé (fiche AD).

## Opportunités de différenciation pour un garage indépendant

1. **Pneus d'occasion en toute transparence** : la grille d'usure existe déjà (2 à 4 mm, 4 à 6 mm, plus de 6 mm) ; la rendre lisible (tableau, repère légal 1,6 mm, prix par gamme et par diamètre). Aucun acteur observé ne le fait. Prix [A VERIFIER].
2. **Demande de pièce guidée** : marque, modèle, année en listes, immatriculation facultative, pièce recherchée par famille, puis rappel ; promesse « réception en moins de 24 h selon référence » affichée. C'est la version réaliste du « catalogue pièces garage » de la maquette sans construire un catalogue en ligne complet.
3. **Diagnostic par questions simples** (zone centrale de la maquette) : quelques questions à choix (bruit, voyant, moment où cela arrive), aboutissant à une orientation honnête (pièce probable, prestation, ou « appelez-nous ») et à une demande préremplie. Il ne pose pas de verdict mécanique ; il oriente. Aucun indépendant observé ne propose cela ; le patron le plus proche est le module de prix de Stress-Free.
4. **Économie circulaire comme argument** : pneus et pièces d'occasion, obligation légale d'information sur les pièces de réemploi transformée en preuve de sérieux [applicabilité A VERIFIER].
5. **Site sans bandeau cookies** : aucun traceur tiers, mesure d'audience exemptée ou absente ; tous les concurrents observés ont un bandeau.
6. **Zone « ? » de la maquette** : questions fréquentes concrètes (délai de commande, montage, pneus d'occasion, paiement, accès par la N7), utiles au client et lisibles par les moteurs et les assistants d'IA (45 % des consommateurs américains s'en servent pour trouver un commerce, BrightLocal ; effet sur la visibilité : hypothèse [A VERIFIER]).
7. **Identité forte et locale** : un logo avec une idée graphique (leçon Ottohaus) et l'ancrage « Roussillon, sur la N7 » dans l'accroche, pour sortir de l'homonymie des cinq « BF Auto ».
8. **Humain et vérifiable** : qui répond au téléphone, photo du comptoir, date de mise à jour des prix et des horaires.

## Pré-classement Kano proposé (basique / performance / attractive / indifférente / à éviter)

Pré-classement issu de l'observation concurrentielle, à trancher dans `docs/conception/kano-site-bf-auto.md`.

**Basique** (absence = rejet, présence = neutre)
- Téléphone cliquable toujours visible sur mobile : tous les sites observés l'ont, son absence ferait perdre l'appel.
- Adresse avec lien d'itinéraire : présent partout, attendu pour un commerce de passage sur la N7.
- Horaires exacts et cohérents partout : une erreur d'horaire coûte un déplacement inutile.
- Mentions légales complètes : obligation légale (F37351).
- Chargement rapide et lisible sur téléphone : exigence du brief, et site actuel faible sur ce point.
- Liste claire des produits et services : déjà présente sur le site actuel, attendue.
- Formulaire de contact court avec information sur les données personnelles : attendu, RGPD.
- Photos réelles du lieu : leur absence rend le garage suspect face aux concurrents qui en montrent.

**Performance** (plus c'est fait, plus la satisfaction monte)
- Prix affichés, datés, avec ce qui est inclus : M&V Tech et La Maison Mécanique en font un argument ; la satisfaction croît avec la couverture.
- Délai de commande annoncé (moins de 24 h selon référence) : plus il est précis et tenu, plus il rassure.
- Preuve sociale récente et vérifiable (lien fiche Google, nombre d'avis) : 74 % cherchent des avis récents (BrightLocal).
- Pages de service détaillées par famille : utiles au client et au référencement local.
- Questions fréquentes pratiques : chaque réponse évite un appel.
- Statut ouvert ou fermé en temps réel : la fiche AD le montre, gain direct de temps.

**Attractive** (inattendue, crée l'enthousiasme)
- Diagnostic par questions simples qui oriente et préremplit la demande : absent chez tous les acteurs observés.
- Grille des pneus d'occasion par usure et par prix : singulière, déjà amorcée par BF Auto.
- Demande de pièce guidée par listes (marque, modèle, année) avec rappel : transpose le module Stress-Free à un petit magasin.
- Aucun bandeau cookies : différence perceptible dès la première seconde.
- Logo à idée graphique forte : mémorisation (Ottohaus).

**Indifférente** (n'influence pas le choix)
- Blog ou actualités : M&V Tech en a, aucun effet observé sur la confiance.
- Flux Instagram intégré : lien simple suffisant.
- Vidéo d'arrière-plan : décor coûteux en performance, sans information.
- Carrousels et animations décoratives : pas d'apport d'information.
- Lettre d'information : sans objet pour un achat ponctuel de pièces.

**A éviter** (sa présence dégrade la satisfaction)
- Bandeaux promotionnels à compte à rebours : pression commerciale.
- Fenêtre cookies bloquante ou asymétrique : irritant et non conforme.
- Compteurs animés à zéro sans JavaScript : chiffre faux.
- Bulle de discussion ou robot conversationnel : promesse de réponse non tenue par un petit garage [A VERIFIER disponibilité].
- Avis ou notes non vérifiables, allégations techniques non prouvées : perte de confiance et risque juridique.
- Photos de banque d'images présentées comme le garage : décrédibilise dès qu'on vient sur place.

## Sources

Sites et fiches « BF Auto »
- https://bf-auto-pneus-pieces.com/ (accueil, code source et données structurées)
- https://bf-auto-pneus-pieces.com/a-propos
- https://bf-auto-pneus-pieces.com/mentions-legales
- https://bf-auto-pneus-pieces.com/contact-bf-auto-access-pneus-neufs-pieces-detachees-a-roussillon
- https://bf-auto-pneus-pieces.com/pieces-detachees-a-roussillon-38150
- https://bf-auto-pneus-pieces.com/pneus-neuf-et-occasion-a-roussillon-38150
- https://bf-auto-pneus-pieces.com/recharge-climatisation-a-roussillon-38150
- https://www.pappers.fr/entreprise/bf-auto-pneus-pieces-detachees-981962459
- https://www.allopneus.com/montage-pneu/isere-38/roussillon/bf-auto-access-25434
- https://www.vroomly.com/garages/bf-auto-access-38150-n7/
- https://www.grip500.fr/montage/isere/roussillon/41357
- https://www.ad.fr/garage/garage-ad-bf-auto
- https://www.facebook.com/GarageBfAuto/
- https://www.autocadre.com/garage/773539
- https://www.societe.com/societe/bf-auto-848616215.html
- https://www.facebook.com/BFAuto34800/
- https://fr.mappy.com/poi/684e2fd568fb3d3b7af928a0
- https://www.pagesjaunes.fr/pros/56571279
- https://mecazen.fr/garage/garage-bf-auto-services

Garages indépendants et références
- https://www.ottohausofcharleston.com/
- https://lamaisonmecanique.fr/
- https://www.garagemvtech.com/
- https://www.mezauto25.fr/
- https://www.stressfree.com/
- https://colorlib.com/wp/auto-repair-website-examples/
- https://www.awwwards.com/websites/automotive/

Référencement local et données structurées
- https://support.google.com/business/answer/7091?hl=fr
- https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=fr
- https://schema.org/AutoRepair
- https://schema.org/AutomotiveBusiness
- https://schema.org/AutoPartsStore
- https://schema.org/TireShop
- https://www.brightlocal.com/research/local-consumer-review-survey/

Cadre légal et technique
- https://entreprendre.service-public.gouv.fr/vosdroits/F37351
- https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi
- https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000862823
- https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226565/
- https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000050000999
- https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049571119
- https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035724934/2023-03-28
- https://iifiir.org/en/encyclopedia-of-refrigeration/hydrocarbon-refrigerants
- https://www.continental-tires.com/fr/fr/tire-knowledge/tread-depth/
