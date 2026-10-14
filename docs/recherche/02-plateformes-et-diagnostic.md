# Plateformes de réservation et diagnostics de panne par questions : ce que BF Auto doit en retenir

Étude réalisée le 2026-09-23. Angle : comparateurs et plateformes de réservation de garages (France et étranger) et outils de diagnostic de panne en ligne par questions. Objectif : cadrer le bloc « Diagnostic mécanique rapide avec question simple » de la maquette client et alimenter l'analyse Kano.

Conventions : chaque constat porte sa source (numéro renvoyant à la section Sources) ou la mention [A VERIFIER]. Les captures sont dans `docs/recherche/captures/`. Les propositions pour BF Auto sont signalées comme telles et ne constituent pas des faits.

## Synthese

1. Les plateformes françaises (iDGarages, Vroomly, Allogarage, Autobutler) vendent des prestations déjà nommées (vidange, plaquettes, « diagnostic électronique ») : aucune n'offre de diagnostic par questions. Le conducteur qui ne sait pas ce qu'a sa voiture n'a pas de porte d'entrée.
2. Les meilleurs diagnostics étudiés (RepairPal, Wrenchly) partent des sensations du conducteur, tranchent l'urgence à partir d'observables (voyant fixe ou clignotant, perte de puissance) et débouchent sur un rendez-vous.
3. Les pièges sont nets : fausse précision (probabilités « 9/10 », fourchettes de prix génériques), résultat conditionné à un e-mail, conflit d'intérêt (liens affiliés), et responsabilité du garagiste, présumée depuis 2022.
4. Recommandation : 3 à 6 questions, « je ne sais pas » partout, écran d'arrêt sécurité, 3 niveaux de conduite à tenir, 1 à 3 pistes sans pourcentage, prix du contrôle affiché, résumé transmis au garage qui rappelle.

## Analyse par acteur

### 1. iDGarages (France, comparateur et réservation)

**Ce qu'il fait.** Comparateur de garages en ligne depuis 2012 : devis immédiat et rendez-vous 24 h sur 24 à partir du véhicule et du code postal, réseau annoncé de 5 000 garages partenaires, prix « négociés jusqu'à -40 % » [1][2][3]. Page « diagnostic électronique » : prix moyen affiché de 39 euros sur le réseau, plage de 25 à 80 euros selon le véhicule, durée d'environ une heure ; le forfait comprend branchement de la valise, lecture et interprétation des codes, effacement des défauts fugitifs et rapport écrit, et **exclut explicitement la réparation**, qui fait l'objet d'un devis séparé [2]. Guide statique des voyants groupés par couleur (rouge, orange, vert, bleu) avec une conduite à tenir par couleur [4]. Page « recherche de pannes » : pas d'outil interactif, liste de pannes par système et avertissement que toutes doivent être contrôlées par un professionnel qualifié [3].

**Excellent.**
- Le prix du diagnostic est affiché avec son périmètre (inclus, exclu) : c'est exactement ce qui manque au client inquiet [2].
- Le guide des voyants relie une couleur à une consigne simple (rouge : s'arrêter ; orange : rouler en douceur et faire contrôler vite) [4].
- Note agrégée sourcée : 4,7 sur 5 sur 32 507 avis, avec le tiers de vérification nommé (Avis Vérifiés) [3], capture `captures/idgarages-desktop.png`.
- Bannière cookies avec « Refuser et fermer » au même niveau que « Accepter », conforme à la recommandation CNIL [5], capture `captures/idgarages-desktop.png`.

**Faible.**
- L'entrée impose de savoir quelle prestation on veut : « Quelle est votre voiture ? » puis « Voir les tarifs » (capture `captures/idgarages-desktop.png`). Le symptôme n'est jamais le point de départ.
- Interface saturée de promotions : bandeau code promo, pastille flottante « Code promo », médaille de palmarès (captures `captures/idgarages-desktop.png`, `captures/idgarages-voyants-mobile.png`). Sur mobile, la page voyants n'affiche son titre qu'après le formulaire de réservation et la bannière cookies.
- Le guide des voyants est une longue liste, sans parcours « quel voyant voyez-vous ? » [4].

### 2. Vroomly (France, comparateur et réservation)

**Ce qu'il fait.** Plus de 6 000 garages, 46 prestations chiffrées en ligne, recherche par immatriculation ou marque, modèle, année, version ; parcours en trois étapes (comparer les prix, lire les avis, réserver un créneau) ; promesse « le même prix qu'en atelier » ; label « Garage d'Exception » et charte d'engagement [6], capture `captures/vroomly-desktop.png`. Contenu éditorial riche sur les symptômes (alternateur, démarreur, voyants) [7][8].

**Excellent.**
- Double entrée véhicule (plaque ou menus déroulants contraints), jamais de texte libre pour identifier la voiture (capture `captures/vroomly-desktop.png`).
- Trois engagements courts sous le formulaire : devis instantané, même prix qu'en atelier, garages certifiés (capture `captures/vroomly-desktop.png`).

**Faible.**
- Catalogue rédigé dans le vocabulaire du mécanicien : « décalaminage », « courroie d'accessoire », « géométrie et parallélisme » [9]. Aucune entrée « je ne sais pas ce que j'ai ».
- Bannière cookies asymétrique : bouton noir « Accepter et fermer » contre un simple lien « Continuer sans accepter » en haut à droite (capture `captures/vroomly-desktop.png`), à l'opposé de la recommandation CNIL (boutons de même niveau et même format) [5].
- Article juridique du blog citant l'article 1147 du Code civil [8], numérotation antérieure à la réforme de 2016 (aujourd'hui article 1231-1) [10] : un contenu juridique non tenu à jour décrédibilise.

