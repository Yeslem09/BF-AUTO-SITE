const FORMAT_SIRET = /^\d{14}$/
const BASE_DECIMALE = 10
const MODULO_LUHN = 10

/** SIRET normalisé (14 chiffres, sans espace) ou `null` s'il est invalide. */
export function normaliserSiret(texte: string): string | null {
  const compact = texte.replace(/\s/g, '')
  if (!FORMAT_SIRET.test(compact) || !respecteLuhn(compact)) return null
  return compact
}

/** Clé de contrôle de Luhn, utilisée par l'Insee pour le SIREN et le SIRET. */
function respecteLuhn(chiffres: string): boolean {
  let somme = 0
  const inverses = [...chiffres].reverse()
  inverses.forEach((caractere, position) => {
    let valeur = Number(caractere)
    if (position % 2 === 1) {
      valeur *= 2
      if (valeur >= BASE_DECIMALE) valeur -= BASE_DECIMALE - 1
    }
    somme += valeur
  })
  return somme % MODULO_LUHN === 0
}
