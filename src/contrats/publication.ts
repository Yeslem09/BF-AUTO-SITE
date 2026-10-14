/**
 * Fourni par le pré-diagnostic : vrai s'il est publié. En production, il ne
 * l'est qu'une fois l'arbre relu avec le garagiste et daté ; en relecture et
 * en démonstration, toujours. Faux, aucune page ne lie `/pre-diagnostic`
 * (l'adresse répond 404) : on invite à appeler le garage à la place (Kano D3).
 */
export type PreDiagnosticPublie = boolean
