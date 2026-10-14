# Fiche du juré J5, passe 1

**Profil simulé** : senior malvoyant, navigation au clavier seul (Tab, Maj+Tab, Entrée, Espace, flèches) avec lecteur d'écran.
**Quand** : jeudi 24 septembre 2026, de 01 h 38 à 02 h 04 (nuit, garage fermé).
**Comment** : scripts Playwright jetables (Chromium sans tête), ordinateur 1440 × 900 et téléphone 390 × 844. À chaque touche, je relève ce que le lecteur d'écran annoncerait : rôle, nom, état et description, lus dans l'arbre d'accessibilité de Chromium via le protocole de débogage, plus `ariaSnapshot()` pour la lecture linéaire. J'ai aussi relevé les zones dynamiques (`aria-live`, `role=status/alert`), l'élément qui a le focus, et si ce focus est caché par un élément fixe (échantillonnage `elementFromPoint`). Les captures servent à vérifier la visibilité du focus et le confort de lecture en vision basse.
**axe-core** : version 4.10.3 injectée depuis cdn.jsdelivr.net dans le seul navigateur de test, sans installer de paquet. La CSP du site (`script-src 'self'`) bloque l'injection : j'ai utilisé l'option `bypassCSP` de ce navigateur de test.
**Aucun fichier du projet lu** : seul le paquet Playwright installé a servi.

---

## Notes

| # | Critère | Note | Observation qui fonde la note |
|---|---|---|---|
| 1 | Trouver le téléphone | **9** | 3e arrêt de tabulation à 390 px (0,35 s), 8e sur ordinateur (0,71 s). Annonce : « lien Appeler 06 05 92 28 38 » (`tel:+33605922838`). Le même lien est présent sur chaque page, dans la barre fixe mobile et dans la région « Téléphone » du pied de page. |
| 2 | Savoir si c'est ouvert maintenant | **8** | Trois gestes : Tab, Entrée sur « Aller au contenu », flèche bas. On entend alors « Fermé exceptionnellement, ouvre demain à 8 h 30 ». Statut juste et cohérent partout (voir §2). Retenue : il est collé à l'adresse (« … 8 h 30 7 rue Demanieux »), placé avant le titre de niveau 1 et jamais atteint à la touche Tab. |
| 3 | Pré-diagnostic | **8** | Le résultat est annoncé dès le titre de la page : « Résultat du pré-diagnostic : Roulez prudemment et faites contrôler dans les prochains jours ». En cas d'urgence : « Ne roulez pas : pré-diagnostic ». Mais le parcours coûte 58 gestes sur ordinateur (53 Tab) contre 38 à 390 px, car le focus repart du haut de page à chaque question. |
| 4 | Devis ou rendez-vous | **9** | Envoi avec 2 erreurs volontaires : le titre devient « Erreur : Faire une demande », le focus va sur « Le formulaire contient 2 erreurs » et deux liens mènent aux champs. Correction en 10 touches et 14 caractères (1,2 s). Page de succès « Demande enregistrée » : « Nous vous rappelons vendredi matin », avec récapitulatif. |
| 5 | Comprendre les prix | **6** | Les tableaux sont bien lisibles (légende, en-têtes de colonnes et de lignes) et les règles sont claires (TTC, devis écrit avant travaux). Mais les 20 lignes disent toutes « Sur demande » ou « Prix sur devis », alors que l'accueil promet « Taux horaire et prix TTC ». |
| 6 | Confiance | **8** | Engagements écrits, page « Vos droits » avec les textes de loi, SIRET avec lien vers la fiche publique, changement de nom expliqué. Le rappel indique le numéro qui appellera. Il manque les avis clients, le nom du médiateur et plusieurs mentions légales. |
| 7 | Esthétique et finition | **7** | Anneau de focus de 3 px décalé de 2 px, bien contrasté (6,45:1 sur fond sombre, 5,74:1 sur blanc). Il n'a jamais été masqué par la barre fixe sur aucun parcours, zoom 400 % compris. Mais depuis la fermeture exceptionnelle, le bouton « Être rappelé » de la barre fixe déborde de l'écran : de 5 px à 390 px (dernière ligne rognée) et de 21 px à 320 px (« 30 » invisible, capture `14-barre-320.png`). Autres retenues : textes de 13 px en capitales espacées, « vous décidez. » à 3,48:1 sur mobile. |
| | **Moyenne** | **7,9** | (9 + 8 + 8 + 9 + 6 + 8 + 7) / 7 = 7,86 |

