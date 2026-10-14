# Analyse Kano : couleurs du site BF Auto

Version 1 du 2026-09-23, à la demande d'Anthony (« un peu plus clair ? si tu fais un Kano
sur les couleurs, ce serait quoi ? »). Ce Kano tranche la palette du site et du logo
recoloré. Il complète [kano-site-bf-auto.md](kano-site-bf-auto.md).

## Verdict

1. **Fond clair dominant** (blanc et gris béton très clair), texte graphite, et **une seule
   couleur de marque : un vert atelier** profond et désaturé (le vert des machines-outils et
   des plaques émaillées), utilisé pour les actions et les repères.
2. **Le rouge et l'orange sont réservés au sens** : ce sont les couleurs des voyants du
   tableau de bord. Rouge = « Ne roulez pas », ambre = « À faire contrôler ». Une marque
   rouge ou orange viderait ces alertes de leur sens dans le pré-diagnostic.
3. **Refusés** : bleu nuit et doré (signature « site généré », et le bleu-or évoque le
   haut de gamme, donc des prix élevés), fond crème beige, fond sombre dominant, néon,
   dégradés, plusieurs couleurs de marque.
4. Les **figures techniques** légendées (« Fig. 1 Frein à disque ») sont dessinées à
   l'encre graphite sur papier quadrillé clair : c'est la signature visuelle, la couleur
   n'y sert qu'aux repères.

## Constats qui fondent la décision

- **Tableau de bord** : le conducteur lit déjà un code couleur normalisé (rouge = arrêt,
  orange ou ambre = attention, vert = témoin actif). Le pré-diagnostic s'appuie sur ce code
  (étude 02, décision D3 du Kano principal).
- **Lecture en extérieur** : le conducteur en panne lit son téléphone dehors, souvent en
  plein jour ; un texte sombre sur fond clair reste lisible en forte lumière, un grand
  aplat sombre fatigue et reflète.
- **Perception du prix** : le jury des directions a relevé que l'allure « haut de gamme »
  du fond sombre peut faire craindre des tarifs élevés (juré méfiant, V3).
- **Concurrence locale** (étude 06) : jaune et noir (Speedy, Midas), rouge (Point S,
  Norauto), bleu (Euromaster, AD) ; les indépendants de Choisy utilisent surtout du rouge,
  du bleu ou des photos de banque. Un vert atelier sobre se distingue sans crier.
- **Charte d'Anthony** : tons feutrés, jamais de néon, aucune ombre, contraste AA minimum
  et AAA sur le texte courant.

## Basiques

| Id | Attribut | Justification |
|---|---|---|
| C-B1 | Contraste AAA (7:1) pour le texte courant, AA (4,5:1) partout, 3:1 pour bordures de champs et focus | Public âgé, lecture en extérieur |
| C-B2 | Aucune information portée par la couleur seule (texte « Ouvert », « Ne roulez pas » toujours écrit) | WCAG 1.4.1, daltonisme (8 % des hommes) |
| C-B3 | Rouge, ambre et vert de statut réservés à leur sens, jamais décoratifs | Code du tableau de bord |
| C-B4 | Logo, site, enseigne et fiche Google dans les mêmes couleurs | Reconnaissance, cohérence du renommage |
| C-B5 | Palette sobre et désaturée, sans néon ni dégradé ni ombre | Charte d'Anthony |

## Performance

| Id | Attribut | Cible |
|---|---|---|
| C-P1 | Part de fond clair | Au moins 85 % de la surface de chaque page ; le sombre limité au pied de page et à des encarts |
| C-P2 | Une seule couleur d'action | Tous les boutons principaux (Appeler, Être rappelé, Envoyer) dans le vert atelier, reconnaissables d'un écran à l'autre |
| C-P3 | Lisibilité mesurée | Rapports calculés et testés en porte automatique pour chaque paire de jetons utilisée |

## Attractives

| Id | Attribut | Gisement |
|---|---|---|
| C-A1 | Vert atelier : la couleur des machines-outils, des établis et des plaques émaillées, un vert « de métier » que personne n'utilise localement | Couture du paysage : se distinguer sans nouveau coût |
| C-A2 | Figures techniques à l'encre graphite sur quadrillage clair, repères numérotés dans la couleur de marque | Demande d'Anthony, démontre le savoir sans photo |

## Indifférentes

