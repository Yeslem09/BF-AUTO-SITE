import { describe, expect, it } from 'vitest'
import { creerExpediteurConsole } from '../../../../infrastructure/courriel/envoi/expediteur-console.js'
import type {
  CourrielSortant,
  ExpediteurCourriel,
} from '../../../../infrastructure/courriel/envoi/ports.js'
import { ErreurConnecteur } from '../../../../infrastructure/erreurs.js'
import type { EnvoiSms, SmsSortant } from '../../../../infrastructure/sms/ports.js'
import { ErreurNotification } from '../../domaine/erreurs.js'
import { creerAlerteSms } from './alerte-sms.js'
import { creerNotificateurCourriel, notificateurIndisponible } from './notificateur-courriel.js'

const MESSAGE = {
  sujet: 'Ne roulez pas : Julie',
  texte: 'Ne roulez pas : appelez-nous.\n',
  reference: 'BF-7K3Q9D',
}

function expediteurRetenu(): ExpediteurCourriel & { readonly envoyes: CourrielSortant[] } {
  const envoyes: CourrielSortant[] = []
  return {
    canal: 'smtp',
    envoyes,
    envoyer: async (courriel) => {
      envoyes.push(courriel)
      return { identifiantMessage: '<BF-7K3Q9D.1@gmail.com>' }
    },
    verifier: async () => undefined,
  }
}

describe('notificateur par courriel (D5, Kano connecteurs C3)', () => {
  it('remet le message au garage, rattaché à sa demande (référence, rang 1)', async () => {
    const expediteur = expediteurRetenu()
    const notificateur = creerNotificateurCourriel(expediteur, 'atelier@garage.exemple', {
      invitationReponse: false,
    })
    await notificateur.envoyer(MESSAGE)
    expect(notificateur.canal).toBe('courriel')
    expect(expediteur.envoyes).toEqual([
      {
        destinataire: 'atelier@garage.exemple',
        objet: MESSAGE.sujet,
        texte: MESSAGE.texte,
        fil: { reference: 'BF-7K3Q9D', rang: 1 },
      },
    ])
  })

  it('invite à répondre « fait » quand la boîte est lue, et seulement alors', async () => {
    const expediteur = expediteurRetenu()
    await creerNotificateurCourriel(expediteur, 'atelier@garage.exemple', {
      invitationReponse: true,
    }).envoyer(MESSAGE)
    expect(expediteur.envoyes[0]?.texte).toContain('répondez simplement « fait » à ce courriel')
  })

  it('un échec du connecteur devient une erreur de notification qui porte cause et remède', async () => {
    const expediteur: ExpediteurCourriel = {
      ...expediteurRetenu(),
      envoyer: async () => {
        throw new ErreurConnecteur(
          'Envoi de courriel (SMTP)',
          'identifiants',
          '535',
          'Créez un mot de passe d’application.',
        )
      },
    }
    const echec = creerNotificateurCourriel(expediteur, 'atelier@garage.exemple', {
      invitationReponse: false,
    }).envoyer(MESSAGE)
    await expect(echec).rejects.toBeInstanceOf(ErreurNotification)
    await expect(echec).rejects.toThrow(/identifiants refusés.*mot de passe d’application/)
  })

  it('en console, le message s’écrit avec son objet référencé, sans rien envoyer', async () => {
    const lignes: string[] = []
    const notificateur = creerNotificateurCourriel(
      creerExpediteurConsole((texte) => lignes.push(texte)),
      'atelier@garage.exemple',
      { invitationReponse: false },
    )
    await notificateur.envoyer(MESSAGE)
    expect(notificateur.canal).toBe('console')
    expect(lignes[0]).toContain('Objet : Ne roulez pas : Julie [BF-7K3Q9D]')
  })

  it('sans canal en production, chaque envoi échoue en nommant les variables à régler', async () => {
    await expect(notificateurIndisponible.envoyer(MESSAGE)).rejects.toThrow(/COURRIEL_GARAGE/)
  })
})

describe('SMS « Ne roulez pas » (Kano connecteurs, C6)', () => {
  it('part vers le mobile configuré par le fournisseur', async () => {
    const envoyes: SmsSortant[] = []
    const envoi: EnvoiSms = {
      fournisseur: 'console',
      envoyer: async (sms) => {
        envoyes.push(sms)
        return { identifiant: null, segments: 1 }
      },
      verifier: async () => ({ creditsRestants: null }),
    }
    await creerAlerteSms(envoi, '+33605922838').envoyer('BF Auto : NE ROULEZ PAS.')
    expect(envoyes).toEqual([{ destinataire: '+33605922838', texte: 'BF Auto : NE ROULEZ PAS.' }])
  })
})
