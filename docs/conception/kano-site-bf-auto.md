# Analyse Kano : site BF Auto

Version 2 du 2026-09-23, révisée après deux relectures adversariales (voir « Journal de
relecture » et « Corrections de relecture écartées » en fin de document), avant toute US
réalisée. À mettre à jour après chaque lot (tableaux « État appliqué » et « Anomalies »).
Ce document tranche : chaque doute réel s'y conclut par une décision motivée. Toute donnée
d'identité non confirmée par le brief reste marquée `[À VALIDER : ...]` et n'est jamais
présentée comme un fait.

## Verdict

1. On construit un site rendu côté serveur, d'au plus 100 Ko sur l'accueil hors photo réelle, qui répond en une seconde sur téléphone à trois intentions (« ma voiture a un souci », « je cherche une pièce ou une réparation », « je veux un rendez-vous »), avec le téléphone, le statut d'ouverture exact à l'heure de Paris et l'action utile du moment (appeler quand c'est ouvert, être rappelé quand c'est fermé) toujours à portée.
2. Le catalogue est une liste de familles d'intervention (Freinage, Batterie, Vidange...) : une seule page par besoin, qui réunit la pièce, la prestation, le prix validé et deux actions (devis, rendez-vous). Le rendez-vous est une demande honnêtement nommée, confirmée par téléphone. Chaque demande arrive au garagiste par le canal qu'il lit vraiment dans la journée, lisible sans se connecter ; un espace garagiste minimal, sans mot de passe, sert aux demandes, aux fermetures exceptionnelles et au signalement des changements.
3. On refuse : panier et paiement en ligne, faux agenda, indicateur de stock, « compatible » automatique, avis, photos ou chiffres inventés, prix de réparation estimés, traceurs, bandeau de cookies, robot conversationnel, indicateur calculé sur un statut que le garagiste ne saisira pas, demande jetée en silence.
4. Le pari différenciant : une « Orientation en 5 questions » qui tranche d'abord la sécurité, oriente sans promettre et transmet au garagiste un dossier prêt à rappeler. Les sites locaux s'arrêtent à un champ libre, les plateformes (Vroomly, idGarages) à une prestation déjà nommée ; aucune ne part du symptôme ni ne donne un interlocuteur nommé qui rappelle sans commission.
5. Sans avis, la confiance repose sur un socle réel et bloquant : prénom du garagiste, photo de la façade, taux horaire et prix du premier contrôle, deux engagements écrits, réponse à « faut-il un rendez-vous ? », statut d'ouverture exact. Toute autre donnée non validée reste invisible, jamais inventée. La collecte se fait en deux séances de 30 minutes avec le garagiste (kit de collecte), pas par un fichier qu'il ne relira pas.
6. La bataille locale se joue d'abord sur la fiche Google : un lot sans code l'aligne sur le site (nom, horaires, prestations, photos, lien) et outille la collecte d'avis au comptoir. Aucune mise en ligne avant ce lot, le jury au niveau excellent et l'accord d'Anthony.

## Sources opposables

### Dossier du projet