---

## Chronométrage

Le temps est celui du script, instrumentation comprise. Les gestes sont les touches de navigation ; les caractères tapés sont comptés à part.

| Tâche | Ordinateur 1440 px | Téléphone 390 px |
|---|---|---|
| 1. Téléphone | 8 Tab, 0,71 s | 3 Tab, 0,35 s |
| 2. Ouvert ? (lecteur) | 3 gestes (Tab, Entrée, flèche bas), 0,2 s | idem ; ou nom du lien de la barre fixe, au 64e Tab sur 66 |
| 3. Pré-diagnostic jusqu'au résultat | 58 gestes (53 Tab, 4 Entrée, 1 Espace), 2,2 s | 38 gestes (33 Tab, 4 Entrée, 1 Espace), 1,6 s |
| 4. Rendez-vous, de l'accueil au succès, avec 2 erreurs puis correction | 52 touches (42 Tab, 5 Entrée, 1 Espace, 1 flèche, 3 autres) + 79 caractères, 4,2 s. Détail : accueil vers formulaire 0,37 s ; saisie jusqu'à la page d'erreurs 2,6 s ; correction jusqu'au succès 1,2 s | 50 touches (39 Tab, 6 Entrée, 1 Espace, 1 flèche, 3 autres) + 79 caractères, 4,2 s (accès au formulaire par « Menu » : 7 Tab et 2 Entrée, 0,53 s) |

---

## 1. Trouver le téléphone

- Ordre de tabulation sur l'ordinateur : lien d'évitement, logo, 5 liens de navigation, puis « Appeler 06 05 92 28 38 ».
- À 390 px : lien d'évitement, logo, puis « Appeler 06 05 92 28 38 ». Seul le numéro est écrit à l'écran, mais le nom accessible le contient : l'étiquette visible fait bien partie du nom.
- Dans la liste des liens du lecteur, le premier lien téléphonique porte le verbe « Appeler ». Les liens du pied de page et de la région « 7 rue Demanieux » s'appellent seulement « 06 05 92 28 38 », ce qui reste compréhensible grâce au titre « Téléphone ».
- Captures : `02-desktop-tab08.png`, `02-mobile-tab03.png`.

## 2. Savoir si c'est ouvert maintenant

- **À 01 h 38**, l'accueil annonçait « Fermé, ouvre à 8 h 30 », ce qui était juste (le tableau indiquait jeudi 8 h 30 à 12 h, 14 h à 19 h).
- **Vers 01 h 47**, une fermeture exceptionnelle a été déclarée, sans action de ma part (probablement par un autre juré côté garage). En moins d'une minute, tout le site est devenu cohérent :
  - statut « Fermé exceptionnellement, ouvre demain à 8 h 30 » dans la bannière, le pied de page et la barre fixe ;
  - ligne « Jeudi (aujourd'hui) : Fermé exceptionnellement » dans le tableau ;
  - « Le jeudi 24 septembre : imprévu » dans Accès et horaires ;
  - créneaux du jeudi retirés du formulaire de rendez-vous ;
  - « Nous vous rappelons vendredi matin » sur la page de succès.

  Cette cohérence est un vrai motif de confiance.
- **Accès au lecteur d'écran** :
  - Accueil : Entrée sur « Aller au contenu » donne le focus à « principal », et la première ligne lue est le statut.
  - Pages intérieures : le statut est dans la bannière, juste après « Appeler ».
  - Le statut se retrouve aussi sous le titre « Horaires » du pied de page, et dans un tableau d'horaires bien construit (légende « Horaires des sept prochains jours, à partir d'aujourd'hui », en-têtes de lignes « Jeudi (aujourd'hui) »).
