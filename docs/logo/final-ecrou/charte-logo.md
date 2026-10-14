# BF Auto, charte du logo (jeu final, concept écrou)

Version 2.0 du 2026-09-23. Palette graphite et orange (décision d'Anthony, voir
`docs/conception/kano-couleurs.md`, section « Décision finale », mise à jour par la palette
graphite `#3A3935`). Tous les fichiers de ce dossier sont régénérables :

```
cd docs/logo/final-ecrou
/usr/bin/python3 source/construction.py . && /usr/bin/python3 source/rendus.py .
cd ../../.. && pnpm exec playwright screenshot --viewport-size=1600,1200 --full-page \
  "file://$PWD/docs/logo/final-ecrou/planche-finale.html" "docs/logo/final-ecrou/planche-finale.png"
```

## 1. Synthèse

Le B et le F serrent un écrou orange ; un chat, dessiné avec les mêmes règles que les
lettres, dort sur le O et laisse pendre sa queue. On lit « BF AUTO » d'abord, l'écrou
ensuite (le métier), le chat enfin (la maison, le garage de quartier). Deux couleurs :
graphite pour les lettres et le chat, orange atelier pour l'écrou. Aucun effet, aucun
élément texte : tout est en chemins vectoriels.

## 2. Construction

### 2.1 Lettrage et écrou (unités, capitale = 240)

| Élément | Valeur |
|---|---|
| Capitale | 240, ligne de base à 0, axe de serrage à 120 |
| Fûts / traverses hautes et basses / barres médianes | 44 / 40 / 36 |
| Seule oblique admise | 60 degrés, l'angle des faces d'un écrou posé à plat |
| Chanfrein des courbes (panses du B, bas du U, coins du O) | 20 de projection horizontale (34,6 de haut) ; sommet du A : 34 |
| Écrou | rayon circonscrit 48 (96 de large, 83 de haut), alésage de rayon 16 |
| Jeu entre l'écrou et les lettres | 10, mesuré perpendiculairement aux faces |
| Canal entre B et F | 58 |
| Chasses | B 144, F 120 (bras médian 84 % du bras haut), A 164, U 148, T 144, O 158 |
| Approches | F-A 92, A-U 28, U-T 26, T-O 24 |

Règles : chaque courbe devient un chanfrein à 60 degrés, les angles droits d'origine
restent vifs (F, T, pieds du A) ; la barre du B, le centre de l'écrou et le bras médian
du F sont sur le même axe ; le B et le F sont entaillés à la forme de l'écrou agrandie
du jeu.

### 2.2 Le chat (mêmes unités)