| Source | Opposable pour | Non opposable |
|---|---|---|
| `docs/BRIEF.md` | Identité confirmée le 2026-09-23 : BF Auto, 7 rue Demanieux, 94600 Choisy-le-Roi, 06 05 92 28 38, fermeture constatée à 19 h, fiche Google « Garage auto choisy 94 » bientôt renommée, aucun avis. Charte, choix techniques, arborescence. | Toute donnée marquée à valider (horaires complets, prestations, prix, SIRET). |
| `docs/maquette/maquette-client.jpg` | Intentions et hiérarchie : logo en haut à gauche, accroche en bandeau, catalogue « pièces garage » puis « ? » à gauche, « INFORMATION » au centre avec « Diagnostic mécanique rapide avec question simple », « Info garage : num, adresse, formulaire de contact » à droite. | La grille à trois colonnes comme gabarit à recopier (brief §2 : inspiration). |
| `01-reseaux-nationaux.md` | Normes du marché (statut du jour, appel en un geste, parcours en 3 étapes), poids mesurés de 1,4 à 11,7 Mo, défauts constatés. | Mentions [A VERIFIER] ; étude Ipsos pour Dekra (échantillon allemand) citée comme tendance seulement. |
| `02-plateformes-et-diagnostic.md` | Mécanique des questionnaires (RepairPal, Wrenchly, Halfords, FixMyCar), risques (fausse précision, e-mail exigé, exclusion), jurisprudence de responsabilité, fiabilité des vérificateurs de symptômes. | Libellés d'interface non lus [A VERIFIER]. |
| `03-catalogues-pieces.md` | Modèles de catalogue, droit de la vente à distance, obligations sur les pièces issues de l'économie circulaire, défauts des leaders (compatibilité « indicative »). | Les faits propres au BF Auto de Roussillon (3 000 références, réception sous 24 h, retrait au comptoir) : ce n'est pas le client. |
| `04-independants-et-sites-bf-auto.md` | Patrons de confiance des indépendants (grille datée de M&V Tech, règle écrite de La Maison Mécanique, appel fixe d'Ottohaus), règles schema.org et avis. | La section A1 (Roussillon) comme donnée client : pneus d'occasion par usure, adresses à rediriger, N7, allégations climatisation. |
| `05-attentes-clients-et-cadre-legal.md` | Sondages (Ifop, Roole, Guest Suite), enquêtes DGCCRF, tableau des obligations légales en vigueur au 2026-09-23. | Le rattachement des constats du site de Roussillon au client. |
| `06-concurrence-locale-choisy.md` | Concurrents de Choisy-le-Roi, requêtes locales, ancres de prix des plateformes, cohérence NAP, entité juridique candidate GARAGE AUTO CHOISY 94 (SIREN 953 343 738). | Le rattachement de BF Auto à cette société `[À VALIDER : rattachement du nom commercial BF Auto à GARAGE AUTO CHOISY 94]`. |
| `~/.claude/skills/agate-conception-projet/references/kano-backlog.md` | Méthode : catégories, gisements d'attractives, format des US, notation de l'attractive phare. | |
| `~/Documents/Anthony - Memoire perso/wiki/07-Travail/AGATE/methodes/pieges-de-conception-logicielle.md` | Les 41 motifs de défauts qui passent les tests, relus avant conception (voir « À éviter »). | |

**Règle d'opposabilité.** Les études 03, 04 et 05 ont été rédigées avant la confirmation de
l'identité (brief §3). Leurs constats de marché et de droit restent opposables ; **aucun
fait propre au BF Auto de Roussillon n'est repris** pour le garage de Choisy-le-Roi. Une
mention [A VERIFIER] d'une étude reste une hypothèse : elle ne fonde aucune promesse
affichée.

**Contradiction relevée entre études.** Les études 03 et 04 lisent le décret n° 2024-824
comme imposant aussi l'affichage en ligne des **prix** des pièces issues de l'économie
circulaire ; l'étude 05 ne cite que la possibilité d'opter, les catégories et les
exceptions. Décision : le bloc réglementaire se rédige sur le texte de l'article
D224-25-2 relu à la source au moment de l'écriture `[À VALIDER : lecture juridique de
D224-25-2, mention des prix ou non]`.

**Règle des chiffres.** Chaque chiffre cité dans ce document porte son année et son
périmètre. Les sondages Ifop de 2015 (onze ans) et l'étude Ipsos pour Dekra (échantillon
allemand) ne valent que comme tendance. Aucun chiffre de sondage n'est repris dans les
textes publics du site.

### Sources web citées par les études (consultées par elles le 2026-09-23)

Droit :
- Arrêté du 27 mars 1987, publicité des prix des garages : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000862823
- LCEN consolidée (art. 1-1, 1-2, 19) : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164
- Code de la consommation, entretien et réparation (R224-22 à D224-25-5) : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000033728707/
- Décret n° 2024-824 (pièces issues de l'économie circulaire, site internet) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000050000999
- Article R616-1 (médiateur sur le site) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032808378
- Articles L223-1 à L223-7 (démarchage téléphonique, version du 11/08/2026) : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221441/
- Articles L111-7-2 et D111-17 (avis en ligne) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049571119 et https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035724934
- Article L221-28 et décret n° 2026-3 (rétractation, « renoncer au contrat ici ») : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170 et https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053298978
- Règlement (UE) 2024/3228 (fin de la plateforme de règlement en ligne des litiges) : https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32024R3228
- Exemption automobile, règlement (UE) n° 461/2010 prolongé par 2023/822 : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=legissum:cc0008
- Responsabilité du garagiste (Cass. 1re civ. 11 mai 2022 et suivants) : https://www.inc-conso.fr/content/responsabilite-contractuelle-du-garagiste-clarification-de-la-cour-de-cassation
- CNIL, cookies et formulaires : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi et https://www.cnil.fr/fr/exemples-de-formulaire-de-collecte-de-donnees-caractere-personnel
- Google, données structurées d'établissement local : https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=fr
- SignalConso, faux avis : https://signal.conso.gouv.fr/fr/actualites/faux-avis

Régulateur et études d'opinion :
- DGCCRF, enquête 2024 publiée le 04/06/2026 : https://www.economie.gouv.fr/dgccrf/laction-de-la-dgccrf/les-enquetes-et-les-controles/enquete-sur-la-loyaute-des-informations-delivrees-aux-consommateurs-en-matiere-dentretien
- Ifop pour IDGarages (2015) : https://www.auto-infos.fr/Sondage-IFOP-une-confiance-mitigee,7227
- Ifop pour Caroom (2021) : https://journal-du-palais.fr/au-sommaire/automobile/reparation-auto-les-femmes-n-ont-pas-confiance
- Ifop pour Guest Suite (2026) : https://www.guest-suite.com/blog/statistiques-avis-clients
- Observatoire Roole 2024 : https://data.roole.fr/etudes/observatoire-2024
- Ipsos pour Dekra, article Auto Infos du 04/09/2026 : https://www.auto-infos.fr/article/les-automobilistes-attendent-davantage-de-services-numeriques-de-leur-atelier.293351
- Médiamétrie, Année Internet 2025 : https://www.mediametrie.fr/en/internet-year-2025
- Semigran et al., BMJ 2015, vérificateurs de symptômes : https://www.semanticscholar.org/paper/Evaluation-of-symptom-checkers-for-self-diagnosis-Semigran-Linder/f7b90d0542b9f1319815a722c013e4090e5ac645

Parcours de référence observés :
- RepairPal, voyant moteur : https://repairpal.com/symptoms/check-engine-light
- Wrenchly, script du questionnaire : https://www.wrenchly.co.uk/wrenchly-form.js
- Halfords, symptôme vers contrôle : https://help.halfords.com/wss/fitting-service-repair/car-servicing/which-car-check-for-me
- Midas, rendez-vous « motif inconnu » : https://www.midas.fr/rendez-vous-midas
- Speedy Thiais (fiche centre de référence) : https://centres-auto.speedy.fr/garage/thiais-94320/560
- Europe Auto, Choisy-le-Roi : https://www.europe-auto94.fr/
- Pièces Auto, devis en ligne : https://pieces-auto.fr/devis-en-ligne/
- CGV Carter-Cash (ex-Yakarouler) : https://www.yakarouler.com/infos/cgv.html
- M&V Tech (grille tarifaire datée) : https://www.garagemvtech.com/
- Annuaire des entreprises, GARAGE AUTO CHOISY 94 : https://annuaire-entreprises.data.gouv.fr/entreprise/garage-auto-choisy-94-953343738

## Personas

### P1. L'automobiliste inquiet, sur son téléphone

- **Situation** : un voyant vient de s'allumer, un bruit nouveau, une odeur ; souvent en route ou garé, parfois après la fermeture. Téléphone à la main, réseau médiocre, une seule main libre.
- **Vocabulaire** : des sensations (« ça claque », « ça tire à droite »), jamais le nom d'une pièce.
- **Peurs** : le danger, le coût, se faire avoir. 52 % des automobilistes ne font pas confiance aux garagistes en général, 60 % en Île-de-France (Ifop pour IDGarages, 2015, France, tendance ancienne) ; 75 % des femmes se sentent perçues comme « faciles à arnaquer » (Ifop pour Caroom, 2021, France).
- **Ce qu'il veut en trente secondes** : savoir s'il peut rouler, joindre quelqu'un, savoir s'il peut passer sans rendez-vous et ce que coûtera le premier contrôle.
- **Chez les concurrents** : un champ de texte libre (Midas) ou une prestation à nommer d'avance (iDGarages, Vroomly) ; Europe Auto, à 500 m, affiche un entretien rapide « Chrono Service » sans rendez-vous (étude 06).
- **Réussite** : il sait quoi faire tout de suite, et le garage le rappelle en connaissant déjà son cas, au moment où il peut décrocher.

### P2. Le client qui cherche une pièce

- **Situation** : il sait, ou croit savoir, ce qu'il lui faut (plaquettes, batterie, balais, ampoule), souvent sur le conseil de quelqu'un. Il a vu des prix chez Oscaro, Carter-Cash ou Norauto Belle Épine (batterie « dès 64,99 € », étude 06).
- **Peurs** : se tromper de pièce (les leaders qualifient leur filtre par plaque d'« indicatif » dans leurs CGV), payer la pose ailleurs, se voir refuser le montage d'une pièce apportée.
- **Ce qu'il veut** : un prix, un délai, la certitude que c'est la bonne pièce, quelqu'un qui la pose.
- **Réussite** : un devis « pièce posée », vérifiée pour sa voiture, obtenu sans compte ni paiement et sans second appel pour préciser la motorisation.

### P3. Le client qui prépare un entretien

- **Situation** : révision, vidange, pneus, freins qui commencent à siffler, contrôle technique qui approche. Il planifie, parfois plusieurs semaines à l'avance, compare (ancres idGarages « dès 59 € », moyenne Vroomly de la vidange à 154 € à Choisy-le-Roi, de 72 € à 230 € selon le véhicule, étude 06) et choisit le moment.
- **Profil** : souvent plus âgé, attaché à « son » garagiste (96 % des plus de 65 ans lui font confiance, Ifop pour IDGarages, 2015, tendance ancienne) ; exigeant sur la lisibilité.
- **Peurs** : être poussé à la consommation (94 % jugent important de ne pas l'être, même source), perdre la garantie constructeur en sortant du réseau.
- **Réussite** : une demande de rendez-vous envoyée en moins de deux minutes, en connaissant le prix du forfait pour un véhicule comme le sien et ce qu'il comprend.

### P4. Le garagiste de BF Auto, qui exploite le site

- **Situation** : il travaille à l'atelier, les mains occupées ; le téléphone sonne sous la voiture. Aucun temps pour l'administratif ; il utilise son téléphone, pas un ordinateur. Rien n'établit qu'il lit ses courriels dans la journée `[À VALIDER : canal réellement consulté dans la journée, SMS ou courriel]`. Son prénom n'est pas connu du dossier `[À VALIDER : prénom et accord du garagiste pour apparaître sur le site]`. Anthony valide les données avant leur publication.
- **Ce qu'il veut** : des demandes complètes et lisibles sans se connecter (véhicule, besoin, urgence, moment où le client peut répondre), pas de pourriel, aucune promesse faite en son nom qu'il ne peut pas tenir, signaler une fermeture en trois gestes.
- **Peurs** : un site qui promet un créneau ou une heure de rappel qu'il n'a pas, des clients qui trouvent porte close, des appels à 22 h, un site hors la loi, un outil qui le juge.
- **Réussite** : il rappelle en connaissant le cas. Il ne saisit rien d'autre que ses fermetures exceptionnelles ; ranger une demande « traitée » est facultatif et rien n'en dépend ; un changement d'horaires ou de prix se signale en un message à Anthony.

## Décisions structurantes

### D1. Le catalogue : familles d'intervention

**Question.** La maquette place « CATALOGUE : pièces garage » en tête de la colonne gauche.
Que montre ce catalogue, jusqu'où va-t-il (prix, stock, compatibilité, paiement), et
comment éviter qu'un même besoin (le freinage) existe deux fois, comme pièce et comme
prestation ?

**Options.**
- A. Boutique en ligne : fiches article, panier, paiement, retrait ou livraison.
- B. Catalogue article par article avec stock affiché, sans paiement.
- C. Vitrine par familles de pièces, séparée d'une page de prestations et tarifs.
- D. Une seule liste de familles d'intervention ; chaque famille réunit la pièce et la prestation et débouche sur un devis ou un rendez-vous ; pièce vérifiée et posée par le garagiste ; paiement à l'atelier.
- E. Catalogue PDF à télécharger.
- F. Pas de catalogue, renvoi au téléphone.

**Décision : D** (la décision C de la version 1, fusionnée avec les prestations).
- Un seul objet, la **famille d'intervention**, une seule page par famille : `/entretien-reparation/<famille>`. 10 à 14 familles à plat, nommées dans les mots du client : Freinage, Batterie, Pneus, Vidange et filtres, Distribution, Embrayage, Amortisseurs et suspension, Échappement, Démarrage et charge, Climatisation, Éclairage, Essuie-glaces, Bougies et allumage, Liquides. Seules les familles que le garagiste confirme traiter sont publiées `[À VALIDER : liste des familles traitées]`.
- Dans la liste, chaque famille porte ses mots courants (« Freinage : plaquettes, disques, liquide de frein »). Ils remplacent la recherche : 14 entrées tiennent sur un écran de téléphone. La recherche ne sera rouverte qu'au-delà de 20 familles.
- Page de famille : à quoi elle sert (une phrase), les signes d'usure (lien vers l'orientation), ce que fait le garage (vérification, pose), le forfait TTC daté avec son véhicule de référence s'il est validé, sinon « Prix sur devis », et deux actions : « Demander un devis » et « Demander un rendez-vous », qui ouvrent la demande avec la famille pré-remplie. Titre HTML du type « Freinage à Choisy-le-Roi : plaquettes, disques | BF Auto ».
- Deux entrées vers les mêmes pages : le bloc « Catalogue : pièces et réparations » de l'accueil, fidèle à la maquette, et la page `/tarifs`, tableau récapitulatif calculé depuis les mêmes données. Un seul fichier source et une seule porte : un prix ne peut pas diverger entre la page de famille et les tarifs (AE-05).
- Sur la page de la liste, un bloc « Ce que nous ne faisons pas » (liste validée, par exemple énergies, carrosserie, boîte automatique ou utilitaires `[À VALIDER : ce que le garage ne traite pas]`).
- Offre par défaut : pièce vérifiée et posée par le garage. L'option « Pièce seule, à retirer au garage » n'apparaît que si la vente au comptoir est confirmée `[À VALIDER : vente de pièces au comptoir]`. La règle sur les pièces apportées par le client n'est publiée qu'une fois arrêtée `[À VALIDER : politique pièces apportées]`.
- Gamme souhaitée : « Neuve », « D'occasion ou reconditionnée (pièce issue de l'économie circulaire) », « Sans préférence » (attractive AT-4). L'expression légale exacte reste dans le bloc de B-11.
- Identification du véhicule : pour une demande de devis, la plaque **ou** l'ensemble marque (liste), modèle (texte court), année (liste) et énergie (liste) est exigé, avec l'explication « Sans cela, nous devrons vous rappeler pour le demander. » La plaque est normalisée avant validation (majuscules, espaces et tirets retirés puis remis) et acceptée au format SIV (`AB-123-CD`) comme à l'ancien format FNI (`1234 AB 56`). Pour un rendez-vous ou un rappel, la marque suffit et reste facultative. Ni numéro VIN exigé, ni photo de carte grise. Le véhicule est un objet valeur `Vehicule` du contexte Demande ; aucun port d'identification n'est créé tant qu'aucune API de plaque n'est retenue (YAGNI).
- Jamais : indicateur de stock, mention « compatible », délai promis non validé, « vérification gratuite » présentée comme un service à part (elle attire les comparateurs, qui repartent avec la référence acheter ailleurs).

**Motif.** A perd d'avance face à 300 000 à 6,7 millions de références et au retrait en
une heure de Carter-Cash, et fait basculer dans la vente à distance : CGV, rétractation de
14 jours même en retrait magasin, fonction « renoncer au contrat ici » en vigueur depuis
le 19/06/2026 (études 03 et 05). B affiche un stock qu'aucun flux n'alimente : lecture sans
écriture et zéro qui ment (pièges 1 et 3). C, retenue en version 1, faisait exister le
freinage deux fois (famille de pièces et prestation) : deux pages, deux types de demande
pour un même besoin, deux prix à tenir. E est illisible sur téléphone et périmé dès sa
sortie (Garage Clément). F trahit la maquette. D prolonge ce que fait un garage : la
vérification humaine de compatibilité, que les leaders renvoient au client dans leurs CGV
(Carter-Cash) ou vendent sur abonnement (Autodoc), et la pose, que les plateformes
sous-traitent ; une page par besoin sert aussi le référencement local recommandé par les
études 04 et 06. Exiger la plaque ou le modèle complet pour un devis épargne au garagiste
un appel non payé ; rien de ce qui s'affiche ne dépend d'une donnée que personne
n'entretient.

### D2. Le contenu de la zone « ? »

**Question.** Le client a dessiné un grand point d'interrogation sous le catalogue sans
le définir. Qu'y met-on ?

**Options.**
- A. Foire aux questions pratique générique (paiement, accès, délais).
- B. Aide à l'identification des pièces (où lire la plaque, le modèle).
- C. Questions juridiques de confiance, sourcées (version 1).
- D. « Vos questions » : les questions qu'un nouveau client se pose avant de venir, pratiques et de confiance, chacune répondue en une phrase de client, la source juridique en lien secondaire.
- E. Guide des voyants.
- F. Assistant conversationnel.
- G. Promotions du moment.

**Décision : D.** Six questions au plus, en volets dépliables natifs (`<details>`,
fonctionnels sans JavaScript), dans cet ordre :

1. « Mon voyant est allumé : puis-je rouler ? » Un voyant rouge qui reste allumé moteur tournant, ou le voyant moteur qui clignote : arrêtez-vous. Lien vers l'orientation.
2. « Faut-il prendre rendez-vous ? » Réponse validée (oui, ou « passez sans rendez-vous pour un premier contrôle aux heures d'ouverture ») `[À VALIDER : accueil sans rendez-vous]`.
3. « Combien coûte un premier contrôle ? » Prix TTC ou gratuité, et ce qu'il comprend `[À VALIDER : prix ou gratuité du premier contrôle]`.
4. « Faites-vous des travaux sans mon accord ? » « Non : vous recevez un devis écrit avant les travaux, et nous vous appelons avant tout travail supplémentaire. » `[À VALIDER : engagements réellement pratiqués]`.
5. « Vais-je perdre la garantie de mon constructeur si je fais l'entretien ici ? » « Non, si l'entretien suit les préconisations du constructeur avec des pièces de qualité équivalente : votre garantie d'origine reste valable. Seules certaines extensions de garantie offertes par un réseau de marque peuvent exiger un entretien dans ce réseau : vérifiez votre contrat. » Lien secondaire « Le texte » : règlement (UE) n° 461/2010, prolongé jusqu'au 31/05/2028 par le règlement (UE) 2023/822 ; fiche DGCCRF du 17/07/2023.
6. « Comment puis-je payer ? » Publiée seulement si validée `[À VALIDER : moyens de paiement]`.

Sous la liste, le lien « Tous vos droits chez nous » mène à `/vos-droits` (pièces issues de
l'économie circulaire, médiateur, garantie, engagements). Règle : une question dont la
réponse repose sur une donnée non validée n'est pas affichée, jamais remplacée par un texte
d'attente. Les questions 2 à 4 reposent sur le socle de confiance, bloquant (D8), et la
question 5 sur la loi : la zone n'est jamais vide. L'aide à l'identification du véhicule
(option B) vit dans le formulaire de devis, à l'endroit où la question se pose. Le guide
des voyants (option E) est différé (voir D3). F et G figurent en « À éviter ».

**Motif.** Le premier frein face à un garage inconnu est la confiance : 52 % de défiance
générale et 94 % qui refusent d'être poussés à la consommation (Ifop pour IDGarages, 2015,
tendance ancienne), près de 40 % des 1 600 garages contrôlés en 2024 ayant fait l'objet de
suites (DGCCRF, publication du 04/06/2026). Mais un nouveau client demande d'abord s'il
peut passer, combien coûte le contrôle et si l'on touchera à sa voiture sans lui ; des
questions sur les règlements européens et l'économie circulaire, rédigées comme un texte
de juriste, ne le retiennent pas (relecture du 2026-09-23). La réponse tient en une phrase
de client ; la source reste consultable, en second.

### D3. L'orientation par questions

**Question.** Comment tenir « Diagnostic mécanique rapide avec question simple » sans
promettre un diagnostic, sans exposer le garage, et sans perdre le conducteur en route ?

**Options.** A. Questionnaire long exhaustif. B. Conversation libre par IA. C. Page de
contenus à lire (symptômes, voyants). D. Questionnaire court, fermé, à urgence déduite
d'observables, qui aboutit à une conduite à tenir et à un relais humain.

**Décision : D**, avec les règles suivantes.

| Point | Décision | Motif |
|---|---|---|
| Nom | « Orientation en 5 questions », titre visible « Un souci avec votre voiture ? », mention permanente « Orientation gratuite : le diagnostic se fait à l'atelier. » Adresse `/orientation` ; titre HTML « Voyant, bruit, fuite : orientation gratuite avant diagnostic à l'atelier \| BF Auto, Choisy-le-Roi ». Le mot « diagnostic » désigne uniquement l'examen à l'atelier ; le mot « avis » n'apparaît jamais dans le parcours, il est réservé aux avis Google. | Faute et lien de causalité du garagiste présumés depuis Cass. 1re civ. 11 mai 2022 ; un vérificateur de symptômes ne donne la bonne orientation que dans 57 % des cas (BMJ 2015, outils anglophones). « Premier avis » désignait à la fois l'outil et l'avis Google sur la même page, et n'est pas une requête qu'un conducteur tape. |
| Nombre de questions | 5 au plus avant le résultat, par construction : Q1 ce que vous remarquez, Q2 signes de danger (toujours en deuxième), Q3 à Q5 questions de la branche (3 au plus). 7 choix au plus par question. Une question par écran, affichée « Question 2 sur 5 au maximum ». | Chaque question en moins améliore l'achèvement ; RepairPal tranche « ne démarre pas » sur 2 axes observables ; Wrenchly annonce moins de 2 minutes. |
| Point d'entrée | Q1 est affichée sur l'accueil sous forme de 7 liens directs (`/orientation?q1=bruit`) : un geste par choix, aucun formulaire. Choix : Un voyant s'allume ; Un bruit inhabituel ; Ça vibre ou la voiture tire d'un côté ; Une odeur, une fumée ou une fuite ; Elle démarre mal ou pas du tout ; Le freinage a changé ; Autre chose ou je ne sais pas. | Entrer par la perception, jamais par la prestation : toutes les plateformes françaises exigent une prestation nommée (étude 02). Des liens évitent de défiler, choisir puis envoyer, et retirent un formulaire de l'accueil (piège 10). |
| Urgence | Q2 : « Remarquez-vous l'un de ces signes ? », cases à cocher : « Un voyant rouge reste allumé moteur tournant (huile, température, batterie, freins), ou le voyant moteur clignote » ; « La pédale de frein est molle ou s'enfonce » ; « De la fumée sous le capot ou une odeur de brûlé » ; « La direction tire fortement ou devient dure » ; « Une perte soudaine de puissance » ; « Aucun de ces signes » ; « Je ne sais pas ». Règle du domaine : tout signe coché l'emporte sur « Aucun de ces signes » et sur « Je ne sais pas ». Un seul signe coché déclenche l'écran d'arrêt et interrompt le questionnaire. L'arbre peut adapter la liste à la branche (« Elle démarre mal ou pas du tout » se passe de la direction), mais sur toute branche où la voiture roule, la porte exige la pédale de frein, le voyant et la fumée. Libellés relus par le garagiste à la séance de relecture. | L'urgence se déduit d'observables, jamais d'une probabilité (RepairPal) ; omettre l'arrêt serait une faute de conseil. « Un voyant rouge » seul couvrait la ceinture, la porte ouverte et le frein à main ; « de la fumée » seule couvrait la vapeur normale à froid : fausses alertes qui décrédibilisent l'outil et dérangent le garagiste. |
| Écran d'arrêt | Titre « Ne roulez pas. » Dans cet ordre, que le garage soit ouvert ou fermé : (1) mise en sécurité (feux de détresse, gilet, passagers hors de la voie) et « En cas de danger immédiat, appelez le 112 » ; (2) « Appelez l'assistance de votre assureur : le numéro figure sur votre attestation d'assurance ou dans son application » ; (3) « Demandez à être remorqué jusqu'à BF Auto, 7 rue Demanieux, 94600 Choisy-le-Roi », adresse sélectionnable pour la copier, seulement si le garage accepte les véhicules remorqués `[À VALIDER : accueil des véhicules remorqués et place disponible]` ; (4) garage ouvert : « Appeler le garage » ; garage fermé : « Être rappelé à l'ouverture (jeudi matin) », numéro affiché. Le dépannage par le garage n'est cité que s'il existe `[À VALIDER : dépannage proposé ou non]`. | Un conducteur en danger reçoit une consigne, pas une question de plus. Pour une voiture qui ne doit pas rouler, le geste utile est l'assistance et le remorquage, et la dépanneuse a besoin d'une destination ; le garagiste, souvent sous une voiture, ne décroche pas toujours. |
| « Je ne sais pas » | Présent sur chaque question, y compris Q2. Réponse neutre qui n'écarte jamais une piste. En Q2, il fixe l'urgence au niveau 2 au moins et le résultat rappelle les signes qui imposent l'arrêt. Si toutes les réponses sont « je ne sais pas », le résultat dit : « Vos réponses ne suffisent pas pour orienter : l'atelier doit voir la voiture », avec appel et rappel. | La logique d'exclusion de Wrenchly (ce qui n'est pas signalé est absent) est dangereuse ; un état vide dit ce qui manque et quoi faire (piège 4). |
| Restitution | Dans l'ordre : (1) la conduite à tenir en toutes lettres, sur 3 niveaux : « Ne roulez pas : appelez-nous », « Roulez prudemment et faites contrôler dans les prochains jours », « Pas d'urgence : à vérifier lors d'un prochain passage » ; la couleur, sobre, n'est qu'un appui ; **plancher** : sur les branches Bruit, Freinage, Vibrations et direction, le niveau le plus bas est « Roulez prudemment et faites contrôler dans les prochains jours », jamais « Pas d'urgence » ; (2) 1 à 3 pistes sans pourcentage ni rang chiffré, chacune en une phrase simple suivie de « Ce que l'atelier vérifiera » ; (3) le premier contrôle à l'atelier, son prix TTC ou sa gratuité et ce qu'il comprend ; aux niveaux 2 et 3, si l'accueil sans rendez-vous est validé, « Passez sans rendez-vous aux heures d'ouverture » avec l'itinéraire ; (4) les actions : Appeler (garage ouvert), Être rappelé, Imprimer ou partager la fiche ; (5) la mention « Orientation établie à partir de vos seules réponses. Elle ne remplace pas l'examen du véhicule. » Un lien secondaire vers la famille d'intervention concernée est admis, jamais sur un résultat de niveau 1. | Modèles RepairPal (graduation) et Halfords (issue = contrôle à prix connu). Un bruit de roulement ou de rotule classé « pas d'urgence » serait une promesse faite au nom du garagiste, dont la responsabilité est présumée. |
| Prix | Aucun prix ni fourchette de réparation, jamais. Seul le prix du premier contrôle, validé et daté. | Une fourchette que le devis contredit crée un litige (Wrenchly) ; la DGCCRF relève les frais de diagnostic non affichés parmi les premiers manquements. |
| Garde-fous | Aucun geste de bricolage sur freins, direction, pneus ou liaison au sol ; aucune manipulation à chaud (capot, liquide de refroidissement) ; tests d'observation seulement (le bruit persiste-t-il à l'arrêt ? le voyant clignote-t-il ?) ; jamais de suggestion de supprimer un filtre à particules, une vanne EGR ou un dispositif antipollution (Code de la route L318-3) ; aucun texte libre ni IA dans le questionnaire ; aucune coordonnée exigée pour voir le résultat ; aucune réponse enregistrée tant que le visiteur n'envoie pas de demande. | Sécurité, responsabilité, minimisation. |
| Contenu | L'arbre (questions, choix, règles, pistes, planchers) vit dans un fichier versionné, validé par une porte : 5 questions au plus sur chaque chemin ; « Je ne sais pas » sur chaque question ; tout signe de danger mène au niveau 1 ; planchers par branche respectés ; signes obligatoires de Q2 présents sur les branches où la voiture roule ; le signe « voyant rouge » cite au moins un exemple ; chaque résultat porte niveau, mention et actions ; aucun mot interdit, cherché par mots entiers sans tenir compte de la casse ni des accents (« certain », « certainement », « sûrement », « forcément », « garanti », « avis ») ni le signe « % ». | Un invariant en prose n'est pas un invariant (piège 26). |
| Relecture | Le fichier de l'arbre produit un **livret imprimable** (une page par branche, en français courant, une case « d'accord / à changer » par résultat), relu à voix haute avec le garagiste lors de la séance 2 (lot 3). `relu_par` = le garagiste, `relu_le` = la date de la séance ; le livret signé est archivé dans `docs/collecte/`. Les branches non validées pendant la séance sont élaguées : leurs résultats deviennent « Vos réponses ne suffisent pas pour orienter : l'atelier doit voir la voiture ». Sans relecture datée, l'orientation n'est pas publiée : l'accueil remplace Q1 par « Un souci avec votre voiture ? Appelez-nous » (ou « Être rappelé » quand c'est fermé) et `/orientation` répond 404 ; le reste du site peut sortir. | Un garagiste qui n'aime pas les outils ne relira jamais un fichier versionné ; une relecture impossible bloquerait le site entier ou serait signée par complaisance. |
| Technique | Une page serveur par question (formulaire GET), sans JavaScript ; chaque question porte un lien « Revenir à la question précédente » qui transporte les réponses précédentes dans l'adresse et pré-coche la réponse côté serveur ; l'état voyage dans l'adresse sous forme de codes fermés, toute valeur inconnue est ignorée (piège 40) ; pages de question et de résultat en `noindex`, seule l'entrée `/orientation` est indexée ; les journaux d'accès n'enregistrent pas la chaîne de requête. | Brief §5 ; la restauration des formulaires par le bouton retour du navigateur n'est pas garantie ; aucune combinaison infinie indexée ; minimisation. |
| Guide des voyants | Différé. Couleur plus fixe ou clignotant suffit à trancher l'urgence ; une seule illustration informative est admise : voyant fixe contre voyant clignotant. | YAGNI. |

**Motif global.** A fait fuir (chaque question coûte des abandons). B est non maîtrisable
et diffuse la responsabilité ; 9 % seulement font confiance à une recommandation d'IA
seule (Ifop pour Guest Suite, 2026, France). C existe partout et n'oriente personne
(FixMyCar, iDGarages). D est le seul format qu'aucun site de garage local ni aucune
plateforme française ne propose (études 02 et 06), et il sert directement la maquette.

### D4. Rendez-vous : vraie réservation de créneau ou demande ?

**Question.** Le client doit-il réserver un créneau ferme en ligne ?

**Options.** A. Agenda en ligne avec créneaux réels et confirmation automatique.
B. Demande de rendez-vous : famille d'intervention, une à trois demi-journées souhaitées,
confirmation par téléphone. C. Simple demande de rappel. D. Module d'une plateforme
(Vroomly, idGarages).

**Décision : B, nommée honnêtement.**
- Bouton « Demander un rendez-vous », jamais « Réserver » ni « Prendre RDV ».
- Demi-journées proposées : les 10 prochaines demi-journées d'ouverture, calculées à partir des horaires validés moins les fermetures exceptionnelles (jamais un jour fermé), plus « Le plus tôt possible » et « Une autre date (nous en parlons au téléphone) ». Le client en coche une à trois.
- Toute demande, quel que soit son type, demande « Quand pouvez-vous répondre au téléphone ? » (liste obligatoire : Dès que possible, Le matin, À midi, En fin de journée). Un champ « Précisions », court et facultatif, complète les choix fermés ; il n'est jamais le seul moyen de décrire le besoin (AE-13).
- Confirmation : « Votre demande est enregistrée. Ce n'est pas encore une réservation : nous vous appelons pour fixer l'heure. », suivie du moment du rappel à la demi-journée (AT-3), puis « BF Auto vous rappelle au numéro indiqué, depuis le 06 05 92 28 38 : enregistrez ce numéro pour décrocher. » `[À VALIDER : numéro depuis lequel le garage rappelle]`.
- C est intégrée comme un type de la même demande. Un seul agrégat `Demande` à quatre types : rendez-vous, devis, rappel après orientation, rappel simple. Le formulaire court « Être rappelé » de l'accueil porte un motif en liste (Un souci avec ma voiture, Un devis, Un rendez-vous, Une autre question), le nom, le téléphone et le moment où l'on peut répondre.
- Une énergie ou un besoin que le garage ne traite pas est annoncé au-dessus du formulaire (« Ce que nous ne faisons pas ») et refusé côté serveur : le formulaire est réaffiché, valeurs conservées, avec « Nous ne traitons pas ce type de véhicule », au lieu d'enregistrer une demande impossible.

**Motif.** A exige un agenda de charge tenu à jour : sans écrivain, il affiche des créneaux
faux (pièges 1 et 3) ; une intervention dure d'une heure (vidange) à une journée
(embrayage) ; l'organisation de l'atelier est inconnue. D intercale un tiers, des traceurs
et une commission, et la plateforme affiche parfois un autre numéro que le garage (Po
Mécanique, étude 06) ; la présence du garage sur une plateforme, hors du site, est une
autre question (D10). C seule rate l'attente mesurée (66 % d'intérêt pour le rendez-vous
en ligne, Ipsos pour Dekra, 2026, échantillon allemand) et reproduit l'irritant d'Europe
Auto, dont le bouton « Prendre RDV » ouvre un formulaire de contact. B donne le vrai choix
utile (quand je peux venir) sans promettre ce que personne n'entretient ; le moment où le
client peut décrocher évite au garagiste les rappels manqués, sa plus grosse perte de
temps. A ne sera réévaluée que si le garagiste demande lui-même à tenir un agenda ; le port
`Agenda` n'est pas créé d'ici là (YAGNI).

### D5. Espace garagiste et notification

**Question.** Faut-il un espace de gestion, lequel au minimum, et comment une demande
atteint-elle un garagiste qui travaille sous une voiture ?

**Options.** A. Aucun espace : demandes par courriel seulement, tout le reste dans la
configuration. B. Espace minimal et notification par le canal que le garagiste lit.
C. Gestion de contenu complète (textes, prix, photos, horaires).

**Décision : B.**

**Notification (port `Notificateur`).** Le canal est choisi à la séance 1 et fait partie
des données bloquantes (D8) : SMS (adaptateur SMS, `[À VALIDER : prestataire, coût par
envoi, lieu de traitement]`) ou courriel ; adaptateur console en développement. Le message
se suffit à lui-même, sans connexion : type de demande, niveau de conduite à tenir en tête
s'il s'agit de « Ne roulez pas », famille ou résumé des réponses, véhicule, moment où le
client peut répondre, nom, téléphone du client composable en un geste, lien vers la fiche.
La demande est enregistrée avant toute notification ; une file de renvoi persistée réessaie
à 1 minute, 10 minutes et 1 heure ; une notification en échec depuis plus d'une heure fait
répondre `/sante` en 503, pour que la sonde (D11) alerte Anthony. Relance unique : une
demande de niveau « Ne roulez pas » dont la fiche n'a pas été consultée 30 minutes après
sa réception, pendant les heures d'ouverture, déclenche un second message
`[À VALIDER : seuil de 30 minutes]`.

**Espace garagiste**, quatre capacités et rien d'autre :
1. **Demandes** : liste de toutes les demandes « À rappeler », puis des demandes traitées des 30 derniers jours ; « À rappeler » d'abord, niveau « Ne roulez pas » en tête, puis par date ; fiche avec appel en un geste, résumé complet, heure de réception et heure de première consultation, mention visible si la notification a échoué ; deux statuts, « À rappeler » et « Traitée », changés par un seul bouton facultatif qui range la liste et dont aucune mesure ne dépend ; le nombre d'envois non confirmés de la semaine (D9).
2. **Fermetures exceptionnelles** : un bouton « Imprévu aujourd'hui » (deux gestes : le bouton, puis confirmer), et une période (du, au, motif en liste : congés, jour férié, imprévu) sur un seul écran ; trois gestes au plus depuis l'icône de l'écran d'accueil. Le statut public, le bandeau, les demi-journées, le rappel annoncé et les données structurées (`specialOpeningHoursSpecification`) en tiennent compte immédiatement. La confirmation affiche « Déclarez aussi cette fermeture sur votre fiche Google » avec le lien direct vers les horaires exceptionnels de la fiche `[À VALIDER : lien de gestion de la fiche]`.
3. **Signaler un changement** : horaires habituels, prix, prestation ou autre (liste) et un texte court, envoyés à Anthony sous forme de message structuré ; Anthony met à jour le fichier versionné, qui reste la source unique, sous 48 heures ouvrées `[À VALIDER : engagement de mise à jour d'Anthony]`.
4. **Résumé mensuel** en une ligne : « Septembre : 12 demandes reçues par le site, 640 pages consultées (les appels passés depuis le site ne sont pas comptés) », à partir d'un compteur agrégé côté serveur (D9).

**Connexion, sans mot de passe.** « Recevoir un lien de connexion » envoie, au seul canal
de configuration, un lien à usage unique valable 15 minutes ; la session dure 90 jours
glissants sur son téléphone, et l'écran d'accueil de l'espace explique comment ajouter
`/garagiste` à l'écran d'accueil du téléphone. Cookie `HttpOnly`, `Secure`, `SameSite=Lax`,
`Path=/garagiste` ; toute requête POST de l'espace vérifie l'en-tête `Origin` et un jeton
anti-falsification ; aucune requête GET ne change d'état. Demandes de lien limitées à 5 par
heure et par adresse client, avec un plafond global de 20 par heure qui alerte Anthony sans
verrouiller le compte. Réinitialisation : une commande serveur lancée par Anthony
(`pnpm garagiste:reinitialiser`) révoque toutes les sessions ; elle est documentée dans le
guide d'exploitation. Pages en `noindex`, `Cache-Control: no-store`.

**Purge** des demandes 12 mois après la plus récente de deux dates, création ou dernier
changement de statut, exécutée dans le processus (au démarrage, puis toutes les 24 heures).

**Hors périmètre** : édition directe des textes, prix, horaires et prestations (fichier de
configuration unique versionné, brief §3), statistiques détaillées, agenda, fichier
clients, comptes multiples, mesure du délai de rappel.

**Motif.** A laisse des demandes écrites que personne ne relit quand un courriel se perd :
écriture sans lecture (piège 2) et diagnostic perdu en transit (piège 22) ; A ne permet
pas non plus de déclarer une fermeture, et le statut calculé mentirait pendant les congés
sur un site dont l'exactitude est l'argument principal (annuaires périmés et horaires
contradictoires autour de la rue Demanieux, étude 06). Un courriel non lu jusqu'au soir
avec un indicateur au vert déplaçait la même faute d'un cran : d'où le canal choisi par le
garagiste, le message suffisant à lui seul, la relance et la sonde. C crée une seconde
source de vérité et un outil que le garagiste n'entretiendra pas ; le bouton « Signaler un
changement » garde la source unique sans le rendre dépendant de la disponibilité
d'Anthony pour être entendu. La mesure du délai de rappel (version 1) supposait un clic
« rappelée » après chaque appel : il ne le fera pas, et l'écran aurait affiché un retard
imaginaire (pièges 1 et 3). Un mot de passe unique oublié coupait l'accès aux demandes : le
lien de connexion supprime ce risque. `SameSite=Lax` plutôt que `Strict` : un lien de
notification ouvert depuis un webmail est une navigation intersites qui perdrait la
session ; la falsification est bloquée par `Origin` et le jeton sur tout POST. Les 12 mois
appliquent la minimisation : le site n'est pas le fichier client du garage (plafond CNIL
de 3 ans pour un prospect, étude 05).