- **Défauts** :
  - Le statut et l'adresse forment une seule phrase dans l'arbre d'accessibilité : « Fermé exceptionnellement, ouvre demain à 8 h 30 7 rue Demanieux, 94600 Choisy-le-Roi » (accueil et bannière des pages intérieures). On entend « 8 h 30 7 rue ».
  - Sur l'accueil, le statut précède le titre de niveau 1 : en sautant directement au titre, on le manque.
  - Le statut est calculé au chargement. Avec l'horloge du navigateur simulée à 10 h, 12 h 30, 18 h 50, samedi 13 h et dimanche 10 h, le texte ne change pas. `Cache-Control: no-cache` le garde frais à chaque chargement, mais un onglet resté ouvert affiche un statut périmé.

## 3. Pré-diagnostic, clavier seul, jusqu'au résultat

**Parcours** : « Un voyant s'allume » (lien), puis « Aucun de ces signes » (case à cocher et « Continuer »), puis « Orange ou jaune » (bouton), puis « Un moteur vu de profil, allumé sans clignoter » (bouton), puis le résultat.

- **Excellent pour le lecteur** : chaque étape a un titre de page explicite, annoncé au chargement.
  - « Question 2 du pré-diagnostic : Remarquez-vous l'un de ces signes ? | BF Auto »
  - « Question 3 … : De quelle couleur est le voyant qui reste allumé ? »
  - « Question 4 … : À quoi ressemble ce voyant orange ? »
  - « Résultat du pré-diagnostic : Roulez prudemment et faites contrôler dans les prochains jours »
