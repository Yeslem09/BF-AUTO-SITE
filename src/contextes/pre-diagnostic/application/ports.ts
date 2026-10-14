/** Fournit le contenu brut de l'arbre (JSON déjà analysé) ; le domaine le lit et le vérifie. */
export interface SourceArbre {
  lire(): Promise<unknown>
}
