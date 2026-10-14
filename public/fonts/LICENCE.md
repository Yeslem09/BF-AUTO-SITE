# Polices du site

## Hanken Grotesk

- Fichiers : `hanken-grotesk-400.woff2` (normal), `hanken-grotesk-600.woff2` (demi-gras),
  `hanken-grotesk-700.woff2` (gras).
- Source : Hanken Grotesk version 3.013, Copyright 2021 The Hanken Grotesk Project Authors
  (https://github.com/marcologous/hanken-grotesk).
- Licence : SIL Open Font License 1.1, texte complet dans `OFL.txt`. La police ne déclare
  aucun nom de police réservé.
- Transformation : sous-ensemble latin et latin étendu (français complet, guillemets,
  apostrophe typographique, symbole euro), converti en WOFF2 avec `pyftsubset` (fonttools).
  Les fichiers sont servis par le site lui-même, aucune requête vers un service tiers.

Pour remplacer un fichier de police, changer aussi son nom (par exemple `-v2`) : les
polices sont servies avec un cache immuable d'un an.
