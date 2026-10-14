import { describe, expect, it } from 'vitest'
import type { Connecteurs } from '../connecteurs.js'
import type { CourrielSortant, ExpediteurCourriel } from '../courriel/envoi/ports.js'
import { creerBoiteMemoire } from '../courriel/lecture/boite-memoire.js'
import { nonRemiseGmail, reponseGmail } from '../courriel/lecture/essai/echantillons.js'
import type { BoiteDeReception } from '../courriel/lecture/ports.js'
import { ErreurConnecteur } from '../erreurs.js'
import { CODES_SORTIE } from './commun.js'
import { executerTestCourriel, USAGE_COURRIEL } from './tester-courriel.js'

const MOT_DE_PASSE = 'abcd efgh ijkl mnop'
const GMAIL = { SMTP_UTILISATEUR: 'garage@gmail.com', SMTP_MOT_DE_PASSE: MOT_DE_PASSE }
const MAINTENANT = new Date('2026-09-23T10:00:00Z')

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

function lancer(
  argumentsRecus: string[],
  env: Record<string, string>,
  connecteurs: Partial<Connecteurs> = {},
) {
  const sortie: string[] = []
  const erreurs: string[] = []
  const code = executerTestCourriel(argumentsRecus, {
    env,
    maintenant: () => MAINTENANT,
    sorties: {
      ecrire: (texte) => sortie.push(texte),
      ecrireErreur: (texte) => erreurs.push(texte),
    },
    genererReference: () => 'BF-7K3Q9D',
    fabriquer: () => ({ expediteur: null, boite: null, sms: null, ...connecteurs }),
  })
  return { code, sortie: () => sortie.join(''), erreurs }
}

describe('pnpm courriel:tester (US-C11)', () => {
  it('vérifie, envoie un courriel d’essai référencé et liste les réponses, sans montrer le secret', async () => {
    const expediteur = expediteurRetenu()
    const boite = creerBoiteMemoire()
    boite.deposer(reponseGmail('Fait'), new Date('2026-09-22T18:00:00Z'))
    boite.deposer(nonRemiseGmail(), new Date('2026-09-21T18:00:00Z'))
    const { code, sortie } = lancer(['--', '--envoyer', 'garage@gmail.com'], GMAIL, {
      expediteur,
      boite,
    })
    expect(await code).toBe(CODES_SORTIE.succes)
    const texte = sortie()
    expect(texte).toContain('Courriel : Gmail')
    expect(texte).toContain('mot de passe : défini')
    expect(texte).not.toContain(MOT_DE_PASSE)
    expect(texte).not.toContain('abcdefghijklmnop')
    expect(texte).toContain('Envoi (SMTP) : réussi')
    expect(texte).toContain('Lecture (IMAP) : réussi, dossier INBOX ouvert en lecture seule')
    expect(texte).toContain('(référence BF-7K3Q9D)')
    expect(texte).toContain('Messages référencés des 7 derniers jours : 2')
    expect(texte).toContain('BF-7K3Q9D  réponse de garage.essai@gmail.com : commande reconnue')
    expect(texte).toContain('non remis à atelier.inconnu@exemple.test : 5.1.1')
    expect(texte).not.toContain('Prénom : Julie')
    expect(expediteur.envoyes).toHaveLength(1)
    expect(expediteur.envoyes[0]).toMatchObject({
      destinataire: 'garage@gmail.com',
      objet: 'Courriel d’essai du site BF Auto',
      fil: { reference: 'BF-7K3Q9D', rang: 1 },
    })
    expect(expediteur.envoyes[0]?.texte).toContain('répondez simplement « fait »')
  })

  it('une lecture en échec donne le code 1, la cause et le remède', async () => {
    const boite: BoiteDeReception = {
      relever: async () => Promise.reject(new Error('inutile')),
      listerRecents: async () => [],
      verifier: async () => {
        throw new ErreurConnecteur(
          'Lecture de la boîte (IMAP)',
          'identifiants',
          'AUTHENTICATIONFAILED',
          'Mot de passe d’application',
        )
      },
    }
    const { code, sortie } = lancer([], GMAIL, { expediteur: expediteurRetenu(), boite })
    expect(await code).toBe(CODES_SORTIE.echec)
    expect(sortie()).toContain('Lecture (IMAP) : ÉCHEC')
    expect(sortie()).toContain('Que faire : Mot de passe d’application')
    expect(sortie()).not.toContain('Messages référencés')
  })

  it('un envoi d’essai refusé donne le code 1', async () => {
    const expediteur: ExpediteurCourriel = {
      ...expediteurRetenu(),
      envoyer: async () => {
        throw new ErreurConnecteur('Envoi de courriel (SMTP)', 'refus', '550', 'Vérifiez l’adresse')
      },
    }
    const { code, sortie } = lancer(['--envoyer', 'inconnu@exemple.test'], GMAIL, { expediteur })
    expect(await code).toBe(CODES_SORTIE.echec)
    expect(sortie()).toContain('Courriel d’essai : ÉCHEC')
  })

  it('rien de configuré, ou configuration fausse : code 2 et ce qu’il faut renseigner', async () => {
    const vide = lancer([], {})
    expect(await vide.code).toBe(CODES_SORTIE.usage)
    expect(vide.sortie()).toContain('SMTP_UTILISATEUR')
    const faux = lancer([], { ...GMAIL, SMTP_MOT_DE_PASSE: 'MonMotDePasse2026' })
    expect(await faux.code).toBe(CODES_SORTIE.usage)
    expect(faux.sortie()).toContain('Configuration du courriel invalide')
    expect(faux.sortie()).not.toContain('MonMotDePasse2026')
  })

  it.each([
    ['--inconnu'],
    ['--envoyer'],
    ['--envoyer', 'pas-une-adresse'],
    ['--jours', '0'],
    ['--jours', '91'],
  ])('arguments %j : rappel de l’usage, code 2', async (...argumentsRecus) => {
    const { code, erreurs } = lancer(argumentsRecus, GMAIL)
    expect(await code).toBe(CODES_SORTIE.usage)
    expect(erreurs).toEqual([USAGE_COURRIEL])
  })
})