| Élément | Valeur |
|---|---|
| Position | couché sur le O, au jeu de 10 au-dessus de la capitale (même jeu que l'écrou) |
| Tête | 96 de large, 66 de haut, joue chanfreinée à 60 degrés (18) |
| Oreilles | deux triangles équilatéraux de 36 de base (31,2 de haut) posés aux angles de la tête |
| Corps | 50 de haut, 192 de long de la joue à l'arrière, dos chanfreiné à 60 degrés (26) |
| Queue | bande de 22 au jeu de 10 du flanc du O, pend de 62 sous la capitale, crochet construit comme le bas du U (chanfreins à 60 degrés) |
| Visage | deux yeux clos en fentes hexagonales (16 x 6) et un nez en triangle, évidés |

Le chat ne touche aucune lettre : le jeu constant le détache du O comme il détache
l'écrou du B et du F. Il reste lisible en une couleur (silhouette, oreilles, queue).

### 2.3 Symbole (carré de 512)

Taille optique propre, pas le logotype réduit : capitale 320 (de 96 à 416), fûts 64,
traverses 48, barre médiane 32 (contreformes du B rouvertes), chanfrein 32, écrou de
rayon 58, alésage 19, jeu 14, B 192, canal 64, F 160. Le monogramme va de 48 à 464 :
tous les bords droits tombent sur des multiples de 16 unités, donc sur des pixels
entiers à 32 et 64 px. Fond graphite, rayon d'angle 96.

### 2.4 Favicon (dessiné au pixel)

- `favicon.svg` : grille de 32. Hauts, bas, fûts et barres sur des coordonnées paires
  (pixels entiers à 16, 32, 48 et 64 px) ; l'écrou est un hexagone de 6 px percé de 2 px,
  séparé des lettres par 2 px de fond.
- `favicon-16.png` : dessiné pixel par pixel sur une grille de 16 (source
  `source/favicon-16.svg`). Contreformes du B rectangulaires d'un pixel, écrou réduit à un
  carré orange de 2 px isolé par un pixel de fond de chaque côté.

**Choix du favicon : B, écrou, F, sans le chat.** Un essai d'écrou à oreilles de chat a été
dessiné à 16 px (`source/essai-ecrou-chat-16.svg`, montré sur la planche) : il est lisible,
mais il se lit « chat » avant « garage » et fait penser à un vétérinaire ; il perd aussi le
nom. Le chat réduit à 16 ou 32 px au-dessus des lettres n'est qu'une tache. Le favicon garde
donc le monogramme, qui dit le nom et le métier ; le chat vit dans le logo.

## 3. Versions et fichiers

| Fichier | Usage |
|---|---|
| `logo.svg` | Version principale, fond clair : lettres et chat graphite, écrou orange, descripteur graphite |
| `logo-negatif.svg` | Fond graphite : lettres et chat blanc cassé, écrou orange, descripteur gris clair |
| `logo-mono.svg` | Une couleur, noir (tampon, gravure, fax, marquage une couleur) |
| `logo-blanc.svg` | Une couleur, blanc (photo sombre, vitrine, adhésif blanc) |
| `logo-compact.svg`, `logo-compact-negatif.svg` | Sans descripteur, marge réduite : en-tête du site à 40 px de haut, signature de courriel |
| `*-sans-chat.svg` | Même version sans le chat, pour les petits formats (voir tailles minimales) |
| `symbole.svg` | Carré 512 : icône d'application, avatar de réseau social, drapeau d'enseigne |
| `favicon.svg`, `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Onglet de navigateur |
| `apple-touch-icon.png` | 180 px, carré plein fond graphite (iOS pose son propre masque) |
| `icon-192.png`, `icon-512.png` | Manifeste web |
| `og-image.png` | 1200 x 630, aperçu de partage : fond graphite, logo négatif centré |
| `couleurs.json` | Palette et contrastes calculés |

Intégration dans le `<head>` du site :

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="/og-image.png">
```

## 4. Couleurs

Contrastes WCAG 2.2 calculés par `source/rendus.py` (détail dans `couleurs.json`).

| Nom | Hexadécimal | Rôle | Contraste |
|---|---|---|---|
| Graphite | `#3A3935` | lettres et chat sur clair, fonds sombres, symbole | 10,52:1 sur blanc cassé |
| Graphite profond | `#2F2E2B` | fond sombre du site | 12,35:1 sous blanc cassé |
| Orange atelier | `#E4682B` | écrou, filets, fond des boutons principaux | objet graphique : 3,03:1 sur blanc cassé, 3,48:1 sur graphite |
| Orange foncé | `#B5501B` | texte orange sur fond clair | 4,63:1 sur blanc cassé, 5,09:1 sur blanc |
| Blanc cassé | `#F5F4F2` | fond clair, lettres en négatif | |
| Texte | `#262626` | texte courant ; texte des boutons orange | 13,77:1 sur blanc cassé ; 4,57:1 sur orange |
| Gris clair | `#C9C6BF` | descripteur du négatif | 6,78:1 sur graphite |

L'écrou est un objet graphique (seuil 3:1, WCAG 1.4.11), tenu sur les deux fonds, de
justesse sur blanc cassé : ne pas poser le logo couleur sur un fond plus sombre que
`#F5F4F2` ni sur un gris moyen. Référence d'impression de l'orange : [À VALIDER : teinte
Pantone et quadrichromie à caler sur nuancier physique avec l'imprimeur et l'enseigniste].

## 5. Zone de protection

La hauteur de l'écrou (83 unités, soit 0,35 fois la capitale) tout autour de l'encre,
chat et queue compris. Rien ne pénètre cette zone : ni texte, ni bord de page, ni autre
logo. Le symbole se suffit de son carré.

## 6. Tailles minimales

| Version | Écran | Imprimé |
|---|---|---|
| Logo avec chat et descripteur | 200 px de large | 45 mm |
| Logo sans chat, avec descripteur | 140 px | 30 mm |
| Compact avec chat (en-tête de site) | 40 px de haut | 30 mm de large |
| Compact sans chat | 24 px de haut ; en-tête mobile à 32 px | 20 mm |
| Symbole | 48 px ; en dessous, `favicon.svg` (32) et `favicon-16.png` | 10 mm |

Règle de l'en-tête du site : 40 px de haut avec chat sur ordinateur ; sous 40 px
(mobile), `logo-compact-sans-chat.svg` à 32 px.

Fabrication (jeu de 10 sur 240 autour de l'écrou et du chat) :
- découpe vinyle et broderie : logotype d'au moins 110 mm de large pour garder un jeu
  d'un millimètre ; en poitrine de tenue sous 110 mm, broder le symbole seul (40 mm) ;
- tampon et gravure : `logo-mono-sans-chat.svg` au moins 60 mm, sinon symbole ;
- enseigne : lettres découpées ou boîtier, écrou en pièce orange mate rapportée, chat
  en graphite découpé dans la même plaque que le O (jamais chromé, jamais lumineux en
  orange vif) ;
- véhicule : version couleur sur carrosserie claire, négatif sur carrosserie sombre.

## 7. Interdits

- Recolorer le chat en orange, ou l'écrou dans une autre couleur que l'orange atelier
  (hors versions une couleur).
- Ajouter ombre, halo, contour, dégradé, relief ou effet métallique.
- Déplacer le chat sur une autre lettre, le retourner, l'agrandir ou le détacher du logo
  pour en faire la marque ; le poser seul comme illustration reste à valider
  [À VALIDER : usage du chat seul en illustration secondaire].
- Composer d'autres mots « à la manière du logo » : seules B, F, A, U, T, O existent.
  Tout autre texte se compose en Hanken Grotesk.
- Écrire du texte en orange atelier sur fond clair (utiliser l'orange foncé).
- Déformer, incliner, condenser, changer l'espacement ou la position de l'écrou.
- Poser le logo couleur sur une photo chargée : passer par un bandeau graphite et le
  négatif, ou par la version blanche.
- Utiliser une version avec chat sous ses tailles minimales.

## 8. Historique : remarques du jury appliquées

| Remarque (jury client, fabrication, directeur artistique) | Suite donnée |
|---|---|
| Écrou lu comme un petit « o », « BoF » | Alésage réduit de 21 à 16 : l'écrou se lit comme une pièce pleine percée ; orange dans toutes les versions couleur ; au pixel, carré orange plein à 16 px |
| Pas de favicon dessiné au pixel, écrou en tache à 16 px | Favicon 16 et 32 dessinés au pixel, contreformes du B rectangulaires |
| AUTO trop pochoir, trop condensé | Chanfreins de 28 à 20, A, U, T, O élargis, approches ouvertes |
| Bas du B « coupé » | Chanfrein court : les panses gagnent une partie verticale et se lisent comme un B |
| Jeu de 8 qui se bouche en fabrication | Jeu porté à 10 et tailles minimales de fabrication (110 mm en broderie et vinyle) ; le doublement à 16 demandé par le jury fabrication desserrerait l'écrou et le canal, donc non retenu |
| Réduire les couches de vinyle | Descripteur en graphite : deux couleurs sur fond clair |
| Laiton qui vire au moutarde | Sans objet, l'orange atelier remplace le laiton |
| Composer AUTO en Hanken Grotesk | Non retenu : le lettrage dessiné est adouci plutôt que remplacé, pour garder un seul dessin |

## 9. Points à valider

- [À VALIDER : test de lecture de l'en-tête (logo compact à 40 px) auprès de quelques
  personnes, pour confirmer que personne ne lit « BoF » ni ne manque le chat]
- [À VALIDER : version de fabrication « écrou soudé » (écrou relié aux lettres) si le
  garagiste veut un marquage vinyle ou une broderie de poitrine sous 110 mm]
- [À VALIDER : référence Pantone de l'orange atelier au nuancier]
- [À VALIDER : descripteur « GARAGE AUTOMOBILE » à confirmer selon l'offre réelle]