### D6. Photos et preuves de confiance en l'absence d'avis

**Question.** Le garage n'a aucun avis et n'a fourni aucune photo. Comment inspirer
confiance sans rien inventer ?

**Options.** A. Images de banque et témoignages d'exemple « en attendant ». B. Texte seul.
C. Preuves vérifiables, illustrations au trait en attendant les photos (version 1).
D. Un socle de confiance réel, bloquant, collecté en séance, et des preuves que le
conducteur lit vraiment.

**Décision : D.**
- **Jamais** : image de banque présentée comme le garage, avis ou témoignage fictif, note ou `aggregateRating` auto-déclarés, années d'expérience, certification, logo de constructeur ou d'équipementier non validés.
- **Socle de confiance, bloquant (D8)** : le prénom du garagiste, avec son accord écrit ; une photo réelle de la façade montrant l'entrée de l'atelier ; le taux horaire TTC ; le prix ou la gratuité du premier contrôle ; deux engagements écrits, « Devis écrit avant travaux » et « Nous vous appelons avant tout travail supplémentaire » ; la réponse à « faut-il prendre rendez-vous ? ». Anthony prend les photos au téléphone pendant la séance 1. Si le garagiste refuse l'un de ces points, le site ne sort pas en l'état : Anthony rouvre cette décision.
- **Autres photos** (atelier, poste de travail, garagiste au travail, intervention sans plaque lisible), publiées seulement avec l'accord des personnes `[À VALIDER : photos et accords]`. Format AVIF ou WebP, `srcset`, dimensions déclarées.
- **Illustrations** : deux au plus, informatives : voyant fixe contre voyant clignotant dans l'orientation ; où lire la marque, le modèle, l'énergie et la date de première immatriculation sur le certificat d'immatriculation, dans le formulaire de devis. Aucune illustration d'ambiance, aucun substitut de photo.
- **Preuves mises en avant** : (1) le prénom et la façade ; (2) les tarifs TTC datés, avec leur véhicule de référence ; (3) « Comment nous travaillons » : les deux engagements du socle, plus « Pièces remplacées restituées sur demande » si c'est validé ; (4) « Vos droits chez nous » (AT-2) ; (5) le statut d'ouverture exact (B-04). L'identité légale et le lien vers le registre public vivent dans les mentions légales : ce n'est pas une preuve qu'un conducteur consulte `[À VALIDER : rattachement BF Auto et GARAGE AUTO CHOISY 94, SIREN 953 343 738]`.
- **Avis** : aucun encart « Donnez le premier avis » en tête de page, qui annoncerait en gros l'absence d'avis à un visiteur qui n'est pas encore venu. L'encart « Nouveau nom : Garage auto choisy 94 devient BF Auto » vit en bas de l'accueil et sur la page Accès, pour les habitués, avec le lien « Laissez un avis Google » (`/avis`) ; « même atelier » n'y figure que s'il s'agit du même exploitant `[À VALIDER : même exploitant]`. Les vrais leviers de collecte sont au comptoir (lot 8) : adresse courte `/avis` redirigée vers le formulaire d'avis de la fiche Google, sans traceur ; affichette imprimable avec code QR ; modèle de SMS à envoyer après intervention ; sans contrepartie ni filtrage.
- **Note** : aucune note affichée en v1, et aucun champ de note dans la configuration. Une note recopiée, sourcée et datée ne sera envisagée qu'avec la fonction (YAGNI).

**Motif.** Un faux avis est une pratique commerciale trompeuse (jusqu'à 2 ans et 300 000 €,
SignalConso) ; Google exclut la note sur soi-même ; une image de banque décrédibilise dès
la visite (sites de Roussillon et de Global Auto 94, études 04 et 06). Masquer tout ce qui
n'est pas validé laissait, au pire, un site sans visage, sans prix ni engagement, que le
conducteur méfiant ne distingue pas d'une coquille vide (relecture du 2026-09-23) : le
socle rend ces preuves obligatoires plutôt que facultatives. Les clients jugent sur la
récence et le détail (récence 48 %, preuves concrètes 43 %, Ifop pour Guest Suite, 2026).
Aucun indépendant local n'affiche de prix sur son propre site, mais Po Mécanique (1,27 km)
les affiche sur Vroomly avec 4,8 sur 5 (26 avis) et AAG, dans la même rue, réserve via
Vroomly (étude 06) : le prix publié rattrape la plateforme, il ne suffit pas à distinguer.
Ce qui distingue est ce qu'une plateforme ne donne pas : un visage, un nom, des
engagements écrits. Le renommage de la fiche est un moment du cycle de vie : le dire, en
bas de page, évite qu'un habitué croie à un autre garage.

### D7. Plan du site et adaptation mobile de la maquette trois colonnes

**Question.** Quelles pages, et comment la maquette à trois colonnes devient-elle
excellente sur un téléphone ?

**Décision : plan.**

| Page | Adresse | Rôle | Condition de publication |
|---|---|---|---|
| Accueil | `/` | Les trois intentions, contact toujours à portée | Toujours |
| Orientation | `/orientation` (étapes et résultats en `noindex`) | Orientation par questions | Arbre relu à la séance 2 ; sinon 404 et appel sur l'accueil (D3) |
| Entretien et réparation | `/entretien-reparation`, `/entretien-reparation/<famille>` | Familles d'intervention, « Ce que nous ne faisons pas » | Toujours (liste des familles bloquante) |
| Tarifs | `/tarifs` | Récapitulatif des prix validés : taux horaire, premier contrôle, forfaits avec véhicule de référence | Toujours (taux horaire et premier contrôle bloquants) |
| Demande | `/demande?type=...`, `/demande/envoyee?j=<jeton>` | Formulaire unique à quatre types, confirmation | Toujours |
| Accès et horaires | `/acces-et-horaires` | Horaires jour par jour, repères (boulevard de Stalingrad à environ 200 m, Vitry-sur-Seine à 600 m, étude 06), stationnement, attente sur place, documents à apporter, carte statique, description de l'enseigne actuelle tant qu'elle ne porte pas « BF Auto » `[À VALIDER : enseigne actuelle de la façade]`, encart « Nouveau nom » | Toujours (horaires bloquants) |
| Vos droits chez nous | `/vos-droits` | Comment nous travaillons, pièces issues de l'économie circulaire, garantie constructeur, médiateur | Toujours (bloc légal, lot 0) |
| Mentions légales, confidentialité | `/mentions-legales`, `/confidentialite` | Obligations ; « Ce site ne dépose aucun cookie de suivi » | Toujours (bloquant, D8) |
| Avis | `/avis` | Redirection vers le formulaire d'avis de la fiche Google | Lien d'avis validé ; sinon 404 |
| Espace garagiste | `/garagiste` | D5 | Hors plan public, `noindex`, exclu par `robots.txt` |
| Erreurs 404 et 500 | | Téléphone et liens vers les trois intentions | Toujours |
| `sitemap.xml`, `robots.txt` | | Socle de référencement (B-27) | Toujours |

Navigation principale : cinq entrées au plus (Orientation, Entretien et réparation,
Rendez-vous, Tarifs, Accès). « Vos droits » est atteint depuis la zone « ? » et le pied de
page de chaque page. La page par famille d'intervention sert le référencement local dès le
premier jour (D1).

