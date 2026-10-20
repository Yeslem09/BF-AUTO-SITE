import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ErreurConfiguration, lireConfiguration } from './configuration.js'

const RACINE = '/srv/bf-auto'

function problemes(env: Record<string, string>): readonly string[] {
  try {
    lireConfiguration(env, RACINE)
  } catch (erreur) {
    if (erreur instanceof ErreurConfiguration) return erreur.problemes
    throw erreur
  }
  throw new Error('la configuration aurait dû être refusée')
}

describe('configuration', () => {
  it('fournit des valeurs par défaut sûres pour le développement', () => {
    expect(lireConfiguration({}, RACINE)).toEqual({
      port: 3000,
      hote: '127.0.0.1',
      urlPublique: 'http://localhost:3000',
      cheminDonnees: resolve('/srv/bf-auto/donnees'),
      cheminPublic: resolve('/srv/bf-auto/public'),
      baseSqlite: resolve('/srv/bf-auto/var/demandes.sqlite'),
      courrielGarage: null,
      courrielGaragiste: null,
      courrielResponsable: null,
      connecteurs: { courriel: null, sms: null },
      avertissementsConnecteurs: [
        'SMS désactivé : aucun identifiant de fournisseur (SMS_OVH_* ou SMS_BREVO_CLE_API) ; les demandes « Ne roulez pas » ne partent que par courriel.',
      ],
      niveauJournal: 'info',
      mode: 'production',
      mandatairesDeConfiance: 0,
    })
  })

  it('prend l’adresse du garagiste, à défaut celle qui reçoit les demandes', () => {
    const repli = lireConfiguration({ COURRIEL_GARAGE: 'garage@exemple.fr' }, RACINE)
    expect(repli.courrielGaragiste).toBe('garage@exemple.fr')
    const propre = lireConfiguration(
      {
        COURRIEL_GARAGE: 'garage@exemple.fr',
        COURRIEL_GARAGISTE: 'patron@exemple.fr',
        COURRIEL_RESPONSABLE_SITE: 'anthony@exemple.fr',
      },
      RACINE,
    )
    expect(propre.courrielGaragiste).toBe('patron@exemple.fr')
    expect(propre.courrielResponsable).toBe('anthony@exemple.fr')
    expect(problemes({ COURRIEL_GARAGISTE: 'patron', COURRIEL_RESPONSABLE_SITE: 'moi' })).toEqual([
      'COURRIEL_GARAGISTE : « patron » n’est pas une adresse de courriel',
      'COURRIEL_RESPONSABLE_SITE : « moi » n’est pas une adresse de courriel',
    ])
  })

  it('lit le nombre de mandataires (TRUST_PROXY), aucun par défaut', () => {
    expect(lireConfiguration({ TRUST_PROXY: '1' }, RACINE).mandatairesDeConfiance).toBe(1)
    for (const faux of ['-1', 'oui', '1.5', '11']) {
      expect(problemes({ TRUST_PROXY: faux })).toEqual([
        `TRUST_PROXY : « ${faux} », nombre de mandataires attendu (entier de 0 à 10, 1 sur Render)`,
      ])
    }
  })

  it('en relecture, n’écoute que sur 127.0.0.1 (Kano D8)', () => {
    expect(lireConfiguration({ MODE_SITE: 'relecture' }, RACINE).hote).toBe('127.0.0.1')
    expect(problemes({ MODE_SITE: 'relecture', HOTE: '0.0.0.0' })).toEqual([
      'HOTE : « 0.0.0.0 » refusé en relecture, qui n’écoute que sur 127.0.0.1 (retirer HOTE)',
    ])
    expect(lireConfiguration({ MODE_SITE: 'demonstration', HOTE: '0.0.0.0' }, RACINE).hote).toBe(
      '0.0.0.0',
    )
  })

  it('lit le mode du site et refuse un mode inconnu', () => {
    expect(lireConfiguration({ MODE_SITE: 'demonstration' }, '/srv/bf-auto').mode).toBe(
      'demonstration',
    )
    expect(() => lireConfiguration({ MODE_SITE: 'essai' }, '/srv/bf-auto')).toThrow(/MODE_SITE/)
  })

  it('lit les variables d’hébergement', () => {
    const configuration = lireConfiguration(
      {
        PORT: '10000',
        HOTE: '0.0.0.0',
        URL_PUBLIQUE: 'https://www.bf-auto.fr/',
        CHEMIN_DONNEES: '/etc/bf-auto',
        BASE_SQLITE: '/var/data/demandes.sqlite',
        COURRIEL_GARAGE: 'garage@exemple.fr',
        NIVEAU_JOURNAL: 'warn',
      },
      RACINE,
    )
    expect(configuration.port).toBe(10000)
    expect(configuration.hote).toBe('0.0.0.0')
    expect(configuration.urlPublique).toBe('https://www.bf-auto.fr')
    expect(configuration.cheminDonnees).toBe(resolve('/etc/bf-auto'))
    expect(configuration.baseSqlite).toBe(resolve('/var/data/demandes.sqlite'))
    expect(configuration.courrielGarage).toBe('garage@exemple.fr')
    expect(configuration.niveauJournal).toBe('warn')
  })

  it('lit les connecteurs : Gmail en deux variables, destinataire des demandes = la boîte', () => {
    const configuration = lireConfiguration(
      { SMTP_UTILISATEUR: 'garage@gmail.com', SMTP_MOT_DE_PASSE: 'abcd efgh ijkl mnop' },
      RACINE,
    )
    expect(configuration.connecteurs.courriel?.smtp).toMatchObject({
      fournisseur: 'gmail',
      serveur: { hote: 'smtp.gmail.com', port: 465, securise: true },
      expediteur: 'garage@gmail.com',
    })
    expect(configuration.connecteurs.courriel?.imap?.serveur.hote).toBe('imap.gmail.com')
    expect(configuration.courrielGarage).toBe('garage@gmail.com')
    expect(configuration.courrielGaragiste).toBe('garage@gmail.com')
  })

  it('garde un COURRIEL_GARAGE explicite, et aucun défaut pour un relais d’envoi', () => {
    expect(
      lireConfiguration(
        {
          SMTP_UTILISATEUR: 'garage@gmail.com',
          SMTP_MOT_DE_PASSE: 'abcdefghijklmnop',
          COURRIEL_GARAGE: 'atelier@exemple.fr',
        },
        RACINE,
      ).courrielGarage,
    ).toBe('atelier@exemple.fr')
    expect(
      lireConfiguration(
        {
          COURRIEL_FOURNISSEUR: 'brevo',
          SMTP_UTILISATEUR: '8f1a2b001@smtp-brevo.com',
          SMTP_MOT_DE_PASSE: 'cle-smtp',
          SMTP_EXPEDITEUR: 'site@exemple.fr',
        },
        RACINE,
      ).courrielGarage,
    ).toBeNull()
  })

  it('le SMS attend le téléphone du garage quand SMS_DESTINATAIRE manque', () => {
    const { connecteurs } = lireConfiguration({ SMS_FOURNISSEUR: 'console' }, RACINE)
    expect(connecteurs.sms).toEqual({ fournisseur: 'console', destinataire: null })
  })

  it('rassemble toutes les anomalies en une seule erreur', () => {
    expect(
      problemes({
        PORT: 'quatre-vingt',
        URL_PUBLIQUE: 'https://www.bf-auto.fr/accueil',
        COURRIEL_GARAGE: 'garage',
        NIVEAU_JOURNAL: 'bavard',
        SMTP_HOTE: 'smtp.exemple.fr',
        SMTP_SECURISE: 'oui',
        SMTP_UTILISATEUR: 'site',
      }),
    ).toEqual([
      'PORT : « quatre-vingt » n’est pas un port (entier de 1 à 65535)',
      'URL_PUBLIQUE : origine seule attendue, sans chemin (https://www.exemple.fr)',
      'NIVEAU_JOURNAL : « bavard » inconnu (fatal, error, warn, info, debug, trace, silent)',
      'COURRIEL_GARAGE : « garage » n’est pas une adresse de courriel',
      'SMTP_SECURISE : « oui », true ou false attendu',
      'SMTP_UTILISATEUR et SMTP_MOT_DE_PASSE : les deux ou aucun',
      'SMTP_EXPEDITEUR : obligatoire (adresse d’expédition)',
    ])
  })

  it.each(['0', '65536', '80.5'])('refuse le port %j', (port) => {
    expect(problemes({ PORT: port })).toHaveLength(1)
  })

  it('refuse une adresse publique qui n’est pas en http ou https', () => {
    expect(problemes({ URL_PUBLIQUE: 'ftp://bf-auto.fr' })).toEqual([
      'URL_PUBLIQUE : http ou https attendu',
    ])
  })
})