### 3. Allogarage (France, annuaire et avis)

**Ce qu'il fait.** Guide des garages lancé en 2007 : 24 699 garages référencés, recherche par ville, palmarès par marque et par réseau, avis clients, jeu « AlloGarage rembourse votre facture » [11][12]. Les avis sont vérifiés par duplicata de facture depuis 2009, selon une source tierce [13].

**Excellent.** Positionnement sur la confiance (« éviter les arnaques ») et la vérification des avis [11][13]. C'est la preuve que la confiance est le premier besoin du conducteur face au garage.

**Faible.** Ni prix, ni réservation, ni diagnostic, ni demande de devis sur la page d'accueil [11]. Application monopage : à 3 secondes, la capture ne montre qu'un logo sur fond blanc (`captures/allogarage-desktop.png`), signe d'un rendu côté client lent.

### 4. Autobutler (France et Europe, demandes de devis)

**Ce qu'il fait.** Le conducteur indique sa plaque ou son modèle, le type de réparation et le lieu ; il reçoit jusqu'à 3 devis de garages, présentés **au même format** (travaux, pièces, temps par tâche) pour être comparables ; plateforme adossée au groupe Stellantis [14].

**Excellent.** Le devis normalisé (même niveau de détail d'un garage à l'autre) est un vrai progrès de lisibilité [14].

**Faible.** Suppose encore que le conducteur sache nommer la réparation [14]. Pages de fonctionnement et FAQ inaccessibles à la consultation automatisée (refus HTTP 403) : gestion d'un problème non identifié [A VERIFIER].

### 5. RepairPal (États-Unis, guide des symptômes, estimation de prix, garages certifiés)