- **Structure** : chaque question est un groupe dont la légende dit « Question 2 sur 5 au plus Remarquez-vous l'un de ces signes ? », avec la consigne reliée au groupe. Le récapitulatif « Vos réponses » est en liste de définitions. On trouve aussi « Revenir à la question précédente » et « Recommencer ».
- **Erreur** : « Continuer » sans rien cocher donne le titre « Erreur : Question 2… », et le message « Erreur : Cochez au moins une case… » est relié au groupe. En revanche, le focus reste en haut de page (le formulaire de demande, lui, déplace le focus sur les erreurs).
- **Réponses contradictoires** (« pédale molle » et « Aucun de ces signes ») : le résultat urgent l'emporte, ce qui est prudent, mais sans signaler la contradiction.
- **Chemin urgent** : titre « Ne roulez pas : pré-diagnostic ». Suivent les étapes en titres de niveau 3 (se mettre en sécurité, appeler l'assistance, prévenir le garage) et un lien `tel:112`.
- **Coût clavier** : chaque réponse recharge la page et le focus repart du document. Il faut 10 Tab sur ordinateur (bannière et fil d'Ariane) ou 6 à 390 px pour revenir aux réponses, soit 53 Tab au total sur ordinateur.
- **Après le verdict** :
  - « Et maintenant ? » propose « Être rappelé à l'ouverture » (qui transmet les réponses) et « Imprimer la fiche », mais aucun lien « Demander un rendez-vous », alors que le verdict dit « faites contrôler dans les prochains jours ».
  - Le numéro « 06 05 92 28 38 » y est en texte simple, pas en lien.
  - La figure « Fig. 1 Silencieux d'échappement… » est lue deux fois (nom de l'image et légende).
- Captures : `05-desktop-q2-continuer.png`, `05-desktop-resultat-ecran.png`, `10-resultat-urgent.png`, `10-q2-rien-coche.png`.

## 4. Demande de rendez-vous avec erreur volontaire, puis corrigée

- **Saisie avec erreurs** : je n'ai pas choisi l'intervention et j'ai tapé un téléphone à 9 chiffres (« 06 39 98 00 0 »). J'ai coché une date, tapé le prénom et choisi « Le matin » avec la flèche bas.
- **Envoi** (validation côté serveur, `novalidate`) :
  - titre « Erreur : Faire une demande | BF Auto » ;
  - focus sur le résumé « Le formulaire contient 2 erreurs » ;
  - deux liens : « Choisissez une intervention dans la liste. » et « Numéro non reconnu : indiquez un numéro français à 10 chiffres, par exemple 06 12 34 56 78. » ;
  - champs marqués invalides avec l'erreur en description, par exemple : « Erreur : Numéro non reconnu… » ;
  - toutes les valeurs sont conservées.
- **Correction** : Tab, puis Entrée sur le 1er lien : le focus arrive sur la liste. Je tape « u », « u » pour obtenir « Un bruit, un voyant ou un souci à faire vérifier ». Maj+Tab ramène au 2e lien, Entrée, puis Ctrl+A et saisie de « 06 39 98 00 05 ». Encore 2 Tab jusqu'au bouton, puis Entrée. Aucun focus masqué, ni sur ordinateur ni à 390 px.
- **Succès** : titre « Demande enregistrée | BF Auto », puis :
  - « Ce n'est pas encore une réservation : nous vous appelons pour fixer l'heure. » ;
  - « Nous vous rappelons vendredi matin. » ;
  - « BF Auto vous rappelle … depuis le 06 05 92 28 38 : enregistrez ce numéro pour décrocher » (précieux pour un senior qui ne décroche pas aux numéros inconnus) ;
  - le récapitulatif complet.
- **Autre essai** : avec quatre dates cochées, on obtient « Erreur : Cochez trois possibilités au plus. » et les cases sont marquées invalides. La consigne « de une à trois » est bien reliée au groupe.
- **Bien fait** : étiquettes, groupes, consignes reliées, `autocomplete="given-name"` et `"tel-national"`, `inputmode="tel"`. Le champ piège anti-robot est invisible au lecteur et au clavier.
- **Défauts** :
  - Avant toute saisie, la liste « Pour quelle intervention ? » et le bouton radio « Dès que possible » sont annoncés « invalide ». Chrome le fait pour les champs natifs `required` vides : je l'ai vérifié sur une page neutre. Les zones de texte, elles, sont annoncées « obligatoire ». C'est déroutant.
  - Le résumé d'erreurs est un `div` avec `aria-labelledby` mais sans rôle : axe le classe « à vérifier », impact sérieux. Chrome l'annonce « groupe », d'autres couples navigateur et lecteur peuvent taire son nom.
  - Un champ corrigé reste annoncé « invalide » avec l'ancienne erreur jusqu'au renvoi.
  - Les sections du formulaire sont des légendes, pas des titres : la navigation par titres saute de « Faire une demande » à « Vos données ».
  - Le titre de page est le même pour rendez-vous, devis et rappel (« Faire une demande | BF Auto »).
  - Entrée sur la liste déroulante fermée envoie le formulaire. C'est le comportement standard de Chromium avec `novalidate` (vérifié sur page neutre), et on s'en remet grâce au résumé d'erreurs.
- **Limite de l'outil** : dans Chromium sans tête sur macOS, la flèche bas ouvre la liste, qui ne reçoit plus les touches (vérifié sur page neutre). J'ai donc choisi par la première lettre.
- Captures : `06-desktop-erreurs-ecran.png`, `06-desktop-erreurs-champs.png`, `06b-mobile-erreurs-arrivee.png`, `06b-desktop-succes-ecran.png`.

## 5. Comprendre les prix

- La page Tarifs contient deux tableaux, avec légende, en-têtes de colonnes et en-têtes de lignes. La phrase d'introduction est claire : « Tous nos prix sont TTC. Votre prix exact au devis, avant travaux. » Chaque terme est expliqué sous son tableau.
- Mais le taux horaire et le premier contrôle sont « Sur demande », et les 18 forfaits sont « Prix sur devis ». Au lecteur d'écran, cela fait 20 lignes à écouter pour la même réponse.
- Le lien de l'accueil annonce « Consulter les tarifs : Taux horaire et prix TTC », et la page « Vos droits » rappelle que le taux horaire doit être affiché. Le site ne le donne pas.
- Si les chiffres sont en attente de validation, je ne pénalise pas leur absence en tant que telle : la note viendrait à 8 ou 9 avec la même structure. En attendant, remplacer les 18 lignes identiques par une phrase et tenir la promesse du lien d'accueil.

## 6. Confiance

- **Pour** :
  - « Devis écrit avant travaux », « Nous vous appelons avant tout travail supplémentaire », « Pièces remplacées restituées sur demande » ;
  - « Vos droits chez nous » : pièces d'occasion, garantie constructeur, affichage des prix, désaccord, avec les textes et les fiches de la DGCCRF ;
  - mentions légales avec SIRET 953 343 738 00019 et lien vers la fiche publique ;
  - « « Garage auto choisy 94 » devient BF Auto : même adresse, même numéro » ;
  - aucun cookie de suivi ; données supprimées après 12 mois ;
  - pré-diagnostic prudent (112, assistance) ;
  - 38 liens internes testés, tous en 200 ; page 404 utile ; aucune ouverture de nouvelle fenêtre.
- **Pour moi, l'accessibilité elle-même rassure** : un garage dont le site se parcourt sans voir me paraît sérieux.
- **Contre** : voir « Basiques absentes » ci-dessous.

## 7. Esthétique et finition (vision basse et lecteur)

- **Visuel** : style « planche technique » cohérent, palette sobre (anthracite, blanc cassé, orange), hiérarchie nette.
- **Redistribution** : aucun défilement horizontal à 320 px ni à 720 px (zoom 200 %).
- **Contrastes** que j'ai calculés sur 6 pages × 2 formats : un seul échec, « vous décidez. », en orange rgb(228,104,43) sur rgb(58,57,53), soit 3,48:1 à 20 px sur mobile (seuil 4,5).
- **Tailles** : nombreux textes de 13 px en capitales espacées, par exemple les surtitres, « QUESTION 2 SUR 5 AU PLUS », les titres du pied de page, le bandeau de démonstration et le statut dans la barre fixe.
- **Barre fixe mobile avec un statut long.** Depuis que le statut est « Fermé exceptionnellement, ouvre demain à 8 h 30 », le bouton « Être rappelé » passe sur 4 lignes dans une barre de 72 px de haut. Les boutons dépassent l'écran :
  - 390 × 844 : bas à 849 px, dernière ligne rognée ;
  - 360 × 740 : 5 px de dépassement ;
  - 320 × 640 : bas à 661 px, « 30 » n'est plus visible (le statut se lit « … ouvre demain à 8 h »).

  Captures `14-barre-390.png`, `14-barre-320.png`. Le nom accessible reste complet, mais un malvoyant qui s'aide de l'écran lit une heure tronquée. Avec le statut court « Fermé, ouvre à 8 h 30 », tout tenait sur une ligne (`02-mobile-tab03.png`).
- **Pastille de statut en haut de l'écran mobile** : avec le même statut long, le point gris se retrouve seul sur la première ligne, au-dessus du texte (`06b-mobile-erreurs-arrivee.png`).
- **Zoom 400 %** (360 × 225) : la barre fixe occupe 72 px, soit 32 % de la hauteur, et son texte dépasse de 5 px en bas (capture `09c-zoom400-barre.png`). Le focus n'est jamais masqué (voir plus bas).
- **Ordre du focus différent de l'ordre visuel** sur l'accueil, côté ordinateur. Après « Itinéraire », le focus va dans la colonne de droite (pré-diagnostic), puis revient à gauche (pièces). Plus bas, il passe du milieu (atelier) à la gauche (questions), puis à la droite (garage). C'est gênant pour qui suit le focus à la loupe.
- **Finition pour le lecteur** :
  - trop de régions nommées : environ 13 repères sur l'accueil, dont 3 dans le pied de page ;
  - noms de liens collés sans ponctuation, par exemple « Demander un rendez-vous Confirmé par téléphone » ou « Freinage Plaquettes, disques, liquide de frein » ;
  - figures lues deux fois ;
  - à 390 px, le lien « Menu » devient « Fermer » une fois ouvert, et Échap ne le referme pas.

---

## Focus et barre fixe

- Pas d'élément fixe sur ordinateur. À 390 px, une barre fixe en bas de 72 px, compensée par `scroll-padding-bottom: 72px`.
- **Aucun focus totalement ni partiellement masqué** par la barre ou le menu ouvert sur :
  - l'accueil (68 arrêts sur ordinateur, 65 à 390 px) ;
  - le pré-diagnostic complet ;
  - le formulaire, ses erreurs et le succès ;
  - le zoom 400 % (65 arrêts sur l'accueil, 39 sur le formulaire).
- **Anneau** : `outline` de 3 px décalé de 2 px, orange clair (245,154,99) sur fond sombre et orange foncé (168,74,23) sur fond clair. Sur les cases et boutons radio, c'est la carte de l'option qui porte l'anneau (capture `13-focus-radio.png`).
- Le lien d'évitement glisse en 0,2 s puis reste entièrement visible.

## axe-core 4.10.3 (25 analyses : 12 pages ou états × 2 formats, plus le menu mobile ouvert)

- **`region`** (modéré, 1 nœud, toutes les pages) : le bandeau « Version de démonstration » est hors repère. Propre à la démo, non pénalisé.
- **`landmark-unique`** (modéré, page Accès) : deux régions « Horaires », celle de la page et celle du pied.
- **À vérifier**, `aria-prohibited-attr` (sérieux) : `#demande-erreurs` porte `aria-labelledby` sur un `div` sans rôle.
- **À vérifier**, `color-contrast` : axe ne sait pas lire le fond quadrillé. Mes calculs ne trouvent qu'un échec, décrit plus haut.

---

## Défauts, du plus gênant au moins gênant, avec l'action proposée

1. **Barre fixe mobile qui déborde de l'écran quand le statut est long** (5 px à 390 px, 21 px à 320 px, où « 30 » disparaît). Action : hauteur de barre libre (min-height au lieu d'une hauteur fixe), avec un `scroll-padding-bottom` qui suit ; ou un statut abrégé dans la barre (« Fermé, rouvre demain 8 h 30 »), le détail restant en haut de page.
2. **Pré-diagnostic, focus en haut de page à chaque question** (10 Tab sur ordinateur, 6 à 390 px, par étape). Action : aux étapes 2 et suivantes, donner le focus à la question (légende ou titre en `tabindex="-1"`), comme le fait déjà la page d'erreurs du formulaire.
3. **Statut collé à l'adresse** (« … 8 h 30 7 rue Demanieux ») sur l'accueil et dans la bannière. Action : séparer par une ponctuation masquée ou en deux éléments distincts.
4. **« invalide » annoncé avant toute saisie** sur la liste d'intervention et le premier bouton radio. Action : `aria-invalid="false"` tant que le serveur n'a pas signalé d'erreur.
5. **Résumé d'erreurs sans rôle**. Action : `role="group"` ou `role="region"` sur `#demande-erreurs`.
6. **Résultat du pré-diagnostic sans lien « Demander un rendez-vous »**, et numéro non cliquable dans « Et maintenant ? ». Action : ajouter les deux.
7. **Barre fixe mobile** : le lien s'appelle « Être rappelé Fermé exceptionnellement, ouvre demain à 8 h 30 ». Action : séparer le statut du nom du lien (description ou ponctuation) ; réduire ou masquer la barre quand la hauteur de fenêtre est faible (zoom 400 % : 32 % de l'écran, texte rogné).
8. **Contraste de « vous décidez. » sur mobile** (3,48:1). Action : utiliser l'orange clair sur fond sombre (6,45:1).
9. **Textes de 13 px en capitales espacées**. Action : 15 à 16 px au minimum, en casse normale.
10. **Page Accès** : deux régions « Horaires ». Action : les nommer différemment, ou ne pas faire de région dans le pied de page ; plus largement, réserver les régions aux grandes sections.
11. **Figures lues deux fois**. Action : garder la légende et masquer le nom en double de l'image.
12. **Noms de liens sans séparation** entre titre et sous-titre. Action : ponctuation masquée ou sous-titre en description.
13. **Ordre du focus différent de l'ordre visuel** sur l'accueil, côté ordinateur. Action : aligner l'ordre du code sur l'ordre visuel des colonnes.
14. **Titre de page générique** pour les demandes. Action : « Demander un rendez-vous | BF Auto », etc. De même après une recherche : « 1 résultat pour « plaquettes » ».
15. **Sections du formulaire sans titres**. Action : titre de niveau 2 dans chaque légende.
16. **Statut non rafraîchi** dans un onglet resté ouvert. Action : recalcul côté navigateur chaque minute (script propre au site, permis par la CSP).
17. **Menu mobile** : Échap ne le ferme pas. Action : Échap ferme le menu et rend le focus au bouton.
18. **Pré-diagnostic en erreur** : le focus n'est pas déplacé vers le message. Action : même traitement que le formulaire.