**Décision : mise en page.**
- **Ordinateur (1024 px et plus), fidèle à la maquette.** En-tête : logo à gauche (lien vers l'accueil), accroche au centre, téléphone à droite. Colonne gauche (un quart) : « Catalogue : pièces et réparations » (familles et leurs mots courants), puis la zone « Vos questions ». Colonne centrale (la moitié) : information (ce que fait le garage, le prénom et la façade, comment nous travaillons), puis « Un souci avec votre voiture ? » et les 7 liens de Q1. Colonne droite (un quart) : info garage (statut, téléphone, adresse et itinéraire, horaires avec le jour courant en tête, formulaire court « Être rappelé »). Sous les colonnes : l'encart « Nouveau nom ». Aucune carte sur l'accueil.
- **Tablette (768 à 1023 px).** Deux colonnes : centre et droite ; la colonne gauche passe sous le centre.
- **Téléphone (moins de 768 px), une colonne dans l'ordre de l'urgence** : en-tête de 64 px au plus (logo, Appeler, Menu) ; statut du jour et adresse courte ; accroche ; une ligne sur ce que fait le garage (3 à 4 familles validées, par exemple « Freinage, vidange, batterie, pneus ») ; « Un souci avec votre voiture ? » et les liens de Q1 ; trois raccourcis (Demander un rendez-vous, Pièces et réparations, Tarifs) ; information ; six premières familles et « Toutes les familles » ; zone « ? » ; info garage (horaires, formulaire de rappel) ; encart « Nouveau nom » ; pied de page. Menu en `<details>` natif, sans JavaScript.
- **Barre fixe basse, sur toutes les pages publiques, calculée depuis le statut.** Garage ouvert : « Appeler » et « Itinéraire ». Garage fermé : « Être rappelé (ouverture jeudi matin) » en action principale et « Appeler » en secondaire. Elle est masquée pendant la saisie, sans script : `body:has(:is(input:not([type=radio], [type=checkbox], [type=submit]), textarea):focus) .barre-fixe { display: none }`, avec un `scroll-padding-bottom` égal à sa hauteur. Le numéro reste visible dans l'en-tête (B-01) `[À VALIDER : le garagiste accepte-t-il des appels hors horaires ?]`.
- **Accroche proposée** : « Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez. » `[À VALIDER : accroche par Anthony]`. Elle n'est affichée que si les deux engagements du socle sont validés (toujours vrai en production, puisqu'ils sont bloquants, mais gardé par un test) ; repli factuel « BF Auto, mécanique à Choisy-le-Roi » (« toutes marques » seulement si c'est validé). Elle évite « à portée de main », déjà prise par La Maison Mécanique et le site de Roussillon.

**Motif.** L'ordre mobile suit l'urgence : P1 doit trouver statut, téléphone et orientation
dans le premier écran, et savoir en cinq secondes si le garage traite son problème (B-06) ;
P3 trouve le rendez-vous au deuxième ; le catalogue (P2) peut attendre. Un en-tête géant
repousse la promesse sous le premier écran (Ottohaus, étude 04). Pousser « Appeler » à 22 h
sur un mobile probablement personnel dérange le garagiste et fait tomber le conducteur sur
une messagerie, dans une zone pleine de fiches de garages fermés (étude 06) : fermé, le
geste utile est d'être rappelé. Retirer la barre des pages de formulaire la retirait de
l'accueil, qui porte le formulaire de rappel ; la masquer pendant la saisie tient WCAG 2.2
(critère 2.4.11) sans ce coût. Sur ordinateur, la maquette est respectée dans ses positions
et sa hiérarchie ; elle n'est pas recopiée au forceps sur téléphone.

### D8. Données non validées : ce qui s'affiche, ce qui bloque, comment on les obtient

**Question.** Le brief impose un fichier unique où les données non confirmées restent à
valider. Que fait le site d'une donnée à valider, et comment obtenir les données d'un
garagiste qui n'aime pas les outils ?

**Options.** A. L'afficher avec la mention « à valider ». B. Afficher une valeur
provisoire. C. Ne jamais afficher publiquement une donnée non validée ; les données
légales et le socle de confiance bloquent la mise en ligne ; les autres se replient sur une
formulation neutre ou masquent leur bloc ; la collecte se fait en séance.

**Décision : C.** Chaque valeur du fichier porte un statut (`valide` ou `a_valider`) et,
pour les prix, une date d'effet. Règles du domaine :
1. En production, une valeur `a_valider` n'est jamais rendue.
2. Le démarrage en production échoue, avec un code de retour non nul et la liste des champs manquants, si une donnée bloquante est à valider.
3. **La production est le mode par défaut.** Le mode relecture, où les valeurs à valider s'affichent surlignées pour Anthony, ne s'active que par un drapeau explicite (`BF_MODE=relecture`), n'écoute que sur `127.0.0.1` et pose `X-Robots-Tag: noindex` sur toutes les réponses. Toute autre valeur de `BF_MODE` arrête le démarrage.
4. Pour le socle de confiance, un refus du garagiste n'est pas un repli : il arrête la mise en ligne jusqu'à décision d'Anthony (D6).

| Donnée | Effet si non validée |
|---|---|
| Horaires complets jour par jour, pause de midi et samedi compris | **Bloquant** (statut, créneaux, rappel et données structurées en dépendent) |
| Dénomination, forme, capital, siège, immatriculation (RCS ou RNE), TVA, directeur de la publication, **courriel public de contact** | **Bloquant** (LCEN art. 1-1 et 19) |
| Hébergeur (nom, adresse, téléphone), région d'hébergement, prestataires d'envoi (courriel, SMS) et lieu de traitement | **Bloquant** (LCEN ; RGPD art. 13, destinataires et transferts) |
| Médiateur de la consommation | **Bloquant** (R616-1) |
| Canal de notification consulté dans la journée (SMS ou courriel) et ses coordonnées | **Bloquant** (sinon écriture sans lecture) |
| Familles d'intervention traitées, et ce que le garage ne fait pas | **Bloquant** (B-06) |
| Socle de confiance : prénom et accord, photo de façade, taux horaire TTC, prix ou gratuité du premier contrôle, deux engagements, accueil sans rendez-vous (oui ou non) | **Bloquant** (D6, B-28, B-29) |
| Nom de domaine ; recherche d'antériorité de marque consignée | **Bloquant** (D13) |
| Relecture datée de l'arbre de l'orientation | Orientation non publiée ; Q1 remplacée par l'appel sur l'accueil (D3) |
| Forfaits | « Prix sur devis » |
| Délai de rappel | « Nous vous rappelons au numéro indiqué », sans demi-journée annoncée |
| Numéro d'appel sortant | Phrase réduite à « BF Auto vous rappelle au numéro indiqué. » |
| Vente au comptoir, politique des pièces apportées | Option masquée |
| « Pièces remplacées restituées sur demande » | Engagement absent |
| Lien d'avis Google | Encart sans lien ; `/avis` en 404 |
| « Même atelier » | Mention absente |
| Autres photos | Absentes |
| Stationnement, moyens de paiement, attente sur place, documents à apporter, dépannage, véhicules remorqués, appels hors horaires | Mention ou question absente ; barre fixe du garage fermé sans « Appeler » en secondaire tant que les appels hors horaires ne sont pas acceptés |
| Canal SMS pour les clients | Lien « Envoyer un SMS » absent |
| Accroche | Titre factuel « BF Auto, mécanique à Choisy-le-Roi » |

**Kit de collecte.** Préparé au lot 0 :
- `docs/collecte/questionnaire-garage.md` : chaque donnée, son format attendu en choix fermé, bloquante ou non, son responsable et sa date de relance.
- Une fiche papier d'une page, générée depuis ce questionnaire, remplie en une **séance 1** de 30 minutes entre Anthony et le garagiste (lot 0) : horaires jour par jour avec la pause de midi et le samedi, familles traitées et non traitées, taux horaire, premier contrôle, forfaits qu'il accepte de tenir, engagements, prénom et accord, canal de notification, accueil sans rendez-vous, appels hors horaires, présence sur les plateformes (D10). Anthony y prend les photos de la façade et, avec accord, de l'atelier. La démarche d'adhésion au médiateur et son coût sont annoncés dès cette séance `[À VALIDER : médiateur retenu et coût]`, ainsi que le coût mensuel total (D11).
- Le livret de l'arbre, relu à voix haute en **séance 2** de 30 minutes à la fin du lot 3 (D3).

**Motif.** Afficher « à valider » à un client ruine la confiance ; une valeur provisoire
est un fait inventé (brief §3). L'invariant « rien de non validé n'est affiché » ne vaut
que s'il est une porte exécutée et un test vu rouge (piège 26), et un mode de relecture
actif par défaut le ferait tomber sur un simple oubli de variable. Les manquements légaux
sont sanctionnés (LCEN 1-2 ; médiateur jusqu'à 15 000 € pour une personne morale,
L641-1) : leur absence doit empêcher la mise en ligne, pas s'afficher en creux. Une liste
de données envoyée à un garagiste sans temps pour l'administratif ne reviendrait pas : la
séance transforme la collecte en une conversation d'une demi-heure.

### D9. Zéro traceur, zéro ressource tierce, zéro bandeau, aucun rejet silencieux

**Décision.** Aucune requête du navigateur vers un autre domaine que celui du site :
police auto-hébergée (une police variable WOFF2 en sous-ensemble latin, 35 Ko au plus, ou
les polices système), aucune carte intégrée (image statique sur la page Accès et lien
externe), aucun module social, aucune mesure d'audience tierce. Les liens sortants
(itinéraire, `sms:`) ne chargent rien.

Anti-abus sans captcha tiers et sans rejet silencieux :
- champ piège au nom sans rapport avec un nom, un téléphone ou un courriel, `autocomplete="off"`, `tabindex="-1"`, `aria-hidden="true"`, hors du flux visuel ;
- délai minimal de saisie de 3 secondes ;
- un envoi suspect (champ piège rempli ou délai trop court) n'est jamais jeté : il reçoit l'écran « Confirmez l'envoi », formulaire rempli et bouton ; seul un second envoi conforme est enregistré ; les envois non confirmés sont comptés dans l'espace garagiste (« 3 envois non confirmés cette semaine ») ;
- limitation de débit par adresse client : Fastify avec `trustProxy` réglé sur le nombre exact de mandataires de Render `[À VALIDER : nombre de sauts]` ; la clé est l'adresse extraite par Fastify, jamais l'en-tête `X-Forwarded-For` lu brut ;
- vérification de l'en-tête `Origin` et jeton de formulaire à usage unique (un double envoi ne crée pas deux demandes).

Les pages publiques ne déposent aucun cookie ; seul l'espace garagiste pose un cookie de
session strictement nécessaire. Un compteur agrégé côté serveur (pages servies par jour,
hors robots déclarés), sans cookie ni adresse conservée, nourrit le résumé mensuel (D5).
Journaux d'accès sans chaîne de requête. Politique de sécurité du contenu stricte
(`default-src 'self'`). JavaScript : 0 Ko par défaut ; une seule exception nommée, l'envoi
unique (bouton désactivé après le premier envoi, 2 Ko au plus), dont le parcours se passe
très bien.

**Motif.** CNIL : refus aussi simple qu'accepter, consentement avant tout contenu tiers,
reCAPTCHA soumis à consentement (étude 05). Quatre captures sur sept masquées par une
modale de consentement (étude 03), bandeaux en anglais chez Europe Auto et Le Tolier
(étude 06), réseaux au-dessus de 1,3 Mo et 680 Ko de JavaScript (étude 01). Le remplissage
automatique du navigateur peut remplir un champ piège mal nommé, et un formulaire de rappel
à deux champs s'envoie en 2 secondes : un rejet silencieux affichant « demande
enregistrée » aurait laissé un vrai client attendre un appel qui ne vient jamais (B-24).
Derrière le mandataire de Render, une limitation par adresse sans `trustProxy` verrait la
même adresse pour tous les visiteurs. **Classement tranché** : « aucun bandeau » n'est pas
une attractive ; c'est une basique de conformité (B-13) dont le gain se mesure en
performance (P-02).

### D10. Nom, cohérence NAP, fiche Google et plateformes

**Décision.** Nom affiché « BF Auto », toujours associé à « Choisy-le-Roi » dans le titre
de page, le titre principal unique de l'accueil, le pied de page et les données
structurées. Adresse « 7 rue Demanieux, 94600 Choisy-le-Roi » et téléphone
« 06 05 92 28 38 » écrits à l'identique partout, depuis le fichier unique, identiques à la
fiche Google. Titre de l'accueil : « BF Auto, garage automobile à Choisy-le-Roi (94600) » ;
les familles validées s'ajoutent à la description. Données structurées `AutoRepair`
générées depuis la configuration et la base (nom, adresse, coordonnées, téléphone,
horaires jour par jour, fermetures exceptionnelles en `specialOpeningHoursSpecification`),
sans note. Lien d'itinéraire principal vers la fiche Google renommée (cohérence NAP), lien
secondaire vers Apple Plans. Mise en ligne après le renommage effectif de la fiche Google,
ou le même jour. Aucun contenu, aucune adresse, aucune promesse du BF Auto de Roussillon.

**Fiche Google, lot 8 sans code** : fiche alignée sur le site (nom, catégories, horaires et
horaires exceptionnels, services et prix repris de la même source, photos de façade et
d'atelier, lien du site), site déclaré dans la Search Console, outils de collecte d'avis au
comptoir (D6), relevé du pack local selon le protocole de l'étude 06, trente jours après
le renommage.

**Plateformes (Vroomly, idGarages)** : hors du site, décision du garagiste posée à la
séance 1 (commission contre visibilité). Le Kano ne l'impose ni ne l'interdit. Si le
garage s'y inscrit, la fiche plateforme porte le même nom, le même numéro et les mêmes
horaires, et le site reste la source des prix. Aucun module de plateforme sur le site (D4).

**Motif.** Au moins cinq entreprises « BF Auto » coexistent en France (étude 04) ; la
requête sur l'ancien nom « Garage auto choisy 94 » renvoie aux concurrents ; trois
indépendants locaux ont des horaires contradictoires entre site et annuaires ; les
recherches locales font d'abord sortir les plateformes et les annuaires (idGarages,
PagesJaunes, Vroomly), et le classement local repose sur la fiche Google (pertinence,
distance, popularité) (étude 06). Le premier écran d'un conducteur est souvent la fiche,
pas le site : ne rien livrer pour elle laisserait le site sans trafic.

### D11. Hébergement, persistance et exploitation

**Décision.**
- Render, région Francfort, instance permanente sans mise en veille. Aucune mise en ligne sans l'accord d'Anthony (brief §5).
- **Persistance** : disque persistant Render monté (par exemple `/var/data`) ; chemin de la base lu dans la configuration ; en production, le démarrage échoue si ce chemin n'est pas sur le disque déclaré. SQLite en mode WAL. Purge et relance exécutées dans le processus (un disque Render ne s'attache qu'à un seul service : une tâche planifiée séparée n'y aurait pas accès). Sauvegarde quotidienne par la commande `.backup`, 7 jours conservés sur le disque, et copie hebdomadaire hors de Render `[À VALIDER : emplacement de la copie]`. Un service avec disque s'interrompt brièvement à chaque déploiement `[À VALIDER : durée constatée]`.
- **Sonde externe** toutes les 5 minutes sur `/sante` (base accessible, aucune notification bloquée depuis plus d'une heure) ; alerte après 3 échecs consécutifs (15 minutes), une seule alerte par incident, puis un message de rétablissement.
- **Cache** : `Cache-Control: no-cache` sur toutes les pages HTML publiques (le statut change avec l'heure) ; `public, max-age=31536000, immutable` sur les ressources à empreinte dans le nom ; `no-store` sur la confirmation et l'espace garagiste.
- **Coût mensuel total pour le garage** (instance, disque, domaine, SMS, envoi de courriels) : `[À VALIDER : montant et offre Render retenue]`, soumis au garagiste à la séance 1 et arrêté avant le lot 7.

**Motif.** Les offres gratuites mettent l'instance en veille et imposent un démarrage à
froid de plusieurs dizaines de secondes au premier visiteur `[À VALIDER : comportement de
l'offre retenue]` : incompatible avec l'instantanéité et avec P1 en panne. Sur Render, le
système de fichiers d'un service web est éphémère : sans disque, chaque déploiement
effacerait les demandes non traitées et les fermetures déclarées. Un site hors service
fait plus de tort que pas de site (Garage des Chalets en erreur 522, étude 06). Francfort
garde les données dans l'Union ; Render reste une société américaine, ce que la politique
de confidentialité dit (B-12). Le coût est la première question du garagiste : il ne se
découvre pas après coup.

### D12. Ce que le Kano impose à l'architecture hexagonale

**Décision.** Le domaine, sans dépendance à Fastify, à la base ni au réseau, se répartit en
contextes bornés qui ne s'importent jamais entre eux :
- `garage` : identité, horaires, fermetures, statut d'ouverture, demi-journées demandables, moment de rappel ;
- `orientation` : arbre, parcours, niveau, pistes, planchers, livret de relecture ;
- `catalogue` : familles d'intervention, mots courants, prix ;
- `demandes` : quatre types, objet valeur `Vehicule`, validation, résumé, notification, file de renvoi, relance, purge.

`src/contrats/` porte les seuls échanges : `ValeurPubliee<T>` (valeur, statut, date
d'effet) et la politique de publication, pure ; `ResumeOrientation` (codes des réponses,
niveau) ; `CalendrierOuverture` (demi-journées ouvertes, prochaine ouverture, statut) ;
`FamilleIntervention` (identifiant, libellé). Règles dependency-cruiser : un contexte
n'importe que `src/contrats/` hors de lui-même ; `domaine/` n'importe aucun paquet ; chaque
règle est vue rouge par injection d'un import interdit.

Ports créés : `Horloge` (renvoie un instant UTC ; le domaine le convertit à l'heure de
Paris par `Intl`, sans paquet, fuseau lu dans la configuration ; un seul formateur d'heures,
testé : « 19 h », « 8 h 30 »), `SourceIdentite`, `SourceCatalogue`, `SourceArbre` (fichiers
versionnés), `DepotDemandes`, `DepotFermetures` (SQLite), `Notificateur` (SMS, courriel,
console ; branché sur les connecteurs partagés `ExpediteurCourriel`, `BoiteDeReception` et
`EnvoiSms` de `src/infrastructure`, voir `kano-connecteurs.md`), `GenerateurJeton` (aléa de 128 bits, remplaçable en test). Ports **refusés** :
`Agenda` (D4), `Paiement` et `Stock` (D1), `Avis` (D6), `MesureAudience` tierce (D9),
`IdentificationVehicule` et `Recherche` (D1).

**Motif.** Le statut, les créneaux et le rappel dépendent de l'heure : sans port
`Horloge`, ils ne se testent pas à 21 h un mercredi ; sans conversion explicite, un serveur
en UTC afficherait « Ouvert » une ou deux heures de trop. L'orientation transmet un résumé
à la demande, et la demande dépend des horaires : ces flux passent par des contrats nommés,
sinon ils deviennent des imports croisés. Les ports refusés sont les « À éviter » : ne pas
les créer empêche la dérive (YAGNI).

### D13. Nom, marque et domaine

**Question.** Peut-on utiliser « BF Auto » sans risque sur l'enseigne, le logo, la fiche et
le domaine, et sous quelle adresse le site vit-il ?

**Décision.** Avant la validation du logo et toute impression :
1. Recherche d'antériorité sur « BF Auto » dans les bases INPI et TMview, classes 12, 35 et 37, résultat consigné dans `docs/collecte/`. En cas de marque antérieure en classe 12 ou 37, Anthony tranche avant toute impression.
2. Inscription du nom commercial « BF Auto » au registre de l'entreprise exploitante `[À VALIDER : entité exploitante et démarche au RNE]`.
3. Nom de domaine portant Choisy pour se distinguer des homonymes (par exemple sur le modèle « bfauto-choisy.fr ») `[À VALIDER : disponibilité et choix]`, variantes redirigées en 301 vers l'origine canonique ; même adresse sur la fiche Google, l'affichette et les impressions.
4. Courriel d'envoi sur ce domaine, avec SPF, DKIM et DMARC.

Le domaine et la recherche d'antériorité consignée sont bloquants (D8).

**Motif.** Au moins cinq « BF Auto » coexistent en France (étude 04). Une marque antérieure
en classe 37 ou 12 exposerait le logo, l'enseigne et la fiche renommée à une opposition ou
à une action en contrefaçon : mieux vaut le savoir avant d'imprimer. Le domaine conditionne
l'URL canonique, les données structurées, l'affichette et la délivrabilité des courriels.

## Basiques

Leur absence fait fuir ou expose le garage ; leur présence ne se remarque pas.

| Id | Attribut | Justification | Source |
|---|---|---|---|
| B-01 | Téléphone cliquable, libellé avec le numéro, visible sans défilement sur chaque page (en-tête) | 80 % du temps internet sur mobile (Médiamétrie, 2025, France) ; premier canal en cas de panne | Études 01, 05 |
| B-02 | Adresse et lien d'itinéraire externe (fiche Google renommée, puis Apple Plans) | Première question d'une recherche locale | Études 01, 06 |
| B-03 | Horaires complets jour par jour, jour courant en tête et mis en évidence, source unique | Une erreur d'horaire coûte un déplacement ; trois indépendants locaux se contredisent | Études 01, 06 |
| B-04 | Statut « Ouvert, ferme à » ou « Fermé, ouvre » calculé au serveur à l'heure de Paris, fermetures exceptionnelles comprises, page jamais servie périmée depuis un cache | Norme des fiches de réseau (5 sur 7) et des fiches Speedy Thiais et Norauto Belle Épine | Études 01, 06 |
| B-05 | Nom, adresse, téléphone et horaires identiques au caractère près sur le site et sur la fiche Google renommée | Référencement local et confiance | Brief §3, étude 06 |
| B-06 | Familles d'intervention traitées, dans les mots du client, et ce que le garage ne fait pas | Savoir en cinq secondes si le garage traite le problème ; éviter une demande impossible | Études 01, 04 |
| B-07 | Demande (rendez-vous, devis, rappel) sans compte ni paiement, coordonnées en dernier | Compte, paiement et coordonnées préalables font fuir | Étude 01 (Point S, Norauto, Speedy) |
| B-08 | Récapitulatif après envoi et suite annoncée : qui rappelle, depuis quel numéro, quelle demi-journée si c'est validé | Une demande sans suite annoncée est vécue comme perdue ; un numéro inconnu n'est pas décroché | Étude 03 (Pièces Auto) |
| B-09 | Mentions légales complètes, courriel public de contact compris, en lien depuis chaque page | LCEN art. 1-1 et 19 | Étude 05 |
| B-10 | Médiateur de la consommation visible et lisible | R616-1, sanction L641-1 | Étude 05 |
| B-11 | Bloc « pièces issues de l'économie circulaire » (expression exacte, catégories, exceptions), en ligne dès le lot 0 | D224-25-2 : « Ces mêmes informations figurent sur son site internet » | Études 03, 05 |
| B-12 | Information RGPD de premier niveau sous chaque formulaire, champs obligatoires signalés, aucune case pré-cochée, mention sur l'usage du téléphone ; politique de confidentialité qui nomme hébergeur, prestataires d'envoi, lieu de traitement et encadrement des transferts | RGPD art. 13.1 e et f ; L223-1 et L223-2 depuis le 11/08/2026 | Étude 05 |
| B-13 | Aucun traceur, aucune ressource tierce, aucun bandeau ; aucun cookie sur les pages publiques | CNIL ; D9 | Études 01 à 06 |
| B-14 | Interface entièrement en français, sans emoji ni pictogramme décoratif | Modules en anglais chez deux concurrents locaux ; charte | Étude 06, brief §4 |
| B-15 | Tous les parcours publics fonctionnent sans JavaScript | Brief §5 ; réseau mobile faible | Brief |
| B-16 | WCAG 2.2 AA : clavier complet, focus visible et jamais masqué, contrastes, cibles, textes alternatifs | Public âgé attaché à son garage ; étoiles de Midas lues comme du bruit | Études 01, 05, brief |
| B-17 | Données structurées `AutoRepair` exactes, générées depuis la configuration et les fermetures en base, sans note auto-déclarée | Sous-type précis recommandé ; `aggregateRating` sur soi exclu | Étude 04 |
| B-18 | Orientation sûre : écran d'arrêt dès un signe de danger, « Je ne sais pas » sur chaque question, planchers par branche, mention d'orientation au résultat, arbre relu par le garagiste | Faute de conseil sinon ; fiabilité limitée de ces outils | Étude 02 |
| B-19 | « BF Auto » toujours associé à Choisy-le-Roi (titre de chaque page, titre principal unique, pied de page) | Au moins cinq « BF Auto » en France | Études 04, 06 |
| B-20 | Aucune donnée non validée affichée comme un fait ; production par défaut ; données légales et socle de confiance bloquants | Brief §3 ; D8 | Brief |
| B-21 | Aucune image de banque présentée comme le garage | Décrédibilise dès la visite | Études 04, 05, 06 |
| B-22 | Tout prix affiché TTC, au format unique, avec ce qu'il comprend, son véhicule de référence et sa date d'effet | LCEN 19 (« clair et non ambigu ») ; incohérences d'AD et de Motrio ; vidange de 72 € à 230 € selon le véhicule | Études 01, 04, 05, 06 |
| B-23 | Protection anti-abus des formulaires sans captcha tiers et sans rejet silencieux | reCAPTCHA soumis à consentement ; un vrai client écarté en silence attend un appel qui ne vient pas | Étude 05, D9 |
| B-24 | Chaque demande est lue : enregistrée avant notification, notifiée par le canal lu dans la journée, renvoyée en cas d'échec, visible dans l'espace garagiste, conservée après un redémarrage, purgée à 12 mois | Écriture sans lecture (piège 2) ; minimisation | D5, D11 |
| B-25 | Site disponible et surveillé ; pages 404 et 500 utiles, avec le téléphone | Site en panne du Garage des Chalets | Étude 06 |
| B-26 | Logo vectoriel lisible dès 32 px, en une couleur et en négatif, à 20 m sur une enseigne, brodé (aucun trait de moins de 1 mm à 5 cm de large) et photocopié sur un devis ; livré en SVG, PDF vectoriel et PNG ; identique à la fiche Google et, une fois posée, à l'enseigne ; lien vers l'accueil | Le garagiste l'utilisera surtout en physique (enseigne, bâche, tampon, devis, vêtement) ; un logo flou ou divergent signale l'amateurisme | Brief §1, étude 04 (Ottohaus) |
| B-27 | Socle de référencement : `sitemap.xml` généré depuis le plan public (pages `noindex` exclues), `robots.txt` qui l'annonce et exclut `/garagiste`, `link rel="canonical"` absolu, meta description unique de 155 caractères au plus, redirection 301 vers l'origine canonique, `og:title`, `og:description`, `og:image` (PNG 1200 × 630) | Les liens de garage circulent par messagerie, où l'aperçu en dépend ; une page sans canonique ni plan se découvre mal | Études 04, 06 |
| B-28 | Socle de confiance réel : prénom du garagiste, photo de la façade, taux horaire TTC, prix ou gratuité du premier contrôle, deux engagements écrits | Sans avis ni visage, le site ne se distingue pas d'une coquille vide | D6 |
| B-29 | Dire si l'on peut passer sans rendez-vous ; si oui, l'afficher sur l'accueil quand c'est ouvert et sur les résultats d'orientation de niveau 2 et 3 | « Je peux passer maintenant pour qu'il écoute ? » est la première question au bruit bizarre ; Europe Auto, à 500 m, le propose (« Chrono Service ») | Étude 06 |
| B-30 | Données des demandes protégées : confirmation par jeton aléatoire, aucune donnée personnelle dans une adresse, espace garagiste protégé contre la falsification de requête, journaux sans chaîne de requête | RGPD art. 32 ; piège 40 | D5, D9 |

## Performance

La satisfaction monte avec le niveau atteint. Chaque cible est mesurable et vérifiée par
une porte (US ou tableau « Portes sans user story »).

| Id | Attribut | Cible chiffrée mesurable | Justification |
|---|---|---|---|
| P-01 | Temps d'affichage mobile | Porte sur les mesures, chaque gabarit public : premier affichage (FCP) ≤ 1,0 s ; plus grand élément affiché (LCP) ≤ 1,5 s ; temps de blocage (TBT) ≤ 50 ms ; décalage de mise en page (CLS) ≤ 0,02. Protocole : Lighthouse CI en version figée `[À VALIDER : version retenue]`, préréglage mobile (4G lente simulée, processeur ralenti 4 fois), médiane de 5 exécutions ; contre le build de production servi localement en porte de lot, puis contre l'URL de production avant la mise en ligne | Réseaux mesurés de 1,4 à 11,7 Mo (étude 01) ; P1 en zone mal couverte ; une note agrégée oscille avec la charge de la machine (étude 01 y a renoncé) |
| P-02 | Poids de page | Accueil ≤ 100 Ko transférés compressés hors photo réelle, ≤ 180 Ko avec la photo de façade ; HTML ≤ 20 Ko, CSS ≤ 15 Ko, JavaScript 0 Ko par défaut (seule exception nommée : envoi unique ≤ 2 Ko), une police variable ≤ 35 Ko ou polices système, logo en SVG en ligne ≤ 4 Ko ; aucune carte sur l'accueil ; 10 requêtes au plus ; 0 domaine tiers | Un ordre de grandeur sous les réseaux (étude 01) ; les sous-budgets de la version 1 dépassaient déjà le total avant toute image |
| P-03 | Notes Lighthouse | Mobile, chaque gabarit public : Accessibilité 100, Bonnes pratiques 100, Référencement 100 (porte) ; note Performance relevée et archivée, non bloquante, les mesures de P-01 faisant porte | Mesure reproductible, porte de chaque lot |
| P-04 | Accessibilité mesurée | 0 violation axe-core (règles WCAG 2.0, 2.1 et 2.2, A et AA) sur toutes les pages, espace garagiste compris ; contraste du texte courant ≥ 7:1, de tout texte ≥ 4,5:1, des composants et du focus ≥ 3:1 ; cibles ≥ 44 × 44 px ; aucun défilement horizontal à 320 px ; texte agrandi à 200 % sans perte | Brief (AA, AAA sur le texte courant) |
| P-05 | Réponse serveur et disponibilité | Traitement serveur p95 ≤ 50 ms (journal applicatif) ; délai avant le premier octet (TTFB) p95 ≤ 300 ms sur 7 jours, mesuré par une sonde située en Europe de l'Ouest ; disponibilité mensuelle ≥ 99,5 % | Instantanéité perçue ; D11 |
| P-06 | Brièveté de l'orientation | ≤ 5 questions sur chaque chemin ; ≤ 7 choix par question ; 100 % des questions avec « Je ne sais pas » ; vérifié par la porte de l'arbre | Chaque question en moins améliore l'achèvement (étude 02) |
| P-07 | Brièveté de la demande | Un seul écran ; ≤ 5 champs obligatoires à remplir par type, moment de rappel compris, champs pré-remplis exclus ; seule exception, le devis sans plaque, qui demande marque, modèle, année et énergie à la place de la plaque, parce qu'un devis sans motorisation coûte un rappel au garagiste ; parcours de rendez-vous complet en ≤ 10 gestes au test navigateur | AD en 3 étapes, Bosch en 6 : moins, c'est mieux (étude 01) |
| P-08 | Transparence tarifaire | Taux horaire TTC et premier contrôle (bloquants), puis les forfaits que le garagiste accepte de tenir, aucun minimum imposé ; chaque forfait porte son véhicule de référence (« exemple : citadine essence ») ou une grille par catégorie (citadine, berline, SUV et utilitaire) et la phrase « Votre prix exact au devis, avant travaux » ; 0 prix sans date ; toute date d'effet de plus de 6 mois signalée dans l'espace garagiste | 94 % ne veulent pas être poussés à la consommation (Ifop pour IDGarages, 2015) ; un « à partir de » sans véhicule de référence serait opposé au comptoir (AE-05) ; Vroomly publie déjà des moyennes locales (étude 06) |
| P-09 | Retirée | Mesure du délai de rappel retirée du v1 (relecture du 2026-09-23) : elle dépendait d'un statut que le garagiste ne saisira pas | Pièges 1 et 3 |
| P-10 | Catalogue utile | 10 à 14 familles ; 100 % avec rôle, signes d'usure, mots courants, lien vers l'orientation et deux actions (devis, rendez-vous) ; 0 page de famille sans issue | Étude 03 |
| P-11 | Clarté des textes | Sur l'accueil, l'orientation, les familles et la demande : phrases de 15 mots au plus en moyenne ; chaque terme d'un lexique versionné des termes techniques défini à sa première occurrence dans la page (`<dfn>` ou phrase explicative), vérifié par script | 93 % attendent des explications claires (Ifop pour IDGarages, 2015) |
| P-12 | Images | AVIF ou WebP, `srcset`, ≤ 80 Ko pour toute image du premier écran mobile, dimensions déclarées | Poids et stabilité de la mise en page |
| P-13 | Mouvement | Transitions ≤ 200 ms ; aucune sous `prefers-reduced-motion` ; aucune animation en boucle | Brief §4 ; piège 15 |
| P-14 | Notification du garagiste | Message remis au prestataire d'envoi en ≤ 60 s après la demande (p95) ; délai entre réception et première consultation de la fiche mesuré côté serveur et relevé pour Anthony, lu comme un plancher (un appel passé directement depuis le message n'est pas compté) ; relance unique à 30 minutes pour le niveau « Ne roulez pas » non consulté en heures d'ouverture | Le rappel rapide est la valeur perçue par P1 ; la remise au serveur d'envoi ne prouve pas la lecture |
| P-15 | Amplitude horaire lisible | L'amplitude validée (fermeture la plus tardive, jours d'ouverture) est visible sur l'accueil sans défilement | La fermeture constatée à 19 h dépasse celle de la plupart des indépendants proches (18 h à 18 h 30) ; « ouvert samedi » est une requête explicite (étude 06) |
| P-16 | Lien « Envoyer un SMS » | Publié si le garagiste lit les SMS de ses clients `[À VALIDER : canaux réellement utilisés]` : lien `sms:` avec le texte prérempli « Bonjour, j'ai une [marque], mon souci : », syntaxe testée sur iOS et Android ; WhatsApp seulement s'il l'utilise déjà avec ses clients | Le client peut envoyer la photo du voyant, que le formulaire refuse ; le garagiste lit ses SMS entre deux interventions ; lien sortant sans ressource tierce (D9) |
| P-17 | Carte statique | Sur `/acces-et-horaires` seulement : générée une fois à la construction depuis OpenStreetMap, « © contributeurs OpenStreetMap », texte alternatif descriptif, WebP ≤ 60 Ko | Sur téléphone, le lien d'itinéraire ouvre déjà l'application de navigation ; la carte aide à situer, sans être une basique |