**Ce qu'il fait.** Trois briques chaînées :
- **Guide des symptômes** : 2 questionnaires (« Engine Light On », « Car Won't Start »), une soixantaine de fiches symptômes rédigées dans les mots du conducteur (« Car Shakes When Braking », « Spongy or Soft Brakes »), une rubrique voyants et une rubrique pièces [15].
- **Estimateur de prix juste** : véhicule, prestation, code postal ; il restitue une fourchette qui intègre l'écart pièces d'origine ou adaptables et le taux horaire régional [16].
- **Garages certifiés** : environ 2 800 ateliers qui s'engagent à ne pas dépasser la fourchette dans les 30 jours, avec une garantie minimale de 12 mois ou 12 000 miles [16].

**Mécanique du questionnaire « la voiture ne démarre pas ».** L'article compagnon expose les scénarios que le questionnaire discrimine [15b] : deux axes observables sans outil, **le moteur tourne-t-il** (pas du tout, lentement, normalement, trop vite) et **quel bruit** (aucun, cliquetis, grincement, sifflement de rotation). Cela donne 7 situations, chacune avec ses causes probables, ce que le conducteur peut vérifier lui-même (cosses de batterie, démarrage avec câbles) et le moment où il faut un professionnel. Le libellé exact des questions du composant interactif n'a pas pu être lu [A VERIFIER].

**Mécanique du questionnaire « voyant moteur ».** Quatre situations graduées selon le comportement du voyant [15c] :
1. Il s'allume par intermittence : si la voiture se conduit normalement, rentrer et faire contrôler rapidement.
2. Il reste fixe sans symptôme : faire réviser au plus tôt.
3. Il reste fixe avec perte de performances : s'arrêter en lieu sûr et faire remorquer.
4. Il clignote : s'arrêter immédiatement et faire remorquer (risque d'endommager le catalyseur, voire d'incendie).

**Excellent.**
- **L'urgence est déduite d'observables** (clignote ou non, la voiture roule-t-elle différemment), jamais d'une probabilité. La conduite à tenir est explicite pour chaque cas [15c].
- Chaîne complète diagnostic, estimation, garage qui s'engage sur le prix : l'estimation n'est pas un chiffre en l'air puisqu'un atelier la garantit [16].
- Le texte rappelle qu'un mécanicien pose le diagnostic final [15b].

**Faible.**
- Seuls 2 questionnaires ; tout le reste est de l'article à lire [15].
- Contenus datés de 2018 [15b][15c].
- Site protégé par Cloudflare : la capture n'a montré qu'une page de vérification anti-robot (capture non conservée), lecture faite par l'archive Wayback.

### 6. Wrenchly (Royaume-Uni, diagnostic guidé par IA)

**Ce qu'il fait.** Questionnaire guidé (pays, véhicule par plaque ou saisie, symptômes), analyse par IA, rapport listant 3 causes classées avec une « probabilité » sur 10, une urgence par cause, un coût estimé, des conseils de bricolage et des liens vers des pièces [17][18]. Capture accueil `captures/wrenchly-desktop.png`, capture questionnaire mobile `captures/wrenchly-questionnaire-mobile.png`.

**Mécanique fine (lecture du script du formulaire, source [19]).**
- **Arbre à branches.** Première question « What kind of problem are you noticing? » avec des familles formulées en sensations : voyants, bruits, voiture lente ou faible, vibrations, odeur ou fuite ; d'autres branches existent (freins, électricité, démarrage, fumée). Le script contient près de 90 libellés de questions, mais l'utilisateur ne parcourt qu'une branche.
- **Vocabulaire du conducteur.** Les réponses décrivent ce que l'on perçoit : « One click, then nothing », « Rapid clicking », « Vibration under foot », ou un régime qui monte sans que la voiture accélère [19].
- **Tests guidés sans outil.** Le bruit persiste-t-il au point mort ? La pédale de frein, maintenue enfoncée, descend-elle lentement ? [19]
- **Saisie experte facultative.** A-t-on déjà passé la valise, et quel code défaut (exemple « P0301 ») [19].
- **Gestion du « je ne sais pas ».** Partielle : « Not sure » sur le carburant, « Not sure or varies » sur certaines questions, « None of these », « Nothing », « It happens differently each time » [19]. Ce n'est pas systématique sur chaque question.
- **Auto-évaluation de la gravité.** Échelle de « Normal » à « Car not safe to drive » [19].
- **Qualification commerciale.** « Are you looking to get your car booked in soon? », puis e-mail obligatoire pour recevoir le rapport [19][18].
- **Version pour garages.** Les résultats sont partagés avec un garage nommé qui peut rappeler (« Your results will be shared with » suivi du nom du garage) [19].
- **Modèle économique.** Gratuit pour le conducteur, financé par les garages abonnés [17] ; les liens pièces portent des identifiants d'affiliation Amazon et eBay (vérifié dans le code de la page d'accueil) [17].

**Excellent.**
- Une question par écran, choix fermés, barre de progression, « usually takes less than 2 minutes » (capture `captures/wrenchly-questionnaire-mobile.png`).
- Rapport partageable : PDF ou résumé pour le mécanicien, envoi direct au garage (« QuickSend ») pour ne pas avoir à tout réexpliquer [17].
- Avertissement présent : rapports générés par IA, à confirmer par un mécanicien qualifié [18].

**Faible.**
- **Fausse précision** : une « Likelihood 9/10 » par cause et une fourchette de réparation (exemple 120 à 340 livres) sans atelier qui s'y engage [17].
- **Logique d'exclusion revendiquée** : ce que l'utilisateur ne signale pas est considéré comme absent (« fault exclusion logic ») [17]. C'est dangereux pour un conducteur qui n'a simplement pas remarqué un symptôme.
- **Promesses contradictoires** : « Instant report » et « no account needed » sur l'accueil [17], mais rapport envoyé par e-mail sur la page de l'outil [18]. Durée annoncée « under 60 seconds » [17] contre « less than 2 minutes » dans le formulaire.
- **Conflit d'intérêt** : se dit indépendant [17] tout en étant financé par les garages et rémunéré par l'affiliation [17].
- Témoignages en prénoms seuls, non vérifiables [17] ; pictogrammes émoji dans toute l'interface (captures `captures/wrenchly-desktop.png`, `captures/wrenchly-questionnaire-mobile.png`).

### 7. Halfords (Royaume-Uni, orientation vers le bon contrôle)

**Ce qu'il fait.** Une page d'aide associe chaque contrôle à des symptômes exprimés simplement : freins qui grincent ou collent, voiture qui tire ou « tape » dans les virages, embrayage qui semble anormal, bruit d'échappement, voyant inquiétant pour le contrôle diagnostic [20]. La plupart de ces contrôles sont gratuits (freins, pneus, suspension, embrayage, échappement, batterie) et réservables en ligne [20][21].