## Basiques absentes

- Avis clients (note, témoignages) : aucun.
- Médiateur de la consommation non nommé (nom, site, adresse), dans « Vos droits » comme dans les mentions légales.
- Mentions légales incomplètes : forme juridique, capital, numéro RCS ou RM, directeur de la publication, nom et coordonnées de l'hébergeur (seul « Francfort (Allemagne) » est indiqué).
- Aucun prix chiffré, pas même le taux horaire (voir §5).
- Accès sans voiture : aucune ligne de bus ni gare, alors qu'on repart à pied après avoir laissé sa voiture. Seuls deux repères sont donnés (« À environ 200 m du boulevard de Stalingrad », « À environ 600 m de Vitry-sur-Seine »).
- Droits sur les données exerçables seulement par téléphone : pas de voie écrite (courriel) proposée.
- Aucune photo réelle du garage ni de l'équipe. Peu utile pour moi, mais c'est une basique de confiance pour les autres visiteurs.

## Points forts à conserver

- Lien d'évitement fonctionnel.
- Titres de page porteurs de sens à chaque étape : question, verdict, « Erreur : », « Demande enregistrée ».
- Résumé d'erreurs focalisé avec liens vers les champs, et valeurs conservées.
- Tableaux d'horaires et de tarifs bien balisés.
- Focus toujours visible et jamais masqué.
- Cohérence immédiate de la fermeture exceptionnelle sur tout le site.
- Page de succès qui dit quand et depuis quel numéro le garage rappellera.