## Attractives

Inattendues, elles enthousiasment ; leur absence ne coûte rien. Chacune s'appuie sur ce
que le système fait déjà.

### AT-1. L'orientation qui passe le relais au garagiste (attractive phare)

- **Gisement** : couture entre systèmes (questionnaire, demande, garagiste), doublée d'un irritant avoué (le champ libre de Midas, le « tout réexpliquer » au téléphone).
- **Ce que c'est** : à l'issue de l'orientation, « Être rappelé » ouvre une demande pré-remplie avec les réponses et le niveau ; le client ne saisit que son nom, son téléphone et le moment où il peut répondre (la marque en option) ; le garagiste reçoit le cas en toutes lettres par le canal qu'il lit dans la journée, sans se connecter, l'urgence en tête ; une relance part si une demande « Ne roulez pas » n'est pas consultée. Une fiche imprimable et partageable reprend le tout.
- **Pourquoi ça surprend** : aucune plateforme française ni aucun site local observé ne part du symptôme ; Wrenchly vend cette boucle aux garages, BF Auto l'offre en direct, sans intermédiaire ni commission (études 02 et 06).
- **Crédibilité** : réutilise l'arbre (D3), l'agrégat `Demande` (D4) et le `Notificateur` (D5) ; aucune collecte nouvelle.
- **Preuve observable** : US-22, US-50.

### AT-2. « Vos droits chez nous » : l'obligation qui répond aux peurs

- **Gisement** : obligation transformée en service.
- **Ce que c'est** : les obligations (prix affichés, pièces issues de l'économie circulaire, médiateur, exemption automobile) réécrites comme réponses aux questions d'un nouveau client, en une phrase de client, la source en lien « Le texte », sur une page dédiée atteinte depuis la zone « ? » et le pied de chaque page.
- **Pourquoi ça surprend** : le client s'attend à des mentions en petits caractères ; il trouve la réponse à sa peur (« vais-je perdre ma garantie ? »), nuancée et sourcée.
- **Crédibilité** : contenu légal dû de toute façon (B-10, B-11) ; coût marginal de rédaction seulement.
- **Preuve observable** : US-09, US-36.

### AT-3. Le rappel annoncé à la demi-journée, même hors horaires

- **Gisement** : donnée dormante (horaires et fermetures exceptionnelles, déjà tenus pour le statut) et moment où le client peut répondre.
- **Ce que c'est** : une demande envoyée un mercredi à 21 h par un client disponible en fin de journée reçoit « Nous vous rappelons jeudi, en fin de journée », en tenant compte des fermetures exceptionnelles, suivi de « BF Auto vous rappelle au numéro indiqué, depuis le 06 05 92 28 38 : enregistrez ce numéro pour décrocher. » Jamais une heure : une promesse à l'heure près, sur le créneau le plus chargé de l'atelier, serait rompue plus souvent que tenue.
- **Pourquoi ça surprend** : les formulaires observés ne disent rien de la suite (Pièces Auto) ; les annuaires locaux affichent des horaires faux (étude 06).
- **Crédibilité** : même calcul que le statut d'ouverture ; conditionné à un délai validé par le garage, sinon aucune demi-journée n'est promise (D8).
- **Preuve observable** : US-13.

### AT-4. La pièce vérifiée et posée par le garagiste, neuve ou d'occasion