**Excellent.** L'issue de l'orientation n'est pas une cause probable mais **un contrôle concret, réservable, à prix connu** (souvent gratuit). Cela désamorce la question du prix et la responsabilité d'un pronostic [20].

**Faible.** Pas d'outil interactif, simple page à lire [20].

### 8. FixMyCar, ex WhoCanFixMyCar (Royaume-Uni, comparateur)

**Ce qu'il fait.** Guide « Diagnose car problems » organisé par les sens (odeurs, bruits, sensations, voyants, fumée, fluides, pneus), avec 11 types de bruits distingués ; bouton de réservation vers le comparateur [22]. Prix moyen d'un diagnostic réservé sur la plateforme : 57,21 livres [23].

**Excellent.** L'entrée « par les sens » est intuitive pour un non-mécanicien [22].

**Faible.** Aucun niveau d'urgence explicite ni consigne « rouler ou non », aucun prix dans le guide ; c'est un article, pas un parcours [22].

### 9. AutoZone Fix Finder (États-Unis, lecture de codes en magasin)

**Ce qu'il fait.** Lecture gratuite des codes défaut par un vendeur en magasin, avec rapport des causes possibles et prochaines étapes [24][25].

**Excellent.** Gratuité et rapidité, et une limite honnêtement documentée par des sources tierces : la lecture d'un code oriente vers un système, **elle n'identifie pas la pièce défaillante** [25].

**Faible.** Nécessite de se déplacer ; l'enseigne vend les pièces, d'où un risque d'orientation vers l'achat [A VERIFIER].

### 10. Outils français récents (Garage IA, DiagnosticAuto)

- **Garage IA** : boîtier OBD Bluetooth et application Android. Codes défaut expliqués avec gravité et causes, et une conversation IA libre pour interpréter un symptôme ; aucun lien vers un rendez-vous garage [26].
- **DiagnosticAuto** (diagnosticautofree.com) : annonce un diagnostic en 2 minutes avec probabilités et coûts estimés [27]. Le site était injoignable lors de l'étude [A VERIFIER].

**Enseignement.** Le marché français bascule vers le « diagnostic par IA » grand public, sans garage derrière. L'humain local reste l'espace libre.

### 11. Contre-exemple instructif : les vérificateurs de symptômes médicaux

Une étude de référence publiée dans le BMJ a évalué 23 vérificateurs de symptômes en ligne sur 45 cas types [28][29] :
- bon diagnostic cité en premier dans environ un tiers des cas ;
- bon diagnostic présent dans les 20 premières propositions dans un peu plus de la moitié des cas ;
- orientation (urgence, consultation, soins à domicile) appropriée dans 57 % des cas seulement, avec une tendance à surestimer l'urgence.

**Enseignement transposable.** Un questionnaire en ligne est un outil d'**orientation**, pas de diagnostic. Afficher une cause unique ou un pourcentage donne un faux sentiment de certitude.

### Grille comparée de la mécanique des diagnostics par questions

