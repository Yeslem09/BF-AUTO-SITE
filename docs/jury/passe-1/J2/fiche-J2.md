# Fiche du juré J2, passe 1

**Profil** : 29 ans, je cherche des plaquettes de frein et un prix, je compare avec Oscaro (recherche de la pièce par immatriculation, prix affiché) et Norauto (forfait de pose affiché, réservation en ligne). Téléphone 390 x 844 (isMobile, hasTouch, Chrome Android émulé), puis ordinateur 1440 x 900.

**Session** : jeudi 24 septembre 2026, de 01 h 38 à 02 h 00 (heure de Paris). Le garage était fermé pendant tout le test.

**Garde-fous** : aucun fichier du projet lu ; toute requête autre que GET bloquée dans le navigateur ; formulaires remplis avec des données fictives (Essai, 06 00 00 00 00, AB-123-CD) et jamais envoyés.

**Événement pendant la session** : entre 01 h 40 et 01 h 47, le statut est passé de « Fermé, ouvre à 8 h 30 » à « Fermé exceptionnellement, ouvre demain à 8 h 30 » (fermeture exceptionnelle « imprévu » ajoutée pour le jeudi 24 septembre, visible sur Accès et horaires). Le contenu n'est pas pénalisé ; les défauts d'affichage que ce texte plus long a révélés, eux, sont jugés.

**Note J2 : 6,9 / 10** (9 + 8 + 8 + 7 + 3 + 6 + 7, divisé par 7)

---

## 1. Tâches chronométrées

Temps = durée du script (machine), gestes = actions qu'un visiteur ferait. Départ : accueil chargé.

| Tâche | Téléphone | Ordinateur | Ce que j'obtiens |
|---|---|---|---|
| T1 recherche « plaquettes » | 4 gestes (1 défilement, tap champ, saisie, « Chercher »), 1,18 s | 3 gestes (clic, saisie, Entrée), 0,53 s | « Une famille correspond à votre recherche » : carte Freinage. Pas de fiche pièce, pas de prix, pas de compatibilité avec mon véhicule. |
| T1 « plaquette avant » | 4 gestes, 1,14 s | 3 gestes, 0,57 s | Freinage (singulier et « avant » tolérés). |
| T1 « disques » | 4 gestes, 1,14 s | 3 gestes, 0,41 s | Freinage, sous-titre réordonné « Disques, plaquettes, liquide de frein » (bonne idée). |
| T2 retrait au garage ou pose | 7 gestes (recherche, carte Freinage, 2 défilements), 0,91 s ; 4 gestes par la puce « Freinage » de l'accueil | 6 gestes, 1,49 s | Section « Retrait ou pose : à vous de choisir », deux cartes claires. Manquent : délai pour avoir la pièce, prix pièce seule contre pièce posée, et si le garage pose une pièce que j'apporte (achetée sur Oscaro). |
| T3 demander un prix pour des plaquettes | 8 gestes jusqu'au formulaire prérempli « Freinage », 1,40 s ; puis 11 gestes utiles et environ 5 défilements pour le remplir (environ 6 écrans) | 7 gestes jusqu'au formulaire, 1,90 s | Formulaire clair, non envoyé (voir limites). |
| T4 coût d'un premier contrôle et d'une vidange | 3 gestes (défilement, « Consulter les tarifs », défilement), 1,08 s | 2 gestes (menu « Tarifs », molette), 0,77 s | Échec sur le fond : « Premier contrôle à l'atelier : Sur demande », « Vidange et filtres : Prix sur devis ». Ce qu'est le premier contrôle n'est expliqué que dans la question repliée de l'accueil « Faut-il prendre rendez-vous ? » (« passez sans rendez-vous »). |
| T5 trouver le téléphone | 0 geste (en-tête et barre fixe du bas), 1 tap pour appeler | 0 geste (« Appeler 06 05 92 28 38 » en haut à droite) | Réussi. |
| T6 savoir si c'est ouvert | 0 geste (pastille sous l'en-tête) | 0 geste | Réussi, cohérent avec le tableau des horaires. |
| T7 confiance | voir critère 6 | | Je confierais mes plaquettes après un appel pour obtenir le prix, pas sur la seule foi du site. |

**Robustesse de la recherche** (20 requêtes supplémentaires) : fautes et casse tolérées (« plaquete », « PLAQUETTES », « plaquettes clio 4 » donnent Freinage) ; « controle technique » donne un bon état vide (« Demander un prix », « Appeler le 06 05 92 28 38 »). Bruit : « freins qui grincent » donne 6 familles dont Climatisation, Boîte de vitesses et Démarrage et charge (le mot « qui » accroche « Air qui ne refroidit plus », « Vitesses qui craquent ») ; « plaquettes arrière » ajoute Éclairage et Pare-brise ; « disque avant » ajoute Embrayage (m04).

