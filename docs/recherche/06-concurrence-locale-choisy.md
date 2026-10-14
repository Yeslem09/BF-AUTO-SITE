# Étude 06 : concurrence locale de BF Auto à Choisy-le-Roi et dans les communes voisines

Consultation des sources : 23 septembre 2026. Captures dans `docs/recherche/captures/` (préfixe `local-`).

Méthode :
- Distances **à vol d'oiseau** depuis le 7 rue Demanieux, calculées à partir du géocodage de la Base Adresse Nationale (https://api-adresse.data.gouv.fr). Le trajet routier est plus long.
- Notes et nombres d'avis relevés **à la source citée, le jour de la consultation** ; une note Google n'est donnée que si une source la reprend, sinon [A VERIFIER].
- Statut des entreprises vérifié dans le registre officiel (https://recherche-entreprises.api.gouv.fr) et au BODACC quand un doute existait.
- Requêtes testées avec l'outil de recherche web de l'agent, dont l'index **n'est pas Google** : le classement Google et le pack local Google Maps restent [A VERIFIER] (protocole en fin de section « Requêtes locales »).
- Captures : la commande `npx --no-install playwright screenshot` échoue (navigateur absent pour Playwright 1.63). Captures prises avec l'interface en ligne de commande de Playwright 1.62.1 déjà installée, mêmes réglages (1440 x 900, attente 3000 ms). Dix tentatives : huit captures exploitables, deux refusées par le pare-feu anti-robot (Midas, Feu Vert, HTTP 403), supprimées.

## Synthèse

1. Le 7 rue Demanieux est à environ 200 m du boulevard de Stalingrad, partagé entre Choisy-le-Roi et Thiais, et à 600 m de Vitry-sur-Seine : une micro-zone où **deux garages ont disparu** (Point S radié en 2021, agent Peugeot Prad en liquidation judiciaire depuis février 2026) alors que leurs fiches restent en ligne : une demande locale orpheline existe.
2. Le concurrent le plus proche est un indépendant **dans la même rue** (Assistance Auto Garage, 29 rue Demanieux, sans site ni avis trouvés) ; le mieux installé est Europe Auto (agent Citroën et Peugeot, 500 m, 435 avis Google cités par PagesJaunes).
3. Sur les requêtes « garage Choisy-le-Roi », ce sont les **plateformes et annuaires** (idGarages, PagesJaunes, Vroomly, AlloGarage) qui occupent le haut des résultats ; aucun indépendant local n'y ressort par son propre site.
4. Les sites des indépendants locaux sont faibles : **aucun prix affiché**, aucune vraie prise de rendez-vous (formulaire de contact déguisé), horaires contradictoires entre site et annuaires, bandeaux et widgets en anglais, un site en panne.
5. Un garage sans avis peut gagner sur la **transparence** (prix indicatifs, taux horaire, devis avant travaux), la **joignabilité** (réponse rapide, horaires jusqu'à 19 h à confirmer), l'**exactitude** des informations (NAP) et le **diagnostic par questions**, absent de tous les sites locaux consultés.

## Tableau des concurrents locaux

Douze concurrents retenus, classés par distance. Abréviations : PJ = PagesJaunes, VO = véhicules d'occasion, RDV = rendez-vous.

| # | Nom | Adresse | Distance | Type | Site web (qualité) | Prestations mises en avant | Prix affichés | RDV en ligne | Note et avis (source) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Assistance Auto Garage (AAG) | 29 rue Demanieux, Choisy-le-Roi | 0,16 km | Indépendant toutes marques, entreprise active au registre (création 2006) | Aucun site trouvé [A VERIFIER] | Peinture, véhicule de remplacement, réparation toutes marques, VO (PJ) | Non | Via Vroomly (fiche « Garage Aag » avec prise de RDV) | Aucun avis sur PJ ni Vroomly ; Google [A VERIFIER] |
| 2 | Europe Auto | 1 rue du Docteur-Roux, Choisy-le-Roi | 0,49 km | Agent Citroën et Peugeot : VN, VO, mécanique, carrosserie, entretien rapide « Chrono Service » sans RDV | Oui, le meilleur site local (menu clair, horaires, témoignages, communes voisines citées) mais bandeau cookies en anglais qui masque la page | Mécanique, carrosserie, peinture, diagnostic, pièces, financement, professionnels | Non | Non : le bouton « Prendre RDV » mène au formulaire de contact | Google 4,1/5 (435 avis) et PJ 3/5 (18 avis), selon PJ |
| 3 | BS Auto 94 (société Progrès Mécanic) | 16 avenue du Progrès, Vitry-sur-Seine | 0,64 km | Indépendant sans enseigne (depuis 2021) | Aucun site propre trouvé [A VERIFIER] | Mécanique générale, pneus, VO, véhicule de courtoisie | Sur plateformes seulement | Oui, via Vroomly et idGarages | Vroomly 4,3/5 (18 avis) ; idGarages 4,8/5 (5 avis) |
| 4 | Ludo Express | 3 allée Ange-Jacques-Gabriel, Choisy-le-Roi | 0,73 km | Indépendant (depuis 2022), propose aussi la mécanique à domicile | Aucun site trouvé | Vidange, climatisation, pneus, diagnostic, moteur | Non | Non (fiche Vroomly non certifiée, sans services) | Aucune note trouvée [A VERIFIER] ; horaires contradictoires selon les sources |
| 5 | Alfort GPL | 4 rue de la Darse, Choisy-le-Roi | 1,20 km | Spécialiste GPL (installation, entretien, VO GPL) | Oui, daté : pickups américains en tête, menu dispersé (boutique, système audio), ni horaires ni adresse en accueil | Installation et entretien GPL | Non (seulement le prix du GPL à la pompe) | Non : téléphone ou courriel | Google 4,7/5 (98 avis) et PJ 5/5 (18 avis), selon PJ |
| 6 | Po Mécanique Auto (Garage de l'Hôtel de Ville) | 6 rue Alphonse-Brault, Choisy-le-Roi | 1,27 km | Indépendant (depuis 2020), label Vroomly « Garage d'Exception » | Pas de site propre trouvé : présence par plateformes (Vroomly, Fixter, idGarages) | Distribution, filtre à particules, pneus, diagnostic, décalaminage ; garantie 1 an (Vroomly) | Oui, sur Vroomly (« Voir les prix du garage ») | Oui, via Vroomly et Fixter | Vroomly 4,8/5 (26 avis) ; PJ 5/5 (3 avis) |
| 7 | Midas Choisy-le-Roi | 67 bis avenue Victor-Hugo, Choisy-le-Roi | 1,32 km | Centre auto franchisé | Page réseau midas.fr, inaccessible à l'agent (HTTP 403) | Vidange, révision avec garantie constructeur préservée, climatisation, freins, pneus, échappement, sans RDV (PJ) | [A VERIFIER] | [A VERIFIER] | [A VERIFIER] : PJ signale « probablement fermé définitivement » ; l'exploitant indiqué par PJ (TOP GOMME) est cessé depuis le 22/10/2024 ; un garage (AB AUTOMOTIVE) est actif à cette adresse depuis 2023 |
| 8 | Garage ACC (AD Carrosserie et Garage Expert) | 8 rue des Cosmonautes, Choisy-le-Roi | 2,19 km | Réseau AD, mécanique et carrosserie toutes marques | Page réseau ad.fr | Entretien, réparation, diagnostic, carrosserie, peinture | Non trouvé | Partenaire idGarages ; RDV propre au garage [A VERIFIER] | PJ 4,7/5 (24 avis) ; idGarages 4,28/5 |
| 9 | Garage Le Tolier | 5 avenue Danville, Choisy-le-Roi | 2,22 km | Indépendant (depuis 2021), carrosserie, mécanique, « self garage » | Oui : fond sombre rouge saturé, aucune information au-dessus de la ligne de flottaison, emoji dans le titre, widget de discussion en anglais | Mécanique, diagnostic, carrosserie, pneus, esthétique, préparation au contrôle technique, location d'emplacement outillé | Non | Non : formulaire de devis ; certifié Vroomly | Aucun avis affiché ; horaires contradictoires (site : lundi au samedi ; Vroomly : lundi au vendredi) |
| 10 | Global Auto 94 | 14 bis rue des Cosmonautes, Choisy-le-Roi | 2,25 km | Indépendant | Oui : gabarit générique, photo de banque d'images, adresse fautive (« cosmaunote »), © 2022 | Vidange, lavage, parallélisme, pneus d'occasion, freins | Non | Non : formulaire de contact | PJ 2/5 (1 avis) ; dimanche fermé selon le site, ouvert 10 h à 19 h selon PJ |
| 11 | Feu Vert Vitry-sur-Seine | 5 rue Eugène-Hénaff, Vitry-sur-Seine | 2,67 km | Centre auto de réseau | Page réseau feuvert.fr, inaccessible à l'agent (HTTP 403) | Pneus, entretien, freins, climatisation, commande en ligne avec retrait en 2 h (PJ) | [A VERIFIER] | [A VERIFIER] | PJ 4/5 (627 avis) |
| 12 | Pôle Belle Épine, Thiais : Norauto et Speedy | Centre commercial régional Belle Épine, Thiais | environ 3 km (géocodage approximatif) | Centres auto de réseau | Pages réseau riches (note, horaires du jour, itinéraire, RDV, carte) | Norauto : pneus, entretien, batterie, freins, climatisation, carrosserie, véhicule de courtoisie. Speedy : entretien, pneus, véhicules électriques et hybrides | Norauto : batterie dès 64,99 €, montage pneus à 9,95 € dès deux pneus, filtres jusqu'à moins 30 %. Speedy : bon de 75 € dès 200 € d'achat | Oui (« Prendre RDV ») | Norauto 3,7/5 (427 avis) ; Speedy 4,6/5 (68 avis), sur leurs pages |

### Micro-zone du boulevard de Stalingrad (moins de 400 m)

Établissements voisins, hors tableau principal, qui expliquent la situation locale :

| Établissement | Adresse | Distance | Constat | Source |
|---|---|---|---|---|
| Garage Prad (agent Peugeot) | 78 bd de Stalingrad, Choisy-le-Roi | 0,19 km | Liquidation judiciaire ouverte le 25/02/2026 (parution BODACC du 06/03/2026) ; PJ le signale « probablement fermé » ; ses fiches affichent encore 112 à 117 avis Google selon les annuaires [A VERIFIER] | BODACC, PJ, top-concession-auto.fr |
| Point S / Choisy Centre Auto GTR Services | 32 bd de Stalingrad, Choisy-le-Roi | 0,21 km | Société radiée le 27/01/2021 ; absente du plan de site points.fr ; fiche Vroomly supprimée (HTTP 410) ; encore présente dans plusieurs annuaires | societe.com, points.fr, Vroomly, tiendeo.fr |
| Ici Ton Pneu | 39 bd de Stalingrad, Thiais | 0,18 km | Spécialiste pneus, créé le 01/08/2025, site icitonpneu.com, listé sur Vroomly | annuaire-entreprises, PJ, Vroomly |
| Carrosserie GTO | 3 voie de l'Épinette, Choisy-le-Roi | 0,34 km | Carrosserie et entretien, SAS créée en 2015, ouverte du lundi au vendredi | annuaire-entreprises, Acceslibre |
| Garage des Chalets | 17 avenue d'Alfortville, Choisy-le-Roi | 0,85 km | Carrosserie, peinture, réparation toutes marques, dépanneuse, véhicule de remplacement ; site en erreur 522 le 23/09/2026 | PJ, capture `local-garage-des-chalets-desktop.png` |

Lecture : autour de la rue Demanieux, l'offre active est surtout de la carrosserie et du pneu. Pour la **mécanique générale de proximité**, BF Auto n'a en face qu'AAG (même rue, sans présence en ligne visible) et Europe Auto (agent de marque, orienté vente de véhicules).

## Analyse des meilleurs sites locaux

### Europe Auto : https://www.europe-auto94.fr/ (capture `local-europe-auto-desktop.png`)
- **Fort** : logos Citroën et Peugeot, menu en trois univers (garage, atelier, achat), bouton « Prendre RDV » en haut à droite, horaires atelier détaillés (lundi au vendredi 8 h à 12 h 30 et 14 h à 19 h, samedi 9 h à 13 h), quatre témoignages datés, communes voisines citées (Thiais, Vitry-sur-Seine, Ivry-sur-Seine, Orly), ancienneté revendiquée de 40 ans.
- **Faible** : première impression gâchée par une fenêtre de consentement **en anglais** qui couvre tout l'écran ; bandeau d'accueil occupé par une promotion constructeur, pas par le garage ; « Prendre RDV » renvoie à `/contact#formulaire` (promesse non tenue) ; aucun prix.
- **À retenir pour BF Auto** : citer les communes voisines, montrer les horaires sans chercher, ne jamais promettre un rendez-vous qui n'est qu'un formulaire.

### Global Auto 94 : https://globalauto94.fr/ (capture `local-global-auto-94-desktop.png`)
- **Fort** : titre principal riche en mots-clés (« Garage auto 94 pour l'entretien et la réparation »), barre supérieure avec adresse, téléphone et courriel, appel à l'action unique et visible.
- **Faible** : photo de banque d'images, faute dans l'adresse affichée, aucun horaire en tête, aucun avis, rouge saturé, horaires contradictoires avec PJ (dimanche fermé contre dimanche ouvert).
- **À retenir** : l'écriture du titre pour la recherche locale ; à éviter : l'imprécision des coordonnées, qui ruine la cohérence NAP.

### Alfort GPL : https://www.alfortgpl.fr/ (capture `local-alfort-gpl-desktop.png`)
- **Fort** : positionnement de niche immédiatement lisible (« Installateur GPL tout véhicules »), bloc de contact avec deux numéros en gros caractères, spécialité qui explique une bonne note (4,7/5 sur 98 avis Google selon PJ).
- **Faible** : esthétique datée, pickups américains qui ne ressemblent pas à la clientèle locale, menu dispersé (boutique, système audio), ni horaires ni adresse en page d'accueil, bandeau cookies en bas d'écran.
- **À retenir** : une spécialité claire vaut mieux qu'un catalogue flou ; la note se construit sur un savoir-faire identifiable.

### Garage Le Tolier : https://letolier94.fr/fr (capture `local-le-tolier-desktop.png`)
- **Fort** : logo travaillé, bandeau supérieur « Demandez votre devis gratuitement », bandeau cookies honnête (cookies strictement nécessaires seulement).
- **Faible** : écran d'accueil sans aucune information utile (ni téléphone, ni horaires, ni prestations), fond rayé rouge et noir agressif, emoji dans le titre, widget de discussion **en anglais** (« Hello, do you have a question? »).
- **À retenir** : exactement ce que la palette sobre et l'interdiction des emoji du brief évitent.

### Speedy Thiais et Norauto Belle Épine (captures `local-speedy-thiais-desktop.png`, `local-norauto-thiais-desktop.png`)
- **Fort** : la meilleure « fiche centre » de la zone. Note et nombre d'avis en tête, statut « Aujourd'hui : Ouvert » avec l'horaire du jour, jour courant en gras dans le tableau des horaires, boutons Itinéraire, Prendre RDV et téléphone, carte. Norauto affiche des prix d'appel (batterie dès 64,99 €).
- **Faible** : formulaire de collecte de coordonnées contre un bon de réduction (Speedy), fenêtre de cookies bloquante (Norauto), contenu générique identique d'un centre à l'autre, aucune personne visible.
- **À retenir** : le bloc « ouvert maintenant + horaire du jour + itinéraire + appeler » est le standard à égaler ; le ton promotionnel est à laisser aux réseaux.

### Po Mécanique Auto sur Vroomly (capture `local-po-mecanique-vroomly-desktop.png`)
- Ce qu'un indépendant sans site obtient d'une plateforme : note 4,8/5 sur 26 avis détaillée en cinq critères (accueil 4,9, ponctualité 4,8, conseils 4,7, délai de restitution 4,8, propreté du véhicule 4,6), avis rattachés au véhicule et à la prestation (exemple : Citroën C3, vidange, 31 mars 2026), trois promesses (devis instantané, RDV en ligne, garantie 1 an).
- Limite : le numéro affiché par la plateforme (01 84 80 77 23) diffère de celui du garage sur PJ (06 27 92 14 16) ; la plateforme s'intercale dans la relation [A VERIFIER : numéro de suivi de la plateforme].
- **À retenir** : les clients jugent un garage sur ces cinq critères concrets ; le site de BF Auto peut s'engager sur eux avant même d'avoir des avis.

### Site en panne : Garage des Chalets (capture `local-garage-des-chalets-desktop.png`)
- Erreur Cloudflare 522 au moment de la consultation : un site hors service fait plus de tort que pas de site. Hébergement fiable et surveillance de disponibilité sont un basique.

## Requêtes locales et référencement

### Ce qui ressort en tête (moteur de l'agent, non Google, 23/09/2026)

| Requête | Premiers résultats observés | Lecture |
|---|---|---|
| garage Choisy-le-Roi mécanique | idGarages, PJ (fiche Po Mécanique, annuaire), midas.fr, AlloGarage, AlloVoisins, Vroomly (deux pages) | Plateformes dominantes ; seul un réseau (Midas) sort par son site |
| garage automobile Choisy-le-Roi 94600 avis | PJ (Garage ACC, annuaires), idGarages, AlloGarage, Fixter, info-garage.org | Le mot « avis » renvoie aux annuaires notés |
| vidange Choisy-le-Roi | idGarages, PJ « vidange curage », puis quatre entreprises de vidange de fosses septiques | Mot ambigu : écrire « vidange moteur » ou « vidange voiture » |
| mécanicien 94600 | PJ « garage à domicile », annonces d'emploi (jemepropose), mécaniciens à domicile (Kiwiiz, GoodMecano) | Intention mêlée : emploi, domicile |
| garage Choisy-le-Roi ouvert samedi réparation toutes marques | PJ, StarOfService, fiches Garage des Chalets et Garage Lamartine, Vroomly (Go Garage), commerces-ouverts.fr | L'horaire du samedi est un critère de recherche explicite |
| réparation voiture Choisy-le-Roi garage pas cher | ad.fr, PJ, idGarages, Vroomly, StarOfService, jesuisreparateur.fr, Fixter | Le prix fait monter les comparateurs |
| Garage auto choisy 94 (nom actuel de la fiche Google) | Pappers, annuaire-entreprises, annuaires PJ, Global Auto 94 (PJ et site), Garage Le Tolier | Nom générique confondu avec les concurrents : le renommage en « BF Auto » est nécessaire |

Volumes d'offre affichés par les annuaires : idGarages recense 61 établissements à Choisy-le-Roi, note moyenne 4,2/5 sur 533 avis ; PJ affiche 73 résultats en réparation automobile ; AlloGarage en liste 10.

### Prix de référence que le client voit avant d'appeler
- idGarages, Choisy-le-Roi : vidange, révision et freinage « dès 59 € », parallélisme dès 49 €, distribution dès 499 €.
- Vroomly, moyenne des garages certifiés de Choisy-le-Roi : vidange 154 € (de 72 € à 230 € selon le véhicule), plaquettes 186 €, disques 425 €, amortisseurs 642 €, distribution 682 €, embrayage 1 003 €.
- Ces chiffres servent d'ancrage mental. Les prix de BF Auto viennent d'Anthony et restent [A VALIDER] ; ne jamais les déduire de ces moyennes.

### Constats utiles
1. Aucun site de garage indépendant local ne sort sur les requêtes génériques testées : le terrain organique est pris par les plateformes, la bataille de proximité se joue sur la **fiche Google** et sa cohérence avec le site.
2. Les annuaires sont **en retard** (Point S radié en 2021, Prad en liquidation, Midas incertain) : des clients appellent des garages fermés. Des informations exactes et un téléphone qui répond sont un avantage réel.
3. Les incohérences d'horaires sont fréquentes (Global Auto 94, Le Tolier, Ludo Express, Norauto selon les sources) : c'est précisément ce que la cohérence NAP corrige.

### Recommandations de référencement local pour BF Auto
- Nom « BF Auto », adresse « 7 rue Demanieux, 94600 Choisy-le-Roi » et téléphone « 06 05 92 28 38 » **strictement identiques** sur le site, la fiche Google renommée, et tout annuaire où le garage apparaîtra (aucune fiche PJ trouvée à ce jour pour le 7 rue Demanieux [A VERIFIER]).
- Titre de page et titre principal explicites : « BF Auto, garage à Choisy-le-Roi (94600) : entretien, mécanique, diagnostic ».
- Une page par prestation courante, avec le vocabulaire du client (« vidange moteur », « plaquettes de frein », « diagnostic voyant moteur »).
- Données structurées schema.org de type `AutoRepair` : adresse, coordonnées géographiques, horaires, téléphone, zone desservie (Choisy-le-Roi, Thiais, Vitry-sur-Seine, Orly, Villeneuve-le-Roi).
- Page « Accès » avec repères réels (boulevard de Stalingrad à environ 200 m, Thiais et Vitry-sur-Seine toutes proches) [A VALIDER sur place : stationnement, entrée de l'atelier].
- Collecte des premiers avis : lien direct vers le formulaire d'avis de la fiche Google, QR code au comptoir, message après intervention ; **sans filtrage ni contrepartie** (les faux avis sont une pratique commerciale trompeuse, sanctionnée jusqu'à deux ans d'emprisonnement et 300 000 € d'amende selon SignalConso).

### Protocole pour vérifier le pack local Google [A VERIFIER]
Navigation privée sur téléphone, localisation à Choisy-le-Roi, requêtes « garage Choisy-le-Roi », « garage près de moi », « vidange voiture Choisy », « mécanicien Choisy-le-Roi » ; noter les trois garages du pack local, leur note et leur nombre d'avis, puis refaire le relevé un mois après le renommage de la fiche.

## Positionnement recommandé pour BF Auto

**Angle : le garage de quartier exact, transparent et joignable, entre Choisy-le-Roi, Thiais et Vitry-sur-Seine.** Les réseaux ont la note et le volume ; les indépendants locaux ont la proximité mais une présence en ligne négligée. BF Auto peut occuper l'espace entre les deux.

1. **Transparence avant la note.** Afficher des prix indicatifs « à partir de » sur six à huit prestations courantes, avec ce qui est inclus, et le taux horaire TTC. L'affichage du taux horaire et des forfaits est déjà une obligation à l'entrée de l'atelier (arrêté du 27 mars 1987) : le reprendre en ligne est cohérent et aucun indépendant local ne le fait. Valeurs fournies par Anthony [A VALIDER].
2. **Méthode écrite en quatre étapes** : diagnostic, devis écrit, accord du client avant travaux, restitution des pièces remplacées sur demande. Elle rassure là où les avis manquent [A VALIDER : pratiques réelles du garage].
3. **Joignabilité** : téléphone cliquable permanent, demande de rappel à choix contraints (marque, modèle, prestation, créneau), délai de rappel annoncé seulement si Anthony peut le tenir [A VALIDER]. Si la fermeture à 19 h est confirmée, la mettre en avant : la plupart des indépendants proches ferment entre 18 h et 18 h 30.
4. **Exactitude** : horaires, adresse, téléphone et statut « ouvert maintenant » tirés d'un seul fichier de configuration ; c'est l'avantage le plus simple sur une zone pleine de fiches périmées.
5. **Preuves sans avis** : vraies photos de l'atelier et de l'équipe, mentions légales complètes (société GARAGE AUTO CHOISY 94, SIREN 953 343 738, SIRET du 7 rue Demanieux 953 343 738 00019, à rapprocher du nom commercial BF Auto [A VALIDER]), garanties légales, et un encart honnête « Nouveau nom, même atelier : donnez le premier avis ».
6. **Diagnostic par questions simples** (maquette) : aucun des sites de garages locaux consultés (pages d'accueil et fiches centres) n'en propose ; il oriente vers la bonne prestation et préremplit la demande, sans promettre de diagnostic à distance.
7. **Ne pas imiter les réseaux** : pas de coupons, pas de fenêtre promotionnelle, pas de « meilleur prix garanti ».

## Pré-classement Kano

Pré-classement issu de l'observation locale, à trancher dans `docs/conception/kano-site-bf-auto.md`.

**Basique** (absence = rejet, présence = neutre)
- Nom, adresse et téléphone identiques à la fiche Google : les incohérences observées chez trois indépendants locaux dégradent la confiance et le référencement.
- Téléphone cliquable toujours visible : en tête chez Global Auto 94, Alfort GPL, Speedy et Norauto ; absent de l'en-tête chez Europe Auto et Le Tolier (captures), ce qui oblige à chercher.
- Horaires exacts, horaire du jour mis en avant : standard posé par Speedy et Norauto.
- Adresse avec itinéraire et repères : attendu pour un garage de quartier.
- Liste claire des prestations : présente partout.
- Site disponible, rapide et lisible sur téléphone : le site en panne du Garage des Chalets montre le coût de l'échec.
- Interface entièrement en français : bandeaux et widgets en anglais chez Europe Auto et Le Tolier.
- Mentions légales complètes : obligation légale.

**Performance** (plus c'est fait, plus la satisfaction monte)
- Nombre de prestations avec prix indicatifs : zéro chez les indépendants locaux, ancrages visibles sur idGarages et Vroomly.
- Rapidité de réponse annoncée et tenue.
- Demande de rendez-vous réelle (créneau proposé, confirmation), pas un formulaire déguisé.
- Amplitude horaire affichée (soir, samedi) : critère cherché explicitement (« ouvert samedi »).
- Photos réelles de l'atelier et des personnes.
- Profondeur du catalogue de pièces : Europe Auto et Norauto en proposent déjà.

**Attractive** (inattendue, crée l'enthousiasme)
- Diagnostic par questions simples qui oriente et préremplit la demande.
- Méthode transparente (devis écrit, accord avant travaux, pièces restituées sur demande, photo de la pièce usée).
- Engagements alignés sur les critères notés par les clients (accueil, ponctualité, conseils, délai de restitution, propreté du véhicule).
- Encart honnête « premier avis » avec lien direct vers la fiche Google.
- Page d'accès locale précise (repères du boulevard de Stalingrad).

**Indifférente** (n'influence pas le choix)
- Blog ou actualités (Global Auto 94, Alfort GPL) sans contenu pratique.
- Carrousel de promotions constructeur.
- Galerie de véhicules sans lien avec la clientèle.
- Fils de réseaux sociaux intégrés.

**À éviter** (inverse : leur présence fait fuir)
- Fenêtre de consentement bloquante ou en anglais : si le site n'emploie aucun traceur tiers, aucun bandeau n'est nécessaire.
- Widget de discussion automatique, surtout en anglais.
- Emoji, fonds sombres saturés, rouge criard.
- Formulaire de coordonnées contre un bon de réduction.
- Avis fabriqués, filtrés ou non vérifiables ; slogans « meilleur prix garanti » non prouvés.
- Horaires ou coordonnées différents entre site et fiches.
- Bouton « Prendre RDV » qui ouvre un simple formulaire de contact.

## Sources

Registres et outils publics
- Base Adresse Nationale, géocodage : https://api-adresse.data.gouv.fr/search/?q=7+rue+Demanieux+94600+Choisy-le-Roi
- Registre des entreprises (statuts AAG, PRAD, GARAGE AUTO CHOISY 94, établissements du 67 bis av. Victor-Hugo) : https://recherche-entreprises.api.gouv.fr/search?q=488032988 ; https://recherche-entreprises.api.gouv.fr/search?q=441513603 ; https://recherche-entreprises.api.gouv.fr/search?q=953343738 ; https://recherche-entreprises.api.gouv.fr/search?q=67%20avenue%20victor%20hugo%20choisy-le-roi
- BODACC, liquidation judiciaire PRAD : https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?where=registre%20like%20%22441513603%22
- GTR Services radiée : https://www.societe.com/societe/gtr-services-490366465.html
- GARAGE AUTO CHOISY 94 : https://annuaire-entreprises.data.gouv.fr/entreprise/garage-auto-choisy-94-953343738
- Ici Ton Pneu : https://annuaire-entreprises.data.gouv.fr/entreprise/ici-ton-pneu-ici-ton-pneu-990009060
- Carrosserie GTO : https://annuaire-entreprises.data.gouv.fr/entreprise/811467026 ; https://acceslibre.beta.gouv.fr/app/94-choisy-le-roi/a/carrosserie/erp/carrosserie-gto/
- Arrêté du 27 mars 1987 (publicité des prix des garages) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000862823
- SignalConso (DGCCRF), faux avis et sanctions : https://signal.conso.gouv.fr/fr/actualites/faux-avis

Sites des concurrents
- Europe Auto : https://www.europe-auto94.fr/
- Global Auto 94 : https://globalauto94.fr/
- Alfort GPL : https://www.alfortgpl.fr/
- Garage Le Tolier : https://letolier94.fr/fr
- Speedy Thiais : https://centres-auto.speedy.fr/garage/thiais-94320/560
- Norauto Belle Épine : https://centres.norauto.fr/val-de-marne/thiais/centre-commercial-regional
- Midas Choisy-le-Roi (HTTP 403) : https://www.midas.fr/centres-auto-midas/ile-de-france/val-de-marne/creteil/choisy-le-roi_1211
- Feu Vert Vitry (HTTP 403) : https://www.feuvert.fr/centres-auto/vitry-sseine/feu-vert-vitry-sur-seine/265.html
- Garage des Chalets (erreur 522) : https://carrosseriedeschalets.precisium.fr/
- Point S, plan de site des centres : https://www.points.fr/centre-sitemap.xml
- Réseau AD, Choisy-le-Roi : https://www.ad.fr/garage-auto/ville/garage-choisy-le-roi

Annuaires et plateformes
- PagesJaunes, réparation automobile Choisy-le-Roi : https://www.pagesjaunes.fr/annuaire/choisy-le-roi-94/garages-d-automobiles-reparation
- PagesJaunes, fiches : AAG https://www.pagesjaunes.fr/pros/09500831 ; Garage ACC https://www.pagesjaunes.fr/pros/52806892 ; Po Mécanique https://www.pagesjaunes.fr/pros/61513044 ; Global Auto 94 https://www.pagesjaunes.fr/pros/62548618 ; Midas https://www.pagesjaunes.fr/pros/04587766 ; Prad https://www.pagesjaunes.fr/pros/00096542 ; Feu Vert https://www.pagesjaunes.fr/pros/08386994 ; Garage des Chalets https://www.pagesjaunes.fr/pros/09362677 ; Alfort GPL https://www.pagesjaunes.fr/pros/51602866 ; rue Demanieux https://www.pagesjaunes.fr/annuaire/rue-demanieux-choisy-le-roi-94/-
- idGarages : https://www.idgarages.com/fr-fr/ville/garage-94600-choisy-le-roi ; https://www.idgarages.com/fr-fr/ville/garage-94600-choisy-le-roi/prestation-revision-vidange ; https://www.idgarages.com/fr-fr/garage/choisy-le-roi/GB16380_midas-choisy-le-roi ; https://www.idgarages.com/fr-fr/garage/vitry-sur-seine/GB12573_garage-progres-mecanic ; https://www.idgarages.com/fr-fr/ville/garage-94600-choisy-le-roi/enseigne-point-s
- Vroomly : https://www.vroomly.com/garage-choisy-le-roi/ ; https://www.vroomly.com/garages/po-mecanique-auto-94400-bert/ ; https://www.vroomly.com/garages/ludo-express-94600-gabriel/ ; https://www.vroomly.com/garages/garage-le-tolier-94600-danville/ ; https://www.vroomly.com/garages/go-garage-94600-mirabeau/ ; https://www.vroomly.com/garage-choisy-le-roi/centre-midas/ ; https://www.vroomly.com/garages/choisy-centre-auto-gtr-services-choisy-le-roi-94600-stalingr/ (HTTP 410)
- AlloGarage : https://www.allogarage.fr/garages-par-ville/liste-garage-Choisy-le-Roi-94600.html ; https://www.allogarage.fr/garages/details-garage-FEU-VERT-VITRY-SUR-SEINE-12590.html ; https://www.allogarage.fr/garages/details-garage-Midas-Choisy-le-Roi-15253.html
- Ludo Express : https://mecazen.fr/garage/ludo-express ; https://www.jemepropose.com/annonces/mecanicien/ludo-express-mecanique-a-domicile+664272/
- Garage Prad, avis Google repris : https://top-concession-auto.fr/fr/peugeot-garage-prad-choisy-le-roi-1391477.html
- Point S Choisy, fiches encore en ligne : https://www.tiendeo.fr/Magasins/choisy-le-roi/point-s-boulevard-de-stalingrad/198011 ; https://www.au-magasin.fr/94600-choisy-le-roi/point-s-221371.html
- Norauto, centres proches : https://alternativi.fr/annuaire/norauto/choisy-le-roi-94600
- Feu Vert, localisation : https://www.feuvert.fr/centres-auto/vitry-sseine/feu-vert-vitry-sur-seine/265.html

Captures (23/09/2026, 1440 x 900)
- `captures/local-europe-auto-desktop.png`, `captures/local-global-auto-94-desktop.png`, `captures/local-alfort-gpl-desktop.png`, `captures/local-le-tolier-desktop.png`, `captures/local-speedy-thiais-desktop.png`, `captures/local-norauto-thiais-desktop.png`, `captures/local-po-mecanique-vroomly-desktop.png`, `captures/local-garage-des-chalets-desktop.png`
