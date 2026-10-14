> Version 1 du 2026-09-23, périmée. Remplacée par `docs/conception/kano-site-bf-auto.md` (version 2, voir son « Journal de relecture »). Conservée pour la traçabilité seulement : ne pas s'en servir pour concevoir ni coder.

# Analyse Kano : site BF Auto

Version 1 du 2026-09-23, rédigée avant toute ligne de code. À mettre à jour après chaque
lot (tableaux « État appliqué » et « Anomalies » en fin de document). Ce document tranche :
chaque doute réel s'y conclut par une décision motivée. Toute donnée d'identité non
confirmée par le brief reste marquée `[À VALIDER : ...]` et n'est jamais présentée comme
un fait.

## Verdict

1. On construit un site rendu côté serveur, de moins de 150 Ko, qui répond en une seconde sur téléphone à trois intentions (« ma voiture a un souci », « je cherche une pièce », « je veux un rendez-vous »), avec le téléphone et le statut d'ouverture toujours à portée.
2. Le catalogue est une vitrine par familles qui débouche sur un devis vérifié par le garagiste ; le rendez-vous est une demande honnêtement nommée, confirmée par téléphone ; un espace garagiste minimal (demandes, fermetures exceptionnelles) empêche le site de mentir.
3. On refuse : panier et paiement en ligne, faux agenda, indicateur de stock, « compatible » automatique, avis, photos ou chiffres inventés, prix de réparation estimés, traceurs, bandeau de cookies, robot conversationnel.
4. Le pari différenciant : un « premier avis » en cinq questions au plus, qui tranche d'abord la sécurité, oriente sans promettre, et transmet au garagiste un dossier prêt à rappeler, là où tous les concurrents observés s'arrêtent à un champ libre ou à une prestation déjà nommée.
5. Sans avis, la confiance se construit par la preuve vérifiable (tarifs datés, droits du client écrits, identité légale consultable, statut d'ouverture exact) ; toute donnée non validée par le garage reste invisible, jamais inventée.

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
- **Peurs** : le danger, le coût, se faire avoir. 52 % des automobilistes ne font pas confiance aux garagistes en général, 60 % en Île-de-France (Ifop 2015) ; 75 % des femmes se sentent perçues comme « faciles à arnaquer » (Ifop pour Caroom 2021).
- **Ce qu'il veut en trente secondes** : savoir s'il peut rouler, joindre quelqu'un, savoir ce que coûtera le contrôle.
- **Chez les concurrents** : un champ de texte libre (Midas) ou une prestation à nommer d'avance (iDGarages, Vroomly).
- **Réussite** : il sait quoi faire tout de suite, et le garage le rappelle en connaissant déjà son cas.

### P2. Le client qui cherche une pièce

- **Situation** : il sait, ou croit savoir, ce qu'il lui faut (plaquettes, batterie, balais, ampoule), souvent sur le conseil de quelqu'un. Il a vu des prix chez Oscaro, Carter-Cash ou Norauto Belle Épine (batterie « dès 64,99 € », étude 06).
- **Peurs** : se tromper de pièce (les leaders qualifient leur filtre par plaque d'« indicatif » dans leurs CGV), payer la pose ailleurs, se voir refuser le montage d'une pièce apportée.
- **Ce qu'il veut** : un prix, un délai, la certitude que c'est la bonne pièce, quelqu'un qui la pose.
- **Réussite** : un devis « pièce posée », vérifiée pour sa voiture, obtenu sans compte ni paiement.

### P3. Le client qui prépare un entretien

- **Situation** : révision, vidange, pneus, freins qui commencent à siffler, contrôle technique qui approche. Il planifie, compare (ancres idGarages « dès 59 € », moyenne Vroomly de la vidange à 154 € à Choisy-le-Roi, étude 06), et choisit le moment (soir, samedi).
- **Profil** : souvent plus âgé, attaché à « son » garagiste (96 % des plus de 65 ans lui font confiance, Ifop 2015) ; exigeant sur la lisibilité.
- **Peurs** : être poussé à la consommation (94 % jugent important de ne pas l'être), perdre la garantie constructeur en sortant du réseau.
- **Réussite** : une demande de rendez-vous envoyée en moins de deux minutes, en connaissant le prix du forfait et ce qu'il comprend.

### P4. Le garagiste de BF Auto, qui exploite le site

- **Situation** : il travaille à l'atelier, les mains occupées ; le téléphone sonne sous la voiture. Aucun temps pour l'administratif ; il utilise son téléphone, pas un ordinateur. Son nom n'est pas connu du dossier `[À VALIDER : identité et accord du garagiste pour apparaître sur le site]`. Anthony valide les données avant leur publication.
- **Ce qu'il veut** : des demandes complètes (véhicule, besoin, urgence, moment de rappel), pas de pourriel, aucune promesse faite en son nom qu'il ne peut pas tenir, signaler une fermeture en trente secondes.
- **Peurs** : un site qui promet un créneau qu'il n'a pas, des clients qui trouvent porte close, un site hors la loi.
- **Réussite** : il rappelle en connaissant le cas ; en dehors des fermetures exceptionnelles, il ne saisit rien.

## Décisions structurantes

### D1. Le modèle du catalogue de pièces

**Question.** La maquette place « CATALOGUE : pièces garage » en tête de la colonne gauche.
Que montre ce catalogue, et jusqu'où va-t-il (prix, stock, compatibilité, paiement) ?

**Options.**
- A. Boutique en ligne : fiches article, panier, paiement, retrait ou livraison.
- B. Catalogue article par article avec stock affiché, sans paiement.
- C. Vitrine par familles de pièces ; chaque famille débouche sur une demande de devis ; pièce vérifiée et posée par le garagiste ; paiement à l'atelier.
- D. Catalogue PDF à télécharger.
- E. Pas de catalogue, renvoi au téléphone.

**Décision : C.**
- 10 à 14 familles à plat, nommées dans les mots du client : Freinage, Batterie, Pneus, Vidange et filtres, Distribution, Embrayage, Amortisseurs et suspension, Échappement, Démarrage et charge, Climatisation, Éclairage, Essuie-glaces, Bougies et allumage, Liquides. Seules les familles que le garagiste confirme traiter sont publiées `[À VALIDER : liste des familles traitées]`.
- Fiche famille : à quoi sert la pièce (une phrase), les signes d'usure (renvoi vers le premier avis), ce que fait le garage (vérification, pose), un prix « à partir de » TTC daté seulement s'il est validé, sinon « Prix sur devis ».
- Issue unique : « Demander un devis pour cette pièce », qui ouvre la demande de type « devis pièce » avec la famille pré-remplie. Le site dit « demande », jamais « panier ».
- Offre par défaut : pièce posée par le garage. L'option « Pièce seule, à retirer au garage » n'apparaît que si la vente au comptoir est confirmée `[À VALIDER : vente de pièces au comptoir]`. La règle sur les pièces apportées par le client n'est publiée qu'une fois arrêtée `[À VALIDER : politique pièces apportées]`.
- Gamme souhaitée : neuve, issue de l'économie circulaire, ou sans préférence (attractive AT-4).
- Identification du véhicule : plaque facultative, acceptée au format SIV (`AB-123-CD`) comme à l'ancien format FNI (`1234 AB 56`) ; à défaut, marque (liste), année (liste), énergie (liste), modèle en texte court facultatif. Ni numéro VIN exigé, ni photo de carte grise. Port `IdentificationVehicule` dont l'adaptateur v1 est la saisie ; une API de plaque, payante, restera un adaptateur futur.
- Jamais : indicateur de stock, mention « compatible », délai promis non validé.

**Motif.** A perd d'avance face à 300 000 à 6,7 millions de références et au retrait en
une heure de Carter-Cash, et fait basculer dans la vente à distance : CGV, rétractation de
14 jours même en retrait magasin, fonction « renoncer au contrat ici » en vigueur depuis
le 19/06/2026 (études 03 et 05). B affiche un stock qu'aucun flux n'alimente, puisqu'aucun
logiciel de stock n'est connu : lecture sans écriture et zéro qui ment (pièges 1 et 3).
D est illisible sur téléphone et périmé dès sa sortie (Garage Clément). E trahit la
maquette. C prolonge ce que fait un garage : la vérification humaine de compatibilité,
que les leaders renvoient au client dans leurs CGV (Carter-Cash) ou vendent sur abonnement
(Autodoc), et la pose, que les plateformes sous-traitent. Rien de ce qui s'affiche ne
dépend d'une donnée que personne n'entretient.

### D2. Le contenu de la zone « ? »

**Question.** Le client a dessiné un grand point d'interrogation sous le catalogue sans
le définir. Qu'y met-on ?

**Options.**
- A. Foire aux questions pratique générique (paiement, accès, délais).
- B. Aide à l'identification des pièces (où lire la plaque, le VIN).
- C. « Vos questions » centrée sur la confiance : les questions qu'un nouveau client se pose avant de confier sa voiture, avec des réponses sourcées qui mènent à la page « Vos droits chez nous ».
- D. Guide des voyants.
- E. Assistant conversationnel.
- F. Promotions du moment.

**Décision : C.** Six questions au plus, en volets dépliables natifs (`<details>`,
fonctionnels sans JavaScript), dans cet ordre :

1. « Mon voyant est allumé : puis-je rouler ? » Réponse courte (voyant rouge ou voyant moteur qui clignote : arrêtez-vous) et lien vers le premier avis.
2. « Vais-je perdre la garantie de mon constructeur si je fais l'entretien ici ? » Non, à condition de respecter les préconisations du constructeur : règlement (UE) n° 461/2010, prolongé jusqu'au 31/05/2028 par le règlement (UE) 2023/822 ; fiche DGCCRF du 17/07/2023.
3. « Puis-je demander des pièces issues de l'économie circulaire ? » Oui, sauf les exceptions prévues par la loi (L224-67, D224-25-2) ; lien vers le bloc réglementaire.
4. « Faites-vous des travaux sans mon accord ? » Publiée seulement quand l'engagement est validé `[À VALIDER : devis écrit, accord avant tout travail supplémentaire]`.
5. « Combien coûte un devis ou un contrôle ? » Publiée seulement avec des prix validés et datés `[À VALIDER : devis gratuit ou payant, prix du contrôle à l'atelier]`.
6. « En cas de désaccord, qui peut m'aider ? » Publiée avec le médiateur réellement désigné `[À VALIDER : médiateur de la consommation]`.

Règle : une question dont la réponse repose sur une donnée non validée n'est pas affichée,
jamais remplacée par un texte d'attente. Les questions 1 à 3 reposent sur la loi et
sont publiables dès le premier jour : la zone n'est jamais vide. L'aide à la plaque et au
VIN (option B) vit dans le formulaire de devis, à l'endroit où la question se pose. Le
guide des voyants (option D) est différé (voir D3). E et F figurent en « À éviter ».

**Motif.** Le premier frein face à un garage inconnu est la confiance : 52 % de défiance
générale, 94 % refusent d'être poussés à la consommation (Ifop 2015), près de 40 % des
1 600 garages contrôlés en 2024 ont fait l'objet de suites (DGCCRF, 04/06/2026). BF Auto
n'a aucun avis : la zone « ? » répond aux peurs mesurées par des faits vérifiables, là où
la preuve sociale manque. C'est le gisement « obligation transformée en service ».

### D3. Le diagnostic par questions

**Question.** Comment tenir « Diagnostic mécanique rapide avec question simple » sans
promettre un diagnostic, sans exposer le garage, et sans perdre le conducteur en route ?

**Options.** A. Questionnaire long exhaustif. B. Conversation libre par IA. C. Page de
contenus à lire (symptômes, voyants). D. Questionnaire court, fermé, à urgence déduite
d'observables, qui aboutit à une conduite à tenir et à un relais humain.

**Décision : D**, avec les règles suivantes.

| Point | Décision | Motif |
|---|---|---|
| Nom | « Premier avis en 5 questions au plus », avec la mention permanente « Orientation gratuite : le diagnostic se fait à l'atelier. » Le mot « diagnostic » désigne uniquement l'examen à l'atelier. | Faute et lien de causalité du garagiste présumés depuis Cass. 1re civ. 11 mai 2022 ; un vérificateur de symptômes ne donne la bonne orientation que dans 57 % des cas (BMJ 2015). L'intention du client (rapide, simple) est gardée, le mot est réservé à l'acte. |
| Nombre de questions | 5 au plus avant le résultat, par construction : Q1 ce que vous remarquez, Q2 signes de danger (toujours en deuxième), Q3 à Q5 questions de la branche (3 au plus). 7 choix au plus par question. Une question par écran, affichée « Question 2, 5 au plus ». | Chaque question en moins améliore l'achèvement ; RepairPal tranche « ne démarre pas » sur 2 axes observables ; Wrenchly annonce moins de 2 minutes. |
| Point d'entrée | Q1 est affichée directement sur l'accueil : commencer coûte un clic. Choix : Un voyant s'allume ; Un bruit inhabituel ; Ça vibre ou la voiture tire d'un côté ; Une odeur, une fumée ou une fuite ; Elle démarre mal ou pas du tout ; Le freinage a changé ; Autre chose ou je ne sais pas. | Entrer par la perception, jamais par la prestation : toutes les plateformes françaises exigent une prestation nommée (étude 02). |
| Urgence | Q2 : « Remarquez-vous l'un de ces signes ? » Un voyant rouge ou le voyant moteur qui clignote ; La pédale de frein est molle ou s'enfonce ; De la fumée ou une odeur de brûlé ; La direction tire fortement ou devient dure ; Une perte soudaine de puissance ; Aucun de ces signes ; Je ne sais pas. Un seul signe coché déclenche l'écran d'arrêt et interrompt le questionnaire. | L'urgence se déduit d'observables, jamais d'une probabilité (RepairPal) ; omettre l'arrêt serait une faute de conseil. |
| Écran d'arrêt | Titre « Ne roulez pas. » ; consigne de mise en sécurité ; bouton Appeler ; demande de rappel. Si le garage est fermé : « Nous sommes fermés : contactez l'assistance de votre assureur. En cas de danger immédiat, appelez le 112. » Le dépannage par le garage n'est cité que s'il existe `[À VALIDER : dépannage proposé ou non]`. | Un conducteur en danger doit recevoir une consigne, pas une question de plus. |
| « Je ne sais pas » | Présent sur chaque question, y compris Q2. Réponse neutre qui n'écarte jamais une piste. En Q2, il fixe l'urgence au niveau 2 au moins et le résultat rappelle les signes qui imposent l'arrêt. Si toutes les réponses sont « je ne sais pas », le résultat dit : « Vos réponses ne suffisent pas pour orienter : l'atelier doit voir la voiture », avec appel et rappel. | La logique d'exclusion de Wrenchly (ce qui n'est pas signalé est absent) est dangereuse ; un état vide dit ce qui manque et quoi faire (piège 4). |
| Restitution | Dans l'ordre : (1) la conduite à tenir en toutes lettres, sur 3 niveaux : « Ne roulez pas : appelez-nous », « Roulez prudemment et faites contrôler dans les prochains jours », « Pas d'urgence : à vérifier lors d'un prochain passage » ; la couleur, sobre, n'est qu'un appui ; (2) 1 à 3 pistes sans pourcentage ni rang chiffré, chacune en une phrase simple suivie de « Ce que l'atelier vérifiera » ; (3) le contrôle proposé à l'atelier, avec son prix TTC, ce qu'il comprend et ne comprend pas, seulement s'il est validé ; (4) les actions : Appeler, Être rappelé, Imprimer ou partager la fiche ; (5) la mention « Premier avis établi à partir de vos seules réponses. Il ne remplace pas l'examen du véhicule. » Un lien secondaire vers la famille de pièces concernée est admis, jamais sur un résultat de niveau 1. | Modèles RepairPal (graduation) et Halfords (issue = contrôle réservable à prix connu). |
| Prix | Aucun prix ni fourchette de réparation, jamais. Seul le prix du contrôle à l'atelier, validé et daté. | Une fourchette que le devis contredit crée un litige (Wrenchly) ; la DGCCRF relève les frais de diagnostic non affichés parmi les premiers manquements. |
| Garde-fous | Aucun geste de bricolage sur freins, direction, pneus ou liaison au sol ; aucune manipulation à chaud (capot, liquide de refroidissement) ; tests d'observation seulement (le bruit persiste-t-il à l'arrêt ? le voyant clignote-t-il ?) ; jamais de suggestion de supprimer un filtre à particules, une vanne EGR ou un dispositif antipollution (Code de la route L318-3) ; aucun texte libre ni IA dans le questionnaire ; aucune coordonnée exigée pour voir le résultat ; aucune réponse enregistrée tant que le visiteur n'envoie pas de demande. | Sécurité, responsabilité, minimisation. |
| Contenu | L'arbre (questions, choix, règles, pistes) vit dans un fichier versionné, validé par une porte : 5 questions au plus sur chaque chemin, « je ne sais pas » sur chaque question, tout signe de danger mène au niveau 1, chaque résultat porte niveau, mention et actions, aucun mot interdit (« % », « certain », « garanti », « sûrement »). Il porte `relu_par` et `relu_le` : sans relecture mécanique datée par le garagiste, la production refuse de démarrer `[À VALIDER : relecture de l'arbre par le garagiste]`. | Un invariant en prose n'est pas un invariant (piège 26). |
| Technique | Une page serveur par question (formulaire GET), sans JavaScript, bouton retour fiable ; l'état voyage dans l'adresse sous forme de codes fermés, toute valeur inconnue est ignorée (piège 40) ; pages de question et de résultat en `noindex`, seule l'entrée `/premier-avis` est indexée. | Brief §5 ; aucune combinaison infinie indexée. |
| Guide des voyants | Différé. Couleur plus fixe ou clignotant suffit à trancher l'urgence ; dessiner et valider une vingtaine de symboles normalisés est un chantier de contenu sans gain sur la décision. | YAGNI. |

**Motif global.** A fait fuir (chaque question coûte des abandons). B est non maîtrisable
et diffuse la responsabilité ; 9 % seulement font confiance à une recommandation d'IA
seule (Ifop pour Guest Suite 2026). C existe partout et n'oriente personne (FixMyCar,
iDGarages). D est le seul format qu'aucun site de garage local ou de plateforme française
ne propose (études 02 et 06), et il sert directement la maquette.

### D4. Rendez-vous : vraie réservation de créneau ou demande ?

**Question.** Le client doit-il réserver un créneau ferme en ligne ?

**Options.** A. Agenda en ligne avec créneaux réels et confirmation automatique.
B. Demande de rendez-vous : prestation, une à trois demi-journées souhaitées,
confirmation par téléphone. C. Simple demande de rappel. D. Module d'une plateforme
(Vroomly, idGarages).

**Décision : B, nommée honnêtement.**
- Bouton « Demander un rendez-vous », jamais « Réserver » ni « Prendre RDV ».
- Demi-journées proposées : les 10 prochaines demi-journées d'ouverture, calculées à partir des horaires validés moins les fermetures exceptionnelles (jamais un jour fermé), plus « Le plus tôt possible ». Le client en coche une à trois.
- Confirmation : « Votre demande est enregistrée. Ce n'est pas encore une réservation : nous vous appelons pour fixer l'heure. » suivie du moment du rappel (attractive AT-3).
- C est intégrée comme un type de la même demande (« Être rappelé »). Un seul agrégat `Demande` à quatre types : rendez-vous, devis pièce, rappel après premier avis, question.

**Motif.** A exige un agenda de charge tenu à jour : sans écrivain, il affiche des créneaux
faux (pièges 1 et 3) ; une intervention dure d'une heure (vidange) à une journée
(embrayage) ; l'organisation de l'atelier est inconnue. D intercale un tiers, des traceurs
et une commission, et la plateforme affiche parfois un autre numéro que le garage (Po
Mécanique, étude 06). C seule rate l'attente mesurée (66 % d'intérêt pour le rendez-vous
en ligne, Ipsos pour Dekra, échantillon allemand) et reproduit l'irritant d'Europe Auto,
dont le bouton « Prendre RDV » ouvre un formulaire de contact. B donne le vrai choix utile
(quand je peux venir) sans promettre ce que personne n'entretient. A ne sera réévaluée
que si le garagiste demande lui-même à tenir un agenda ; le port `Agenda` n'est pas créé
d'ici là (YAGNI).

### D5. Espace garagiste (back-office) : nécessaire ou non, et périmètre minimal

**Question.** Faut-il un espace de gestion, et lequel au minimum ?

**Options.** A. Aucun : demandes par courriel seulement, tout le reste dans la
configuration. B. Espace minimal. C. Gestion de contenu complète (textes, prix, photos,
horaires).

**Décision : B**, trois capacités et rien d'autre :
1. **Demandes** : liste, non traitées d'abord, urgentes en tête ; fiche avec appel en un geste et résumé du premier avis s'il existe ; statut « nouvelle », « rappelée », « close » ; mention visible si le courriel de notification a échoué.
2. **Fermetures exceptionnelles** : déclarer une période (du, au, motif en liste : congés, jour férié, imprévu) sur un seul écran de téléphone ; le statut public, le bandeau de fermeture et les demi-journées proposées en tiennent compte immédiatement.
3. **Délai de rappel mesuré** : temps entre réception et passage à « rappelée » ; part des demandes rappelées dans le délai annoncé sur 30 jours glissants.

S'y ajoutent : notification par courriel à chaque demande, avec lien direct vers la fiche
(port `Notificateur`, adaptateur console en développement) ; purge automatique des
demandes 12 mois après leur dernier changement de statut ; un seul compte, mot de passe
haché, limitation des essais, session de 30 jours révocable ; pages en `noindex`.

Hors périmètre : édition des textes, prix, horaires et prestations (ils restent dans le
fichier de configuration unique versionné, brief §3), statistiques de fréquentation,
agenda, fichier clients, comptes multiples.

**Motif.** A laisse des demandes écrites que personne ne relit quand un courriel se perd :
écriture sans lecture (piège 2) et diagnostic perdu en transit (piège 22). A ne permet pas
non plus de déclarer une fermeture : le statut calculé depuis les horaires mentirait
pendant les congés, sur un site dont l'exactitude est l'argument principal (annuaires
périmés et horaires contradictoires autour de la rue Demanieux, étude 06). C crée une
seconde source de vérité pour l'identité et les prix, contraire au brief, et un outil que
le garagiste n'entretiendra pas. La frontière est nette : le stable et opposable
(identité, horaires, prix, prestations) vit dans le fichier versionné ; l'opérationnel et
volatil (demandes, fermetures) vit en base. Les 12 mois appliquent la minimisation : le
site n'est pas le fichier client du garage (plafond CNIL de 3 ans pour un prospect,
étude 05).

### D6. Photos et preuves de confiance en l'absence de données réelles

**Question.** Le garage n'a aucun avis et n'a fourni aucune photo. Comment inspirer
confiance sans rien inventer ?

**Options.** A. Images de banque et témoignages d'exemple « en attendant ». B. Texte seul.
C. Preuves vérifiables par le visiteur, illustrations techniques au trait assumées comme
telles, collecte honnête des premiers avis.

**Décision : C.**
- **Jamais** : image de banque présentée comme le garage, avis ou témoignage fictif, note ou `aggregateRating` auto-déclarés, années d'expérience, certification, logo de constructeur ou d'équipementier non validés.
- **Tant que les photos manquent** : illustrations techniques au trait (style plan, admises par la charte), sans légende qui les ferait passer pour le lieu ; carte statique auto-hébergée issue d'OpenStreetMap avec son attribution, et lien d'itinéraire externe. Aucun emplacement « photo à venir » visible.
- **Photos à obtenir**, avec l'accord des personnes : façade avec l'enseigne BF Auto, entrée de l'atelier, poste de travail, accueil, le garagiste au travail, une intervention sans plaque lisible `[À VALIDER : photos réelles et accords]`. Format AVIF ou WebP, `srcset`, dimensions déclarées.
- **Preuves vérifiables mises en avant** : (1) identité légale avec lien vers la fiche publique du registre `[À VALIDER : rattachement BF Auto et GARAGE AUTO CHOISY 94, SIREN 953 343 738]` ; (2) tarifs TTC datés ; (3) « Comment nous travaillons », limité aux engagements validés (devis écrit, accord avant tout travail supplémentaire, pièces remplacées restituées sur demande) `[À VALIDER : engagements réellement pratiqués]` ; (4) « Vos droits chez nous » (AT-2) ; (5) statut d'ouverture exact (AT-3).
- **Encart de transition** : « Nouveau nom, même atelier : Garage auto choisy 94 devient BF Auto. Vous êtes déjà venu ? Donnez le premier avis. » avec le lien vers le formulaire d'avis de la fiche Google renommée `[À VALIDER : lien d'avis]`, sans contrepartie ni filtrage.
- **Plus tard** : une note ne s'affichera que recopiée avec sa source et sa date de relevé (« N sur 5, M avis Google, relevé le JJ/MM/AAAA ») et sera masquée automatiquement si le relevé a plus de 90 jours. En v1 : lien seulement.

**Motif.** Un faux avis est une pratique commerciale trompeuse (jusqu'à 2 ans et 300 000 €,
SignalConso) ; Google exclut la note sur soi-même ; une image de banque décrédibilise dès
la visite (sites de Roussillon et de Global Auto 94, études 04 et 06). Les clients jugent
sur la récence et le détail (récence 48 %, preuves concrètes 43 %, Ifop pour Guest Suite
2026) : un relevé daté plafonné à 90 jours évite la note qui périme (piège 3). Sans avis,
la preuve vérifiable remplace la preuve sociale, et aucun indépendant local n'affiche le
moindre prix (étude 06). Le renommage de la fiche est un moment du cycle de vie : le dire
évite qu'un habitué croie à un autre garage.

### D7. Plan du site et adaptation mobile de la maquette trois colonnes

**Question.** Quelles pages, et comment la maquette à trois colonnes devient-elle
excellente sur un téléphone ?

**Décision : plan.**

| Page | Adresse | Rôle | Condition de publication |
|---|---|---|---|
| Accueil | `/` | Les trois intentions, contact toujours à portée | Toujours |
| Premier avis | `/premier-avis` (étapes et résultats en `noindex`) | Orientation par questions | Arbre relu et daté |
| Pièces | `/pieces`, `/pieces/<famille>` | Vitrine par familles, recherche | Au moins une famille validée |
| Demande | `/demande?type=...`, `/demande/envoyee` | Formulaire unique à quatre types, confirmation | Toujours |
| Prestations et tarifs | `/prestations-et-tarifs` | Prestations validées ; prix validés et datés ; taux horaire TTC | Au moins une prestation validée |
| Accès et horaires | `/acces-et-horaires` | Horaires jour par jour, repères (boulevard de Stalingrad à environ 200 m, Vitry-sur-Seine à 600 m, étude 06), stationnement, carte statique | Horaires validés |
| Vos droits chez nous | `/vos-droits` | Comment nous travaillons, pièces issues de l'économie circulaire, garantie constructeur, médiateur | Toujours (bloc légal) |
| Mentions légales, confidentialité | `/mentions-legales`, `/confidentialite` | Obligations ; « Ce site ne dépose aucun cookie de suivi » | Toujours (bloquant, D8) |
| Espace garagiste | `/garagiste` | D5 | Hors plan public, `noindex` |
| Erreurs 404 et 500 | | Téléphone et liens vers les trois intentions | Toujours |

Navigation principale : cinq entrées au plus (Premier avis, Pièces, Rendez-vous, Tarifs,
Accès). « Vos droits » est atteint depuis la zone « ? » et le pied de page. Une page par
prestation (utile au référencement local) est différée tant que son contenu n'est pas
validé ; la bataille locale se joue d'abord sur la fiche Google (étude 06).

**Décision : mise en page.**
- **Ordinateur (1024 px et plus), fidèle à la maquette.** En-tête : logo à gauche (lien vers l'accueil), accroche au centre, téléphone à droite. Colonne gauche (un quart) : familles de pièces et recherche, puis la zone « ? ». Colonne centrale (la moitié) : information (prestations validées, comment nous travaillons, encart « nouveau nom »), puis le premier avis avec Q1 intégrée. Colonne droite (un quart) : info garage (statut, téléphone, adresse et itinéraire, horaires avec le jour courant en tête, carte statique, formulaire court « Être rappelé »).
- **Tablette (768 à 1023 px).** Deux colonnes : centre et droite ; la colonne gauche passe sous le centre.
- **Téléphone (moins de 768 px), une colonne dans l'ordre de l'urgence** : en-tête de 64 px au plus (logo, Appeler, Menu) ; statut du jour et adresse courte ; accroche ; Q1 du premier avis ; trois raccourcis (Demander un rendez-vous, Trouver une pièce, Tarifs) ; information ; six premières familles et « Toutes les familles » ; zone « ? » ; info garage (horaires, carte, formulaire de rappel) ; pied de page. Menu en `<details>` natif, sans JavaScript.
- **Barre fixe basse** « Appeler » et « Itinéraire » sur les pages sans saisie de texte ; retirée des pages de formulaire, où le clavier virtuel la ferait couvrir les champs (WCAG 2.2, critère 2.4.11) et où le téléphone reste dans l'en-tête.
- **Accroche proposée** : « Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez. » `[À VALIDER : accroche par Anthony]`. Elle évite « à portée de main », déjà prise par La Maison Mécanique et le site de Roussillon.

**Motif.** L'ordre mobile suit l'urgence : P1 doit trouver statut, téléphone et premier
avis dans le premier écran ; P3 trouve le rendez-vous au deuxième ; le catalogue (P2) peut
attendre. Un en-tête géant repousse la promesse sous le premier écran (Ottohaus, étude 04).
Sur ordinateur, la maquette est respectée dans ses positions et sa hiérarchie ; elle n'est
pas recopiée au forceps sur téléphone.

### D8. Données non validées : ce qui s'affiche, ce qui bloque

**Question.** Le brief impose un fichier unique où les données non confirmées restent à
valider. Que fait le site d'une donnée à valider ?

**Options.** A. L'afficher avec la mention « à valider ». B. Afficher une valeur
provisoire. C. Ne jamais afficher publiquement une donnée non validée ; les données
légalement obligatoires bloquent la mise en ligne ; les autres se replient sur une
formulation neutre ou masquent leur bloc.

**Décision : C.** Chaque valeur du fichier porte un statut (`valide` ou `a_valider`) et,
pour les prix, une date d'effet. Règles du domaine : (1) en production, une valeur
`a_valider` n'est jamais rendue ; (2) le démarrage en production échoue, avec un code de
retour non nul et la liste des champs manquants, si une donnée bloquante est à valider ;
(3) en développement, les valeurs à valider s'affichent surlignées pour la relecture
d'Anthony.

| Donnée | Effet si non validée |
|---|---|
| Horaires complets jour par jour | **Bloquant** (statut, créneaux et données structurées en dépendent) |
| Dénomination, forme, capital, siège, immatriculation (RCS ou RNE), TVA, directeur de la publication | **Bloquant** (LCEN 1-1) |
| Hébergeur (nom, adresse, téléphone) | **Bloquant** |
| Médiateur de la consommation | **Bloquant** (R616-1) |
| Courriel de réception des demandes | **Bloquant** (sinon écriture sans lecture) |
| Liste des prestations | **Bloquant** |
| Relecture datée de l'arbre du premier avis | **Bloquant** |
| Prix, taux horaire, prix du contrôle | Repli : « Prix sur devis » ; question 5 de la zone « ? » masquée |
| Délai de rappel | Repli : « Nous vous rappelons au numéro indiqué », sans délai ni date |
| Vente au comptoir, politique des pièces apportées | Option masquée |
| Engagements de méthode | Bloc « Comment nous travaillons » masqué |
| Lien d'avis Google | Encart réduit à « Nouveau nom, même atelier », sans lien |
| Photos | Illustrations au trait |
| Stationnement, moyens de paiement, dépannage | Mention absente |
| Accroche | Titre sobre « BF Auto, garage automobile à Choisy-le-Roi » |

**Motif.** Afficher « à valider » à un client ruine la confiance ; une valeur provisoire
est un fait inventé (brief §3). L'invariant « rien de non validé n'est affiché » ne vaut
que s'il est une porte exécutée et un test vu rouge (piège 26). Les manquements légaux
sont sanctionnés (LCEN 1-2 ; médiateur jusqu'à 15 000 € pour une personne morale,
L641-1) : leur absence doit empêcher la mise en ligne, pas s'afficher en creux.

### D9. Zéro traceur, zéro ressource tierce, zéro bandeau

**Décision.** Aucune requête du navigateur vers un autre domaine que celui du site :
polices auto-hébergées (deux fichiers WOFF2 au plus), aucune carte intégrée (image
statique et lien externe), aucun captcha tiers (champ piège, délai minimal de saisie,
limitation de débit par adresse), aucune mesure d'audience (les compteurs de demandes de
l'espace garagiste suffisent), aucun module social. Les pages publiques ne déposent aucun
cookie ; seul l'espace garagiste pose un cookie de session strictement nécessaire. Les
formulaires publics sont protégés par la vérification de l'en-tête `Origin`. Politique de
sécurité du contenu stricte (`default-src 'self'`).

**Motif.** CNIL : refus aussi simple qu'accepter, consentement avant tout contenu tiers,
reCAPTCHA soumis à consentement (étude 05). Quatre captures sur sept masquées par une
modale de consentement (étude 03), bandeaux en anglais chez Europe Auto et Le Tolier
(étude 06), réseaux au-dessus de 1,3 Mo et 680 Ko de JavaScript (étude 01).
**Classement tranché** : « aucun bandeau » n'est pas une attractive. L'absence d'un
irritant ne crée pas d'enthousiasme ; c'est une basique de conformité (B-13) dont le gain
se mesure en performance (P-02).

### D10. Nom, cohérence NAP et homonymie

**Décision.** Nom affiché « BF Auto », toujours associé à « Choisy-le-Roi » dans le titre
de page, le titre principal (unique) de l'accueil, le pied de page et les données
structurées. Adresse « 7 rue Demanieux, 94600 Choisy-le-Roi » et téléphone
« 06 05 92 28 38 » écrits à l'identique partout, depuis le fichier unique, identiques à la
fiche Google. Titre de l'accueil : « BF Auto, garage automobile à Choisy-le-Roi (94600) » ;
les mots-clés de prestations s'y ajoutent seulement quand les prestations sont validées.
Données structurées `AutoRepair` générées depuis la configuration (nom, adresse,
coordonnées, téléphone, horaires jour par jour), sans note. Mise en ligne après le
renommage effectif de la fiche Google, ou le même jour. Aucun contenu, aucune adresse,
aucune promesse du BF Auto de Roussillon.

**Motif.** Au moins cinq entreprises « BF Auto » coexistent en France (étude 04) ; la
requête sur l'ancien nom « Garage auto choisy 94 » renvoie aux concurrents ; trois
indépendants locaux ont des horaires contradictoires entre site et annuaires ; le
classement local repose sur la fiche Google (pertinence, distance, popularité) (étude 06).

### D11. Hébergement et instantanéité

**Décision.** Instance permanente en production, sans mise en veille. Sonde de
disponibilité externe toutes les 5 minutes ; seule une indisponibilité prolongée alerte.
Aucune mise en ligne sans l'accord d'Anthony (brief §5) `[À VALIDER : offre Render
retenue et son coût]`.

**Motif.** Les offres gratuites mettent l'instance en veille et imposent un démarrage à
froid de plusieurs dizaines de secondes au premier visiteur `[À VALIDER : comportement de
l'offre retenue]` : incompatible avec la promesse d'instantanéité et avec P1 en panne. Un
site hors service fait plus de tort que pas de site (Garage des Chalets en erreur 522,
étude 06).

### D12. Ce que le Kano impose à l'architecture hexagonale

**Décision.** Le domaine, sans dépendance à FastAPI, à la base ni au réseau, porte :
`Garage` (identité, horaires, fermetures, statut d'ouverture, demi-journées demandables,
moment de rappel), `PremierAvis` (arbre, parcours, niveau, pistes), `Catalogue`
(familles, synonymes, recherche), `Demande` (quatre types, validation, résumé),
`PolitiqueDePublication` (valeur validée ou non, date d'effet). Ports créés : `Horloge`,
`SourceIdentite`, `SourceCatalogue`, `SourceArbre` (fichiers versionnés), `DepotDemandes`,
`DepotFermetures` (SQLite), `Notificateur` (courriel, console), `IdentificationVehicule`
(saisie en v1). Ports **refusés** : `Agenda` (D4), `Paiement` et `Stock` (D1), `Avis`
(D6), `MesureAudience` (D9).

**Motif.** Le statut et les créneaux dépendent de l'heure : sans port `Horloge`, ils ne se
testent pas à 21 h un mercredi. Les ports refusés sont les « À éviter » : ne pas les créer
empêche la dérive (YAGNI).

## Basiques

Leur absence fait fuir ou expose le garage ; leur présence ne se remarque pas.

| Id | Attribut | Justification | Source |
|---|---|---|---|
| B-01 | Téléphone cliquable, libellé avec le numéro, visible sans défilement sur chaque page | 80 % du temps internet sur mobile ; premier canal en cas de panne | Études 01, 05 (Médiamétrie 2025) |
| B-02 | Adresse, lien d'itinéraire externe et carte statique | Première question d'une recherche locale | Études 01, 06 |
| B-03 | Horaires complets jour par jour, jour courant en tête, source unique | Une erreur d'horaire coûte un déplacement ; trois indépendants locaux se contredisent | Études 01, 06 |
| B-04 | Statut « Ouvert, ferme à » ou « Fermé, rouvre » calculé au serveur, fermetures exceptionnelles comprises | Norme des fiches de réseau (5 sur 7) et des fiches Speedy Thiais et Norauto Belle Épine | Études 01, 06 |
| B-05 | Nom, adresse, téléphone identiques au caractère près sur le site et sur la fiche Google renommée | Référencement local et confiance | Brief §3, étude 06 |
| B-06 | Liste des prestations réalisées, dans les mots du client | Savoir en cinq secondes si le garage traite le problème | Études 01, 04 |
| B-07 | Demande (rendez-vous, devis pièce, rappel, question) sans compte ni paiement, coordonnées en dernier | Compte, paiement et coordonnées préalables font fuir | Étude 01 (Point S, Norauto, Speedy) |
| B-08 | Récapitulatif après envoi et suite annoncée (qui rappelle, par quel canal, quand si c'est validé) | Une demande sans suite annoncée est vécue comme perdue | Étude 03 (Pièces Auto) |
| B-09 | Mentions légales complètes, en lien depuis chaque page | LCEN art. 1-1 et 19 | Étude 05 |
| B-10 | Médiateur de la consommation visible et lisible | R616-1, sanction L641-1 | Étude 05 |
| B-11 | Bloc « pièces issues de l'économie circulaire » (expression exacte, catégories, exceptions) | D224-25-2 : « Ces mêmes informations figurent sur son site internet » | Études 03, 05 |
| B-12 | Information RGPD de premier niveau sous chaque formulaire, champs obligatoires signalés, aucune case pré-cochée, mention sur l'usage du téléphone | RGPD art. 13 ; L223-1 et L223-2 depuis le 11/08/2026 | Étude 05 |
| B-13 | Aucun traceur, aucune ressource tierce, aucun bandeau ; aucun cookie sur les pages publiques | CNIL ; D9 | Études 01 à 06 |
| B-14 | Interface entièrement en français, sans emoji ni pictogramme décoratif | Modules en anglais chez deux concurrents locaux ; charte | Étude 06, brief §4 |
| B-15 | Tous les parcours publics fonctionnent sans JavaScript | Brief §5 ; réseau mobile faible | Brief |
| B-16 | WCAG 2.2 AA : clavier complet, focus visible et jamais masqué, contrastes, cibles, textes alternatifs | Public âgé attaché à son garage ; étoiles de Midas lues comme du bruit | Études 01, 05, brief |
| B-17 | Données structurées `AutoRepair` exactes, générées depuis la configuration, sans note auto-déclarée | Sous-type précis recommandé ; `aggregateRating` sur soi exclu | Étude 04 |
| B-18 | Premier avis sûr : écran d'arrêt dès un signe de danger, « Je ne sais pas » sur chaque question, mention d'orientation au résultat, arbre relu par le garagiste | Faute de conseil sinon ; fiabilité limitée de ces outils | Étude 02 |
| B-19 | « BF Auto » toujours associé à Choisy-le-Roi (titre, titre principal unique, pied de page) | Au moins cinq « BF Auto » en France | Études 04, 06 |
| B-20 | Aucune donnée non validée affichée comme un fait ; données légales bloquantes | Brief §3 ; D8 | Brief |
| B-21 | Aucune image de banque présentée comme le garage | Décrédibilise dès la visite | Études 04, 05, 06 |
| B-22 | Tout prix affiché TTC, au format unique, avec ce qu'il comprend et sa date d'effet | LCEN 19 (« clair et non ambigu ») ; incohérences d'AD et de Motrio | Études 01, 04, 05 |
| B-23 | Protection anti-abus des formulaires sans captcha tiers | reCAPTCHA soumis à consentement | Étude 05 |
| B-24 | Chaque demande est lue : enregistrée avant notification, visible dans l'espace garagiste, purgée à 12 mois | Écriture sans lecture (piège 2) ; minimisation | D5 |
| B-25 | Site disponible ; pages 404 et 500 utiles, avec le téléphone | Site en panne du Garage des Chalets | Étude 06 |
| B-26 | Logo vectoriel net et lisible dès 32 px, identique à l'enseigne et à la fiche, lien vers l'accueil | Un logo flou ou divergent signale l'amateurisme | Brief §1, étude 04 (Ottohaus) |

## Performance

La satisfaction monte avec le niveau atteint. Chaque cible est mesurable et vérifiée par
une porte.

| Id | Attribut | Cible chiffrée mesurable | Justification |
|---|---|---|---|
| P-01 | Temps d'affichage mobile | Lighthouse mobile (4G lente simulée, processeur ralenti 4 fois), chaque gabarit public : premier affichage (FCP) ≤ 1,0 s ; plus grand élément affiché (LCP) ≤ 1,5 s ; temps de blocage (TBT) ≤ 50 ms ; décalage de mise en page (CLS) ≤ 0,02 | Réseaux mesurés de 1,4 à 11,7 Mo (étude 01) ; P1 en zone mal couverte |
| P-02 | Poids de page | Accueil ≤ 150 Ko transférés hors photos réelles, ≤ 300 Ko avec ; HTML ≤ 30 Ko, CSS ≤ 25 Ko, JavaScript ≤ 15 Ko, polices : 2 fichiers et 70 Ko au plus ; 12 requêtes au plus ; 0 domaine tiers | Un ordre de grandeur sous les réseaux (étude 01) |
| P-03 | Notes Lighthouse visées | Mobile, chaque gabarit public : Performance ≥ 98, Accessibilité 100, Bonnes pratiques 100, Référencement 100 | Mesure reproductible, porte de chaque lot |
| P-04 | Accessibilité mesurée | 0 violation axe-core (règles WCAG 2.0, 2.1 et 2.2, A et AA) sur toutes les pages, espace garagiste compris ; contraste du texte courant ≥ 7:1, de tout texte ≥ 4,5:1, des composants et du focus ≥ 3:1 ; cibles ≥ 44 × 44 px ; aucun défilement horizontal à 320 px ; texte agrandi à 200 % sans perte | Brief (AA, AAA sur le texte courant) |
| P-05 | Réponse serveur et disponibilité | Traitement serveur p95 ≤ 50 ms (journal applicatif) ; délai avant le premier octet reçu (TTFB) p95 ≤ 300 ms mesuré par la sonde ; disponibilité mensuelle ≥ 99,5 % | Instantanéité perçue ; D11 |
| P-06 | Brièveté du premier avis | ≤ 5 questions sur chaque chemin ; ≤ 7 choix par question ; 100 % des questions avec « Je ne sais pas » ; vérifié par la porte de l'arbre | Chaque question en moins améliore l'achèvement (étude 02) |
| P-07 | Brièveté de la demande | Un seul écran ; ≤ 5 champs obligatoires par type ; parcours de rendez-vous complet en ≤ 10 gestes au test navigateur | AD en 3 étapes, Bosch en 6 : moins, c'est mieux (étude 01) |
| P-08 | Transparence tarifaire | Cible ≥ 8 prix TTC validés et datés (taux horaire, contrôle à l'atelier, 6 forfaits courants) ; 0 prix sans date ; une date d'effet de plus de 12 mois est signalée dans l'espace garagiste | 94 % ne veulent pas être poussés à la consommation ; aucun indépendant local n'affiche de prix (étude 06) |
| P-09 | Délai de rappel tenu | Délai annoncé `[À VALIDER : délai tenable]` ; ≥ 90 % des demandes passées à « rappelée » dans ce délai sur 30 jours glissants, affiché dans l'espace garagiste | 48 % ont déjà récupéré leur véhicule en retard (Ifop 2015) ; la réactivité distingue d'un réseau |
| P-10 | Catalogue utile | 10 à 14 familles ; 100 % avec rôle, signes d'usure et lien vers le premier avis ; recherche par synonymes ; 0 résultat vide sans issue | Étude 03 |
| P-11 | Clarté des textes | Phrases de 15 mots au plus en moyenne sur les textes publics, mesurée par script ; tout terme technique expliqué à sa première occurrence dans la page | 93 % attendent des explications claires (Ifop 2015) |
| P-12 | Images | AVIF ou WebP, `srcset`, ≤ 80 Ko pour toute image du premier écran mobile, dimensions déclarées | Poids et stabilité de la mise en page |
| P-13 | Mouvement | Transitions ≤ 200 ms ; aucune sous `prefers-reduced-motion` ; aucune animation en boucle | Brief §4 ; piège 15 |
| P-14 | Notification du garagiste | Courriel remis au serveur d'envoi en ≤ 60 s après la demande (p95), lien direct vers la fiche | Le rappel rapide est la valeur perçue par P1 |
| P-15 | Amplitude horaire lisible | Fin de journée et samedi visibles sur l'accueil sans défilement dès qu'ils sont validés (fermeture constatée à 19 h, la plupart des indépendants proches ferment entre 18 h et 18 h 30) | « ouvert samedi » est une requête explicite (étude 06) |

## Attractives

Inattendues, elles enthousiasment ; leur absence ne coûte rien. Chacune s'appuie sur ce
que le système fait déjà.

### AT-1. Le premier avis qui passe le relais au garagiste (attractive phare)

- **Gisement** : couture entre systèmes (questionnaire, demande, garagiste), doublée d'un irritant avoué (le champ libre de Midas, le « tout réexpliquer » au téléphone).
- **Ce que c'est** : à l'issue du premier avis, « Être rappelé » ouvre une demande pré-remplie avec les réponses et le niveau ; le client ne saisit que son nom et son téléphone ; le garagiste lit le cas en toutes lettres avant d'appeler, urgences en tête. Une fiche imprimable et partageable reprend le tout.
- **Pourquoi ça surprend** : aucune plateforme française ni aucun site local observé ne part du symptôme ; Wrenchly vend cette boucle aux garages, BF Auto l'offre en direct, sans intermédiaire (étude 02).
- **Crédibilité** : réutilise l'arbre (D3) et l'agrégat `Demande` (D4) ; aucune collecte nouvelle.
- **Preuve observable** : US-22.

### AT-2. « Vos droits chez nous » : la zone « ? » qui répond aux peurs

- **Gisement** : obligation transformée en service.
- **Ce que c'est** : les obligations (prix affichés, pièces issues de l'économie circulaire, médiateur, droit de l'exemption automobile) réécrites comme réponses aux questions d'un nouveau client, dans la zone « ? » de la maquette et sur une page dédiée.
- **Pourquoi ça surprend** : le client s'attend à des mentions en petits caractères ; il trouve la réponse à sa peur (« vais-je perdre ma garantie ? »), sourcée.
- **Crédibilité** : contenu légal dû de toute façon (B-10, B-11) ; coût marginal de rédaction seulement.
- **Preuve observable** : US-09, US-36.

### AT-3. Le rappel daté, calculé, même hors horaires

- **Gisement** : donnée dormante (horaires et fermetures exceptionnelles, déjà tenus pour le statut).
- **Ce que c'est** : une demande envoyée un mercredi à 21 h reçoit « Nous vous rappelons demain matin, à partir de 8 h 30 », en tenant compte des fermetures exceptionnelles, au lieu d'un « nous revenons vers vous » sans date.
- **Pourquoi ça surprend** : les formulaires observés ne disent rien de la suite (Pièces Auto) ; les annuaires locaux affichent des horaires faux (étude 06).
- **Crédibilité** : même calcul que le statut d'ouverture ; conditionné à un délai validé par le garage, sinon aucune date n'est promise (D8).
- **Preuve observable** : US-13.

### AT-4. La pièce vérifiée et posée par le garagiste, neuve ou issue de l'économie circulaire

- **Gisement** : irritant avoué du marché (erreurs de compatibilité, filtre par plaque « indicatif » dans les CGV des leaders, vérification experte vendue sur abonnement chez Autodoc).
- **Ce que c'est** : la demande de devis pièce annonce que la compatibilité est vérifiée par le garagiste avant toute commande de pièce, propose la gamme (neuve, issue de l'économie circulaire, sans préférence) et la pose.
- **Pourquoi ça surprend** : les leaders renvoient le risque au client ; ici un seul responsable, et un levier prix (51 % envisagent des pièces d'occasion, Roole 2024).
- **Crédibilité** : c'est le geste normal d'un garage ; conditionné à la validation de l'engagement et de l'offre `[À VALIDER : vérification et pose, offre de pièces issues de l'économie circulaire]`.
- **Preuve observable** : US-28.

### Notation (méthode de référence, 1 à 5 par axe)

| Attractive | Désirabilité | Ancrage | Faisabilité MVP | Coût marginal | Démontrabilité | Total |
|---|---|---|---|---|---|---|
| AT-1 Premier avis relayé | 5 | 5 | 4 | 4 | 5 | **23** |
| AT-2 Vos droits chez nous | 4 | 4 | 5 | 5 | 4 | 22 |
| AT-3 Rappel daté | 4 | 3 | 5 | 5 | 5 | 22 |
| AT-4 Pièce vérifiée et posée | 4 | 4 | 4 | 4 | 4 | 20 |

**Attractive phare : AT-1 (23 sur 25).** Elle est dessinée par le client lui-même (bloc
central de la maquette) et démontrable en une minute devant le jury.

**Écartées comme attractives, et pourquoi** : « aucun bandeau » (basique de conformité,
D9) ; « taux horaire publié » (performance P-08 : la satisfaction croît avec la
couverture des prix) ; « logo à idée forte » (basique B-26 pour l'utilisateur) ; « guide
des voyants » (différé, D3).

## Indifférentes

Écartées : personne ne les remarquerait, ou leur coût dépasse leur effet.

| Attribut | Motif |
|---|---|
| Blog, actualités | Aucun effet mesuré sur le choix d'un garage ; coût éditorial que le garage ne tiendra pas (études 01, 04, 05, 06) |
| Compte client, espace personnel, liste d'envies | Contact ponctuel ; friction inutile (études 01, 03) |
| Lettre d'information | Consentement requis, aucune attente mesurée (étude 05) |
| Fils Instagram ou Facebook intégrés | Ressource tierce (D9) ; un simple lien en pied de page si des comptes existent `[À VALIDER : comptes sociaux]` |
| Carrousel, vidéo d'arrière-plan, animations décoratives | Aucune information, du poids (étude 04) |
| Galerie de véhicules, vente d'occasion, recrutement | Hors maquette |
| Comparaison de plusieurs garages | Site d'un garage unique |
| Champ dédié au code défaut OBD | Minorité équipée ; le champ « Précisions » facultatif l'accepte (étude 02) |
| Paiement fractionné | Aucun paiement en ligne (D1) |
| Catalogue exhaustif de références | Le client veut sa pièce, pas un inventaire ; licence de données coûteuse (étude 03) |
| Guide des voyants illustré | Différé (D3) : sans gain sur la décision d'urgence |
| Version anglaise | Clientèle locale ; brief |
| Lien SMS ou WhatsApp | La demande structurée couvre le besoin ; WhatsApp ajoute un tiers ; le numéro mobile reste joignable par SMS sans lien dédié |
| Case « je suis un professionnel » | Rien n'établit que le garage de Choisy sert des professionnels `[À VALIDER : clientèle professionnelle]` |
| Pneus d'occasion classés par usure | Offre du BF Auto de Roussillon ; non établie pour Choisy-le-Roi, donc non applicable |
| Application installable, notifications poussées | Aucun usage récurrent qui la justifie |
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
| AE-05 | Prix contradictoires, non datés, « à partir de » présentés comme un engagement, ou déduits des moyennes d'idGarages et de Vroomly | AD affiche 79,90 € et 92,90 € pour la même prestation ; la DGCCRF sanctionne l'écart entre annoncé et facturé | Études 01, 05, 06 |
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
| AE-13 | Texte libre seul pour décrire la panne ou la pièce ; plaque, VIN, photo de carte grise, adresse postale ou date de naissance demandées au contact | Le client ne connaît pas le nom des pièces ; minimisation (la plaque est une donnée personnelle, CNIL) | Études 03, 05 |
| AE-14 | Barre fixe qui masque un champ ou l'élément qui a le focus | WCAG 2.2, critère 2.4.11 | D7 |
| AE-15 | En-tête géant qui repousse l'information sous le premier écran mobile | Ottohaus | Étude 04 |

### Premier avis

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

### Pièges du catalogue transverse, appliqués à ce site

| Piège | Où il menace ce site | Garde retenue |
|---|---|---|
| 1. Lecture sans écriture | Agenda de créneaux, stock, note d'avis | Refusés (D1, D4, D6) |
| 2. Écriture sans lecture | Demandes jamais lues | Notification, espace garagiste, mention d'échec (D5, US-16) |
| 3. Zéro qui ment | Stock à 0, note, statut sans horaires | Donnée inconnue jamais rendue en chiffre ; statut masqué si horaires non validés (D8, US-02) |
| 4. État vide qui ment sur sa cause | Recherche sans résultat, premier avis sans réponse exploitable | Message qui dit ce qui manque et quoi faire (US-19, US-27) |
| 5 et 31. Texte ou test qui décrit l'ancien comportement | « Demande » et « réservation » | Critères qui assertent le libellé exact (US-11) |
| 10. Formulaire imbriqué | Accueil portant deux formulaires (Q1 du premier avis, rappel) | Test navigateur qui envoie chaque formulaire de l'accueil (US-08) |
| 15. Pourcentage inventé | Probabilités, durée estimée | Mots interdits dans la porte de l'arbre (US-21) |
| 22. Diagnostic perdu en transit | Échec de courriel invisible | Demande enregistrée avant notification, échec affiché (US-16) |
| 26. Prose comptée comme invariant | « Aucune donnée non validée n'est affichée » | Porte de démarrage et test vu rouge (US-05, US-06) |
| 27. Composant orphelin | Page tarifs ou « Vos droits » que rien ne lie | Parcours de navigation depuis l'accueil (US-39) |
| 28. Oracle de contenant | Test qui vérifie qu'un statut existe, pas son texte | Critères qui assertent le texte exact |
| 40. Texte libre de l'adresse rendu à l'écran | Fiche partagée du premier avis, messages après redirection | Codes fermés, test d'injection (US-23) |

## User stories

Format : persona, capacité, valeur ; catégorie Kano et attribut couvert ; critères
d'acceptation en Gherkin français, chacun destiné à devenir un test. Les horaires cités
dans les critères sont ceux d'une **configuration d'essai**, jamais les horaires réels du
garage.

### Lot 0 : socle et identité

**US-01. Appeler en un geste** (basique, B-01, P1)
En tant qu'automobiliste inquiet sur mon téléphone, je veux appeler le garage en un geste depuis n'importe quelle page, afin de parler à quelqu'un sans chercher le numéro.
- Étant donné une page publique quelconque affichée dans une fenêtre de 390 px de large, quand la page est chargée, alors un lien `tel:+33605922838` dont le texte contient « 06 05 92 28 38 » est visible sans défilement.

**US-02. Savoir si le garage est ouvert** (basique, B-04, P1 et P3)
En tant qu'automobiliste qui veut passer au garage, je veux lire s'il est ouvert maintenant et quand il rouvre, afin de ne pas me déplacer pour rien.
- Étant donné une configuration d'essai ouverte le mercredi jusqu'à 19 h et une horloge réglée un mercredi à 18 h 30, quand l'accueil est rendu, alors le statut affiche exactement « Ouvert, ferme à 19 h ».
- Étant donné la même configuration, une réouverture le jeudi à 8 h 30 et une horloge réglée un mercredi à 21 h, quand l'accueil est rendu, alors le statut affiche exactement « Fermé, rouvre demain à 8 h 30 ».
- Étant donné des horaires marqués à valider, quand l'accueil est rendu en mode production, alors aucun statut d'ouverture n'est affiché et le lien d'appel reste présent.

**US-03. Trouver le garage** (basique, B-02, P1 et P3)
En tant que client qui vient pour la première fois, je veux l'adresse et un itinéraire en un geste, afin d'arriver sans chercher.
- Étant donné l'accueil affiché, quand je lis le bloc d'informations du garage, alors l'adresse « 7 rue Demanieux, 94600 Choisy-le-Roi » est suivie d'un lien « Itinéraire » vers un service de cartographie externe, et la page ne charge aucune ressource de ce service.

**US-04. Une seule source pour l'identité** (basique, B-05 et B-17, P4)
En tant que garagiste, je veux que nom, adresse, téléphone et horaires viennent d'un seul fichier, afin que le site, les données structurées et la fiche Google disent la même chose.
- Étant donné le fichier de configuration, quand une page publique est rendue, alors le nom, l'adresse et le téléphone du pied de page et du bloc JSON-LD `AutoRepair` sont identiques caractère pour caractère à ceux du fichier, et le JSON-LD ne contient ni `aggregateRating` ni `review`.
- Étant donné un téléphone modifié dans le fichier seulement, quand toutes les pages publiques sont rendues de nouveau, alors aucune ne contient l'ancien numéro.

**US-05. Mise en ligne bloquée sans mentions légales** (basique, B-09, B-10, B-20, P4)
En tant que garagiste, je veux que le site refuse de démarrer en production tant qu'une mention obligatoire manque, afin de ne jamais publier un site hors la loi.
- Étant donné un fichier de configuration dont le médiateur est marqué à valider, quand l'application démarre en mode production, alors le démarrage échoue avec un code de retour non nul et un message qui nomme le champ « médiateur ».
- Étant donné un fichier complet et validé, quand la page Mentions légales est rendue, alors elle affiche dénomination, forme, capital, siège, immatriculation, TVA, directeur de la publication et hébergeur, chacun lu depuis le fichier.

**US-06. Aucune donnée non validée affichée comme un fait** (basique, B-20 et B-22, P3)
En tant que client qui compare les prix, je veux que chaque prix affiché soit réel et daté, afin de pouvoir m'y fier.
- Étant donné un forfait dont le prix est marqué à valider, quand la page Prestations et tarifs est rendue en mode production, alors ce montant n'apparaît nulle part dans la page et la ligne affiche « Prix sur devis ».
- Étant donné un prix validé avec sa date d'effet, quand la page est rendue, alors il s'affiche au format « <montant> € TTC » avec deux décimales, suivi de ce qu'il comprend et de sa date d'effet.

**US-07. Ni traceur, ni cookie, ni bandeau** (basique, B-13, P1)
En tant que visiteur, je veux un site qui ne me suit pas et ne m'interrompt pas, afin d'arriver directement à l'information.
- Étant donné le chargement de chaque page publique dans un navigateur, quand toutes les requêtes sont terminées, alors aucune ne vise un autre domaine que celui du site, aucune réponse ne contient d'en-tête `Set-Cookie`, et aucun bandeau de consentement n'est présent.

### Lot 1 : accueil

**US-08. L'essentiel dans le premier écran** (basique, B-01, B-04, B-06, P1 à P3)
En tant qu'automobiliste sur téléphone, je veux voir dès le premier écran le statut, le téléphone et le début du premier avis, afin d'agir sans défiler.
- Étant donné l'accueil dans une fenêtre de 390 × 844 px, quand la page est chargée, alors le statut d'ouverture, le lien d'appel et l'intitulé de la première question du premier avis sont visibles sans défilement.
- Étant donné l'accueil dans une fenêtre de 1440 × 900 px, quand la page est chargée, alors la colonne gauche contient les familles de pièces puis la zone « Vos questions », la colonne centrale l'information et le premier avis, et la colonne droite les informations du garage et le formulaire de rappel.
- Étant donné l'accueil dans un navigateur réel, quand j'envoie successivement la première question du premier avis puis le formulaire de rappel, alors chaque envoi atteint sa propre route et produit sa propre page.

**US-09. Les questions qui font hésiter** (attractive, AT-2, P3)
En tant que client qui ne connaît pas encore ce garage, je veux trouver les réponses aux questions qui me retiennent, afin de décider de lui confier ma voiture.
- Étant donné la zone « Vos questions » de l'accueil, quand j'ouvre « Vais-je perdre la garantie de mon constructeur si je fais l'entretien ici ? », alors la réponse énonce la condition du respect des préconisations du constructeur et cite les règlements (UE) n° 461/2010 et 2023/822.
- Étant donné une question dont la réponse dépend d'une donnée marquée à valider, quand l'accueil est rendu en mode production, alors cette question n'apparaît pas et la zone contient au moins les trois questions fondées sur la loi.
- Étant donné JavaScript désactivé, quand j'active une question au clavier, alors sa réponse se déplie.

**US-10. Comprendre l'absence d'avis** (basique, B-21 et AE-01, P3)
En tant que client qui cherche des avis, je veux comprendre pourquoi il n'y en a pas encore et pouvoir en donner un, afin de ne pas prendre ce vide pour un mauvais signe.
- Étant donné un lien d'avis Google validé, quand l'accueil est rendu, alors l'encart affiche « Nouveau nom, même atelier », l'ancien nom « Garage auto choisy 94 » et un lien vers le formulaire d'avis, et la page ne contient aucune note chiffrée ni aucun témoignage.
- Étant donné une note recopiée dont la date de relevé remonte à plus de 90 jours, quand l'accueil est rendu, alors la note n'est pas affichée.

### Lot 2 : demandes

**US-11. Demander un rendez-vous** (basique B-07 et performance P-07, P3)
En tant que client qui prépare un entretien, je veux proposer une à trois demi-journées où je peux venir, afin d'obtenir un rendez-vous sans téléphoner pendant les heures d'atelier.
- Étant donné une configuration d'essai fermée le dimanche et une fermeture exceptionnelle déclarée le lundi suivant, quand j'ouvre le formulaire de rendez-vous, alors la liste des demi-journées proposées ne contient ni ce dimanche ni ce lundi.
- Étant donné le formulaire rempli avec une prestation, une demi-journée, une marque, un nom et un téléphone, quand je l'envoie, alors la confirmation contient « Ce n'est pas encore une réservation » et le bouton d'accès au formulaire porte le libellé exact « Demander un rendez-vous ».
- Étant donné JavaScript désactivé, quand je remplis et envoie le formulaire de rendez-vous, alors la demande est enregistrée et la confirmation s'affiche.

**US-12. Savoir ce qui se passe ensuite** (basique, B-08, P2 et P3)
En tant que client qui vient d'envoyer une demande, je veux un récapitulatif et la suite annoncée, afin de ne pas me demander si elle est partie.
- Étant donné une demande envoyée, quand la confirmation s'affiche, alors elle reprend le type de demande, le véhicule, les créneaux choisis et le numéro saisi, et dit qui rappelle et par quel canal.

**US-13. Le rappel daté, même le soir** (attractive, AT-3, P1 et P3)
En tant qu'automobiliste qui écrit après la fermeture, je veux savoir précisément quand on me rappellera, afin de ne pas rester dans l'attente.
- Étant donné une configuration d'essai qui ouvre le jeudi à 8 h 30, un délai validé « prochaine demi-journée d'ouverture » et une horloge réglée un mercredi à 21 h, quand j'envoie une demande de rappel, alors la confirmation affiche « Nous vous rappelons demain matin, à partir de 8 h 30 ».
- Étant donné la même configuration et une fermeture exceptionnelle couvrant le jeudi, quand j'envoie la même demande le mercredi à 21 h, alors la date annoncée est celle de la première demi-journée d'ouverture après la fermeture.
- Étant donné un délai de rappel marqué à valider, quand j'envoie une demande, alors la confirmation n'annonce ni délai ni date.

**US-14. Un formulaire qui dit ce que devient mon numéro** (basique, B-12, P2 et P3)
En tant que client, je veux savoir à quoi servira mon téléphone, afin de le donner sans craindre le démarchage.
- Étant donné n'importe quel formulaire public, quand il est affiché, alors les champs obligatoires sont signalés, aucune case n'est pré-cochée, une mention (responsable, finalité, durée de conservation de 12 mois, droits, lien vers la politique de confidentialité) figure sous le formulaire, et le champ téléphone est suivi d'une mention indiquant qu'il sert uniquement à répondre à la demande et qu'aucune sollicitation commerciale n'aura lieu sans consentement préalable.

**US-15. Pas de demandes automatiques** (basique, B-23, P4)
En tant que garagiste, je veux ne pas recevoir de pourriel, afin de ne consacrer mon temps qu'à de vrais clients.
- Étant donné une demande envoyée avec le champ piège rempli, quand le serveur la reçoit, alors elle n'est pas enregistrée, aucune notification ne part, et la réponse affichée est identique à celle d'une demande valide.
- Étant donné cinq demandes déjà reçues de la même adresse dans l'heure, quand une sixième arrive, alors elle est refusée avec un message qui donne le numéro de téléphone du garage.
- Étant donné une requête dont l'en-tête `Origin` désigne un autre domaine, quand elle envoie une demande, alors la demande est refusée et n'est pas enregistrée.

**US-16. Une demande n'est jamais perdue** (basique, B-24, P4)
En tant que garagiste, je veux que chaque demande soit conservée même si le courriel échoue, afin de ne jamais laisser un client sans réponse.
- Étant donné un notificateur de courriel en échec, quand un client envoie une demande, alors la demande est enregistrée, le client voit la confirmation normale, et sa fiche dans l'espace garagiste porte la mention « Courriel de notification non envoyé ».
- Étant donné un notificateur en état de marche, quand une demande est enregistrée, alors un courriel part vers l'adresse de configuration avec le type, le niveau d'urgence éventuel, le téléphone en lien `tel:` et le lien vers la fiche.

### Lot 3 : premier avis

**US-17. Commencer depuis l'accueil** (attractive, AT-1, P1)
En tant qu'automobiliste inquiet, je veux commencer le premier avis sans quitter l'accueil, afin de gagner du temps.
- Étant donné l'accueil, quand je choisis « Un voyant s'allume » et que j'envoie, alors la page suivante est la question des signes de danger, intitulée « Question 2 » avec la mention « 5 questions au plus ».

**US-18. L'écran d'arrêt** (basique, B-18, P1)
En tant qu'automobiliste, je veux être arrêté net si ce que je décris est dangereux, afin de ne pas me mettre en danger ni aggraver la panne.
- Étant donné la question des signes de danger, quand je coche « Un voyant rouge ou le voyant moteur qui clignote », alors la page suivante a pour titre « Ne roulez pas », affiche le lien d'appel et ne pose aucune autre question.
- Étant donné le garage fermé selon l'horloge, quand l'écran d'arrêt s'affiche, alors il contient aussi « contactez l'assistance de votre assureur » et « En cas de danger immédiat, appelez le 112 ».

**US-19. « Je ne sais pas » ne piège personne** (basique, B-18, P1)
En tant qu'automobiliste qui n'a pas tout remarqué, je veux pouvoir répondre « Je ne sais pas », afin de ne pas inventer une réponse qui fausserait l'orientation.
- Étant donné l'arbre chargé, quand la porte de validation le parcourt, alors chaque question porte le choix « Je ne sais pas », et la porte échoue avec un code non nul si ce choix est retiré d'une question de l'arbre d'essai.
- Étant donné « Je ne sais pas » répondu à la question des signes de danger, quand le résultat s'affiche, alors son niveau n'est pas « Pas d'urgence » et il liste les signes qui imposent de s'arrêter.
- Étant donné « Je ne sais pas » répondu à toutes les questions, quand le résultat s'affiche, alors il contient « Vos réponses ne suffisent pas pour orienter : l'atelier doit voir la voiture » et propose l'appel et la demande de rappel.

**US-20. Cinq questions au plus** (performance, P-06, P1)
En tant qu'automobiliste pressé, je veux un questionnaire court, afin d'aller au bout.
- Étant donné l'arbre chargé depuis son fichier, quand la porte parcourt tous les chemins de la première question à un résultat, alors aucun chemin ne dépasse 5 questions ni aucune question 7 choix, et la porte échoue avec un code non nul si une sixième question est ajoutée à une branche de l'arbre d'essai.

**US-21. Un résultat clair et honnête** (attractive, AT-1, P1)
En tant qu'automobiliste, je veux lire ce que je dois faire, les pistes possibles et ce que coûtera le contrôle, afin de décider sans me sentir manipulé.
- Étant donné un parcours d'essai de la famille « Un bruit inhabituel » sans signe de danger, quand le résultat s'affiche, alors il présente d'abord l'un des trois niveaux en toutes lettres, puis une à trois pistes suivies chacune de « Ce que l'atelier vérifiera », puis la mention « Premier avis établi à partir de vos seules réponses. Il ne remplace pas l'examen du véhicule. »
- Étant donné l'ensemble des résultats de l'arbre, quand la porte de contenu les analyse, alors aucun ne contient le signe « % », un montant de réparation, ni les mots « certain », « garanti » ou « sûrement ».
- Étant donné un prix du contrôle à l'atelier marqué à valider, quand un résultat est rendu en mode production, alors aucun montant n'y figure.

**US-22. Le relais vers le garagiste** (attractive phare, AT-1, P1 et P4)
En tant qu'automobiliste, je veux envoyer mes réponses au garage en demandant qu'on me rappelle, afin de ne pas avoir à tout réexpliquer.
- Étant donné un résultat de premier avis, quand je choisis « Être rappelé », alors le formulaire s'ouvre avec le type « Rappel après premier avis » et un résumé non modifiable des réponses et du niveau, et seuls mon nom et mon téléphone me sont demandés.
- Étant donné cette demande envoyée, quand le garagiste ouvre sa fiche dans l'espace garagiste, alors il lit les réponses en toutes lettres, le niveau de conduite à tenir et l'heure d'envoi.
- Étant donné une demande de niveau « Ne roulez pas » et deux demandes plus anciennes sans urgence, quand la liste des demandes s'affiche, alors la demande de niveau « Ne roulez pas » apparaît en premier.

**US-23. Une fiche à imprimer ou partager** (attractive, AT-1, P1)
En tant qu'automobiliste, je veux garder ou transmettre le résumé de mes réponses, afin de le montrer au garagiste ou à un proche.
- Étant donné un résultat, quand j'imprime la page, alors la sortie contient les réponses, le niveau, les pistes, le téléphone et l'adresse du garage, et ne contient pas le menu de navigation.
- Étant donné une adresse de résultat dont un paramètre contient un texte libre, quand la page est rendue, alors ce texte n'apparaît nulle part dans la page et les codes inconnus sont ignorés.

**US-24. Le premier avis sans JavaScript** (basique, B-15, P1)
En tant qu'automobiliste sur un téléphone ancien ou mal couvert, je veux que le premier avis fonctionne sans script, afin de ne pas rester bloqué.
- Étant donné JavaScript désactivé, quand je parcours le premier avis de la première question au résultat puis que j'utilise le bouton retour du navigateur, alors chaque page s'affiche et la question précédente réapparaît avec ma réponse.

**US-25. Rien n'est dit en mon nom sans ma relecture** (basique, B-18 et B-20, P4)
En tant que garagiste, je veux que le premier avis ne soit publié qu'après ma relecture, afin que le site ne dise rien que je n'ai validé.
- Étant donné un arbre sans date de relecture, quand l'application démarre en mode production, alors le démarrage échoue avec un code non nul et un message qui nomme « relecture de l'arbre du premier avis ».

### Lot 4 : catalogue

**US-26. Parcourir les familles de pièces** (basique, B-06, P2)
En tant que client qui cherche une pièce, je veux parcourir des familles nommées dans mes mots, afin de trouver la mienne sans connaître le jargon.
- Étant donné la page Pièces, quand elle est rendue, alors elle liste toutes les familles validées de la configuration et aucune famille non validée.
- Étant donné une fiche famille, quand elle est rendue, alors elle contient le rôle de la pièce, les signes d'usure avec un lien vers le premier avis, et un bouton « Demander un devis pour cette pièce ».

**US-27. Une recherche qui comprend** (performance, P-10, P2)
En tant que client, je veux taper le mot qui me vient, afin de trouver la famille même sans son nom exact.
- Étant donné la recherche « frein », quand je l'envoie, alors la famille Freinage figure dans les résultats.
- Étant donné une recherche qui ne correspond à aucune famille, quand je l'envoie, alors la page dit qu'aucune famille ne correspond et propose la demande de devis et le numéro de téléphone.

**US-28. Un devis pour une pièce vérifiée et posée** (attractive, AT-4, P2)
En tant que client qui cherche une pièce, je veux demander un devis sans savoir si la pièce convient à ma voiture, afin que le garagiste le vérifie pour moi.
- Étant donné la fiche d'une famille et l'engagement de vérification validé, quand je demande un devis, alors le formulaire s'ouvre avec la famille pré-remplie, la mention d'engagement tirée de la configuration et le choix de gamme « Neuve », « Issue de l'économie circulaire », « Sans préférence ».
- Étant donné les plaques « AB-123-CD » et « 1234 AB 56 », quand je les saisis tour à tour et que j'envoie, alors les deux sont acceptées.
- Étant donné la plaque « 12-AB », quand j'envoie, alors un message indique le format attendu avec un exemple de chaque format, et la demande n'est pas enregistrée.
- Étant donné la vente au comptoir marquée à valider, quand le formulaire s'affiche en mode production, alors l'option « Pièce seule, à retirer au garage » est absente et aucun champ d'envoi de fichier n'est présent.

**US-29. Ni stock ni compatibilité automatique** (basique, garde de AE-22, P2)
En tant que client, je veux ne jamais lire une promesse que personne ne tient, afin de faire confiance à ce que j'ai lu.
- Étant donné toutes les pages du catalogue rendues, quand leur texte est analysé, alors aucune ne contient « en stock », « panier », « ajouter au panier », « compatible avec votre véhicule » ni « payer ».

### Lot 5 : espace garagiste

**US-30. Traiter les demandes au téléphone** (basique, B-24, P4)
En tant que garagiste, je veux voir mes demandes sur mon téléphone et appeler en un geste, afin de rappeler entre deux interventions.
- Étant donné trois demandes non traitées dont une de niveau « Ne roulez pas » et une demande close, quand j'ouvre la liste dans une fenêtre de 390 px, alors les non traitées précèdent la close, l'urgente est en tête, et chacune porte un lien d'appel.
- Étant donné une demande « nouvelle », quand je la passe à « rappelée », alors le statut et l'heure du changement sont enregistrés et affichés sur la fiche.

**US-31. Déclarer une fermeture exceptionnelle** (basique, B-04, P4)
En tant que garagiste, je veux signaler une fermeture en quelques secondes, afin qu'aucun client ne trouve porte close à cause du site.
- Étant donné l'espace garagiste ouvert sur un téléphone, quand je déclare une fermeture, alors l'écran ne demande que trois champs (du, au, motif choisi dans une liste).
- Étant donné une fermeture d'essai déclarée du lundi au samedi d'une semaine avec le motif « congés », quand un visiteur ouvre l'accueil le mercredi de cette semaine, alors le statut commence par « Fermé exceptionnellement » suivi de la date de réouverture, et le formulaire de rendez-vous ne propose aucune demi-journée de cette semaine.

**US-32. Mesurer mon délai de rappel** (performance, P-09, P4)
En tant que garagiste, je veux voir si je tiens le délai annoncé, afin de corriger avant que les clients s'en plaignent.
- Étant donné dix demandes des 30 derniers jours dont neuf rappelées dans le délai validé, quand j'ouvre l'espace garagiste, alors il affiche « 9 demandes sur 10 rappelées dans le délai annoncé (30 derniers jours) ».
- Étant donné aucune demande sur les 30 derniers jours, quand j'ouvre l'espace garagiste, alors il affiche « Aucune demande sur les 30 derniers jours » et aucun pourcentage.

**US-33. Un accès protégé** (basique, P4)
En tant que garagiste, je veux que mes demandes ne soient lisibles que par moi, afin de protéger les coordonnées de mes clients.
- Étant donné cinq essais de mot de passe faux en quinze minutes, quand un sixième essai arrive, alors il est refusé sans vérification du mot de passe et le message indique le délai d'attente.
- Étant donné une visite de `/garagiste` sans session, quand la page est demandée, alors le visiteur est redirigé vers la connexion et la réponse porte l'en-tête `X-Robots-Tag: noindex`.

**US-34. Purge automatique** (basique, B-24, P4 et P1)
En tant que client, je veux que ma demande ne soit pas conservée indéfiniment, afin que mes coordonnées ne traînent pas.
- Étant donné une demande dont le dernier changement de statut date de plus de 12 mois, quand la tâche de purge s'exécute, alors la demande n'existe plus en base et le journal de purge compte une suppression.

### Lot 6 : contenus de confiance

**US-35. Des tarifs datés** (performance, P-08, P3)
En tant que client qui prépare un entretien, je veux lire les prix TTC, ce qu'ils comprennent et depuis quand ils valent, afin de comparer sans mauvaise surprise.
- Étant donné des prix validés, quand la page Prestations et tarifs est rendue, alors chaque ligne affiche la prestation, ce qu'elle comprend, le prix TTC et la date d'effet, et le taux horaire TTC figure en tête s'il est validé.

**US-36. Vos droits chez nous** (attractive AT-2, basiques B-10 et B-11, P3)
En tant que client méfiant, je veux lire mes droits et les engagements du garage au même endroit, afin de savoir à quoi m'attendre.
- Étant donné la page « Vos droits chez nous », quand elle est rendue, alors elle contient l'expression exacte « pièces issues de l'économie circulaire », les catégories et les exceptions de l'article D224-25-2, le nom et l'adresse du site du médiateur, et l'encart sourcé sur la garantie constructeur.

### Lot 7 : qualité et mise en ligne

**US-37. Rapide sur téléphone** (performance, P-01 à P-03, P1)
En tant qu'automobiliste mal couvert, je veux un site qui s'affiche aussitôt, afin de ne pas perdre de temps en panne.
- Étant donné le site construit en mode production, quand Lighthouse mobile mesure chaque gabarit public, alors Performance ≥ 98, Accessibilité = 100, Bonnes pratiques = 100, Référencement = 100, et l'accueil pèse au plus 150 Ko transférés.

**US-38. Utilisable au clavier et au lecteur d'écran** (basique B-16, performance P-04, P3)
En tant que client qui navigue au clavier ou avec un lecteur d'écran, je veux atteindre chaque fonction, afin d'utiliser le site comme tout le monde.
- Étant donné chaque page publique et chaque page de l'espace garagiste, quand axe-core l'analyse, alors il ne rapporte aucune violation des règles WCAG 2.2 A et AA.
- Étant donné l'accueil dans une fenêtre de 390 px, quand je le parcours uniquement avec la touche Tab, alors chaque lien et chaque champ reçoit un focus visible qui n'est jamais masqué par la barre fixe.

**US-39. Chaque page est atteignable** (basique, garde du piège 27, P1 à P3)
En tant que visiteur, je veux atteindre chaque page par la navigation, afin qu'aucune fonction n'existe sans chemin pour y arriver.
- Étant donné l'accueil, quand un robot de test suit uniquement les liens de navigation, alors il atteint chaque page du plan public sans saisir d'adresse.

## Ordre d'exécution (lots)

| Lot | Contenu | US | Porte de sortie |
|---|---|---|---|
| 0. Socle | Squelette hexagonal, racine de composition unique, fichier de configuration à statuts, politique de publication et porte de démarrage, port `Horloge`, jetons de couleur et gabarits, en-tête et pied, mentions légales, confidentialité, JSON-LD, en-têtes de sécurité, budgets de poids et Lighthouse outillés | US-01 à US-07 | Tests domaine, cas d'usage et HTTP verts ; porte de démarrage vue rouge par injection ; budgets mesurés sur chaque gabarit existant |
| 1. Accueil | Mise en page trois colonnes et téléphone, statut, zone « Vos questions », encart « nouveau nom », illustrations | US-08 à US-10 | Tests navigateur à 390 et 1440 px, avec et sans JavaScript |
| 2. Demandes | Agrégat `Demande`, SQLite, notificateur, formulaire unique à quatre types, confirmation, rappel daté, anti-abus | US-11 à US-16 | Envoi réel au navigateur ; échec de courriel simulé ; injection de champ piège |
| 3. Premier avis | Arbre versionné et sa porte, pages de questions et de résultats, écran d'arrêt, relais, fiche | US-17 à US-25 | Porte de l'arbre vue rouge (sixième question, « Je ne sais pas » retiré, mot interdit) ; parcours complet sans JavaScript |
| 4. Catalogue | Familles et synonymes, fiches, recherche, demande de devis pièce | US-26 à US-29 | Recherche vide testée ; formats de plaque testés ; balayage des mots interdits |
| 5. Espace garagiste | Connexion, demandes, fermetures exceptionnelles, délai mesuré, purge | US-30 à US-34 | Test navigateur sur téléphone ; purge testée sur données datées |
| 6. Contenus de confiance | Prestations et tarifs, « Vos droits chez nous », accès et horaires | US-35, US-36 | Relecture juridique de D224-25-2 ; données validées par Anthony |
| 7. Qualité et mise en ligne | Rejeu complet des portes, Lighthouse, axe-core, navigation, jury d'utilisateurs, instance permanente, sonde de disponibilité | US-37 à US-39 | Jury au niveau excellent ; accord d'Anthony avant tout déploiement |

Règles d'enchaînement :
- **Aucune mise en ligne avant la fin du lot 5.** Une demande publique sans espace pour la lire serait une écriture sans lecture (piège 2).
- Les portes de performance (P-01 à P-03) et d'accessibilité (P-04) tournent **dès le lot 0** sur chaque gabarit existant ; le lot 7 les rejoue sur l'ensemble, il ne les introduit pas.
- Un lot qui n'ajoute aucun test n'a rien démontré (piège 6) ; chaque porte de garde est vue rouge par injection avant d'être considérée comme acquise.
- Les données bloquantes de D8 sont demandées au garage **dès le lot 0**, pour ne pas découvrir au lot 7 qu'un médiateur ou des horaires manquent.
- Jury du lot 7 : un juré par persona (P1 à P4), qui rejoue ses parcours à partir des critères ci-dessus, au téléphone et à l'ordinateur ; toute remarque factuelle ouvre une passe de correction, jusqu'à épuisement des axes.

## État appliqué

À remplir après réalisation de chaque lot. Aucune US n'est réalisée au 2026-09-23.

| US | Lot | État | Preuve (test nommé, capture, mesure) | Date |
|---|---|---|---|---|

## Anomalies détectées et corrigées

Aucune à ce jour.

| N° | Constat | Cause | Correction | Garde ajoutée | Date |
|---|---|---|---|---|---|
