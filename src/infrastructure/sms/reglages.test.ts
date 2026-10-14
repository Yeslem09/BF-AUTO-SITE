import { describe, expect, it } from 'vitest'
import { creerLecteurEnvironnement, type Environnement } from '../environnement.js'
import {
  EXPEDITEUR_BREVO_PAR_DEFAUT,
  lireReglagesSms,
  POINT_ACCES_OVH,
  resoudreDestinataireSms,
} from './reglages.js'

const TELEPHONE_GARAGE = '06 05 92 28 38'
const OVH: Environnement = {
  SMS_OVH_CLE_APPLICATION: 'cle-app',
  SMS_OVH_SECRET_APPLICATION: 'secret-app',
  SMS_OVH_CLE_CONSOMMATEUR: 'cle-conso',
  SMS_OVH_SERVICE: 'sms-ab12345-1',
}

function lire(env: Environnement, telephone: string | null = TELEPHONE_GARAGE) {
  const lecteur = creerLecteurEnvironnement(env)
  return { ...lireReglagesSms(lecteur, telephone), problemes: lecteur.problemes }
}

describe('réglages du SMS au garagiste (US-C09)', () => {
  it('sans identifiant, le SMS est désactivé et on le dit', () => {
    const { reglages, avertissements, problemes } = lire({})
    expect(reglages).toBeNull()
    expect(problemes).toEqual([])
    expect(avertissements[0]).toContain('SMS désactivé')
  })

  it('les identifiants OVH suffisent : fournisseur déduit, destinataire = téléphone du garage', () => {
    expect(lire(OVH)).toEqual({
      reglages: {
        fournisseur: 'ovh',
        destinataire: '+33605922838',
        ovh: {
          cleApplication: 'cle-app',
          secretApplication: 'secret-app',
          cleConsommateur: 'cle-conso',
          service: 'sms-ab12345-1',
          expediteur: null,
          pointAcces: POINT_ACCES_OVH,
        },
      },
      avertissements: [],
      problemes: [],
    })
  })

  it('la clé Brevo suffit, avec l’expéditeur par défaut', () => {
    const { reglages } = lire({ SMS_BREVO_CLE_API: 'xkeysib-cle' })
    expect(reglages).toMatchObject({
      fournisseur: 'brevo',
      destinataire: '+33605922838',
      brevo: { cleApi: 'xkeysib-cle', expediteur: EXPEDITEUR_BREVO_PAR_DEFAUT },
    })
  })

  it('SMS_DESTINATAIRE surcharge le téléphone du garage ; un fixe est refusé', () => {
    expect(lire({ ...OVH, SMS_DESTINATAIRE: '07 12 34 56 78' }).reglages?.destinataire).toBe(
      '+33712345678',
    )
    const fixe = lire({ ...OVH, SMS_DESTINATAIRE: '01 45 00 00 00' })
    expect(fixe.reglages).toBeNull()
    expect(fixe.problemes[0]).toContain('SMS_DESTINATAIRE')
    expect(fixe.problemes[0]).toContain('fixe')
  })

  it('sans téléphone du garage ni SMS_DESTINATAIRE, la configuration est refusée', () => {
    expect(lire(OVH, null).problemes).toEqual([
      'SMS_DESTINATAIRE : obligatoire (aucun téléphone du garage connu)',
    ])
  })

  it('identifiants incomplets : chaque variable manquante est nommée, sans reproduire les secrets', () => {
    const { reglages, problemes } = lire({ SMS_OVH_CLE_APPLICATION: 'cle-app' })
    expect(reglages).toBeNull()
    expect(problemes).toEqual([
      'SMS_OVH_SECRET_APPLICATION, SMS_OVH_CLE_CONSOMMATEUR, SMS_OVH_SERVICE : obligatoire(s) pour envoyer des SMS par OVHcloud',
    ])
    expect(problemes.join()).not.toContain('cle-app')
  })

  it('identifiants des deux fournisseurs : ambiguïté refusée, levée par SMS_FOURNISSEUR', () => {
    const deux = { ...OVH, SMS_BREVO_CLE_API: 'xkeysib-cle' }
    expect(lire(deux).problemes[0]).toContain('choisissez ovh ou brevo')
    expect(lire({ ...deux, SMS_FOURNISSEUR: 'brevo' }).reglages?.fournisseur).toBe('brevo')
  })

  it('console forcée pour le développement ; expéditeur et adresse d’API validés', () => {
    expect(lire({ SMS_FOURNISSEUR: 'console' }).reglages).toEqual({
      fournisseur: 'console',
      destinataire: '+33605922838',
    })
    expect(lire({ ...OVH, SMS_OVH_EXPEDITEUR: 'BF Auto' }).problemes[0]).toContain(
      'SMS_OVH_EXPEDITEUR',
    )
    expect(lire({ ...OVH, SMS_OVH_POINT_ACCES: 'http://api.exemple.test' }).problemes[0]).toContain(
      'https exigé',
    )
    expect(lire({ SMS_FOURNISSEUR: 'twilio' }).problemes[0]).toContain('SMS_FOURNISSEUR')
  })
})

describe('destinataire résolu une fois l’identité du garage lue', () => {
  it('sans téléphone encore lu, le destinataire reste à résoudre, puis prend le mobile du garage', () => {
    const { reglages } = lireReglagesSms(
      creerLecteurEnvironnement({ SMS_FOURNISSEUR: 'console' }),
      undefined,
    )
    expect(reglages).toEqual({ fournisseur: 'console', destinataire: null })
    if (reglages === null) throw new Error('réglages attendus')
    expect(resoudreDestinataireSms(reglages, '06 05 92 28 38')).toEqual({
      reglages: { fournisseur: 'console', destinataire: '+33605922838' },
    })
    expect(resoudreDestinataireSms(reglages, '01 45 00 00 00')).toMatchObject({
      probleme: expect.stringContaining('fixe') as unknown,
    })
  })
})
