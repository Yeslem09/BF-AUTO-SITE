import type { AdressePostale } from '../contrats/index.js'

/**
 * Lien d'itinéraire vers le garage. Un lien sortant ne charge rien (D9) : sur
 * téléphone, il ouvre l'application de navigation, sur ordinateur la carte.
 */
const URL_ITINERAIRE = 'https://www.google.com/maps/dir/?api=1&destination='

export function lienItineraire(adresse: AdressePostale): string {
  const destination = `${adresse.voie}, ${adresse.codePostal} ${adresse.ville}`
  return URL_ITINERAIRE + encodeURIComponent(destination)
}
