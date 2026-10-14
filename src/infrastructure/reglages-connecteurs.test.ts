import { describe, expect, it } from 'vitest'
import {
  decrireReglages,
  ErreurReglagesConnecteurs,
  lireReglagesConnecteurs,
} from './reglages-connecteurs.js'

const DEFAUTS = { telephoneGarage: '06 05 92 28 38' }
const MOT_DE_PASSE = 'abcdefghijklmnop'
const SECRET_OVH = 'secret-ovh-a-ne-jamais-afficher'

describe('réglages de tous les connecteurs (US-C02)', () => {
  it('rassemble toutes les fautes du courriel et du SMS dans une seule erreur', () => {
    try {
      lireReglagesConnecteurs(
        {
          COURRIEL_FOURNISSEUR: 'yahoo',
          SMTP_UTILISATEUR: 'garage@gmail.com',
          SMTP_MOT_DE_PASSE: MOT_DE_PASSE,
          SMTP_PORT: '99999',
          IMAP_INTERVALLE_SECONDES: '5',
          SMS_OVH_CLE_APPLICATION: 'cle',
        },
        DEFAUTS,
      )
      expect.unreachable('des réglages faux doivent lever')
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(ErreurReglagesConnecteurs)
      const { problemes, message } = erreur as ErreurReglagesConnecteurs
      expect(problemes.length).toBeGreaterThanOrEqual(4)
      for (const variable of [
        'COURRIEL_FOURNISSEUR',
        'SMTP_PORT',
        'IMAP_INTERVALLE_SECONDES',
        'SMS_OVH_SECRET_APPLICATION',
      ]) {
        expect(message).toContain(variable)
      }
    }
  })

  it('Gmail et OVH en variables : réglages complets, avertissements à part', () => {
    const { reglages, avertissements } = lireReglagesConnecteurs(
      {
        SMTP_UTILISATEUR: 'garage@gmail.com',
        SMTP_MOT_DE_PASSE: MOT_DE_PASSE,
        SMS_OVH_CLE_APPLICATION: 'cle-app',
        SMS_OVH_SECRET_APPLICATION: SECRET_OVH,
        SMS_OVH_CLE_CONSOMMATEUR: 'cle-conso',
        SMS_OVH_SERVICE: 'sms-ab12345-1',
      },
      DEFAUTS,
    )
    expect(reglages.courriel?.smtp.fournisseur).toBe('gmail')
    expect(reglages.sms?.fournisseur).toBe('ovh')
    expect(avertissements).toEqual([])
  })

  it('décrit les réglages sans jamais montrer un secret', () => {
    const { reglages } = lireReglagesConnecteurs(
      {
        SMTP_UTILISATEUR: 'garage@gmail.com',
        SMTP_MOT_DE_PASSE: MOT_DE_PASSE,
        SMS_OVH_CLE_APPLICATION: 'cle-app',
        SMS_OVH_SECRET_APPLICATION: SECRET_OVH,
        SMS_OVH_CLE_CONSOMMATEUR: 'cle-conso',
        SMS_OVH_SERVICE: 'sms-ab12345-1',
      },
      DEFAUTS,
    )
    const texte = decrireReglages(reglages).join('\n')
    expect(texte).toContain('Courriel : Gmail')
    expect(texte).toContain('smtp.gmail.com:465, TLS direct')
    expect(texte).toContain('mot de passe : défini')
    expect(texte).toContain('dossier INBOX en lecture seule, toutes les 120 s')
    expect(texte).toContain('SMS : OVHcloud')
    expect(texte).toContain('+33605922838')
    for (const secret of [MOT_DE_PASSE, SECRET_OVH, 'cle-app', 'cle-conso']) {
      expect(texte).not.toContain(secret)
    }
  })

  it('sans rien configuré : courriel non configuré et SMS désactivé, avec leur conséquence', () => {
    const { reglages, avertissements } = lireReglagesConnecteurs({}, DEFAUTS)
    expect(reglages).toEqual({ courriel: null, sms: null })
    expect(decrireReglages(reglages)).toEqual([
      'Courriel : non configuré (console en développement, échec visible en production)',
      'SMS : désactivé',
    ])
    expect(avertissements[0]).toContain('SMS désactivé')
  })
})