- Mode sombre automatique du système : coût de double palette pour un usage marginal sur un
  site consulté quelques minutes ; différé.
- Couleur par famille de pièces : aucun gain de repérage, bruit visuel.

## À éviter

| Id | Attribut | Motif |
|---|---|---|
| C-E1 | Bleu nuit et doré, fond crème | Rejet explicite d'Anthony : signature « site généré », allure de luxe |
| C-E2 | Rouge ou orange comme couleur de marque | Neutralise les alertes du pré-diagnostic ; ferait lire chaque bouton comme une alarme |
| C-E3 | Fond sombre dominant | Lecture en extérieur, perception de prix élevés |
| C-E4 | Jaune et noir | Couleurs de Speedy et Midas : confusion avec les réseaux |
| C-E5 | Vert vif ou fluo | Néon, contraire à la charte, et évoque l'écologie plus que l'atelier |

## Palette retenue (proposition, à valider sur maquette)

| Rôle | Couleur | Usage |
|---|---|---|
| Vert atelier profond | `#233F35` | Titres forts, pied de page, plaque du logo |
| Vert atelier | `#2F6B55` | Boutons principaux, liens, repères des figures (6,3:1 sur blanc, 5,8:1 sur béton clair) |
| Réséda clair | `#E2EEE6` | Aplats doux, pastille « Ouvert », encarts |
| Graphite | `#26282B` | Texte courant (14,8:1 sur blanc, 13,6:1 sur béton clair) |
| Gris texte second | `#4A504C` | Texte secondaire (8,3:1 sur blanc, 7,6:1 sur béton clair) |
| Béton clair | `#F5F6F4` | Fond de page |
| Blanc | `#FFFFFF` | Cartes, champs |
| Filets | `#D8DDD9` et `#7F8A84` | Filets décoratifs ; contours de champs et de choix (3:1 au moins) |
| Rouge alerte | réservé | « Ne roulez pas » uniquement |
| Ambre alerte | réservé | « À faire contrôler » uniquement |

Logo recoloré : plaque en vert atelier profond, lettres et filet en blanc cassé neutre,
comme une plaque émaillée ; version négative, une couleur et favicon déclinés à l'identique.

## État appliqué

À remplir après intégration par l'agent de design.

## Décision finale d'Anthony (2026-09-23, version 2)

Après avoir vu la version claire en vert (« trop clair, on ne voit pas les démarcations »),
les variantes à démarcations (A, B, C en vert, D en bleu de travail : « il y a un truc qui ne
va pas »), Anthony tranche : **graphite et orange** (palette 3), la structure V3 (bandeau
d'ouverture sombre), **la partie Pièces plus en avant**, et les **figures techniques**
légendées comme le frein à disque (« c'est stylé »). Cette décision prime sur le verdict
ci-dessus ; le Kano reste valable pour ses basiques et ses « à éviter » hors C-E2.

| Rôle | Couleur | Contraste mesuré |
|---|---|---|
| Graphite profond (bandeau, plaque du logo, pied) | `#262523` | blanc cassé 13,9:1 |
| Fond sombre | `#1C1B19` | |
| Orange atelier (accents, filets, boutons sur sombre et fond des boutons principaux) | `#E4682B` | 4,6:1 sur graphite ; texte graphite `#1C1B19` sur orange 5,2:1 |
| Orange clair (petit texte sur sombre) | `#F59A63` | 7,1:1 sur graphite |
| Orange foncé (liens sur clair) | `#B5501B` | 5,1:1 sur blanc |
| Texte courant | `#262626` | 12,9:1 sur béton clair |
| Fonds clairs | béton `#EDEDEA`, blanc `#FFFFFF` | |

**Parade à C-E2 (orange de marque contre alertes).** L'orange de marque ne paraît jamais
dans la zone de résultat du pré-diagnostic, hors boutons d'action. Les niveaux se lisent
d'abord par leur texte et leur forme : « Ne roulez pas » en aplat rouge `#B3261E` avec texte
blanc ; « À faire contrôler » en cadre épais jaune ambre `#E3B23C` (teinte nettement plus
jaune que l'orange de marque) avec texte graphite ; « Pas d'urgence » en cadre gris neutre.
Jamais la couleur seule (C-B2).

Logo recoloré : `docs/logo/final-graphite/` (plaque graphite, filet et règle orange,
lettres blanc cassé).
