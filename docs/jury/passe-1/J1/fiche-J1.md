# Fiche du juré J1, passe 1

**Profil** : conductrice de 34 ans, sur son téléphone (390 x 844, tactile), pressée : le voyant moteur vient de s'allumer et un bruit est apparu au freinage.
**Conditions** : jeudi 24 septembre 2026, entre 01 h 38 et 01 h 55, site http://127.0.0.1:4500, scripts Playwright jetables (dossier courant), captures regardées une à une. Aucun fichier du projet lu.
**Changement d'état pendant le test** : à 01 h 40 le site affichait « Fermé, ouvre à 8 h 30 » ; à partir de 01 h 49 il affiche « Fermé exceptionnellement, ouvre demain à 8 h 30 » (motif « imprévu » sur la page Accès). Les deux états ont été jugés.

## Notes par critère

| # | Critère | Note | Ce qui fonde la note |
|---|---|---|---|
| 1 | Trouver le téléphone | **9** | 0 geste : numéro en bouton orange en haut à droite et barre du bas « Appeler 06 05 92 28 38 », visibles dès le premier affichage (premier rendu 0,14 à 0,19 s en local), lien `tel:+33605922838` (01-accueil-ecran1.png). Seul accroc : sur la page de résultat, « Numéro du garage : 06 05 92 28 38. » est du texte simple coupé sur deux lignes. |
| 2 | Savoir si c'est ouvert | **7** | 0 geste : pastille « Fermé, ouvre à 8 h 30 » dans le premier écran, cohérente avec le tableau (jeudi mis en avant « aujourd'hui »). La fermeture exceptionnelle est répercutée partout (pastille, tableau en rouge, page Accès avec le motif, confirmation « vendredi matin » ; les créneaux de rendez-vous proposés commencent vendredi). Mais le statut long casse la mise en page (point isolé sur sa ligne, barre du bas tronquée) et « demain » est ambigu à 01 h 49. |
| 3 | Pré-diagnostic | **8** | Question 1 posée directement sur l'accueil, 4 questions au lieu des « 5 au plus » annoncées, 6 gestes, verdict net et coloré (« Roulez prudemment et faites contrôler dans les prochains jours »), pistes avec « Ce que l'atelier vérifiera » et schéma du frein. Escalade cohérente : « frottement métallique » donne « Ne roulez pas : appelez-nous » avec 112 et assistance. Limites : un seul symptôme possible (mon voyant est ignoré), voyants décrits en mots sans pictogramme, aucune indication de coût. |
| 4 | Demander un devis ou un rendez-vous (ici : rappel) | **5** | Ça aboutit (« Demande enregistrée, nous vous rappelons ce matin », avec récapitulatif), erreurs claires et données conservées. Mais 17 gestes dont 9 balayages, deux écrans de formulaire successifs (« Confirmez l'envoi » avec le bouton 4 balayages plus bas), et le bouton le plus visible du résultat (barre du bas) ouvre un formulaire vide qui perd le pré-diagnostic. |
| 5 | Comprendre les prix | **3** | Page « Tarifs » sans un seul montant : « Sur demande » (taux horaire, premier contrôle) et « Prix sur devis » pour les 18 familles. Rien ne dit si le devis ou le contrôle en atelier est gratuit. Impossible de budgéter des plaquettes. Point positif : TTC annoncé et « sur devis » expliqué. Note provisoire si les montants attendent la validation du garage. |
| 6 | Confiance | **7** | Méthode affichée et répétée (devis écrit, appel avant tout supplément, pièces restituées), page « Vos droits » sérieuse, SIRET avec fiche publique, ancien nom assumé, aucun cookie de suivi, pré-diagnostic prudent qui ne pousse pas à la vente. Manquent : photo du garage, avis clients, visage ou nom du garagiste, moyens de paiement. |
| 7 | Esthétique et finition | **7** | Identité « plan technique » cohérente et soignée (quadrillage, schémas au trait, orange et anthracite, cartes en ticket), grandes zones tactiles, très rapide (accueil 160 Ko, affichage principal en 0,12 s en local, 39 liens internes testés sans erreur). Mais débordements quand le statut s'allonge, pages très longues (accueil 7 737 px, soit 9 écrans), récapitulatif en double dans le formulaire. |

**Moyenne J1 : 46 / 7 = 6,6 / 10**

## Temps et gestes par tâche (téléphone)

Gestes : 1 tap = 1, 1 balayage (600 px) = 1, 1 champ tapé = 1. Un élément compte comme visible s'il n'est pas caché par la barre du bas. Estimation humaine : 1 s par balayage, 3 s par écran de question courte, 10 s pour la question 2 (7 cases longues), 5 à 7 s par champ saisi.

| Tâche | Chemin suivi | Gestes | Temps script | Estimation humaine | Captures |
|---|---|---|---|---|---|
| T1 Trouver le téléphone | Arrivée sur l'accueil | 0 | visible à 0,14 à 0,2 s | immédiat | 01-accueil-ecran1.png, 10-t1-t2-accueil.png |
| T2 Savoir si c'est ouvert | Pastille sous le logo | 0 | même écran | 2 s de lecture | 01-accueil-ecran1.png, 13-fermeture-exc-accueil.png |
| T3 Pré-diagnostic bruit au freinage | « Un bruit inhabituel » > « Aucun de ces signes » + Continuer > « Quand je freine » > « Un sifflement ou un grincement aigu » | 6 (5 taps, 1 balayage) | 3,5 s | environ 30 s | 03-diag-bruit-q2.png à 03-diag-bruit-q5-c.png, 10-t3-resultat.png |
| T4 Être rappelée depuis le résultat (bon chemin) | Balayage jusqu'à « Être rappelé à l'ouverture » > prénom, téléphone, « Dès que possible » > « Être rappelé » > écran « Confirmez l'envoi » > 4 balayages > « Confirmer l'envoi » | 17 (6 taps, 9 balayages, 2 saisies) | 2,9 s jusqu'au bouton Confirmer, puis 1 tap | 35 à 45 s | 10-t4-resultat-bouton-rappel.png, 04-rappel-a.png à 04-rappel-e.png, 11-confirmez-envoi-haut.png, 11-confirmez-envoi-bouton.png, 10-t4-envoye.png |
| T4 bis (chemin le plus probable) | Tap sur « Être rappelé » de la barre du bas, visible sans défiler | 1 | 0,6 s | 2 s | 10-t3-resultat.png, 07-barre-resultat-apres-b.png |
| T5 Confiance | Lecture accueil, Tarifs, Vos droits, Accès, Mentions légales | sans objet | sans objet | 3 à 4 min | 16-*.png |

Parcours complet T1 à T4 (bon chemin) : 23 gestes, environ 7 s de script, environ 1 min 10 à 1 min 20 pour une personne.

## T5 : confierais-je ma voiture ?

Oui, pour faire contrôler mes freins vendredi, parce que le site explique avant de vendre : devis écrit, appel avant tout travail supplémentaire, pièces restituées, un pré-diagnostic qui ne dramatise pas, dit ce que l'atelier vérifiera et rappelle qu'il ne remplace pas l'examen. L'entreprise est identifiable (SIRET, adresse, ancien nom « Garage auto choisy 94 » assumé). Mais avant d'y aller je chercherais les avis Google et la façade sur Street View : le site ne montre ni photo, ni avis, ni visage, ni aucun prix. Je sais comment ils travaillent, pas à qui je parle ni combien ça va coûter.

## Basiques manquantes

1. **Prix indicatifs** : taux horaire TTC, « à partir de » pour les interventions fréquentes (plaquettes avant, vidange, lecture à la valise), et la mention « devis gratuit » ou son prix. L'affichage en atelier du taux horaire TTC et des conditions du devis est une obligation (arrêté du 27 mars 1987) [À VALIDER : référence exacte], autant le reprendre en ligne.
2. **Photo de la façade et de l'atelier** : aucune image sur les 9 pages parcourues (0 balise image). Sert à trouver le garage et à rassurer.
3. **Avis clients** : ni note, ni lien vers les avis.
4. **Pictogrammes des voyants** dans le parcours « Un voyant s'allume » (18-voyant-q4.png) : « Un moteur vu de profil », « Un ressort en spirale » ne se reconnaissent pas en lisant, surtout sous stress.
5. **Plusieurs symptômes à la fois** : impossible de déclarer « voyant moteur + bruit au freinage ».
6. **Moyens de paiement acceptés** : absents.
7. **Mentions légales incomplètes** : hébergeur réduit à « Francfort (Allemagne) », sans nom ni coordonnées ; médiateur de la consommation cité sans nom ni coordonnées (16-mentions-1.png).

## Défauts classés par gravité

### Majeur

**M1. Le bouton le plus visible du résultat perd le pré-diagnostic.**
Où : page de résultat, barre du bas « Être rappelé » (10-t3-resultat.png). Quoi : elle mène à `/demande?type=rappel` sans les réponses ; le formulaire redemande un motif (« Un souci avec ma voiture »...) et il faut tout réexpliquer (07-barre-resultat-apres-b.png). Le bon bouton, « Être rappelé à l'ouverture », est sous la ligne de flottaison (1 balayage). Pourquoi : c'est le premier bouton orange qu'on voit, et cela contredit la promesse « Transmis tel quel au garage : vous n'aurez pas à tout réexpliquer ». Action : sur les pages de pré-diagnostic et de résultat, faire porter le pré-diagnostic au bouton de la barre (ou le remplacer par « Être rappelé avec ce pré-diagnostic ») et remonter le bouton de la page sous le verdict.

**M2. Même piège sur l'écran « Confirmez l'envoi ».**
Où : 10-t4-confirmation.png, 11-confirmez-envoi-bouton.png. Quoi : l'encadré dit « Votre demande n'est pas encore envoyée », mais « Confirmer l'envoi » est 4 balayages plus bas, alors que la barre du bas affiche en permanence un bouton orange « Être rappelé », même libellé que le bouton qu'on vient d'utiliser, qui ouvre un formulaire vide. Pourquoi : une personne pressée appuie sur le bouton visible et perd sa saisie et son pré-diagnostic. Action : masquer la barre de rappel sur les pages `/demande`, placer « Confirmer l'envoi » juste sous l'encadré avec un récapitulatif court, ou supprimer cette seconde étape.

**M3. Rappel trop long pour un téléphone.**
Où : formulaire après le résultat (04-rappel-a.png à 04-rappel-e.png, 3 861 px, puis écran de confirmation de 3 858 px). Quoi : 17 gestes dont 9 balayages ; le récapitulatif du pré-diagnostic (environ 1 000 px) passe avant les champs obligatoires et se répète : « Symptôme : Un bruit inhabituel » puis « Que remarquez-vous ? Un bruit inhabituel », et le verdict apparaît deux fois (encadré jaune et paragraphe) (04-rappel-b.png). Action : prénom, téléphone et moment en premier, récapitulatif replié en deux lignes, doublons supprimés.

**M4. Le statut long casse la mise en page.**
Où : barre du bas (20-barre-bas-zoom.png), pastille de l'en-tête (20-entete-zoom.png), bloc « Le garage », pied de page, page Accès (13-fermeture-exc-horaires.png, 16-acces-0.png). Quoi : avec « Fermé exceptionnellement, ouvre demain à 8 h 30 », le bouton orange de la barre passe sur trois lignes et sort de l'écran (lien de 781 à 849 px pour un écran de 844 px, dernière ligne coupée) ; le point de statut se retrouve seul sur sa ligne au-dessus du texte. Pourquoi : l'information clé est tronquée et le site paraît cassé. Action : sous-titre court dans la barre (« Rappel vendredi dès 8 h 30 »), point et texte sur la même ligne, tester l'état le plus long.

**M5. Aucun prix nulle part.**
Où : /tarifs (16-tarifs-0.png, 16-tarifs-1.png, 16-tarifs-3.png) et résultat du pré-diagnostic. Quoi : 2 lignes « Sur demande » et 18 lignes « Prix sur devis », deux formulations pour la même idée ; le résultat « plaquettes » ne donne ni fourchette ni lien vers le tarif freinage. Pourquoi : la question suivante de toute conductrice est « combien ? ». Action : voir basique n° 1 ; si les montants attendent le garage, l'écrire sur la page.

### Moyen

- **Un seul symptôme** : le résultat freinage affirme « Rien dans vos réponses n'impose de vous arrêter » alors que mon voyant moteur n'a jamais pu être déclaré ; je dois refaire un parcours ou l'écrire dans « Précisions ». Action : « Un autre symptôme ? L'ajouter à cette demande » sur le résultat.
- **« Ouvre demain à 8 h 30 » à 01 h 49** désigne vendredi ; la nuit, « demain » se lit « jeudi ». La confirmation dit, elle, « vendredi matin » : formulations incohérentes. Action : nommer le jour dès que la prochaine ouverture n'est pas aujourd'hui.
- **« Être rappelé / Fermé, ouvre à 8 h 30 »** (barre du bas) : on lit que le service de rappel est fermé. Action : « Rappel dès 8 h 30 ».
- **Numéro du résultat non cliquable** : « Numéro du garage : 06 05 92 / 28 38. » en texte simple, coupé sur deux lignes (03-diag-bruit-q5-c.png, 17-frottement-resultat-b.png). Action : lien `tel:` et espaces insécables.
- **Verdict rouge « Ne roulez pas : appelez-nous » pendant la fermeture** (17-frottement-resultat.png) : on demande d'appeler un garage fermé ; l'étape 2 (assistance de l'assureur) sauve la situation. Action : adapter le titre quand c'est fermé.
- **Accueil de 9 écrans** : après le pré-diagnostic viennent « Pièces détachées », une recherche et 18 cartes de familles (environ 2 000 px, 02-accueil-defil-01.png à 02-accueil-defil-04.png) avant la méthode, la FAQ, les horaires et le rappel. Pour une conductrice en panne, ce bloc est du bruit. Action : liste compacte ou bloc déplacé plus bas.
- **FAQ « Mon voyant est allumé : puis-je rouler ? »** (02-accueil-defil-06.png) : ne traite que le rouge fixe et le voyant moteur qui clignote ; le cas le plus courant (voyant moteur orange fixe) renvoie au pré-diagnostic. Action : une phrase pour l'orange fixe.

### Mineur

- Le lien d'erreur « Indiquez votre prénom. » amène le champ tout en haut de l'écran, son libellé caché au-dessus (06-erreur-lien-prenom.png). Action : marge de défilement sur les champs.
- Erreur du téléphone placée sous le texte d'aide, loin du champ, alors que celle du prénom est collée au champ (06-erreur-lien-prenom.png).
- « Pourquoi ? » est une liste déroulante sur le formulaire de l'accueil (02-accueil-defil-08.png) et des boutons radio sur `/demande` (07-barre-resultat-apres-b.png).
- « Imprimer la fiche » sur un téléphone à 1 h du matin : « Envoyer la fiche par SMS » ou « Partager » serait utile.
- Encadré du verdict : texte limité aux deux tiers de la largeur, grand vide à droite (10-t3-resultat.png).
- En ouvrant le menu, « Menu » devient « Fermer », plus large, et décale le bouton du numéro (12-menu-ouvert.png). Le menu n'a ni « Devis » ni « Être rappelé ».
- Lien intitulé « Le texte » sur « Vos droits » (16-droits-2.png) : dire lequel (« Lire l'article sur Légifrance »).
- Seuls les numéros français à 10 chiffres sont acceptés (message clair : « indiquez un numéro français à 10 chiffres »).
- Après l'envoi, la barre du bas propose encore « Être rappelé » : risque de demande en double (10-t4-envoye.png).
- Demande envoyée à 01 h 45 : « Nous vous rappelons ce matin ». À 01 h 49 le site annonce la fermeture exceptionnelle du jeudi : la promesse déjà faite n'est plus tenable et rien ne prévient la cliente. À vérifier côté garage.

## Points forts constatés

- Téléphone et statut sans aucun geste, pré-diagnostic lancé depuis le premier écran.
- Pré-diagnostic prudent, gradué (jaune, rouge), cohérent entre « Un bruit inhabituel » et « Le freinage a changé ».
- Erreurs de formulaire bien faites : résumé en haut avec liens, message précis (« Numéro non reconnu... par exemple 06 12 34 56 78 »), saisie et pré-diagnostic conservés, clavier téléphone (type `tel`, saisie automatique).
- Confirmation rassurante : « BF Auto vous rappelle depuis le 06 05 92 28 38 : enregistrez ce numéro pour décrocher ».
- Fermeture exceptionnelle propagée partout, jusqu'au message de confirmation (« vendredi matin » au lieu de « ce matin »).
- Très léger et rapide, aucun appel à un service extérieur, aucun cookie de suivi, aucun lien interne cassé (39 testés).

## Traces laissées sur le serveur de démonstration

Deux demandes de rappel de test, à purger : prénom « Test jury J1 », téléphone 06 39 98 00 01 (tranche réservée à la fiction), précisions commençant par « Test jury J1, ne pas rappeler ». Écrans : `/demande/envoyee?j=ycNwr6k5wDZIxC4ecR1qUA` (01 h 45) et `/demande/envoyee?j=nT0NXcujswB9j948liQIBQ` (01 h 50). Les soumissions avec erreur et les écrans « Confirmez l'envoi » non confirmés n'ont rien créé, d'après le message du site.