---

## 2. Notes par critère

| # | Critère | Note | Fondement (écran, temps, texte lu) |
|---|---|---|---|
| 1 | Trouver le téléphone | 9 | Écran 1 du téléphone, 0 geste : bouton orange « 06 05 92 28 38 » dans l'en-tête et barre fixe « Appeler 06 05 92 28 38 » (lien tel:+33605922838), présents sur les 65 pages parcourues ; ordinateur : « Appeler 06 05 92 28 38 » en haut à droite (m01-accueil-ecran1, d01-accueil-01). Retenue : sur le résultat du pré-diagnostic, « Numéro du garage : 06 05 92 28 38 » n'est pas cliquable et se coupe en « 06 05 92 / 28 38 » sur téléphone (m12-prediag-resultat-02). |
| 2 | Savoir si c'est ouvert | 8 | Pastille visible sans geste sur toutes les pages ; juste à 01 h 38 (« Fermé, ouvre à 8 h 30 », jeudi 8 h 30 à 12 h) et après la fermeture exceptionnelle (« ouvre demain à 8 h 30 », motif « imprévu » sur Accès). Retenues : un statut long casse l'en-tête et déborde de la barre du bas (défauts 2 et 4) ; le statut est calculé au chargement seulement, une page laissée ouverte ne change pas (vérifié avec une horloge simulée). |
| 3 | Orientation (pré-diagnostic) | 8 | « Le freinage a changé » est sur l'écran 1 ; résultat en 5 taps (3,2 s) : « Roulez prudemment et faites contrôler dans les prochains jours », deux pistes (témoin d'usure des plaquettes ; plaquettes ou disques encrassés ou durcis) avec ce que l'atelier vérifiera, figure, récapitulatif, impression ; les réponses suivent dans « Être rappelé » (« vous n'aurez pas à tout réexpliquer »). Retenues : aucune suite « prix » depuis le résultat (défaut 7) ; la recherche ne renvoie pas vers le pré-diagnostic quand on tape un symptôme. |
| 4 | Demander un devis ou un rendez-vous | 7 | Formulaire atteint en 8 gestes, intervention préremplie, choix retrait ou pose, clavier numérique pour le téléphone, « facultatif » explicite, « Ce n'est pas une réservation » honnête. Retenues : environ 6 écrans sur téléphone ; réponse uniquement par rappel téléphonique ; changer d'onglet efface la saisie (défaut 6) ; « plaquettes » tapé dans la recherche n'est pas repris ; pas de choix rapide de la pièce ; option d'occasion proposée pour le freinage (défaut 3) ; aucun contrôle avant envoi (formulaire en novalidate). |
| 5 | Comprendre les prix | 3 | Je comprends la méthode (prix TTC, devis écrit avant travaux, « Sur demande » donné au téléphone) mais je n'obtiens aucun chiffre : taux horaire et premier contrôle « Sur demande », 18 forfaits « Prix sur devis », fiches Freinage et Vidange « Prix sur devis » (m06-tarifs, d05-tarifs). Comparaison avec Norauto ou Oscaro impossible. Si les montants attendent la validation du garage, la structure est prête et la note remontera avec eux. |
| 6 | Confiance | 6 | Plus : SIRET avec lien vers la fiche publique, adresse, horaires, « Garage auto choisy 94 devient BF Auto, même adresse, même numéro », engagements (devis écrit, appel avant travail supplémentaire, pièces restituées), page de droits sourcée, aucun cookie de suivi. Moins : aucun avis client, aucune photo (0 image sur l'accueil, Accès, Freinage, Vos droits : uniquement des dessins), aucun visage ni nom de mécanicien, pas de garantie annoncée sur les travaux, pas de délai, pas de prix. |
| 7 | Esthétique et finition | 7 | Identité forte et cohérente (anthracite, orange, papier quadrillé, dessins techniques numérotés), typographie lisible, pages légères. Retenues : débordement de la barre du bas, pastille cassée, logo différent selon l'écran, grands vides sur l'accueil ordinateur, paragraphe répété trois fois, heure et numéro coupés en fin de ligne, reflet bleu au toucher (défauts 2, 4, 11 à 15). |

---

## 3. Défauts et manques, par priorité

Chaque point : où, quoi, pourquoi, action.

### P1, bloquant pour mon profil

1. **Aucun prix sur le site**. Où : /tarifs, fiches familles. Quoi : taux horaire « Sur demande », premier contrôle « Sur demande », 18 lignes « Prix sur devis ». Le bouton de l'accueil ordinateur « Consulter les tarifs, Taux horaire et prix TTC » promet un taux horaire absent, et « Vos droits chez nous » écrit « Oui, c'est une obligation : le taux horaire et les forfaits doivent être affichés toutes taxes comprises » : contradiction visible. Pourquoi : c'est le premier réflexe face à Norauto ; sans chiffre je quitte le site pour comparer. Action : publier au minimum le taux horaire TTC et 3 forfaits « à partir de » (plaquettes avant posées, vidange et filtre, premier contrôle), ou des fourchettes par gabarit de véhicule ; sinon changer le sous-titre du bouton et le titre de la page (« Comment nous chiffrons »).
2. **Barre fixe du bas qui déborde**. Où : toutes les pages, téléphone, bouton « Être rappelé » (m19-barre-bas-zoom, m14-vidange-02). Quoi : avec « Fermé exceptionnellement, ouvre demain à 8 h 30 », le bouton passe sur 4 lignes et la dernière (« demain à 8 h 30 ») est coupée par le bord de l'écran (bouton de 781 à 849 px pour un écran de 844). Pourquoi : c'est le bouton le plus vu du site, et le statut long reviendra à chaque fermeture exceptionnelle. Action : sous-texte sur une seule ligne (« Rappel dès demain 8 h 30 »), sans retour à la ligne, points de suspension au besoin, hauteur de barre fixe.
3. **Pièce d'occasion proposée pour des plaquettes**. Où : formulaire de devis Freinage (« Type de pièce souhaitée : Neuve / D'occasion ou reconditionnée / Sans préférence ») et fiche Freinage (« Au devis, vous choisissez la gamme : neuve, d'occasion ou reconditionnée »). Quoi : la page « Vos droits chez nous » exclut elle-même le freinage des pièces de réemploi. Pourquoi : des plaquettes d'occasion n'ont pas de sens pour une pièce d'usure de sécurité ; cela fait douter du sérieux. Action : masquer l'option pour Freinage (et les autres pièces de sécurité soumises à usure) ou écrire « pièces neuves uniquement pour le freinage ».

### P2, gêne nette

4. **Pastille d'état qui se casse**. Où : en-tête téléphone (m19-accueil-ferme-exceptionnel-ecran1), carte Horaires d'Accès (m15-acces-01, d06-acces-01), pied de page (m02-accueil-11, point seul au-dessus de « Fermé, ouvre à 8 h 30 » même avec le texte court). Quoi : le point gris passe seul sur une ligne, l'adresse est repoussée sous la pastille. Action : point et texte dans un même bloc aligné, le point ne passe jamais seul à la ligne.
5. **Recherche bruitée par les mots courants**. Où : /pieces-et-reparations?q=... Quoi : « freins qui grincent » donne 6 familles dont Climatisation (m04-recherche-freins-qui-grincent). Action : ignorer les mots vides (qui, de, la, les, ça...), classer par nombre de termes utiles trouvés, et proposer le pré-diagnostic quand la requête décrit un symptôme (grince, bruit, vibre, voyant).
6. **Changer d'onglet efface la saisie**. Où : /demande, onglets Rendez-vous / Devis / Être rappelé. Quoi : j'ai saisi prénom, téléphone et précisions dans Devis, puis touché « Rendez-vous » : la page se recharge et les trois champs sont vides (vérifié). Action : conserver les champs communs d'un onglet à l'autre.
7. **Résultat du pré-diagnostic sans suite « prix »**. Où : résultat « Roulez prudemment... » (m12-prediag-resultat-02). Quoi : seulement « Être rappelé à l'ouverture » et « Imprimer la fiche » ; ni lien vers la fiche Freinage ni « Demander un prix pour ces pièces ». Action : ajouter ce bouton, prérempli avec la famille et le pré-diagnostic.
8. **Premier contrôle non expliqué là où on le cherche**. Où : /tarifs. Quoi : la ligne ne dit ni ce qui est contrôlé, ni la durée, ni s'il est payant ou déduit de la réparation ; l'accueil annonce pourtant « Pré-diagnostic gratuit : le diagnostic se fait à l'atelier ». Action : une phrase sous la ligne (contenu, durée, sans rendez-vous, prix, déduit ou non).
9. **Basiques de confiance absents**. Où : tout le site. Quoi : avis clients ou note, photos (façade, atelier, équipe), garantie sur les travaux, délai pour obtenir une pièce, politique sur les pièces apportées par le client, moyens de paiement, stationnement ou accès en transports (le repère « À environ 600 m de Vitry-sur-Seine » aide peu). Action : ajouter au moins une photo de la façade sur Accès, un lien vers les avis, la garantie et le délai type pour des plaquettes.
10. **Mentions légales incomplètes**. Où : /mentions-legales. Quoi : hébergeur réduit à « Francfort (Allemagne) » sans nom, adresse ni téléphone ; médiateur de la consommation non nommé ; pas de directeur de la publication. [À VALIDER : informations peut-être en attente du garage.] Action : compléter ces trois mentions.

### P3, finition

11. **Logo différent selon l'écran** : en-tête téléphone en lettres épaisses sans le chat, en-tête ordinateur et pied de page en lettres fines avec le chat (m23-logo-entete-telephone, d08-logo-entete-ordinateur). Action : une seule version, déclinée en taille.
12. **Accueil ordinateur déséquilibré** : la colonne de droite (Le garage, horaires, formulaire « Être rappelé ») est bien plus longue que les deux autres, laissant environ un écran et demi vide à gauche (d01-accueil-05, d01-accueil-06) ; même vide à droite sur /tarifs (d05-tarifs-ecran1) et liens « Toutes les familles / Tous les tarifs » flottants sur la fiche Freinage (d03-freinage-retrait-pose). Action : formulaire de rappel en bande pleine largeur, colonnes rééquilibrées.
13. **Paragraphe répété** : « Avant de commander une pièce, nous vérifions qu'elle convient à votre véhicule... » apparaît sur les résultats de recherche, sur la fiche Freinage (juste sous deux cartes qui disent déjà la même chose) et dans le formulaire. Action : une seule fois, près du choix retrait ou pose.
14. **Coupures en fin de ligne** : « ouvre demain à 8 / h 30 » (d06-acces-01), « 06 05 92 / 28 38 » (m12-prediag-resultat-02). Action : espaces insécables dans les heures et les numéros.
15. **Reflet bleu au toucher** : sur Chrome Android, chaque option touchée se colore un instant en bleu clair (rgba 51, 181, 229, 0,4) avant de passer à l'orange de la charte (m26-toucher-immediat, m26-toucher-600ms). Action : désactiver ce reflet et garder l'état actif de la charte.
16. **Libellés vagues** : liens « Le texte » répétés sur Vos droits chez nous et Confidentialité. Action : nommer la cible (« Arrêté du 27 mars 1987 sur Légifrance »).
17. **Petite incohérence** : Confidentialité dit recueillir « votre nom », les formulaires ne demandent que le prénom.

---

## 4. Ce qui marche, à garder

- Rapidité : 42 à 63 Ko par page, premier affichage entre 0,56 et 0,96 s en 4G simulée avec processeur ralenti 4 fois, aucun décalage de mise en page, aucune erreur console, aucun lien interne mort sur 65 pages.
- En-tête exemplaire sur téléphone : numéro, état d'ouverture et adresse sans aucun geste.
- Recherche tolérante (fautes, singulier, casse, modèle de voiture ajouté) et bon état vide ; pages 404 utiles (« Page introuvable », « Famille introuvable » avec recherche et « Demander un prix »).
- Pré-diagnostic court, prudent et transmis au garage avec la demande.
- Ton honnête : « Sans compte ni paiement », « Ce n'est pas une réservation », « Vous décidez ».
- Clavier : lien « Aller au contenu » en premier, focus orange de 3 px bien visible.

---

## 5. Limites du test

- **Formulaires non envoyés** : envoyer une demande exige l'accord explicite d'Anthony, que je n'ai pas. Le formulaire est en POST sans contrôle côté navigateur (novalidate) : les messages d'erreur et l'écran de confirmation n'ont donc pas été évalués. À faire dans une passe où l'envoi est autorisé.
- **État « ouvert » non observable** : test mené de nuit ; le statut est calculé par le serveur (une horloge simulée côté navigateur ne le change pas).
- **Liens externes** : Légifrance et economie.gouv.fr répondent 403 à un contrôle automatique, non vérifiables ainsi ; EUR-Lex, CNIL et annuaire des entreprises répondent 200.

---

## 6. Captures clés

Téléphone : m01-accueil-ecran1, m02-accueil-01 à 11, m03-recherche-*, m04-recherche-*, m05-freinage-01 à 05, m06-tarifs-01 à 04, m07-t2-retrait-pose-trouve, m07-t3-formulaire-*, m09-form-pret-non-envoye, m10-menu-ouvert, m11-prediag-etape-*, m12-prediag-resultat-01 à 04, m13-rappel-depuis-prediag, m14-vidange-02, m15-acces-01 à 04, m16-droits-*, m17-mentions-*, m18-page-404-01, m18-famille-inconnue-01, m19-accueil-ferme-exceptionnel-ecran1, m19-barre-bas-zoom, m22-rdv-depuis-freinage, m23-logo-entete-telephone, m24-t4-vidange-ligne, m26-toucher-immediat, m26-toucher-600ms.

Ordinateur : d01-accueil-01 à 06, d02-recherche-*, d03-freinage-ecran1, d03-freinage-retrait-pose, d04-formulaire-ecran1, d05-tarifs-ecran1 et 2, d06-acces-01, d07-prediag-resultat-01 et 02, d08-logo-entete-ordinateur, d09-clavier-tab1 et 3.

Scripts Playwright jetables : fichiers 01 à 25 (.mjs) et common.mjs du même dossier.
