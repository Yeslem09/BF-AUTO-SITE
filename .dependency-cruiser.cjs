// Frontières hexagonales verrouillées en intégration continue.
//
// Chaque contexte (garage, catalogue, pre-diagnostic, demandes, acces) se développe seul,
// en parallèle des autres. Ces règles garantissent qu'aucun ne s'appuie sur le
// code interne d'un voisin : les échanges passent par src/contrats, et seule la
// racine de composition connaît tout le monde.
const DOMAINE = '^src/contextes/[^/]+/domaine/'
const APPLICATION = '^src/contextes/[^/]+/application/'
const FICHIER_TEST = '\\.test\\.ts$'

module.exports = {
  forbidden: [
    {
      name: 'domaine-pur',
      comment:
        "Le domaine d'un contexte est du TypeScript pur : aucun paquet externe, ni application, ni adaptateur, ni module du contexte, ni couche web, ni composition. Seuls les contrats sont admis.",
      severity: 'error',
      from: { path: DOMAINE, pathNot: FICHIER_TEST },
      to: {
        path: [
          'node_modules',
          '^src/contextes/[^/]+/(application|adaptateurs)/',
          '^src/contextes/[^/]+/module\\.ts$',
          '^src/web/',
          '^src/(composition|configuration|demarrer)\\.ts$',
        ],
      },
    },
    {
      name: 'domaine-sans-module-node',
      comment: 'Le domaine ne touche ni au disque, ni au réseau : aucun module natif de Node.',
      severity: 'error',
      from: { path: DOMAINE, pathNot: FICHIER_TEST },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'application-sans-adaptateur',
      comment:
        "La couche application ne connaît que le domaine et ses ports, jamais un adaptateur concret : changer de stockage ne doit toucher aucun cas d'usage.",
      severity: 'error',
      from: { path: APPLICATION, pathNot: FICHIER_TEST },
      to: {
        path: [
          '^src/contextes/[^/]+/adaptateurs/',
          '^src/contextes/[^/]+/module\\.ts$',
          '^src/web/',
          '^src/(composition|configuration|demarrer)\\.ts$',
        ],
      },
    },
    {
      name: 'contextes-etanches',
      comment:
        "Un contexte n'importe jamais un autre contexte : les échanges passent par src/contrats. Le groupe capturé du from est réutilisé dans le pathNot du to.",
      severity: 'error',
      from: { path: '^src/contextes/([^/]+)/' },
      to: { path: '^src/contextes/[^/]+/', pathNot: '^src/contextes/$1/' },
    },
    {
      name: 'contrats-sans-dependance',
      comment:
        "Les contrats sont des formes d'échange, pas du code : ils ne dépendent de rien d'autre qu'eux-mêmes.",
      severity: 'error',
      from: { path: '^src/contrats/' },
      to: { pathNot: '^src/contrats/' },
    },
    {
      name: 'web-sans-contexte',
      comment:
        "L'adaptateur HTTP partagé ne connaît aucun contexte : il reçoit les modules et les données d'identité en paramètre.",
      severity: 'error',
      from: { path: '^src/web/' },
      to: { path: ['^src/contextes/', '^src/(composition|configuration|demarrer)\\.ts$'] },
    },
    {
      name: 'infrastructure-reservee-aux-adaptateurs',
      comment:
        "Les connecteurs techniques partagés (src/infrastructure : SMTP, IMAP, SMS) ne se branchent que par les adaptateurs d'un contexte, son module.ts, la configuration (lecture des variables) ou la racine de composition : ni le domaine, ni l'application, ni la couche web, ni les contrats ne les connaissent.",
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: [
          '^src/infrastructure/',
          '^src/contextes/[^/]+/adaptateurs/',
          '^src/contextes/[^/]+/(module|essai)(\\.test)?\\.ts$',
          '^src/(composition|configuration)(\\.test)?\\.ts$',
        ],
      },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'infrastructure-sans-contexte',
      comment:
        "L'infrastructure est commune et sans métier : elle n'importe aucun contexte, ni la couche web, ni la composition, ni la configuration du site.",
      severity: 'error',
      from: { path: '^src/infrastructure/' },
      to: {
        path: ['^src/contextes/', '^src/web/', '^src/(composition|configuration|demarrer)\\.ts$'],
      },
    },
    {
      name: 'composition-au-sommet',
      comment:
        "Seul le point d'entrée importe la racine de composition, et seule la composition lit la configuration.",
      severity: 'error',
      from: { path: '^src/', pathNot: ['^src/(composition|demarrer)\\.ts$', FICHIER_TEST] },
      to: { path: '^src/(composition|configuration|demarrer)\\.ts$' },
    },
    {
      name: 'pas-de-cycle',
      comment: 'Aucun cycle de dépendances.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'import-non-resolu',
      comment:
        "Un import que l'outil ne sait pas résoudre échappe à toutes les règles ci-dessus : il est refusé plutôt que silencieusement ignoré.",
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
}
