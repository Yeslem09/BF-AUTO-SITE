# Fiche juré J5, passe 2

Profil : senior malvoyant, clavier et lecteur d'écran uniquement (parcours Tab/Entrée/Espace, lecture de l'arbre d'accessibilité), ordinateur 1440 px et téléphone 390 px. Séance du 24/09/2026, 03 h 32 à 03 h 43 (heure de Paris, garage fermé).

## Notes

| Critère | Note | Ce qui fonde la note |
|---|---|---|
| 1. Téléphone | 9 | Lien « Appeler 06 05 92 28 38 » (tel:) dans le bandeau : 3e arrêt Tab sur 390 px, 8e sur ordinateur. Répété dans le pied (titre H2 « Téléphone »), sur le résultat et la confirmation. |
| 2. Ouvert maintenant | 9 | « Fermé, ouvre à 8 h 30 » est la première phrase du contenu principal, lue juste après « Aller au contenu » (2 gestes). Tableau « Horaires des sept prochains jours, à partir d'aujourd'hui » avec en-têtes de ligne « Jeudi (aujourd'hui) ». Exact à 03 h 40. |
| 3. Pré-diagnostic | 8,5 | 20 gestes de l'accueil au résultat (390 px). Le focus arrive sur le H1 à chaque question, titre d'onglet « Question 2 du pré-diagnostic : … », « Question 2 sur 5 au plus ». Réponse vide : titre « Erreur : … », focus sur le message. Résultat clair (H1 « Roulez prudemment et faites contrôler dans les prochains jours », récapitulatif « Vos réponses »). Défauts 2 et 5 ci-dessous. |
| 4. Rendez-vous | 9 | Erreur volontaire (06 39 98 00) : titre « Erreur : Faire une demande… », focus sur « Le formulaire contient une erreur », lien vers le champ ; Tab + Entrée amène sur le téléphone, étiquette visible, champ `aria-invalid`, saisies conservées. Envoi corrigé (Test jury, 06 39 98 00 42) : « Demande enregistrée », « Nous vous rappelons ce matin », récapitulatif. Envoi vide : « 5 erreurs », 5 liens. `autocomplete` prénom et téléphone présents. |
| 5. Prix | 7,5 | Page Tarifs : H1, « Tous nos prix sont TTC », tableaux avec légende et en-têtes. Mais chaque prix est précédé de 20 à 40 mots au lecteur d'écran (défaut 1). |
| 6. Confiance | 8 | Mentions légales complètes (SIRET 953 343 738 00019, dénomination, médiateur, hébergement UE), page « Vos droits chez nous », changement de nom expliqué, aucun cookie de suivi. Basiques absentes : aucun avis client, aucun nom de garagiste, aucune qualification ni ancienneté. Je confierais ma voiture pour la transparence (devis écrit, appel avant travaux). |
| 7. Esthétique et finition | 8,5 | Contrastes : aucun texte sous le seuil WCAG mesuré sur 4 pages. Anneau de focus 3 px partout, couleur adaptée au fond sombre ou clair, carte entière encadrée pour les cases à cocher. Aucun défilement horizontal à 390 et 320 px. Aucun focus masqué par la barre collante (balayage de 69 arrêts sur l'accueil, 36 sur Tarifs). Défauts 3 et 6. |

**Moyenne J5 : 8,5 / 10**

## Gestes (clavier seul)

- Téléphone : 3 Tab (390 px), 8 Tab (ordinateur).
- Ouvert ou non : Tab + Entrée sur « Aller au contenu », puis lecture de la première phrase.
- Pré-diagnostic (390 px) : accueil 5 Tab + Entrée ; Q2 6 Tab + Espace + 2 Tab + Entrée ; Q3 1 Tab + Entrée ; Q4 1 Tab + Entrée. Total 20 gestes, environ 0,6 s de chargement par page.
- Rendez-vous avec erreur puis correction (390 px) : environ 41 gestes (32 pour remplir, dont 12 cases de dates traversées ; 2 pour rejoindre le champ fautif depuis le résumé ; 2 pour corriger ; 3 pour renvoyer).
- Prix : 6 Tab + Entrée (ordinateur) jusqu'à Tarifs.

## Défauts par gravité

Bloquant : aucun.

Majeurs (gêne réelle au lecteur d'écran)
1. **Tarifs, en-têtes de ligne trop longs** : le `th` de chaque ligne contient le nom, « Exemple : citadine essence », « Comprend : … » et « Prix au 1er octobre 2026 ». En navigation de tableau, chaque prix est annoncé après tout ce texte, et les deux mentions répétées reviennent 10 fois. Correctif : `th` réduit au nom de la prestation, détail dans une cellule ou une description ; « citadine essence, prix au … » dit une seule fois dans la légende.
2. **Résultat du pré-diagnostic, lien ambigu** : « Demander un prix pour ces pièces » et la figure du silencieux d'échappement sont placés dans la 3e piste (antipollution), alors que le voyant moteur ouvre 3 pistes. Au lecteur d'écran, le lien semble ne concerner que l'échappement. Et « Et maintenant ? » ne propose pas de rendez-vous alors que le verdict dit « faites contrôler dans les prochains jours ». Correctif : sortir le lien de la liste, le nommer (« Demander un devis pour ce voyant moteur »), ajouter « Demander un rendez-vous » prérempli.

Mineurs
3. Lien d'évitement : une fois focalisé, son cadre est coupé en haut (bord supérieur hors écran, top −11 px sur ordinateur) et il recouvre le texte du bandeau de démonstration (`focus-accueil-bureau-1.png`, `masque-accueil-mobile-1.png`).
4. Téléphone en erreur : `aria-describedby` lit d'abord l'aide « Il sert uniquement à vous rappeler… » puis l'erreur. Mettre l'identifiant de l'erreur en premier.
5. Figures (accueil, résultat) : l'image porte le même texte que sa légende, lu deux fois. Masquer le SVG ou vider son nom et garder la légende.
6. Menu 390 px : le bouton s'appelle « Fermer » une fois ouvert (préférer « Fermer le menu »), et le panneau reste ouvert par-dessus le haut du contenu quand le focus en sort par Tab (`menu-mobile-ouvert.png`).
7. L'état « Fermé, ouvre à 8 h 30 » est placé avant le H1 : un utilisateur qui saute de titre en titre ne l'entend pas sur l'accueil.
8. Liste des repères encombrée : chaque section est une région nommée (une dizaine sur l'accueil, plus « Adresse », « Téléphone », « Horaires » dans le pied).
9. Formulaire de rappel de l'accueil : étiquette « Pourquoi ? » trop courte hors contexte (« Motif de votre appel »).
10. Ordinateur, accueil : le focus passe par la carte de droite (pré-diagnostic) avant la recherche de gauche ; ordre visuel et ordre clavier différents pour un malvoyant qui suit l'anneau.
11. Tarifs : « Prix au 1er octobre 2026 » est une date future au 24/09/2026 ; formulation à revoir (contenu de démonstration, non pénalisé en soi).

## Captures

`focus-accueil-bureau-*.png`, `masque-accueil-mobile-1.png`, `prediag-mobile-etape*.png`, `m-q2-focus-case.png`, `m-resultat*.png`, `q2-vide-erreur.png`, `rdv-*-erreur*.png`, `rdv-*-saut-champ.png`, `rdv-*-vide-erreurs.png`, `rdv-mobile-confirmation.png`, `menu-mobile-ouvert.png`. Arbres d'accessibilité : `aria-accueil-bureau.txt`, `rdv-mobile-erreur-aria.txt`, `rdv-mobile-confirmation-aria.txt`, `prediag-mobile.txt`, `rdv-mobile.txt`.