| Critère | RepairPal (quiz) | Wrenchly | Halfords | Plateformes FR (iDGarages, Vroomly, Allogarage) |
|---|---|---|---|---|
| Point d'entrée | Symptôme nommé (ne démarre pas, voyant moteur) [15] | Famille de symptômes par sensation [19] | Symptôme vers contrôle [20] | Prestation nommée [2][6][9] |
| Nombre de questions | Environ 2 axes observables pour « ne démarre pas » [15b] ; nombre exact [A VERIFIER] | Une branche parmi environ 90 libellés, moins de 2 minutes annoncées [19] | Sans objet (page à lire) | Sans objet |
| Vocabulaire | Conducteur, termes techniques expliqués [15b] | Conducteur, tests guidés [19] | Conducteur [20] | Mécanicien (catalogue) [9] |
| « Je ne sais pas » | [A VERIFIER] | Partiel, non systématique [19] | Sans objet | Sans objet |
| Urgence | Oui, graduée par observables, 4 niveaux pour le voyant moteur [15c] | Oui, par cause, plus auto-évaluation [17][19] | Implicite (contrôle recommandé) [20] | Guide voyants par couleur (iDGarages) [4] |
| Rouler ou non | Explicite (« pull over », remorquage) [15c] | Indirect (« Car not safe to drive » saisi par l'utilisateur) [19] | Non | Oui dans le guide voyants [4] |
| Prix | Fourchette garantie par un atelier certifié [16] | Fourchette générique [17] | Contrôles souvent gratuits [21] | Prix du diagnostic affiché (iDGarages 39 euros en moyenne) [2] |
| Passage à l'action | Garage certifié [15][16] | E-mail, envoi au garage, rappel [17][19] | Réservation du contrôle [20] | Réservation [2][6] |
| Avertissement | Diagnostic final par un mécanicien [15b] | Rapport IA « informational purposes only » [18] | Sans objet | Contrôle par un professionnel [3] |

## Bonnes pratiques a reprendre pour BF Auto

Classées par impact décroissant. Les formulations proposées sont des propositions de conception, pas des constats.

1. **Trancher l'urgence avant tout le reste, à partir d'observables.** Première question de chaque branche : les signaux de danger (voyant rouge, voyant moteur qui clignote, pédale de frein molle, fumée ou odeur de brûlé, direction qui tire fort). Si la réponse est oui, afficher un écran d'arrêt : « Ne roulez pas », numéro cliquable du garage, conseil de dépannage. Modèle : questionnaire voyant moteur de RepairPal [15c], code couleur d'iDGarages [4].
2. **Entrer par ce que le conducteur perçoit, pas par la prestation.** Proposer 6 à 7 familles : un voyant s'allume ; un bruit ; ça vibre ou ça tire d'un côté ; une odeur, une fumée ou une fuite ; démarrage difficile ou impossible ; freinage inhabituel ; « autre ou je ne sais pas ». Modèles : Wrenchly [19], FixMyCar [22], Halfords [20].
3. **Faire court et fermé.** Viser 3 à 6 questions par branche, une question par écran, choix contraints en langage courant, progression visible. Mettre **« Je ne sais pas » ou « Je n'ai pas remarqué » sur chaque question**, traité comme neutre et jamais comme une exclusion (contre-exemple : la logique d'exclusion de Wrenchly [17]).
4. **Restituer une conduite à tenir en 3 niveaux, avec des mots.** « Arrêtez-vous et appelez-nous » ; « Roulez prudemment, rendez-vous sous quelques jours » ; « Pas d'urgence, à contrôler lors d'un prochain passage ». Les libellés doivent porter le sens (la couleur n'est qu'un appui, pour l'accessibilité). Base : graduation RepairPal [15c] et iDGarages [4].
5. **Donner 1 à 3 pistes, sans pourcentage.** Pour chacune : ce que c'est en mots simples et ce que le mécanicien vérifiera. Mention courte et visible au résultat : piste d'orientation à confirmer à l'atelier. Cela évite la fausse certitude [17][28].
6. **Convertir le résultat en un contrôle à prix affiché, pas en devis de réparation.** Modèles : contrôles gratuits Halfords [21], diagnostic électronique au périmètre explicite chez iDGarages [2]. Prix TTC du contrôle ou du diagnostic de BF Auto [A VALIDER par le garage], cohérent avec l'affichage en atelier exigé par l'arrêté du 27 mars 1987 [30].
7. **Transmettre le résumé au garage.** Le formulaire de contact ou de rappel est pré-rempli avec les réponses (véhicule, famille, réponses, niveau d'urgence), et un résumé imprimable ou partageable est proposé. Modèle : « QuickSend » et « mechanic summary » de Wrenchly [17].
8. **Aucun compte ni e-mail pour voir le résultat.** Le résultat s'affiche immédiatement ; l'e-mail ou le téléphone ne sont demandés que si le client veut être rappelé (contre-exemple Wrenchly [18]).
9. **Proposer des tests simples et sans risque, puis s'arrêter là.** Deux exemples : le bruit persiste-t-il à l'arrêt, moteur tournant ? Le voyant clignote-t-il ou reste-t-il fixe ? [15c][19]. Jamais de manipulation à chaud (liquide de refroidissement, capot) ni de démontage.
10. **Accepter une saisie experte facultative.** Champ « code défaut si vous l'avez » [19], optionnel et jamais exigé.
11. **Publier une page « voyants » en français simple**, groupée par couleur avec la conduite à tenir, reliée au questionnaire [4].
12. **Afficher des avis sourcés et dire comment ils sont contrôlés** : origine (exemple fiche Google), note et nombre, date. Obligation d'information sur la vérification des avis [31] ; modèles iDGarages (tiers nommé) [3] et Allogarage (facture) [13].

## A eviter absolument

- **Probabilités chiffrées** (« 9/10 ») et cause unique présentée comme certaine : fausse précision [17], contredite par la fiabilité réelle de ces outils [28].
- **Fourchettes de prix de réparation génériques** que le garage ne s'engage pas à tenir [17]. Seul RepairPal rend une fourchette crédible, parce qu'un atelier s'y engage [16]. Une fourchette affichée sur le site de BF Auto et contredite par le devis créerait un litige ; l'enquête DGCCRF relève d'ailleurs en tête des manquements des tarifs incomplets, « notamment pour les frais de diagnostic » [32] [A VERIFIER sur le communiqué DGCCRF du 04/06/2026, inaccessible en consultation automatisée].
- **Appeler l'outil « diagnostic »** sans nuance. Depuis les arrêts du 11 mai 2022, la faute et le lien de causalité du garagiste sont présumés quand un désordre persiste après son intervention [10][33]. Depuis 2025, le garage doit prouver qu'il a averti le client lorsqu'il a limité son intervention [33]. Le vrai diagnostic se fait à l'atelier ; le site oriente. Proposition d'intitulé : « Premier avis en quelques questions » [A VALIDER].
- **Exclure un symptôme parce qu'il n'a pas été signalé** [17].
- **Conditionner le résultat à un e-mail**, ou promettre « instantané » puis envoyer par e-mail [17][18].
- **Tutoriels de bricolage et liens affiliés** vers des pièces, surtout sur les organes de sécurité (freins, direction, pneus) [17].
- **Catalogue ou questions dans le vocabulaire du mécanicien** en premier niveau (« décalaminage », « courroie d'accessoire ») [9].
- **Conversation IA libre** en guise de diagnostic [26] : réponses non maîtrisées, responsabilité diffuse, et Wrenchly lui-même en critique les trous d'information [17].
- **Bannière cookies asymétrique** [5] (contre-exemple Vroomly, capture `captures/vroomly-desktop.png`). Mieux : aucun traceur non essentiel, donc aucune bannière.
- **Bandeaux promotionnels, pastilles flottantes, fenêtres surgissantes** (captures `captures/idgarages-desktop.png`, `captures/idgarages-voyants-mobile.png`).
- **Témoignages non vérifiables** en prénoms seuls [17][31].
- **Rendu entièrement côté client** qui montre un écran vide au chargement (capture `captures/allogarage-desktop.png`).
- **Émojis et pictogrammes décoratifs** (Wrenchly, captures `captures/wrenchly-desktop.png`, `captures/wrenchly-questionnaire-mobile.png`) : contraires à la charte du projet.

## Opportunites de differenciation pour un garage independant

1. **Le créneau est libre en France.** Aucun des comparateurs étudiés ne propose de parcours par questions [2][3][6][11][14]. Les outils d'IA récents n'ont pas de garage derrière [26][27]. Un garage local qui écoute le symptôme avant de voir la voiture n'a pas d'équivalent direct identifié [A VERIFIER sur les sites des garages indépendants, couverts par une autre étude].
2. **L'humain local comme issue.** Le résumé arrive au garage, un mécanicien rappelle. Wrenchly vend cette boucle aux garages [17][19] ; BF Auto peut l'offrir en direct, sans intermédiaire ni commission. Délai de rappel à afficher [A VALIDER par le garage].
3. **Prix du contrôle fixe, affiché et expliqué** (ce qui est inclus, ce qui ne l'est pas), éventuellement déduit si la réparation est faite chez BF Auto [A VALIDER par le garage]. Aucun comparateur ne peut promettre cela au nom d'un atelier précis.
4. **Relier diagnostic et catalogue de pièces**, puisque la maquette place le catalogue en premier bloc. Exemples : une usure irrégulière des pneus oriente vers le contrôle du parallélisme et vers les pneus du catalogue ; un démarrage difficile oriente vers le test de batterie et les batteries. Jamais d'incitation à remplacer soi-même une pièce de sécurité.
5. **Transparence réglementaire mise en avant** comme preuve de sérieux : taux horaires TTC et forfaits affichés en ligne [30], information sur les pièces de réemploi pointée par la DGCCRF [32], mentions sur les avis [31]. Peu d'acteurs le font en ligne [A VERIFIER].
6. **Instantanéité et accessibilité** : questionnaire rendu côté serveur, une page par question, fonctionnel sans JavaScript, sans traceur, face à des plateformes lourdes (captures `captures/idgarages-desktop.png`, `captures/allogarage-desktop.png`).
7. **« Fiche pour votre garagiste »** : résumé imprimable des réponses, utile même si le client ne vient pas. C'est un geste de confiance qui fait parler du garage.

## Pre-classement Kano propose

Pré-classement à confirmer par l'analyse Kano (`docs/conception/kano-site-bf-auto.md`).

**Basique (leur absence mécontente, leur présence passe inaperçue)**
- Numéro cliquable et adresse visibles sur chaque écran du parcours : un conducteur inquiet veut appeler tout de suite.
- Écran d'arrêt sécurité (« ne roulez pas ») dès qu'un signal de danger est coché : l'omettre serait une faute de conseil [15c][33].
- Mention « orientation à confirmer à l'atelier » au résultat : attendue depuis les avertissements de toutes les plateformes [3][18].
- Réponse « Je ne sais pas » sur chaque question : sans elle, le conducteur bloque ou répond au hasard.
- Choix fermés en langage courant, une question par écran, utilisable au téléphone : standard des meilleurs parcours [19].
- Résultat visible sans compte ni e-mail : exiger un e-mail est vécu comme une capture de contact [18].
- Prix TTC du contrôle ou du diagnostic affiché : obligation d'affichage [30] et premier sujet d'inquiétude [32].

**Performance (plus c'est réussi, plus la satisfaction monte)**
- Brièveté : chaque question en moins améliore le taux d'achèvement ; cible 3 à 6 par branche.
- Clarté de la conduite à tenir (3 niveaux en mots) : c'est la vraie valeur ajoutée du parcours [15c].
- Pré-remplissage de la demande de rappel ou de rendez-vous avec le résumé : il évite de tout réexpliquer [17].
- Délai de rappel annoncé et tenu : la rapidité de réponse fait la différence face aux plateformes [A VALIDER].
- Vitesse d'affichage de chaque étape (rendu serveur, aucune ressource distante).

**Attractive (inattendue, elle enchante)**
- Fiche résumé imprimable ou partageable pour le mécanicien : geste de confiance rare [17].
- Lien du résultat vers le catalogue (pneus, batteries, consommables non critiques) : propre à BF Auto, puisque la maquette place le catalogue en tête.
- Page voyants reliée au questionnaire (« quel voyant voyez-vous ? ») : les concurrents s'en tiennent à une liste [4].
- Rappel par le mécanicien lui-même plutôt que par un standard : l'humain local que les plateformes n'offrent pas.

**Indifférente (peu d'effet sur la satisfaction)**
- Compte client : aucun parcours étudié n'en a besoin pour orienter [17].
- Saisie d'un code défaut OBD : utile à une minorité équipée ; à garder facultatif, sans mise en avant [19].
- Comparaison multi-garages : hors sujet pour le site d'un garage unique.
- Conversation IA libre : pas attendue du client, et coûteuse en risque [26].

**À éviter (sa présence mécontente ou expose le garage)**
- Probabilités chiffrées par cause : fausse précision [17][28].
- Fourchettes de prix de réparation génériques : source de litige et de méfiance [16][17][32].
- E-mail obligatoire pour voir le résultat [18].
- Tutoriels de bricolage et liens affiliés sur les organes de sécurité [17].
- Bandeaux promotionnels, pastilles flottantes, bannière cookies asymétrique [5].
- Émojis et pictogrammes décoratifs : contraires à la charte du projet.

## Sources

Consultées le 2026-09-23 sauf mention contraire.

1. iDGarages, accueil : https://www.idgarages.com/
2. iDGarages, diagnostic électronique : https://www.idgarages.com/fr-fr/prestations/diagnostic-electronique
3. iDGarages, recherche de pannes : https://www.idgarages.com/fr-fr/prestations/recherche-pannes-auto
4. iDGarages, guide des voyants : https://www.idgarages.com/fr-fr/voyants-voiture
5. CNIL, « Refuser les cookies doit être aussi simple qu'accepter » : https://www.cnil.fr/fr/refuser-cookies-doit-etre-aussi-simple-accepter-cnil-poursuit-action-adresse-mises-en-demeure et recommandation consolidée : https://www.cnil.fr/sites/default/files/2026-01/recommandation_cookies_consolidee.pdf
6. Vroomly, accueil : https://www.vroomly.com/
7. Vroomly, blog symptômes : https://www.vroomly.com/blog/les-5-signes-dune-panne-dalternateur/ et https://www.vroomly.com/blog/symptomes-demarreur-hs/
8. Vroomly, « Le garagiste a-t-il une obligation de diagnostic ? » : https://www.vroomly.com/blog/le-garagiste-a-t-il-une-obligation-de-diagnostic/
9. Vroomly, liste des prestations : https://www.vroomly.com/prestations/
10. MFA, article 1231-1 du Code civil et obligation du garagiste : https://mfa.fr/le-point-juridique-lobligation-de-resultat-du-garagiste/
11. Allogarage, accueil : https://www.allogarage.fr/
12. Auto Infos, Allogarage : https://www.auto-infos.fr/allogarage/
13. J'aime les startups, Allogarage (vérification des avis par facture) : https://www.jaimelesstartups.fr/allogarage/
14. Autobutler : https://www.autobutler.fr/ et https://www.autobutler.fr/pages/recevez-3-devis (extraits de moteur de recherche, pages refusées en 403)
15. RepairPal, guide des symptômes (archive Wayback du 2026-09-20) : https://web.archive.org/web/20260920110633/https://repairpal.com/symptoms ; page d'origine https://repairpal.com/symptoms
    - 15b. RepairPal, « Car Won't Start » : https://repairpal.com/symptoms/car-wont-start (lu via archive Wayback 2026)
    - 15c. RepairPal, « Check Engine Light On » : https://repairpal.com/symptoms/check-engine-light (lu via archive Wayback 2026)
    - Annonce du guide : https://www.prnewswire.com/news-releases/introducing-repairpals-symptom-guide-300405899.html
16. RepairPal, estimateur et garantie de prix : https://news.repairpal.com/164160-repairpal-brings-truth-and-transparency-to-auto-and-service-repair-with-their-new-fair-price-estimator et https://repairpal.com/repairpal-fair-price-guarantee
17. Wrenchly, accueil (texte et code de la page) : https://www.wrenchly.co.uk/
18. Wrenchly, page de l'outil : https://www.wrenchly.co.uk/whats-wrong-with-my-car/
19. Wrenchly, script du formulaire (libellés des questions et réponses) : https://www.wrenchly.co.uk/wrenchly-form.js
20. Halfords, « Which car check for me » : https://help.halfords.com/wss/fitting-service-repair/car-servicing/which-car-check-for-me
21. Halfords, contrôles : https://www.halfords.com/car-repairs/car-checks/ et https://www.halfords.com/car-repairs/diagnostic-check/
22. FixMyCar, « Diagnose car problems » : https://www.whocanfixmycar.com/advice/diagnose-car-problems
23. FixMyCar, prix d'un diagnostic : https://www.whocanfixmycar.com/advice/how-much-is-a-car-diagnostic-test
24. AutoZone, Fix Finder : https://www.autozone.com/lp/fix-finder
25. Mechanic Insights, limites du diagnostic gratuit AutoZone : https://www.mechanicinsights.com/2026/07/autozone-free-diagnostic.html
26. Garage IA : https://garageia.fr/
27. DiagnosticAuto : https://diagnosticautofree.com/ (injoignable lors de l'étude, description issue d'un moteur de recherche)
28. Semigran HL et al., « Evaluation of symptom checkers for self diagnosis and triage: audit study », BMJ 2015 : https://www.semanticscholar.org/paper/Evaluation-of-symptom-checkers-for-self-diagnosis-Semigran-Linder/f7b90d0542b9f1319815a722c013e4090e5ac645
29. NIH News in Health, « Checking the Symptom Checkers » : https://newsinhealth.nih.gov/2015/09/checking-symptom-checkers
30. Arrêté du 27 mars 1987 relatif à la publicité des prix des prestations d'entretien et de réparation de véhicules (Légifrance) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000862823 ; synthèse : https://www.documentissime.fr/dossiers-droit-pratique/dossier-160-la-responsabilite-du-garagiste/avant-l-intervention-du-garagiste.html
31. Code de la consommation, article L111-7-2 (avis en ligne) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049571119
32. Movalib, synthèse de l'enquête DGCCRF sur la réparation automobile : https://movalib.com/blog/enquete-dgccrf-reparation-automobile-points-vigilance-garagistes ; communiqué primaire (403 lors de l'étude) : https://www.economie.gouv.fr/files/files/directions_services/dgccrf/media-document/CP-DGCCRF-Reparation-et-entretien-automobile.pdf
33. INC, responsabilité contractuelle du garagiste (Cass. 1re civ. 11 mai 2022 n° 20-19.732 et 20-18.867 ; 16 octobre 2024 n° 23-11.712 ; 25 juin 2025 n° 24-10.875 et 23-22.515) : https://www.inc-conso.fr/content/responsabilite-contractuelle-du-garagiste-clarification-de-la-cour-de-cassation

### Captures prises pour cette étude

| Fichier | Sujet | État |
|---|---|---|
| `captures/idgarages-desktop.png` | Accueil iDGarages, bureau | Exploitable (bannière cookies visible) |
| `captures/idgarages-voyants-mobile.png` | Guide des voyants iDGarages, mobile 390 px | Exploitable (bannière cookies visible) |
| `captures/vroomly-desktop.png` | Accueil Vroomly, bureau | Exploitable (bannière cookies asymétrique) |
| `captures/wrenchly-desktop.png` | Accueil Wrenchly, bureau | Exploitable |
| `captures/wrenchly-questionnaire-mobile.png` | Questionnaire Wrenchly, mobile 390 px | Exploitable (premier écran) |
| `captures/allogarage-desktop.png` | Accueil Allogarage, bureau | Non exploitable (écran de chargement), conservé comme preuve de lenteur perçue |

La capture RepairPal a échoué sur une vérification anti-robot Cloudflare et n'a pas été conservée. Les captures mobiles ont été prises en Chrome avec une fenêtre de 390 par 844 pixels et un agent utilisateur iPhone : le préréglage « iPhone 13 » impose WebKit, dont le navigateur n'est pas installé pour la version de Playwright résolue par npx.
