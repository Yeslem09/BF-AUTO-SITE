/**
 * Hôtes de la machine elle-même : seuls admis sans chiffrement (relais de
 * courriel local, faux serveurs des tests). Tout autre hôte exige TLS.
 */
const HOTES_LOCAUX: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function estHoteLocal(hote: string): boolean {
  return HOTES_LOCAUX.has(hote.trim().toLowerCase())
}