- **Gisement** : irritant avoué du marché (erreurs de compatibilité, filtre par plaque « indicatif » dans les CGV des leaders, vérification experte vendue sur abonnement chez Autodoc).
- **Ce que c'est** : le devis porte sur la pièce posée, vérifiée pour le véhicule avant toute commande, dans la gamme choisie (neuve, d'occasion ou reconditionnée, sans préférence). La vérification n'est jamais présentée comme un service gratuit à part.
- **Pourquoi ça surprend** : les leaders renvoient le risque au client ; ici un seul responsable, et un levier prix (51 % envisagent des pièces d'occasion, Observatoire Roole, 2024, France).
- **Crédibilité** : c'est le geste normal d'un garage ; conditionné à la validation de l'engagement et de l'offre `[À VALIDER : vérification et pose, offre de pièces issues de l'économie circulaire]`.
- **Preuve observable** : US-28.

### Notation (méthode de référence, 1 à 5 par axe)

| Attractive | Désirabilité | Ancrage | Faisabilité MVP | Coût marginal | Démontrabilité | Total |
|---|---|---|---|---|---|---|
| AT-1 Orientation relayée | 5 | 5 | 4 | 4 | 5 | **23** |
| AT-2 Vos droits chez nous | 3 | 4 | 5 | 5 | 4 | 21 |
| AT-3 Rappel à la demi-journée | 4 | 3 | 5 | 5 | 5 | 22 |
| AT-4 Pièce vérifiée et posée | 4 | 4 | 4 | 4 | 4 | 20 |

**Attractive phare : AT-1 (23 sur 25).** Elle est dessinée par le client lui-même (bloc
central de la maquette) et démontrable en une minute devant le jury. La désirabilité
d'AT-2 est ramenée à 3 : au lancement, les questions juridiques ne sont pas celles qu'un
nouveau client pose en premier (D2).

**Écartées comme attractives, et pourquoi** : « aucun bandeau » (basique de conformité,
D9) ; « taux horaire publié » (basique du socle B-28, puis performance P-08) ; « logo à
idée forte » (basique B-26 pour l'utilisateur) ; « photo de façade » (basique B-28) ;
« lien SMS » (performance P-16) ; « guide des voyants » (différé, D3).

## Indifférentes

Écartées : personne ne les remarquerait, ou leur coût dépasse leur effet.

| Attribut | Motif |
|---|---|
| Blog, actualités | Aucun effet mesuré sur le choix d'un garage ; coût éditorial que le garage ne tiendra pas (études 01, 04, 05, 06) |
| Compte client, espace personnel, liste d'envies | Contact ponctuel ; friction inutile (études 01, 03) |
| Lettre d'information | Consentement requis, aucune attente mesurée (étude 05) |
| Fils Instagram ou Facebook intégrés | Ressource tierce (D9) ; un simple lien en pied de page si des comptes existent `[À VALIDER : comptes sociaux]` |
| Carrousel, vidéo d'arrière-plan, animations et illustrations décoratives | Aucune information, du poids (étude 04) |
| Galerie de véhicules, vente d'occasion, recrutement | Hors maquette |
| Comparaison de plusieurs garages | Site d'un garage unique |
| Champ dédié au code défaut OBD | Minorité équipée ; le champ « Précisions » facultatif l'accepte (étude 02) |
| Paiement fractionné | Aucun paiement en ligne (D1) |
| Catalogue exhaustif de références | Le client veut sa pièce, pas un inventaire ; licence de données coûteuse (étude 03) |
| Recherche dans le catalogue | 14 familles tiennent sur un écran ; les mots courants sous chaque famille suffisent ; l'étude 03 la juge secondaire. Rouverte au-delà de 20 familles |
| Guide des voyants illustré | Différé (D3) : sans gain sur la décision d'urgence |
| Version anglaise | Clientèle locale ; brief |
| Lien WhatsApp, si le garage ne l'utilise pas déjà avec ses clients | Ajoute un canal que personne ne lit (P-16) |
| Case « je suis un professionnel » | Rien n'établit que le garage de Choisy sert des professionnels `[À VALIDER : clientèle professionnelle]` |
| Pneus d'occasion classés par usure | Offre du BF Auto de Roussillon ; non établie pour Choisy-le-Roi, donc non applicable |
| Application installable, notifications poussées | Aucun usage récurrent qui la justifie ; le raccourci de l'espace garagiste sur l'écran d'accueil suffit (D5) |
| Thème sombre | Aucune attente mesurée ; un thème clair à contraste AAA reste lisible en plein soleil |

## À éviter

La colonne la plus importante : leur présence dégrade la satisfaction ou la confiance, ou
expose le garage. Chacune est gardée par une porte ou un critère d'acceptation.

### Confiance

| Id | Attribut à éviter | Motif | Source |
|---|---|---|---|
| AE-01 | Avis, témoignages ou note inventés, filtrés, ou note auto-déclarée dans les données structurées | Pratique commerciale trompeuse (jusqu'à 2 ans et 300 000 €) ; exclu par Google ; brief §3 | Études 04, 05, 06 |
| AE-02 | Image de banque, « X ans d'expérience », certification, logos de marques non validés | Fait inventé ; décrédibilise sur place | Études 04, 05 |
| AE-03 | Allégations environnementales ou superlatives (« écologique », « non polluant », « meilleur prix garanti ») | Directive (UE) 2024/825 applicable au 27/09/2026 ; slogans invérifiables | Études 05, 06 |
| AE-04 | Textes emphatiques interchangeables ; accroche « à portée de main » | Motrio, Point S ; idée déjà prise localement et à Roussillon | Études 01, 04 |
| AE-05 | Prix contradictoires, non datés, « à partir de » sans véhicule de référence ou présentés comme un engagement, ou déduits des moyennes d'idGarages et de Vroomly | AD affiche 79,90 € et 92,90 € pour la même prestation ; la DGCCRF sanctionne l'écart entre annoncé et facturé | Études 01, 05, 06 |
| AE-06 | Statut « ouvert » calculé sans les fermetures exceptionnelles ; horaires différents entre site et fiche | Un client se déplace pour rien : l'écran ment | Étude 06 |
| AE-07 | Compteurs animés, chiffres dépendant du JavaScript, « 0 » affiché pour une donnée inconnue | « 0 ponts élévateurs » de La Maison Mécanique ; zéro qui ment (piège 3) | Étude 04 |

### Parcours

| Id | Attribut à éviter | Motif | Source |
|---|---|---|---|
| AE-08 | Coordonnées exigées avant l'information ou le résultat | Speedy (« Contact » avant « Estimation ») ; Wrenchly (e-mail exigé pour le rapport) | Études 01, 02 |
| AE-09 | Compte ou paiement exigé pour demander un rendez-vous | Point S, Norauto | Étude 01 |
| AE-10 | Bouton « Prendre RDV » ou « Réserver » qui ouvre un formulaire ; agenda de créneaux que personne ne tient | Europe Auto ; pièges 1 et 3 | Étude 06, D4 |
| AE-11 | Promotions, coupons contre coordonnées, comptes à rebours, carrousels, fenêtres surgissantes | Speedy, AD, Stress-Free | Études 01, 04, 06 |
| AE-12 | Robot conversationnel, discussion qui s'ouvre seule, module en anglais | Disponibilité intenable pour un petit garage ; 9 % font confiance à une recommandation d'IA seule | Études 01, 05, 06 |
| AE-13 | Texte libre seul pour décrire la panne ou la pièce ; plaque exigée sans alternative, VIN, photo de carte grise, adresse postale ou date de naissance demandées au contact | Le client ne connaît pas le nom des pièces ; minimisation (la plaque est une donnée personnelle, CNIL) | Études 03, 05 |
| AE-14 | Barre fixe qui masque un champ ou l'élément qui a le focus | WCAG 2.2, critère 2.4.11 ; la barre est masquée pendant la saisie | D7 |
| AE-15 | En-tête géant qui repousse l'information sous le premier écran mobile | Ottohaus | Étude 04 |

### Orientation

| Id | Attribut à éviter | Motif | Source |
|---|---|---|---|
| AE-16 | Probabilités chiffrées, cause unique présentée comme certaine, estimation de durée (« environ 1 minute ») | Fausse précision ; bonne orientation dans 57 % des cas seulement (BMJ 2015) ; pourcentage inventé (piège 15) | Étude 02 |
| AE-17 | Prix ou fourchette de réparation dans le résultat | Litige si le devis diffère ; seul RepairPal le fait, parce qu'un atelier s'y engage | Étude 02 |
| AE-18 | Appeler l'outil « diagnostic » sans nuance | Présomption de faute du garagiste (Cass. 1re civ. 11 mai 2022) | Étude 02 |
| AE-19 | Écarter une piste parce que le symptôme n'a pas été signalé | Logique d'exclusion de Wrenchly | Étude 02 |
| AE-20 | Tutoriel de bricolage, geste à chaud, lien affilié, suggestion de supprimer un filtre à particules, une vanne EGR ou un dispositif antipollution | Sécurité ; Code de la route L318-3 | Études 02, 05 |

### Catalogue

| Id | Attribut à éviter | Motif | Source |
|---|---|---|---|
| AE-21 | Panier et paiement en ligne en v1 | Vente à distance : CGV, rétractation de 14 jours même en retrait, « renoncer au contrat ici » | Études 03, 05 |
| AE-22 | Mention « compatible » automatique ; indicateur de stock non synchronisé | Les leaders eux-mêmes disent « indicatif » ; lecture sans écriture et zéro qui ment (pièges 1 et 3) | Étude 03 |
| AE-23 | Catalogue PDF à télécharger | Illisible sur téléphone, périmé à la publication | Étude 03 |
| AE-24 | « Sous 24 h » ou tout délai promis sans validation ni condition | Le délai de Roussillon n'est pas celui de Choisy ; promesse intenable | Études 03, 04 |

### Droit, données, technique

| Id | Attribut à éviter | Motif | Source |
|---|---|---|---|
| AE-25 | Bandeau de cookies (surtout asymétrique), carte Google intégrée, polices Google, reCAPTCHA | CNIL ; quatre captures sur sept masquées par une modale | Études 01 à 06 |
| AE-26 | Relance commerciale d'un numéro collecté sans consentement préalable | L223-1 et L223-2 depuis le 11/08/2026 | Étude 05 |
| AE-27 | Lien vers la plateforme européenne de règlement en ligne des litiges | Supprimée le 20/07/2025 (règlement (UE) 2024/3228) | Étude 05 |
| AE-28 | Texte libre de l'adresse rendu à l'écran (fiche partagée, message après redirection) | Un lien forgé fait parler le site avec ses propres mots (piège 40) | Catalogue des pièges |
| AE-29 | Reprendre quoi que ce soit du BF Auto de Roussillon (adresses, textes, promesses, pneus d'occasion, allégations climatisation) | Ce n'est pas le client ; confusion d'homonymes | Brief §3, étude 04 |
| AE-30 | Instance qui s'endort, pages de plusieurs mégaoctets, polices propriétaires lourdes | Eurorepar 11,7 Mo, Bosch 1,6 Mo de polices ; instantanéité | Étude 01, D11 |
| AE-31 | Pictogrammes sans libellé ; couleur seule porteuse du sens (urgence) ; étoiles lues comme du bruit | Accessibilité | Études 01, 04 |
| AE-32 | Tiret cadratin ou demi-cadratin ; fautes d'orthographe | Brief §4 ; fautes du site de Roussillon dès l'accroche | Brief, étude 04 |
| AE-33 | Mise en ligne avant le renommage de la fiche Google, ou nom différent entre site et fiche | Incohérence NAP, confusion avec les concurrents | Étude 06 |

### Exploitation et relais (ajoutés à la relecture du 2026-09-23)

| Id | Attribut à éviter | Motif | Source |
|---|---|---|---|
| AE-34 | Indicateur calculé sur un statut que personne ne saisit (délai de rappel, nombre de demandes « nouvelles ») | Un chiffre qui juge le garagiste à tort (pièges 1 et 3) | D5 |
| AE-35 | Demande jetée en silence avec une confirmation identique à celle d'une demande valide | Un vrai client attend un appel qui ne vient jamais | D9 |
| AE-36 | Promesse de rappel à l'heure près ; « Appeler » en action principale quand le garage est fermé | Promesse rompue sur le créneau le plus chargé ; garagiste dérangé le soir ; messagerie qui fait croire à un garage fermé | D7, AT-3 |
| AE-37 | Le mot « avis » dans l'orientation ; « Pas d'urgence » sur les branches bruit, freinage, vibrations et direction | Confusion avec les avis Google ; promesse de sécurité faite au nom du garagiste | D3 |
| AE-38 | Mode d'affichage des valeurs à valider actif par défaut ; base sur un disque éphémère ; horaires calculés en UTC | L'invariant tombe sur un oubli de variable ; demandes effacées à chaque déploiement ; statut faux d'une ou deux heures | D8, D11, D12 |
| AE-39 | Encart « Donnez le premier avis » en tête de page | Annonce l'absence d'avis à un visiteur qui n'est pas encore venu | D6 |
| AE-40 | Donnée personnelle ou identifiant séquentiel de demande dans une adresse | Historique, journaux et en-tête Referer ; lecture des demandes d'autrui en changeant un numéro | B-30 |
| AE-41 | Notification par un canal que le garagiste ne lit pas dans la journée ; message illisible sans connexion | Écriture sans lecture déplacée d'un cran (piège 2) | D5 |

### Pièges du catalogue transverse, appliqués à ce site

| Piège | Où il menace ce site | Garde retenue |
|---|---|---|
| 1. Lecture sans écriture | Agenda de créneaux, stock, note d'avis, délai de rappel mesuré sur un statut non saisi | Refusés (D1, D4, D5, D6) ; P-09 retirée |
| 2. Écriture sans lecture | Demandes jamais lues ; courriel lu le soir | Canal choisi en séance, message suffisant à lui seul, relance du niveau 1, file de renvoi, espace garagiste (D5, US-16, US-50) |
| 3. Zéro qui ment | Stock à 0, note, statut sans horaires, « 0 sur 10 rappelées » | Donnée inconnue jamais rendue en chiffre ; horaires bloquants (D8) ; indicateurs sur statut non saisi refusés (AE-34) |
| 4. État vide qui ment sur sa cause | Orientation sans réponse exploitable, famille sans prix, zone « ? » | Message qui dit ce qui manque et quoi faire (US-19) ; « Prix sur devis » ; zone jamais vide grâce au socle (D2) |
| 5 et 31. Texte ou test qui décrit l'ancien comportement | « Demande » et « réservation » ; « orientation » et « avis » | Critères qui assertent le libellé exact (US-11, US-17) |
| 10. Formulaire imbriqué | Accueil portant l'orientation et le rappel | Q1 en liens directs : un seul formulaire sur l'accueil ; test navigateur qui l'envoie (US-08) |
| 15. Pourcentage inventé | Probabilités, durée estimée | Mots interdits dans la porte de l'arbre (US-21) |
| 22. Diagnostic perdu en transit | Échec de notification invisible | Demande enregistrée avant notification, file de renvoi, `/sante` en 503, sonde (US-16) |
| 26. Prose comptée comme invariant | « Aucune donnée non validée n'est affichée », « production par défaut », frontières hexagonales | Porte de démarrage vue rouge (US-05, US-06) ; règles dependency-cruiser vues rouges (D12) |
| 27. Composant orphelin | Tarifs, « Vos droits », orientation que rien ne lie | Parcours de navigation depuis l'accueil et le pied de page (US-39) |
| 28. Oracle de contenant | Test qui vérifie qu'un statut existe, pas son texte | Critères qui assertent le texte exact |
| 40. Texte libre de l'adresse rendu à l'écran | Fiche partagée de l'orientation, confirmation, messages après redirection | Codes fermés, jeton aléatoire, test d'injection (US-12, US-23) |

## User stories

Format : persona, capacité, valeur ; catégorie Kano et attribut couvert ; critères
d'acceptation en Gherkin français, chacun destiné à devenir un test. Les horaires cités
dans les critères sont ceux d'une **configuration d'essai** (ouverte du lundi au samedi,
de 8 h 30 à 12 h et de 14 h à 19 h, fermée le dimanche, fuseau Europe/Paris, sauf mention
contraire), jamais les horaires réels du garage. Les US retirées gardent leur numéro, pour
la traçabilité.

### Lot 0 : socle, légal et collecte

**US-01. Appeler en un geste** (basique, B-01, P1)
En tant qu'automobiliste inquiet sur mon téléphone, je veux appeler le garage en un geste depuis n'importe quelle page, afin de parler à quelqu'un sans chercher le numéro.
- Étant donné une page publique quelconque affichée dans une fenêtre de 390 × 844 px, puis de 320 × 568 px, quand la page est chargée, alors un lien `tel:+33605922838` dont le texte contient « 06 05 92 28 38 » est visible sans défilement.

**US-02. Savoir si le garage est ouvert** (basique, B-04, P1 et P3)
En tant qu'automobiliste qui veut passer au garage, je veux lire s'il est ouvert maintenant et quand il ouvre, afin de ne pas me déplacer pour rien.
- Étant donné une horloge réglée le mercredi 15 juillet 2026 à 16 h 30 UTC (18 h 30 à Paris), quand l'accueil est rendu, alors le statut affiche exactement « Ouvert, ferme à 19 h ».
- Étant donné une horloge réglée le mercredi 15 juillet 2026 à 17 h 30 UTC (19 h 30 à Paris), quand l'accueil est rendu, alors le statut affiche exactement « Fermé, ouvre demain à 8 h 30 ».
- Étant donné une horloge réglée le mercredi 15 juillet 2026 à 10 h 30 UTC (12 h 30 à Paris), quand l'accueil est rendu, alors le statut affiche exactement « Fermé, rouvre à 14 h ».
- Étant donné une horloge réglée le samedi 18 juillet 2026 à 19 h UTC (21 h à Paris), quand l'accueil est rendu, alors le statut affiche exactement « Fermé, ouvre lundi à 8 h 30 ».
- Étant donné une horloge réglée le lundi 26 octobre 2026, lendemain du passage à l'heure d'hiver, à 7 h 15 UTC (8 h 15 à Paris), quand l'accueil est rendu, alors le statut affiche exactement « Fermé, ouvre à 8 h 30 » ; à 7 h 45 UTC (8 h 45 à Paris), il affiche « Ouvert, ferme à 12 h ».
- Étant donné une fermeture exceptionnelle du lundi 28 septembre au mercredi 7 octobre 2026 inclus et une horloge réglée le mardi 29 septembre 2026 à 10 h UTC, quand l'accueil est rendu, alors le statut affiche exactement « Fermé exceptionnellement, ouvre le jeudi 8 octobre à 8 h 30 ».

**US-03. Trouver le garage** (basique, B-02, P1 et P3)
En tant que client qui vient pour la première fois, je veux l'adresse et un itinéraire en un geste, afin d'arriver sans chercher.
- Étant donné l'accueil affiché, quand je lis le bloc d'informations du garage, alors l'adresse « 7 rue Demanieux, 94600 Choisy-le-Roi » est suivie d'un lien « Itinéraire » vers la fiche Google renommée et d'un lien secondaire vers Apple Plans, et la page ne charge aucune ressource de ces services.

**US-04. Une seule source pour l'identité** (basique, B-05 et B-17, P4)
En tant que garagiste, je veux que nom, adresse, téléphone et horaires viennent d'un seul fichier, afin que le site, les données structurées et la fiche Google disent la même chose.
- Étant donné le fichier de configuration, quand une page publique est rendue, alors le nom, l'adresse et le téléphone du pied de page et du bloc JSON-LD `AutoRepair` sont identiques caractère pour caractère à ceux du fichier, et le JSON-LD ne contient ni `aggregateRating` ni `review`.
- Étant donné un téléphone modifié dans le fichier seulement, quand toutes les pages publiques sont rendues de nouveau, alors aucune ne contient l'ancien numéro.

**US-05. Mise en ligne bloquée sans données obligatoires** (basique, B-09, B-10, B-20, B-28, P4)
En tant que garagiste, je veux que le site refuse de démarrer en production tant qu'une donnée obligatoire manque, afin de ne jamais publier un site hors la loi ou sans visage.
- Étant donné un fichier de configuration dont le médiateur est marqué à valider, quand l'application démarre en production, alors le démarrage échoue avec un code de retour non nul et un message qui nomme le champ « médiateur ».
- Étant donné aucune variable `BF_MODE` et une donnée bloquante à valider, quand l'application démarre, alors le démarrage échoue avec un code non nul.
- Étant donné `BF_MODE=demo`, quand l'application démarre, alors le démarrage échoue avec un message qui nomme les valeurs admises.
- Étant donné `BF_MODE=relecture`, quand l'application démarre, alors elle n'écoute que sur `127.0.0.1` et chaque réponse porte l'en-tête `X-Robots-Tag: noindex`.
- Étant donné le prénom du garagiste, la photo de façade, le taux horaire, le prix du premier contrôle, un engagement, le canal de notification, le courriel public ou le nom de domaine marqué à valider, quand l'application démarre en production, alors le démarrage échoue et nomme ce champ.
- Étant donné un fichier complet et validé, quand la page Mentions légales est rendue, alors elle affiche dénomination, forme, capital, siège, immatriculation, TVA, directeur de la publication, courriel public de contact et hébergeur, chacun lu depuis le fichier, ainsi que le lien vers la fiche publique du registre.

**US-06. Aucune donnée non validée affichée comme un fait** (basique, B-20 et B-22, P3)
En tant que client qui compare les prix, je veux que chaque prix affiché soit réel et daté, afin de pouvoir m'y fier.
- Étant donné un forfait dont le prix est marqué à valider, quand la page Tarifs et la page de sa famille sont rendues en production, alors ce montant n'apparaît nulle part et la ligne affiche « Prix sur devis ».
- Étant donné un prix validé avec sa date d'effet et son véhicule de référence, quand la page est rendue, alors il s'affiche au format « <montant> € TTC » avec deux décimales, suivi de ce qu'il comprend, du véhicule de référence, de sa date d'effet et de la phrase « Votre prix exact au devis, avant travaux ».

**US-07. Ni traceur, ni cookie, ni bandeau** (basique, B-13, P1)
En tant que visiteur, je veux un site qui ne me suit pas et ne m'interrompt pas, afin d'arriver directement à l'information.
- Étant donné le chargement de chaque page publique dans un navigateur, quand toutes les requêtes sont terminées, alors aucune ne vise un autre domaine que celui du site, aucune réponse ne contient d'en-tête `Set-Cookie`, et aucun bandeau de consentement n'est présent.

**US-36. Vos droits chez nous** (attractive AT-2, basiques B-10 et B-11, P3)
En tant que client méfiant, je veux lire mes droits et les engagements du garage au même endroit, afin de savoir à quoi m'attendre.
- Étant donné la page « Vos droits chez nous », quand elle est rendue, alors elle contient l'expression exacte « pièces issues de l'économie circulaire », les catégories et les exceptions de l'article D224-25-2, le nom du médiateur et l'adresse de son site, la réponse sur la garantie constructeur avec « certaines extensions de garantie », et les deux engagements du socle.
- Étant donné chaque réponse de la page, quand elle est rendue, alors sa source juridique figure dans un lien secondaire « Le texte », jamais dans la phrase de réponse.

**US-41. Des pages d'erreur utiles** (basique, B-25, P1)
En tant qu'automobiliste arrivé sur une mauvaise adresse, je veux pouvoir appeler et repartir, afin de ne pas rester bloqué.
- Étant donné une adresse inconnue, quand elle est demandée, alors la réponse a le code 404 et contient le lien d'appel et les liens vers les trois intentions.
- Étant donné une erreur interne simulée, quand une page est demandée, alors la réponse a le code 500, contient le lien d'appel et ne révèle aucun détail technique.

**US-42. Titres et socle de référencement** (basique, B-19 et B-27, P1 à P3)
En tant qu'automobiliste qui cherche un garage à Choisy-le-Roi, je veux trouver ce site et reconnaître le bon « BF Auto », afin de ne pas me tromper de garage.
- Étant donné chaque page publique, quand elle est rendue, alors elle porte un seul `h1`, un titre qui contient « BF Auto » et « Choisy-le-Roi », une meta description unique de 155 caractères au plus et un lien canonique absolu.
- Étant donné `sitemap.xml`, quand chaque adresse qu'il liste est demandée, alors elle répond 200, n'est pas en `noindex` et porte sa canonique ; aucune page en `noindex` n'y figure, et `robots.txt` annonce le plan et exclut `/garagiste`.
- Étant donné une requête sur une variante de l'origine (http, ou l'autre forme avec ou sans www), quand elle arrive, alors elle est redirigée en 301 vers la même page sur l'origine canonique.

**US-48. Des pages jamais périmées** (basique, B-04, P1)
En tant qu'automobiliste, je veux que le statut lu soit celui de maintenant, afin de ne pas me déplacer sur la foi d'une page gardée en cache.
- Étant donné une page HTML publique, quand elle est servie, alors elle porte `Cache-Control: no-cache` ; une ressource à empreinte porte `immutable` ; la confirmation d'une demande et les pages de l'espace garagiste portent `no-store`.

### Lot 1 : accueil

**US-08. L'essentiel dans le premier écran** (basique, B-01, B-04, B-06, P1 à P3)
En tant qu'automobiliste sur téléphone, je veux voir dès le premier écran le statut, le téléphone, ce que fait le garage et le début de l'orientation, afin d'agir sans défiler.
- Étant donné l'accueil dans une fenêtre de 390 × 844 px, quand la page est chargée, alors le statut d'ouverture, le lien d'appel, la ligne des familles traitées et l'intitulé « Un souci avec votre voiture ? » sont visibles sans défilement.
- Étant donné l'accueil dans une fenêtre de 1440 × 900 px, quand la page est chargée, alors la colonne gauche contient les familles puis la zone « Vos questions », la colonne centrale l'information puis l'orientation, la colonne droite les informations du garage et le formulaire de rappel, et la page ne contient aucune carte.
- Étant donné l'accueil dans un navigateur réel, quand je suis un lien de la première question puis que j'envoie le formulaire de rappel, alors chaque action atteint sa propre route et produit sa propre page, et l'accueil ne contient qu'un seul formulaire.

**US-09. Les questions qui font hésiter** (attractive, AT-2, P3)
En tant que client qui ne connaît pas encore ce garage, je veux trouver les réponses aux questions qui me retiennent, afin de décider de venir.
- Étant donné la zone « Vos questions » de l'accueil, quand j'ouvre « Vais-je perdre la garantie de mon constructeur si je fais l'entretien ici ? », alors la réponse contient « votre garantie d'origine reste valable » et « certaines extensions de garantie », et un lien « Le texte » mène aux règlements (UE) n° 461/2010 et 2023/822.
- Étant donné les moyens de paiement marqués à valider, quand l'accueil est rendu en production, alors la question « Comment puis-je payer ? » n'apparaît pas et la zone contient les questions sur le voyant, le rendez-vous, le premier contrôle, les travaux sans accord et la garantie.
- Étant donné JavaScript désactivé, quand j'active une question au clavier, alors sa réponse se déplie.

**US-10. L'encart du nouveau nom** (basique, B-21, AE-01 et AE-39, P3)
En tant qu'habitué de l'ancien « Garage auto choisy 94 », je veux comprendre que c'est le même garage sous un nouveau nom, afin de ne pas croire à un autre atelier.
- Étant donné un lien d'avis validé, quand l'accueil est rendu, alors l'encart « Nouveau nom » se trouve après les trois colonnes, cite l'ancien nom « Garage auto choisy 94 », porte le lien « Laissez un avis Google » vers `/avis`, la page ne contient aucune note chiffrée ni aucun témoignage, et « Donnez le premier avis » n'apparaît nulle part.
- Étant donné un lien d'avis validé, quand `/avis` est demandé, alors la réponse redirige vers ce lien sans poser de cookie ; sans lien validé, `/avis` répond 404.

**US-40. Les horaires jour par jour** (basique, B-03, P1 et P3)
En tant que client qui prévoit de passer, je veux lire les horaires de chaque jour en commençant par aujourd'hui, afin de choisir mon moment sans calcul.
- Étant donné une horloge réglée un jeudi, quand l'accueil puis la page Accès et horaires sont rendus, alors le tableau des horaires commence par jeudi, marqué « aujourd'hui » en toutes lettres (pas seulement par la couleur), et liste les sept jours avec leurs plages, pause de midi comprise.

**US-43. La barre d'action selon le statut** (basique, B-01, AE-14 et AE-36, P1)
En tant qu'automobiliste sur téléphone, je veux que l'action proposée en bas d'écran soit la bonne à cette heure-là, afin de ne pas tomber sur une messagerie.
- Étant donné le garage ouvert selon l'horloge, quand une page publique est rendue dans une fenêtre de 390 px, alors la barre fixe propose « Appeler » et « Itinéraire ».
- Étant donné le garage fermé, qui rouvre jeudi matin, et les appels hors horaires acceptés, quand une page publique est rendue, alors la barre propose « Être rappelé (ouverture jeudi matin) » en action principale et « Appeler » en secondaire ; si les appels hors horaires ne sont pas validés, seule « Être rappelé » y figure, le numéro restant dans l'en-tête.
- Étant donné l'accueil dans une fenêtre de 390 px, quand le focus est sur le champ téléphone du formulaire de rappel, alors la barre est masquée et le champ est entièrement visible.

**US-52. Écrire par SMS** (performance, P-16, P1)
En tant qu'automobiliste qui a photographié son voyant, je veux écrire au garage par SMS, afin de lui montrer ce que je vois.
- Étant donné le canal SMS client validé, quand l'accueil est rendu, alors il contient un lien « Envoyer un SMS » dont l'adresse commence par `sms:+33605922838` et porte le texte prérempli ; si ce canal n'est pas validé, le lien est absent.

### Lot 2 : demandes

**US-11. Demander un rendez-vous** (basique B-07 et performance P-07, P3)
En tant que client qui prépare un entretien, je veux proposer une à trois demi-journées où je peux venir, afin d'obtenir un rendez-vous sans téléphoner pendant les heures d'atelier.
- Étant donné une fermeture exceptionnelle déclarée le lundi suivant, quand j'ouvre le formulaire de rendez-vous, alors la liste des demi-journées ne contient ni le dimanche ni ce lundi, et propose aussi « Le plus tôt possible » et « Une autre date (nous en parlons au téléphone) ».
- Étant donné le formulaire rempli avec une famille, une demi-journée, une marque, un nom, un téléphone et un moment de rappel, quand je l'envoie, alors la confirmation contient « Ce n'est pas encore une réservation ».
- Étant donné l'accueil et la page d'une famille, quand elles sont rendues, alors le lien vers le formulaire porte le libellé exact « Demander un rendez-vous », et aucune page ne contient « Réserver » ni « Prendre RDV ».
- Étant donné JavaScript désactivé, quand je remplis et envoie le formulaire de rendez-vous, alors la demande est enregistrée et la confirmation s'affiche.

**US-12. Savoir ce qui se passe ensuite** (basique, B-08 et B-30, P2 et P3)
En tant que client qui vient d'envoyer une demande, je veux un récapitulatif et la suite annoncée, afin de ne pas me demander si elle est partie.
- Étant donné une demande envoyée et le numéro d'appel sortant validé, quand le serveur l'enregistre, alors il redirige vers `/demande/envoyee?j=<jeton>`, où le jeton porte 128 bits d'aléa et l'adresse aucune donnée personnelle ; la page reprend le type, le véhicule, les créneaux choisis et le numéro saisi, contient exactement « BF Auto vous rappelle au numéro indiqué, depuis le 06 05 92 28 38 : enregistrez ce numéro pour décrocher. », et la réponse porte `Cache-Control: no-store` et `Referrer-Policy: no-referrer`.
- Étant donné un jeton de plus d'une heure, quand la confirmation est demandée, alors une page neutre s'affiche avec le téléphone du garage et sans récapitulatif.
- Étant donné un jeton modifié d'un caractère, quand la confirmation est demandée, alors la réponse est 404.

**US-13. Le rappel annoncé à la demi-journée** (attractive, AT-3, P1 et P3)
En tant qu'automobiliste qui écrit après la fermeture, je veux savoir quand on me rappellera, afin de ne pas rester dans l'attente.
- Étant donné un délai validé « prochaine demi-journée d'ouverture », une horloge réglée un mercredi à 21 h (heure de Paris) et le moment « En fin de journée », quand j'envoie une demande de rappel, alors la confirmation affiche « Nous vous rappelons jeudi, en fin de journée. »
- Étant donné la même configuration et le moment « Dès que possible », quand j'envoie la demande, alors la confirmation affiche « Nous vous rappelons jeudi matin. »
- Étant donné une fermeture exceptionnelle couvrant le jeudi, quand j'envoie la même demande le mercredi à 21 h, alors la demi-journée annoncée est la première demi-journée d'ouverture après la fermeture.
- Étant donné toute confirmation, quand elle est rendue, alors la phrase de rappel ne contient aucune heure ; le numéro sortant étant validé, elle est suivie de la phrase exacte de US-12, et sinon de « BF Auto vous rappelle au numéro indiqué. »
- Étant donné un délai de rappel marqué à valider, quand j'envoie une demande, alors la confirmation n'annonce ni demi-journée ni date.

**US-14. Un formulaire qui dit ce que devient mon numéro** (basique, B-12, P2 et P3)
En tant que client, je veux savoir à quoi servira mon téléphone et qui traite ma demande, afin de le donner sans craindre le démarchage.
- Étant donné n'importe quel formulaire public, quand il est affiché, alors les champs obligatoires sont signalés, aucune case n'est pré-cochée, une mention (responsable, finalité, durée de conservation de 12 mois, droits, lien vers la politique de confidentialité) figure sous le formulaire, et le champ téléphone est suivi d'une mention indiquant qu'il sert uniquement à répondre à la demande et qu'aucune sollicitation commerciale n'aura lieu sans consentement préalable.
- Étant donné la page `/confidentialite`, quand elle est rendue, alors elle nomme l'hébergeur, la région d'hébergement, les prestataires d'envoi (courriel, SMS), le lieu de traitement et l'encadrement de tout transfert hors de l'Union européenne.

**US-15. Pas de demandes automatiques, aucun vrai client écarté** (basique, B-23, AE-35, P4 et P1)
En tant que garagiste, je veux ne pas recevoir de pourriel sans perdre un seul vrai client, afin de ne consacrer mon temps qu'à de vraies demandes.
- Étant donné une demande envoyée avec le champ piège rempli, quand le serveur la reçoit, alors elle n'est pas enregistrée et la réponse est l'écran « Confirmez l'envoi », qui réaffiche les valeurs saisies ; quand je confirme avec le champ piège vide, alors la demande est enregistrée.
- Étant donné un formulaire envoyé 1 s après son affichage, quand le serveur le reçoit, alors l'écran « Confirmez l'envoi » s'affiche avec les valeurs saisies et rien n'est perdu.
- Étant donné le formulaire de rappel rempli au navigateur en moins de 2 secondes, quand je l'envoie puis confirme si on me le demande, alors la demande est enregistrée après un écran de confirmation au plus.
- Étant donné le champ piège de chaque formulaire, quand le gabarit est analysé, alors il porte `autocomplete="off"`, `tabindex="-1"`, `aria-hidden="true"` et un nom qui ne contient ni « nom », ni « tel », ni « mail », ni « name », ni « phone ».
- Étant donné trois envois non confirmés dans la semaine, quand j'ouvre l'espace garagiste, alors il affiche « 3 envois non confirmés cette semaine ».
- Étant donné une requête dont l'en-tête `Origin` désigne un autre domaine, quand elle envoie une demande, alors la demande est refusée et n'est pas enregistrée.
- Étant donné un même jeton de formulaire envoyé deux fois, quand le serveur reçoit le second envoi, alors une seule demande existe.

**US-16. Une demande n'est jamais perdue** (basique, B-24, P4)
En tant que garagiste, je veux que chaque demande soit conservée et renvoyée même si la notification échoue, afin de ne jamais laisser un client sans réponse.
- Étant donné un notificateur en échec, quand un client envoie une demande, alors la demande est enregistrée, le client voit la confirmation normale, sa fiche porte la mention « Notification non envoyée », et de nouveaux essais partent à 1 minute, 10 minutes et 1 heure selon l'horloge d'essai.
- Étant donné une notification en échec depuis 2 heures, quand `/sante` est demandé, alors il répond 503 ; après un envoi réussi, il répond 200.

**US-46. Une demande survit au redémarrage** (basique, B-24, P4)
En tant que garagiste, je veux retrouver mes demandes après une mise à jour du site, afin qu'aucun déploiement n'efface un client.
- Étant donné une demande enregistrée, quand le service redémarre, alors la demande est toujours listée dans l'espace garagiste.
- Étant donné la production et un chemin de base hors du disque persistant déclaré, quand l'application démarre, alors le démarrage échoue et nomme le chemin.

**US-47. Une limite par client réel** (basique, B-23, P1 et P4)
En tant qu'automobiliste, je veux que ma demande passe même si d'autres visiteurs viennent d'écrire, afin de ne pas être refusé à cause d'eux.
- Étant donné cinq demandes de cinq adresses clientes différentes derrière le même mandataire, quand une sixième arrive d'une sixième adresse, alors elle est enregistrée.
- Étant donné cinq demandes de la même adresse cliente dans l'heure, quand une sixième arrive, alors elle est refusée avec un message qui donne le numéro de téléphone du garage.
- Étant donné un en-tête `X-Forwarded-For` forgé par le client en plus de celui du mandataire, quand la limite est calculée, alors la clé reste l'adresse vue par le mandataire.

**US-50. Un message lisible sans se connecter** (attractive phare AT-1, performance P-14, P4)
En tant que garagiste sous une voiture, je veux que le message reçu me suffise pour rappeler, afin de ne pas ouvrir un site entre deux interventions.
- Étant donné un notificateur d'essai en marche, quand une demande de rappel après orientation de niveau « Ne roulez pas » est enregistrée, alors un seul message part vers le canal de configuration ; il commence par « Ne roulez pas » et contient le type, le résumé des réponses, le véhicule, le moment où le client peut répondre, son nom, son téléphone et le lien vers la fiche.
- Étant donné cette demande reçue à 10 h, un jour ouvert, et sa fiche non consultée à 10 h 30, quand l'horloge atteint 10 h 30, alors un second message part, et un seul.
- Étant donné la même demande reçue à 21 h, quand l'horloge atteint le lendemain 8 h 30, heure d'ouverture, alors aucune relance n'est encore partie ; elle part à 9 h si la fiche n'a pas été consultée.
- Étant donné la fiche consultée 10 minutes après la réception, quand 30 minutes sont écoulées, alors aucune relance ne part.

### Lot 3 : orientation

**US-17. Commencer depuis l'accueil** (attractive, AT-1, P1)
En tant qu'automobiliste inquiet, je veux commencer l'orientation depuis l'accueil en un geste, afin de gagner du temps.
- Étant donné l'accueil, quand je touche le lien « Un voyant s'allume », alors la page suivante est la question des signes de danger, qui affiche exactement « Question 2 sur 5 au maximum ».
- Étant donné toutes les pages du parcours d'orientation rendues, quand leur texte est analysé, alors aucune ne contient le mot « avis ».

**US-18. L'écran d'arrêt** (basique, B-18, P1)
En tant qu'automobiliste, je veux être arrêté net si ce que je décris est dangereux, et savoir quoi faire de ma voiture, afin de ne pas me mettre en danger ni aggraver la panne.
- Étant donné la question des signes de danger et l'accueil des véhicules remorqués validé, quand je coche le signe du voyant rouge, alors la page suivante a pour titre « Ne roulez pas. », ne pose aucune autre question et présente dans cet ordre : la mise en sécurité avec « 112 », l'assistance de l'assureur, le remorquage jusqu'à « 7 rue Demanieux, 94600 Choisy-le-Roi », puis l'action vers le garage.
- Étant donné le garage ouvert selon l'horloge, quand l'écran d'arrêt s'affiche, alors l'action vers le garage est « Appeler le garage » ; le garage fermé, elle est « Être rappelé à l'ouverture » avec le numéro visible, et les trois premiers blocs restent dans le même ordre.
- Étant donné JavaScript désactivé, quand je coche à la fois « Aucun de ces signes » et « De la fumée sous le capot ou une odeur de brûlé », alors l'écran d'arrêt s'affiche.
- Étant donné une demande de rappel de niveau « Ne roulez pas » envoyée, quand la confirmation s'affiche, alors elle contient « Si vous êtes immobilisé ou en danger, n'attendez pas notre rappel : appelez votre assistance ou le 112. »

**US-19. « Je ne sais pas » ne piège personne** (basique, B-18, P1)
En tant qu'automobiliste qui n'a pas tout remarqué, je veux pouvoir répondre « Je ne sais pas », afin de ne pas inventer une réponse qui fausserait l'orientation.
- Étant donné l'arbre chargé, quand la porte de validation le parcourt, alors chaque question porte le choix « Je ne sais pas », et la porte échoue avec un code non nul si ce choix est retiré d'une question de l'arbre d'essai.
- Étant donné « Je ne sais pas » répondu à la question des signes de danger, quand le résultat s'affiche, alors son niveau n'est pas « Pas d'urgence » et il liste les signes qui imposent de s'arrêter.
- Étant donné « Je ne sais pas » répondu à toutes les questions, quand le résultat s'affiche, alors il contient « Vos réponses ne suffisent pas pour orienter : l'atelier doit voir la voiture » et propose l'appel et la demande de rappel.

**US-20. Cinq questions au plus, des planchers tenus** (performance P-06 et basique B-18, P1)
En tant qu'automobiliste pressé, je veux un questionnaire court qui ne minimise jamais un bruit ou un freinage, afin d'aller au bout sans être mal rassuré.
- Étant donné l'arbre chargé depuis son fichier, quand la porte parcourt tous les chemins de la première question à un résultat, alors aucun chemin ne dépasse 5 questions ni aucune question 7 choix, et la porte échoue avec un code non nul si une sixième question est ajoutée à une branche de l'arbre d'essai.
- Étant donné l'arbre d'essai, quand un résultat « Pas d'urgence » est ajouté à la branche Freinage, Bruit, ou Vibrations et direction, alors la porte échoue avec un code non nul.
- Étant donné l'arbre d'essai, quand « La pédale de frein est molle ou s'enfonce » est retiré de la question 2 d'une branche où la voiture roule, ou quand le signe du voyant rouge ne cite plus aucun exemple, alors la porte échoue avec un code non nul.

**US-21. Un résultat clair et honnête** (attractive, AT-1, P1)
En tant qu'automobiliste, je veux lire ce que je dois faire, les pistes possibles et ce que coûtera le premier contrôle, afin de décider sans me sentir manipulé.
- Étant donné un parcours d'essai de la branche « Un bruit inhabituel » sans signe de danger, quand le résultat s'affiche, alors il présente d'abord « Roulez prudemment et faites contrôler dans les prochains jours » ou le niveau supérieur, puis une à trois pistes suivies chacune de « Ce que l'atelier vérifiera », puis le premier contrôle avec son prix TTC ou sa gratuité lu dans la configuration, puis la mention « Orientation établie à partir de vos seules réponses. Elle ne remplace pas l'examen du véhicule. »
- Étant donné l'ensemble des résultats de l'arbre, quand la porte de contenu les analyse par mots entiers, sans tenir compte de la casse ni des accents, alors aucun ne contient le signe « % », un montant de réparation, ni les mots « certain », « certainement », « sûrement », « forcément » ou « garanti » ; « certaines » n'est pas signalé, « Sûrement » l'est.

**US-22. Le relais vers le garagiste** (attractive phare, AT-1, P1 et P4)
En tant qu'automobiliste, je veux envoyer mes réponses au garage en demandant qu'on me rappelle, afin de ne pas avoir à tout réexpliquer.
- Étant donné un résultat d'orientation, quand je choisis « Être rappelé », alors le formulaire s'ouvre avec le type « Rappel après orientation » et un résumé non modifiable des réponses et du niveau, et les seuls champs obligatoires sont mon nom, mon téléphone et « Quand pouvez-vous répondre au téléphone ? », la marque et les précisions restant facultatives.
- Étant donné cette demande envoyée, quand le garagiste ouvre sa fiche dans l'espace garagiste, alors il lit les réponses en toutes lettres, le niveau de conduite à tenir, le moment où le client peut répondre et l'heure d'envoi.
- Étant donné une demande de niveau « Ne roulez pas » et deux demandes plus anciennes sans urgence, quand la liste des demandes s'affiche, alors la demande de niveau « Ne roulez pas » apparaît en premier.

**US-23. Une fiche à imprimer ou partager** (attractive, AT-1, P1)
En tant qu'automobiliste, je veux garder ou transmettre le résumé de mes réponses, afin de le montrer au garagiste ou à un proche.
- Étant donné un résultat, quand j'imprime la page, alors la sortie contient les réponses, le niveau, les pistes, le téléphone et l'adresse du garage, et ne contient pas le menu de navigation.
- Étant donné une adresse de résultat dont un paramètre contient un texte libre, quand la page est rendue, alors ce texte n'apparaît nulle part dans la page et les codes inconnus sont ignorés.

**US-24. L'orientation sans JavaScript** (basique, B-15, P1)
En tant qu'automobiliste sur un téléphone ancien ou mal couvert, je veux que l'orientation fonctionne sans script, afin de ne pas rester bloqué.
- Étant donné JavaScript désactivé, quand je parcours l'orientation de la première question au résultat, alors chaque page s'affiche.
- Étant donné la question 3, quand je suis le lien « Revenir à la question précédente », alors la question 2 s'affiche avec ma réponse pré-cochée.
- Étant donné la question 3, quand j'utilise le bouton retour du navigateur, alors la question 2 s'affiche (sans exigence sur la pré-sélection, qui dépend du navigateur).

**US-25. Rien n'est dit en mon nom sans ma relecture** (basique, B-18 et B-20, P4)
En tant que garagiste, je veux que l'orientation ne soit publiée qu'après ma relecture, afin que le site ne dise rien que je n'ai validé, sans bloquer le reste du site.
- Étant donné un arbre sans date de relecture, quand l'accueil est rendu en production, alors les liens de la première question n'apparaissent pas, « Un souci avec votre voiture ? Appelez-nous » porte le lien d'appel, `/orientation` répond 404, et le démarrage a réussi.
- Étant donné un arbre relu dont une branche est marquée non validée, quand un résultat de cette branche est rendu, alors il affiche « Vos réponses ne suffisent pas pour orienter : l'atelier doit voir la voiture ».

**US-45. Passer sans rendez-vous** (basique, B-29, P1)
En tant qu'automobiliste qui entend un bruit, je veux savoir si je peux passer maintenant pour qu'on écoute, afin de ne pas attendre un rappel.
- Étant donné l'accueil sans rendez-vous validé et le garage ouvert, quand l'accueil est rendu, alors il affiche « Passez sans rendez-vous aux heures d'ouverture » avec le lien d'itinéraire ; le garage fermé, cette mention n'apparaît pas.
- Étant donné l'accueil sans rendez-vous validé, quand un résultat d'orientation de niveau 2 ou 3 est rendu, alors il contient la même mention ; un résultat de niveau 1 ne la contient pas.

**US-53. Le livret de relecture** (basique, B-18, P4)
En tant que garagiste qui n'aime pas les outils, je veux relire l'orientation sur papier, en français courant, afin de la valider en une demi-heure.
- Étant donné l'arbre chargé, quand le livret est généré, alors il compte une page par branche, chaque résultat y figure en toutes lettres avec une case « d'accord » et une case « à changer », et aucun code interne n'y apparaît.
- Étant donné un résultat modifié dans le fichier de l'arbre, quand le livret est régénéré, alors il reflète la modification ; le livret n'est jamais édité à la main.

### Lot 4 : catalogue

**US-26. Parcourir les familles d'intervention** (basique, B-06, P2 et P3)
En tant que client qui cherche une pièce ou une réparation, je veux parcourir des familles nommées dans mes mots, afin de trouver la mienne sans connaître le jargon.
- Étant donné la page `/entretien-reparation`, quand elle est rendue, alors elle liste toutes les familles validées de la configuration, chacune avec ses mots courants, et aucune famille non validée.
- Étant donné une page de famille, quand elle est rendue, alors elle contient le rôle, les signes d'usure avec un lien vers l'orientation, le forfait avec son véhicule de référence ou « Prix sur devis », et deux boutons « Demander un devis » et « Demander un rendez-vous » ; son titre contient le nom de la famille et « Choisy-le-Roi ».
- Étant donné un prix modifié dans le fichier pour la famille Freinage, quand la page Freinage et la page Tarifs sont rendues, alors elles affichent le même montant.

**US-27. Retirée du v1.** La recherche par synonymes est remplacée par les mots courants affichés sous chaque famille (D1) ; elle sera rouverte au-delà de 20 familles.

**US-28. Un devis pour une pièce vérifiée et posée** (attractive, AT-4, P2)
En tant que client qui cherche une pièce, je veux demander un devis sans savoir si la pièce convient à ma voiture, afin que le garagiste le vérifie pour moi.
- Étant donné la page d'une famille et l'engagement de vérification validé, quand je demande un devis, alors le formulaire s'ouvre avec la famille pré-remplie, la mention d'engagement tirée de la configuration et le choix de gamme « Neuve », « D'occasion ou reconditionnée (pièce issue de l'économie circulaire) », « Sans préférence ».
- Étant donné les plaques « AB-123-CD », « ab123cd », « AB 123 CD » et « 1234 AB 56 », quand je les saisis tour à tour et que j'envoie, alors toutes sont acceptées et enregistrées sous la forme « AB-123-CD » ou « 1234 AB 56 ».
- Étant donné la plaque « 12-AB », quand j'envoie, alors un message indique le format attendu avec un exemple de chaque format, et la demande n'est pas enregistrée.
- Étant donné une demande de devis sans plaque ni ensemble marque, modèle, année et énergie, quand j'envoie, alors le formulaire est réaffiché avec « Indiquez la plaque, ou la marque, le modèle, l'année et l'énergie : sans cela, nous devrons vous rappeler pour le demander. » et la demande n'est pas enregistrée.
- Étant donné la vente au comptoir marquée à valider, quand le formulaire s'affiche en production, alors l'option « Pièce seule, à retirer au garage » est absente, aucun champ d'envoi de fichier n'est présent, et aucune page ne contient « vérification gratuite ».

**US-29. Ni stock ni compatibilité automatique** (basique, garde de AE-22, P2)
En tant que client, je veux ne jamais lire une promesse que personne ne tient, afin de faire confiance à ce que j'ai lu.
- Étant donné toutes les pages du catalogue rendues, quand leur texte est analysé, alors aucune ne contient « en stock », « panier », « ajouter au panier », « compatible avec votre véhicule » ni « payer ».

**US-44. Ce que nous ne faisons pas** (basique, B-06, P1 à P3)
En tant que client, je veux savoir tout de suite si le garage traite mon véhicule, afin de ne pas perdre un rappel pour m'entendre dire non.
- Étant donné la page `/entretien-reparation` et la zone au-dessus de chaque formulaire de demande, quand elles sont rendues, alors elles contiennent le bloc « Ce que nous ne faisons pas » lu dans la configuration.
- Étant donné une demande dont l'énergie ou le besoin figure dans cette liste, quand je l'envoie, alors le formulaire est réaffiché avec mes valeurs et « Nous ne traitons pas ce type de véhicule », et la demande n'est pas enregistrée.

### Lot 5 : espace garagiste

**US-30. Traiter les demandes au téléphone** (basique, B-24, P4)
En tant que garagiste, je veux voir mes demandes sur mon téléphone et appeler en un geste, afin de rappeler entre deux interventions.
- Étant donné trois demandes « À rappeler », dont une de niveau « Ne roulez pas », et une demande « Traitée », quand j'ouvre la liste dans une fenêtre de 390 px, alors les demandes « À rappeler » précèdent la demande traitée, l'urgente est en tête, et chacune porte un lien d'appel.
- Étant donné une demande « À rappeler », quand j'appuie sur « Traitée », alors le statut et l'heure du changement sont enregistrés, et l'espace n'affiche aucun pourcentage ni aucune mesure de délai.
- Étant donné une fiche ouverte pour la première fois, quand elle est rendue, alors l'heure de première consultation est enregistrée et affichée ; les ouvertures suivantes ne la modifient pas.

**US-31. Déclarer une fermeture exceptionnelle** (basique, B-04 et B-05, P4)
En tant que garagiste, je veux signaler une fermeture en quelques secondes, afin qu'aucun client ne trouve porte close à cause du site.
- Étant donné l'accueil de l'espace garagiste ouvert sur un téléphone, quand j'appuie sur « Imprévu aujourd'hui » puis sur « Confirmer », alors la fermeture du jour est enregistrée et le statut public commence par « Fermé exceptionnellement ».
- Étant donné l'accueil de l'espace, quand je déclare une période, alors l'écran ne demande que trois champs (du, au, motif choisi dans une liste) et l'enregistrement demande trois gestes au plus.
- Étant donné une fermeture d'essai déclarée du lundi au samedi d'une semaine avec le motif « congés », quand un visiteur ouvre l'accueil le mercredi de cette semaine, alors le statut commence par « Fermé exceptionnellement » suivi de la date d'ouverture, le formulaire de rendez-vous ne propose aucune demi-journée de cette semaine, et le JSON-LD contient une `specialOpeningHoursSpecification` couvrant la période.
- Étant donné une fermeture enregistrée, quand la confirmation s'affiche, alors elle contient « Déclarez aussi cette fermeture sur votre fiche Google » et le lien de configuration vers les horaires exceptionnels de la fiche.

**US-32. Retirée du v1.** La mesure du délai de rappel dépendait d'un statut que le garagiste ne saisira pas (pièges 1 et 3, AE-34).

**US-33. Un accès protégé, sans mot de passe** (basique, B-30, P4)
En tant que garagiste, je veux entrer dans mon espace sans mot de passe à retenir, et que mes demandes ne soient lisibles que par moi, afin de ne jamais être bloqué dehors ni exposer mes clients.
- Étant donné une demande de lien de connexion, quand elle est envoyée, alors le lien part vers le seul canal de configuration, quel que soit le contenu de la requête ; utilisé une fois, il ouvre une session ; réutilisé, il est refusé ; après 15 minutes, il est refusé avec « Ce lien a expiré : demandez-en un nouveau ».
- Étant donné une visite de `/garagiste` sans session, quand la page est demandée, alors elle propose « Recevoir un lien de connexion » et la réponse porte l'en-tête `X-Robots-Tag: noindex`.
- Étant donné une session ouverte, quand le cookie est posé, alors il porte `HttpOnly`, `Secure`, `SameSite=Lax` et `Path=/garagiste`.
- Étant donné une requête POST de l'espace venue d'une autre origine ou sans jeton anti-falsification valide, quand le serveur la reçoit, alors elle est refusée et rien n'est modifié.
- Étant donné la commande `pnpm garagiste:reinitialiser` exécutée, quand l'ancienne session est présentée, alors elle est rejetée.
- Étant donné cinq demandes de lien de la même adresse dans l'heure, quand une sixième arrive, alors elle est refusée avec le délai d'attente ; étant donné vingt demandes globales dans l'heure, quand une vingt et unième arrive, alors Anthony est alerté et le compte n'est pas verrouillé.

**US-34. Purge automatique** (basique, B-24, P4 et P1)
En tant que client, je veux que ma demande ne soit pas conservée indéfiniment, afin que mes coordonnées ne traînent pas.
- Étant donné une demande dont la plus récente des deux dates, création ou dernier changement de statut, remonte à plus de 12 mois, quand la purge s'exécute (au démarrage ou à son passage quotidien), alors la demande n'existe plus en base et le journal de purge compte une suppression.
- Étant donné une demande « À rappeler » créée il y a 13 mois et jamais modifiée, quand la purge s'exécute, alors elle est supprimée ; une demande créée il y a 13 mois mais passée à « Traitée » il y a 2 mois est conservée.

**US-49. Signaler un changement** (basique, D5, P4)
En tant que garagiste, je veux signaler un changement d'horaires ou de prix en un message, afin que le site reste exact sans que je touche à un fichier.
- Étant donné l'espace garagiste, quand j'envoie un signalement (type choisi dans la liste horaires habituels, prix, prestation, autre, et un texte court), alors un message structuré part vers Anthony, la confirmation l'annonce, et le fichier de configuration n'est pas modifié.

**US-51. Le résumé du mois** (basique, D5, P4)
En tant que garagiste, je veux savoir si le site m'amène du monde, afin de juger s'il vaut son coût.
- Étant donné 12 demandes et 640 pages servies en septembre, hors robots déclarés, quand j'ouvre l'espace en octobre, alors il affiche « Septembre : 12 demandes reçues par le site, 640 pages consultées (les appels passés depuis le site ne sont pas comptés) ».
- Étant donné une page publique servie, quand le compteur l'enregistre, alors aucun cookie n'est posé et aucune adresse n'est conservée.

### Lot 6 : contenus de confiance

**US-35. Des tarifs datés** (performance, P-08, P3)
En tant que client qui prépare un entretien, je veux lire les prix TTC, ce qu'ils comprennent, pour quel véhicule et depuis quand ils valent, afin de comparer sans mauvaise surprise.
- Étant donné des prix validés, quand la page Tarifs est rendue, alors le taux horaire TTC et le premier contrôle figurent en tête, et chaque ligne affiche la famille, ce qu'elle comprend, le véhicule de référence ou la catégorie, le prix TTC et la date d'effet, suivie de « Votre prix exact au devis, avant travaux ».
- Étant donné un prix dont la date d'effet a plus de 6 mois, quand j'ouvre l'espace garagiste, alors il signale ce prix à revoir avec sa famille et sa date d'effet.

**US-54. Collecter les avis au comptoir** (basique, B-21 et AE-01, P4)
En tant que garagiste, je veux inviter mes clients satisfaits à laisser un avis, sans rien promettre en échange, afin de sortir de l'absence d'avis.
- Étant donné le lien d'avis validé, quand l'affichette est générée, alors c'est un PDF au format A6 dont le code QR encode l'adresse `/avis` du domaine canonique, qui porte le nom « BF Auto » et ne contient aucune contrepartie.
- Étant donné la configuration, quand le modèle de SMS après intervention est généré, alors il contient l'adresse `/avis` et aucune contrepartie.

### Lot 7 : qualité et mise en ligne

**US-37. Rapide sur téléphone** (performance, P-01 à P-03, P1)
En tant qu'automobiliste mal couvert, je veux un site qui s'affiche aussitôt, afin de ne pas perdre de temps en panne.
- Étant donné le build de production servi localement, quand Lighthouse CI, en version figée et préréglage mobile, mesure chaque gabarit public 5 fois, alors la médiane respecte FCP ≤ 1,0 s, LCP ≤ 1,5 s, TBT ≤ 50 ms et CLS ≤ 0,02, et les notes Accessibilité, Bonnes pratiques et Référencement valent 100.
- Étant donné la porte de poids, quand elle mesure l'accueil, alors il pèse au plus 100 Ko transférés compressés hors photo réelle et ne charge aucun JavaScript hors l'exception nommée.

**US-38. Utilisable au clavier et au lecteur d'écran** (basique B-16, performance P-04, P3)
En tant que client qui navigue au clavier ou avec un lecteur d'écran, je veux atteindre chaque fonction, afin d'utiliser le site comme tout le monde.
- Étant donné chaque page publique et chaque page de l'espace garagiste, quand axe-core l'analyse, alors il ne rapporte aucune violation des règles WCAG 2.2 A et AA.
- Étant donné l'accueil dans une fenêtre de 390 px, quand je le parcours uniquement avec la touche Tab, alors chaque lien et chaque champ reçoit un focus visible qui n'est jamais masqué par la barre fixe.

**US-39. Chaque page est atteignable** (basique, garde du piège 27, P1 à P3)
En tant que visiteur, je veux atteindre chaque page par la navigation, afin qu'aucune fonction n'existe sans chemin pour y arriver.
- Étant donné l'accueil, quand un robot de test suit uniquement les liens de navigation, alors il atteint chaque page du plan public sans saisir d'adresse.
- Étant donné chaque page publique, quand son pied de page est lu, alors il contient un lien vers `/vos-droits`, `/mentions-legales` et `/confidentialite`.

### Portes sans user story

Ces attributs se vérifient par une porte nommée, exécutée à chaque lot concerné et vue
rouge par injection avant d'être considérée comme acquise.

| Attribut | Porte | Lot |
|---|---|---|
| B-26 Logo | Rendu à 32 px comparé à une référence ; aucun trait de moins de 1 mm à 5 cm de large ; versions une couleur et négatif présentes ; exports SVG, PDF vectoriel et PNG présents | 0 |
| B-14 Français sans pictogramme | Balayage du texte rendu de chaque page : aucun emoji ni pictogramme décoratif (plages Unicode des symboles), aucun tiret cadratin ni demi-cadratin (AE-32), aucun libellé d'interface en anglais d'une liste tenue à jour | 0 |
| B-21 Aucune image de banque | Chaque image publiée a son origine consignée dans `docs/collecte/` (photo prise en séance, accord de la personne) ; une image sans origine consignée fait échouer la porte | 1 |
| B-28 Socle de confiance rendu | Test HTTP de l'accueil : prénom du garagiste, photo de façade avec texte alternatif, taux horaire TTC, premier contrôle et deux engagements présents, lus depuis la configuration | 1 |
| D12 Frontières hexagonales | dependency-cruiser : import entre contextes et paquet dans `domaine/` refusés, vus rouges par injection | 0 |
| P-02 Poids | Mesure des octets transférés par gabarit, budgets par type de ressource, liste des domaines contactés | 0 |
| P-05 Réponse serveur | Journal applicatif : temps de traitement p95 ; sonde : délai avant le premier octet p95 sur 7 jours et disponibilité mensuelle | 7 |
| P-11 Clarté | Script de longueur moyenne des phrases et de définition des termes du lexique à leur première occurrence | 6 |
| P-12 Images | Script : format AVIF ou WebP, `srcset`, dimensions déclarées, poids du premier écran | 1 |
| P-13 Mouvement | Porte CSS : aucune transition de plus de 200 ms, règle `prefers-reduced-motion` présente, aucune animation infinie | 0 |
| P-14 Notification | Journal applicatif : délai de remise au prestataire (p95), délai de première consultation relevé pour Anthony | 2 |
| P-15 Amplitude | Test navigateur à 390 × 844 : amplitude validée visible sans défilement | 1 |
| P-17 Carte | Présence de l'attribution OpenStreetMap et d'un texte alternatif, poids ≤ 60 Ko, absente de l'accueil | 6 |
| D11 Sonde et sauvegarde | `/sante` répond 200 puis 503 sur échec simulé ; restauration d'une sauvegarde `.backup` vérifiée sur une base d'essai | 7 |

## Ordre d'exécution (lots)

| Lot | Contenu | US | Porte de sortie |
|---|---|---|---|
| 0. Socle, légal et collecte | Squelette hexagonal, contrats et règles de frontières, racine de composition unique, fichier de configuration à statuts, politique de publication, porte de démarrage et mode production par défaut, port `Horloge` et fuseau, jetons de couleur et gabarits, en-tête, pied et barre fixe, mentions légales, confidentialité, « Vos droits chez nous » (bloc réglementaire, médiateur), JSON-LD, socle de référencement, en-têtes de sécurité et de cache, pages d'erreur, budgets de poids et Lighthouse outillés ; kit de collecte (questionnaire, fiche papier) et séance 1 ; recherche d'antériorité et domaine (D13) | US-01 à US-07, US-36, US-41, US-42, US-48 | Tests domaine, cas d'usage et HTTP verts ; porte de démarrage vue rouge par injection (donnée bloquante, mode inconnu) ; règles de frontières vues rouges ; budgets mesurés sur chaque gabarit existant ; séance 1 tenue et consignée ; antériorité et domaine consignés |
| 1. Accueil | Mise en page trois colonnes et téléphone, statut, horaires, zone « Vos questions », barre fixe selon le statut, encart « Nouveau nom », `/avis`, lien SMS | US-08 à US-10, US-40, US-43, US-52 | Tests navigateur à 390 × 844, 320 × 568 et 1440 × 900, avec et sans JavaScript |
| 2. Demandes | Agrégat `Demande` et objet `Vehicule`, SQLite sur disque persistant, notificateur (SMS, courriel, console), file de renvoi, relance, `/sante`, formulaire unique à quatre types, jeton de confirmation, rappel à la demi-journée, anti-abus sans rejet silencieux, limite par client réel | US-11 à US-16, US-46, US-47, US-50 | Envoi réel au navigateur ; échec de notification simulé ; champ piège et envoi rapide injectés ; redémarrage testé |
| 3. Orientation | Arbre versionné et sa porte, pages de questions et de résultats, écran d'arrêt, planchers, relais, fiche, livret de relecture ; séance 2 | US-17 à US-25, US-45, US-53 | Porte de l'arbre vue rouge (sixième question, « Je ne sais pas » retiré, mot interdit, plancher violé, signe obligatoire retiré) ; parcours complet sans JavaScript ; livret relu et signé |
| 4. Catalogue | Familles d'intervention et mots courants, pages de famille, « Ce que nous ne faisons pas », demande de devis | US-26, US-28, US-29, US-44 | Formats de plaque testés ; balayage des mots interdits ; prix identique entre page de famille et tarifs |
| 5. Espace garagiste | Connexion par lien, demandes, fermetures exceptionnelles, signaler un changement, résumé mensuel, purge | US-30, US-31, US-33, US-34, US-49, US-51 | Test navigateur sur téléphone ; falsification de requête refusée ; purge testée sur données datées |
| 6. Contenus de confiance | Tarifs, accès et horaires, carte statique, photos du socle, affichette et modèle de SMS | US-35, US-54 | Relecture juridique de D224-25-2 et de la réponse sur la garantie ; données validées par Anthony |
| 7. Qualité, exploitation et mise en ligne | Rejeu complet des portes, Lighthouse, axe-core, navigation, disque, sauvegarde, sonde, jury d'utilisateurs, instance permanente | US-37 à US-39 | Jury au niveau excellent (protocole ci-dessous) ; accord d'Anthony avant tout déploiement |
| 8. Fiche Google et comptoir, sans code | Fiche alignée (nom, catégories, horaires et horaires exceptionnels, services et prix de la même source, photos, lien du site), Search Console, affichette posée au comptoir, modèle de SMS remis, question des plateformes posée (D10), relevé du pack local à trente jours du renommage | aucune | Liste de contrôle cochée et datée dans `docs/collecte/fiche-google.md`, captures avant et après |

Règles d'enchaînement :
- **Aucune mise en ligne avant** : les lots 0 à 6 verts, le jury au niveau excellent (lot 7), le lot 8 fait jusqu'au lien du site sur la fiche, et l'accord d'Anthony. Une demande publique sans espace pour la lire serait une écriture sans lecture (piège 2) ; un site sans bloc réglementaire serait hors la loi.
- Les portes de performance (P-01 à P-03) et d'accessibilité (P-04) tournent **dès le lot 0** sur chaque gabarit existant ; le lot 7 les rejoue sur l'ensemble, il ne les introduit pas.
- Un lot qui n'ajoute aucun test n'a rien démontré (piège 6) ; chaque porte de garde est vue rouge par injection avant d'être considérée comme acquise.
- La séance 1 se tient au lot 0 et la séance 2 à la fin du lot 3 ; les données bloquantes sont relancées selon les dates du questionnaire, pour ne pas découvrir au lot 7 qu'un médiateur ou des horaires manquent. Le développement avance sur la configuration d'essai ; seules la production et la mise en ligne attendent les données.
- Le logo n'est finalisé et imprimé qu'après D13 (antériorité consignée et domaine choisi).

### Protocole du jury (lot 7)

- **Jurés** : six, simulés par des agents distincts de ceux qui ont construit le site, **en aveugle** : ils reçoivent l'adresse du site servi en production et leurs tâches, jamais le Kano, le code ni les critères d'acceptation. J1 automobiliste inquiet (P1), sur téléphone ; J2 client qui cherche une pièce (P2) ; J3 client de plus de 60 ans qui prépare un entretien (P3) ; J4 garagiste (P4), espace garagiste sur téléphone ; J5 senior qui navigue au clavier avec un lecteur d'écran ; J6 comparateur, qui juge le site face au site d'Europe Auto, à la fiche Speedy Thiais et à la page Vroomly de Po Mécanique. Anthony peut ajouter des utilisateurs réels ; le rapport dit qui est simulé et qui ne l'est pas.
- **Tâches chronométrées**, sur téléphone (390 × 844), J6 faisant aussi l'ordinateur : trouver le téléphone ; savoir si c'est ouvert maintenant ; obtenir une orientation pour un bruit au freinage ; demander un devis pour des plaquettes ; comprendre ce que coûteront un premier contrôle et une vidange ; dire s'il confierait sa voiture, et pourquoi. J4 lit une demande urgente depuis le message reçu, puis déclare une fermeture imprévue.
- **Grille publiée**, notée sur 10 par critère : trouver le téléphone ; savoir si c'est ouvert ; obtenir une orientation ; demander un devis ou un rendez-vous ; comprendre les prix ; confiance. J4 est noté sur la lecture de la demande, la fermeture et la confiance dans l'outil. Note d'un juré : moyenne de ses critères.
- **Seuil « excellent »** : moyenne des jurés ≥ 9, aucun juré sous 8, aucune basique manquée (une basique constatée absente par un seul juré suffit à refuser le niveau).
- **Contre la complaisance** : chaque note de 9 ou plus cite l'observation qui la fonde (écran, temps, texte lu) ; toute remarque factuelle ouvre une passe de correction ; le jury est rejoué jusqu'à épuisement des axes ; grille, notes, temps, captures et passes sont conservés dans `docs/jury/`, un fichier par passe.

## État appliqué

À remplir après réalisation de chaque lot. Aucune US n'est réalisée au 2026-09-23.

| US | Lot | État | Preuve (test nommé, capture, mesure) | Date |
|---|---|---|---|---|

## Anomalies détectées et corrigées

Aucune à ce jour.

| N° | Constat | Cause | Correction | Garde ajoutée | Date |
|---|---|---|---|---|---|

## Corrections de relecture écartées

Deux relectures adversariales (notes 6 et 7 sur 10, 75 corrections) ont été reçues le
2026-09-23. Aucune correction n'a été écartée en totalité ; six l'ont été en partie. Le
reste de chacune est appliqué.

| Relecture | Correction | Volet écarté | Motif |
|---|---|---|---|
| 1 | Fermetures déclarées en un geste (D5) | Le lien signé permanent enregistré sur l'écran d'accueil | Un lien signé permanent est un identifiant au porteur qui circule (capture, partage) et ne se révoque qu'en changeant la clé. La session de 90 jours sur son téléphone, avec le raccourci d'écran d'accueil, donne le même geste unique et se révoque (US-33). Le bouton « Imprévu aujourd'hui », le rappel vers la fiche Google et la porte des trois gestes sont appliqués. |
| 1 | Statut « rappelée » qui ment (D5, P-09) | L'enregistrement de l'appel lancé, par `sendBeacon` ou par redirection serveur vers `tel:` | `sendBeacon` exige du JavaScript (budget de 0 Ko, P-02) ; une redirection HTTP vers `tel:` n'est pas garantie sur tous les navigateurs mobiles et fragiliserait l'appel, basique B-01. La relecture proposait elle-même l'autre issue, appliquée : P-09 et US-32 sortent du v1, deux statuts, et la première consultation de la fiche est mesurée côté serveur (P-14). |
| 1 | Compteur de fréquentation (D9, D12) | Le comptage des clics « Appeler » | Même motif que ci-dessus. Le compteur agrégé des pages servies et le résumé mensuel sont appliqués ; la ligne dit que les appels ne sont pas comptés (US-51). |
| 2 | Écran d'arrêt (D3) | « Appeler » en action principale et « Être rappelé » en second | Retenu l'ordre de la relecture 1 : mise en sécurité et 112, assistance de l'assureur, remorquage vers BF Auto, puis le garage. Pour une voiture qui ne doit pas rouler, le geste utile est l'assistance et une destination ; le garagiste, sous une voiture, ne décroche pas toujours. La phrase de confirmation proposée (« n'attendez pas notre rappel ») est appliquée (US-18). |
| 2 | Cookie de session de l'espace garagiste (D5) | `SameSite=Strict` | Un lien de notification ouvert depuis un webmail est une navigation intersites : un cookie `Strict` n'y est pas envoyé et le garagiste serait renvoyé à la connexion à chaque demande. `SameSite=Lax` est retenu ; la falsification reste bloquée par `Origin` et le jeton anti-falsification sur tout POST, et aucun GET ne change d'état. Le reste (`HttpOnly`, `Secure`, `Path=/garagiste`, commande de réinitialisation) est appliqué. |
| 2 | Échec de notification (D5) | Le compteur des demandes « nouvelles » de plus de 24 heures sur l'accueil de l'espace | Il lirait un statut que le garagiste ne saisira pas (pièges 1 et 3, AE-34), pour la même raison que P-09. La file de renvoi, `/sante` en 503 et la sonde sont appliqués ; la relance du niveau 1 couvre le risque d'une demande urgente oubliée. |

## Journal de relecture

**2026-09-23, version 2.** Intégration des deux relectures adversariales. Ce qui a changé :

- **Renommage** : « Premier avis » devient « Orientation en 5 questions » (`/orientation`, titre « Un souci avec votre voiture ? ») ; le mot « avis » est réservé aux avis Google et interdit dans le parcours par la porte de contenu (D3, AE-37, US-17).
- **Relais et notification** : canal de notification choisi en séance et bloquant (SMS ou courriel), message suffisant à lui seul, file de renvoi, `/sante` en 503, relance unique du niveau « Ne roulez pas » ; P-14 mesure la première consultation, pas la seule remise au serveur d'envoi (D5, US-16, US-50).
- **Collecte** : kit de collecte au lot 0, deux séances de 30 minutes, livret imprimable de l'arbre relu à voix haute ; la relecture de l'arbre ne bloque plus le site entier, seulement l'orientation, et les branches non validées sont élaguées (D3, D8, US-25, US-53).
- **Socle de confiance bloquant** : prénom, photo de façade, taux horaire, premier contrôle, deux engagements, réponse sur le rendez-vous ; registre public déplacé en mentions légales ; nouvelles basiques B-28 et B-29 (D6, D8).
- **Anti-abus** : plus aucun rejet silencieux, écran « Confirmez l'envoi », champ piège durci, envois non confirmés comptés, `trustProxy` et clé de limitation définis (D9, US-15, US-47, AE-35).
- **Orientation** : libellés précis du voyant rouge et de la fumée, règle d'exclusivité de Q2, planchers par branche (jamais « Pas d'urgence » sur bruit, freinage, vibrations et direction), écran d'arrêt réordonné autour de l'assistance et du remorquage, Q1 en liens directs, lien « Revenir à la question précédente », accueil sans rendez-vous affiché aux niveaux 2 et 3 (D3, US-18 à US-24, US-45).
- **Espace garagiste** : connexion par lien sans mot de passe, cookie et anti-falsification définis, commande de réinitialisation, bouton « Imprévu aujourd'hui », rappel de la fiche Google, `specialOpeningHoursSpecification`, bouton « Signaler un changement », résumé mensuel, deux statuts ; P-09 et US-32 retirées (D5, US-30, US-31, US-33, US-49, US-51).
- **Demandes** : champ « Quand pouvez-vous répondre au téléphone ? », rappel annoncé à la demi-journée et jamais à l'heure, « enregistrez ce numéro », « Une autre date », motif sur le formulaire court, « Ce que nous ne faisons pas », confirmation par jeton aléatoire (D4, US-11 à US-13, US-44, B-30).
- **Catalogue** : fusion des familles de pièces et des prestations en familles d'intervention (`/entretien-reparation/<famille>`, `/tarifs` agrégée), recherche retirée au profit des mots courants, identification du véhicule exigée pour un devis, normalisation des plaques, libellés de gamme, port `IdentificationVehicule` supprimé (D1, US-26 à US-28 ; US-27 retirée).
- **Prix** : plus de minimum de 8 prix, véhicule de référence ou grille par catégorie, phrase « Votre prix exact au devis, avant travaux », signalement à 6 mois (P-08, US-35).
- **Mise en page** : barre fixe sur toutes les pages, calculée depuis le statut et masquée pendant la saisie ; accroche liée aux engagements ; ligne des familles dans le premier écran ; carte retirée de l'accueil (D7, US-08, US-43, P-17).
- **Avis** : encart « Nouveau nom » déplacé en bas de page, « Laissez un avis Google », `/avis`, affichette à code QR et modèle de SMS ; suppression du scénario de note à 90 jours (D6, US-10, US-54).
- **Exploitation** : disque persistant Render, WAL, purge et relance dans le processus, sauvegarde quotidienne, région Francfort, sonde chiffrée, en-têtes de cache, coût mensuel à soumettre au garagiste (D11, US-46, US-48).
- **Sécurité et légal** : production par défaut, mode relecture explicite et local ; courriel public, prestataires et région d'hébergement bloquants ; journaux sans chaîne de requête ; bloc réglementaire au lot 0 (D8, D9, US-05, US-14, US-36).
- **Fuseau horaire** : `Horloge` en UTC, conversion à l'heure de Paris, formateur unique « 19 h », « 8 h 30 », scénarios d'heure d'été, d'heure d'hiver et de longue fermeture (D12, US-02).
- **Architecture** : contrats nommés dans `src/contrats/`, règles de frontières vues rouges, « FastAPI » corrigé en « Fastify », port `GenerateurJeton` (D12).
- **Nom, marque, domaine** : nouvelle décision D13 (antériorité INPI et TMview, nom commercial, domaine avec Choisy, SPF, DKIM, DMARC), bloquante.
- **Référencement et fiche Google** : socle B-27 (plan, `robots.txt`, canonique, descriptions, 301, Open Graph) ; lot 8 sans code pour la fiche Google et le comptoir ; question des plateformes posée au garagiste ; phrase fausse « aucun indépendant local n'affiche le moindre prix » corrigée (D6, D10, US-42).
- **Logo** : critères physiques (une couleur, négatif, enseigne à 20 m, broderie, photocopie) et exports SVG, PDF, PNG (B-26).
- **Mesure** : P-01 fait porte sur FCP, LCP, TBT et CLS en médiane de 5 exécutions, P-03 garde les notes Accessibilité, Bonnes pratiques et Référencement ; budgets de P-02 refaits (100 Ko, JavaScript à 0 Ko) ; P-11 sur un périmètre et un lexique ; table des portes sans user story (B-14, B-21, B-26, B-28, D12, P-02, P-05, P-11 à P-15, P-17, D11).
- **Jury** : protocole écrit, jurés en aveugle, juré lecteur d'écran et juré comparateur, tâches chronométrées, seuil « excellent » chiffré.
- **Nouvelles US** : US-40 à US-54 ; **retirées** : US-27, US-32 ; **nouvelles À éviter** : AE-34 à AE-41 ; chiffres de sondage datés et limités à une tendance.

**Écarts constatés avec le socle déjà codé** (`src/`, `donnees/garage.json`), à aligner au
lot 0 : les adresses de `src/contrats/chemins.ts` (`/catalogue`, `/diagnostic`, `/contact`)
doivent devenir `/entretien-reparation`, `/orientation` et `/demande` ; le contexte
`diagnostic` et le contrat `resume-diagnostic` deviennent `orientation` et
`ResumeOrientation` ; `libelleHeure` rend « 19 h 00 » là où le Kano exige « 19 h » ; le
libellé « Horaires à confirmer » ne doit jamais être rendu en production, les horaires
étant bloquants ; l'accroche provisoire de `donnees/garage.json` diffère de D7 ; le fichier
de configuration ne porte pas encore de statut par valeur ni les blocs du socle, du canal
de notification et du domaine. Le module client d'envoi unique est l'exception
JavaScript nommée admise par P-02. Les libellés de statut « ouvre » (autre jour) et
« rouvre » (après la pause) du socle sont repris par le Kano.

## Arbitrages de l'orchestrateur (2026-09-23, version 2.1)

Trois arbitrages s'imposent au texte ci-dessus quand il diverge. Ils ne touchent aucun
garde-fou de D3, D8 ou D9.

1. **« Pré-diagnostic » plutôt qu'« Orientation ».** Libellé de navigation « Pré-diagnostic »,
   adresse `/pre-diagnostic`, titre de page « Un souci avec votre voiture ? », sous-titre
   « Pré-diagnostic gratuit en 5 questions au plus. Le diagnostic se fait à l'atelier. »
   Contexte de code `pre-diagnostic`, contrat `ResumePreDiagnostic`, paramètre de demande
   `prediagnostic`. Motif : c'est le mot du client sur la maquette (« Diagnostic mécanique
   rapide »), un terme que les conducteurs connaissent, et le préfixe dit sans ambiguïté que
   ce n'est pas l'examen de l'atelier ; « Orientation » seul ne dit pas à quoi sert l'entrée
   de menu. Le mot « avis » reste interdit dans le parcours (AE-37).
2. **Catalogue : `/pieces-et-reparations`.** Les familles d'intervention de D1 sont
   conservées ; libellé de navigation et de bloc « Pièces et réparations » (le bloc d'accueil
   garde le titre « Catalogue : pièces et réparations » de la maquette). Paramètre de demande
   `famille`. `/tarifs` reste la vue agrégée des mêmes données.
3. **Démonstration pour le jury et pour Anthony.** Le mode relecture local de D8 est complété
   d'un mode `demonstration` explicite : les valeurs `a_valider` accompagnées d'une
   proposition (horaires types, familles, engagements) s'affichent normalement, et un bandeau
   discret en tête de chaque page l'annonce (« Version de démonstration : contenus à confirmer
   par le garage »). Ce mode ne démarre jamais en production (porte de démarrage inchangée).
4. **Vente de pièces au comptoir : confirmée** (Anthony, 2026-09-23 : « vente + pose »). L'option
   « Pièce seule, à retirer au garage » de D1 est publiée à côté de la pose à l'atelier ; la
   demande de devis porte le choix « Retrait au garage » ou « Pose à l'atelier ». La partie
   « Pièces détachées » passe en tête de navigation et dans le bandeau d'ouverture (demande
   d'Anthony : « mettre plus en avant la partie pièce détachée »). Vérification de
   compatibilité par le garagiste avant toute commande, dans les deux cas.
5. **Palette et logo** : graphite et orange, logo « écrou » (voir `kano-couleurs.md`, décision
   finale, et `docs/logo/final-ecrou/`).
