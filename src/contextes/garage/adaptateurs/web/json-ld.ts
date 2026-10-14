import { brut, type Html } from '../../../../web/index.js'
import type { FicheGarage } from '../../application/consulter-garage.js'
import { dateIso } from '../../domaine/temps-local.js'
import { JOURS_SEMAINE, type JourSemaine } from '../../domaine/jours.js'
import { MINUTES_PAR_HEURE, type MinuteDuJour } from '../../domaine/heure.js'
import type { SemaineType } from '../../domaine/horaires.js'

const JOURS_SCHEMA: Readonly<Record<JourSemaine, string>> = {
  lundi: 'https://schema.org/Monday',
  mardi: 'https://schema.org/Tuesday',
  mercredi: 'https://schema.org/Wednesday',
  jeudi: 'https://schema.org/Thursday',
  vendredi: 'https://schema.org/Friday',
  samedi: 'https://schema.org/Saturday',
  dimanche: 'https://schema.org/Sunday',
}
const PREFIXE_LIEN_TELEPHONE = 'tel:'
/** Convention schema.org d'un jour fermé : ouverture et fermeture à minuit. */
const MINUIT = '00:00'
const PAYS = 'FR'

function heureSchema(minutes: MinuteDuJour): string {
  const deuxChiffres = (nombre: number) => String(nombre).padStart(2, '0')
  return `${deuxChiffres(Math.floor(minutes / MINUTES_PAR_HEURE))}:${deuxChiffres(minutes % MINUTES_PAR_HEURE)}`
}

function horairesSchema(semaine: SemaineType): readonly object[] {
  return JOURS_SEMAINE.flatMap((jour) =>
    semaine[jour].map((plage) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: JOURS_SCHEMA[jour],
      opens: heureSchema(plage.ouverture),
      closes: heureSchema(plage.fermeture),
    })),
  )
}

/**
 * Données structurées `AutoRepair` (Kano D10, B-17), tirées de la fiche publiée :
 * rien d'autre que ce que la page affiche, et jamais de note ni d'avis.
 */
export function donneesStructurees(fiche: FicheGarage): Record<string, unknown> {
  const { identite, horaires, fermeturesAVenir } = fiche
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: identite.nom,
    telephone: identite.telephone.lien.slice(PREFIXE_LIEN_TELEPHONE.length),
    ...(identite.courriel !== undefined && { email: identite.courriel }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: identite.adresse.voie,
      postalCode: identite.adresse.codePostal,
      addressLocality: identite.adresse.ville,
      addressCountry: PAYS,
    },
    ...(identite.coordonnees !== undefined && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: identite.coordonnees.latitude,
        longitude: identite.coordonnees.longitude,
      },
    }),
    ...(horaires !== null && { openingHoursSpecification: horairesSchema(horaires.semaineType) }),
    ...(fermeturesAVenir.length > 0 && {
      specialOpeningHoursSpecification: fermeturesAVenir.map((fermeture) => ({
        '@type': 'OpeningHoursSpecification',
        validFrom: dateIso(fermeture.du),
        validThrough: dateIso(fermeture.au),
        opens: MINUIT,
        closes: MINUIT,
      })),
    }),
  }
}

/** Caractères qui pourraient fermer l'élément script ou y ouvrir du HTML. */
const CARACTERES_A_NEUTRALISER: Readonly<Record<string, string>> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/**
 * Élément `<script type="application/ld+json">`. Le JSON est neutralisé
 * (chevrons, esperluette, séparateurs de ligne) : aucune valeur ne peut fermer
 * l'élément. C'est une donnée, jamais exécutée : la politique de sécurité ne la bloque pas.
 */
export function rendreDonneesStructurees(fiche: FicheGarage): Html {
  const json = JSON.stringify(donneesStructurees(fiche)).replace(
    /[<>&\u2028\u2029]/g,
    (caractere) => CARACTERES_A_NEUTRALISER[caractere] ?? caractere,
  )
  return brut(`<script type="application/ld+json">${json}</script>`)
}
