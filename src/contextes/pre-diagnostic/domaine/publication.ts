import type { ModeSite } from '../../../contrats/index.js'
import type { Arbre } from './arbre.js'

/**
 * Rien n'est dit au nom du garagiste sans sa relecture : en production, le
 * pré-diagnostic n'est publié qu'une fois la relecture datée. En relecture et
 * en démonstration, il reste visible pour être relu et montré.
 */
export function estPublie(arbre: Arbre, mode: ModeSite): boolean {
  return mode !== 'production' || arbre.relecture !== null
}
