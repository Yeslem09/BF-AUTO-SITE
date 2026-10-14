import { createHmac, timingSafeEqual } from 'node:crypto'
import type {
  EnvoiFormulaireGaragiste,
  ProtectionFormulairesGaragiste,
} from '../../../../contrats/index.js'
import type { Session } from '../../domaine/session.js'

/** Un formulaire de connexion reste valable une journée : un téléphone laissé ouvert la nuit ne bloque pas. */
export const VALIDITE_FORMULAIRE_CONNEXION_MS = 24 * 60 * 60 * 1000

export type MotifRefus = 'origine-absente' | 'origine-etrangere' | 'jeton-invalide'

export interface ProvenanceRequete {
  /** En-tête `Origin`, envoyé par tout navigateur actuel sur une requête POST. */
  readonly origine: string | undefined
  /** En-tête `Referer`, repli des navigateurs anciens qui n'envoient pas `Origin`. */
  readonly referent: string | undefined
  /** En-tête `Host` de la requête, tel que le navigateur l'a adressée. */
  readonly hote: string | undefined
  /** Origine publique configurée (`URL_PUBLIQUE`). */
  readonly originePublique: string
}

function origineDe(adresse: string): URL | null {
  try {
    return new URL(adresse)
  } catch {
    return null
  }
}

/**
 * Un POST de l'espace n'est admis que s'il vient d'une page du site : son
 * origine (ou, à défaut, celle de son référent) est l'origine publique, ou
 * désigne le même hôte que la requête. Une page d'un autre site ne peut ni
 * forger l'en-tête `Origin` ni choisir l'hôte auquel le navigateur s'adresse.
 * Sans aucune des deux indications, la requête est refusée.
 */
export function verifierProvenance(provenance: ProvenanceRequete): MotifRefus | null {
  const indication = provenance.origine ?? provenance.referent
  if (indication === undefined || indication === '') return 'origine-absente'
  const adresse = origineDe(indication)
  if (adresse === null || adresse.origin === 'null') return 'origine-etrangere'
  if (adresse.origin === provenance.originePublique) return null
  return provenance.hote !== undefined && adresse.host === provenance.hote.toLowerCase()
    ? null
    : 'origine-etrangere'
}

/**
 * Jetons anti-falsification signés (HMAC-SHA256). Le secret, tiré une fois,
 * est gardé dans la base avec les sessions : un redémarrage ou un déploiement
 * n'invalide pas un formulaire ouvert (le texte du garagiste n'est pas perdu).
 * - Formulaire de session : lié à l'empreinte de la session, il ne vaut que
 *   pour elle et meurt avec elle.
 * - Formulaire de connexion (avant toute session) : daté et borné dans le temps.
 */
export interface ProtectionFormulaires {
  jetonConnexion(maintenant: Date): string
  verifierJetonConnexion(jeton: unknown, maintenant: Date): boolean
  jetonSession(session: Session): string
  verifierJetonSession(jeton: unknown, session: Session): boolean
}

const PORTEE_CONNEXION = 'connexion'
const PORTEE_SESSION = 'session'
const SEPARATEUR = '.'

export function creerProtectionFormulaires(secret: Buffer): ProtectionFormulaires {
  const signer = (contenu: string): string =>
    createHmac('sha256', secret).update(contenu, 'utf8').digest('base64url')
  const egaux = (recu: string, attendu: string): boolean => {
    const a = Buffer.from(recu, 'utf8')
    const b = Buffer.from(attendu, 'utf8')
    return a.length === b.length && timingSafeEqual(a, b)
  }

  return {
    jetonConnexion: (maintenant) => {
      const echeance = String(maintenant.getTime() + VALIDITE_FORMULAIRE_CONNEXION_MS)
      return `${echeance}${SEPARATEUR}${signer(`${PORTEE_CONNEXION}:${echeance}`)}`
    },
    verifierJetonConnexion: (jeton, maintenant) => {
      if (typeof jeton !== 'string') return false
      const [echeance = '', signature = '', ...reste] = jeton.split(SEPARATEUR)
      if (reste.length > 0 || !/^\d+$/.test(echeance)) return false
      if (Number(echeance) <= maintenant.getTime()) return false
      return egaux(signature, signer(`${PORTEE_CONNEXION}:${echeance}`))
    },
    jetonSession: (session) => signer(`${PORTEE_SESSION}:${session.empreinte}`),
    verifierJetonSession: (jeton, session) =>
      typeof jeton === 'string' && egaux(jeton, signer(`${PORTEE_SESSION}:${session.empreinte}`)),
  }
}

/**
 * Anti-falsification offerte aux autres contextes de l'espace (contrat
 * `ProtectionFormulairesGaragiste`) : les mêmes règles que les formulaires de
 * l'accès, provenance puis jeton lié à la session du cookie.
 */
export function creerProtectionPartagee(dependances: {
  readonly protection: ProtectionFormulaires
  readonly sessionDe: (jetonSession: string | undefined) => Session | null
  readonly originePublique: string
}): ProtectionFormulairesGaragiste {
  const { protection, sessionDe, originePublique } = dependances
  return {
    jeton: (jetonSession) => {
      const session = sessionDe(jetonSession)
      return session === null ? null : protection.jetonSession(session)
    },
    admettre: (envoi: EnvoiFormulaireGaragiste) => {
      const session = sessionDe(envoi.jetonSession)
      if (session === null) return false
      const provenance = verifierProvenance({
        origine: envoi.origine,
        referent: envoi.referent,
        hote: envoi.hote,
        originePublique,
      })
      return provenance === null && protection.verifierJetonSession(envoi.jetonFormulaire, session)
    },
  }
}