---

## Données de test créées (à purger)

Quatre demandes de rendez-vous fictives ont été enregistrées. Toutes portent le prénom « Jeanne », le téléphone 06 39 98 00 05 (plage ARCEP réservée à la fiction), le créneau « Vendredi 25 septembre, matin » et l'objet « Un bruit, un voyant ou un souci à faire vérifier ».

| Heure | Format | Jeton | Mention « TEST JURY J5 » |
|---|---|---|---|
| 01 h 53 min 30 s | ordinateur | `dRL9rEqkVKX2oxyinZ-GxQ` | **non** |
| 01 h 53 min 55 s | 390 px | `coYh75kpp3WcRn-UryfaBA` | oui (dans « Précisions ») |
| 02 h 01 min 30 s | ordinateur | `zSQR4B2YjB2mZt0piixzMQ` | oui |
| 02 h 01 min 36 s | 390 px | `beTa9_gkIrIn3uJAwLVZow` | oui |

Les autres envois étaient volontairement incomplets et n'ont rien enregistré.

## Limites de la simulation

- Les annonces viennent de l'arbre d'accessibilité de Chromium, proche de ce que liraient NVDA ou JAWS avec Chrome. VoiceOver et Firefox peuvent différer, par exemple sur le nom du résumé d'erreurs.
- Les temps sont ceux du script, pas ceux d'une écoute réelle.
- La navigation par flèches dans la liste déroulante ouverte n'est pas testable sans tête sur macOS.

## Fichiers

- **Scripts** : `lib.mjs`, `01` à `13*.mjs`.
- **Relevés** : `*.json`, `*.yaml` (arbres d'accessibilité).
- **Captures principales** : `02-desktop-tab01.png`, `02-desktop-tab08.png`, `02-desktop-tab12.png`, `02-mobile-tab03.png`, `02-mobile-tab04.png`, `04-mobile-menu-ouvert.png`, `05-desktop-q2-continuer.png`, `05-desktop-resultat-ecran.png`, `06-desktop-erreurs-ecran.png`, `06-desktop-erreurs-champs.png`, `06b-desktop-succes-ecran.png`, `09-zoom200-accueil.png`, `09c-zoom400-barre.png`, `10-resultat-urgent.png`, `13-focus-radio.png`, `14-barre-390.png`, `14-barre-320.png`.
