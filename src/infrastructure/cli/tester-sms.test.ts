import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ErreurConnecteur } from '../erreurs.js'
import type { EnvoiSms, SmsSortant } from '../sms/ports.js'
import { CODES_SORTIE } from './commun.js'
import { lireTelephoneGarage } from './telephone-garage.js'
import { executerTestSms, USAGE_SMS } from './tester-sms.js'

const OVH = {
  SMS_OVH_CLE_APPLICATION: 'cle-app',
  SMS_OVH_SECRET_APPLICATION: 'secret-a-ne-pas-afficher',
  SMS_OVH_CLE_CONSOMMATEUR: 'cle-conso',
  SMS_OVH_SERVICE: 'sms-ab12345-1',
}

function envoiRetenu(credits: number | null = 97): EnvoiSms & { readonly envoyes: SmsSortant[] } {
  const envoyes: SmsSortant[] = []
  return {
    fournisseur: 'ovh',
    envoyes,
    envoyer: async (sms) => {
      envoyes.push(sms)
      return { identifiant: '27814656', segments: 1 }
    },
    verifier: async () => ({ creditsRestants: credits }),
  }
}

function lancer(
  argumentsRecus: string[],
  env: Record<string, string>,
  sms: EnvoiSms | null = envoiRetenu(),
) {
  const sortie: string[] = []
  const erreurs: string[] = []
  const code = executerTestSms(argumentsRecus, {
    env,
    telephoneGarage: '06 05 92 28 38',
    sorties: {
      ecrire: (texte) => sortie.push(texte),
      ecrireErreur: (texte) => erreurs.push(texte),
    },
    fabriquer: () => ({ expediteur: null, boite: null, sms }),
  })
  return { code, sortie: () => sortie.join(''), erreurs }
}

describe('pnpm sms:tester (US-C11, AT-C4)', () => {
  it('vérifie le compte, affiche les crédits et ne montre aucune clé', async () => {
    const { code, sortie } = lancer([], OVH)
    expect(await code).toBe(CODES_SORTIE.succes)
    expect(sortie()).toContain('SMS : OVHcloud, compte sms-ab12345-1, clés : défini')
    expect(sortie()).toContain('Destinataire : +33605922838')
    expect(sortie()).toContain('Crédits restants : 97')
    expect(sortie()).not.toContain('secret-a-ne-pas-afficher')
  })

  it('crédits inconnus : dit qu’ils sont inconnus, jamais 0', async () => {
    const { code, sortie } = lancer([], OVH, envoiRetenu(null))
    expect(await code).toBe(CODES_SORTIE.succes)
    expect(sortie()).toContain('Crédits restants : inconnus')
  })

  it('--envoyer : SMS d’essai au destinataire configuré, ou au numéro donné', async () => {
    const envoi = envoiRetenu()
    expect(await lancer(['--envoyer'], OVH, envoi).code).toBe(CODES_SORTIE.succes)
    expect(await lancer(['--envoyer', '07 12 34 56 78'], OVH, envoi).code).toBe(CODES_SORTIE.succes)
    expect(envoi.envoyes.map((sms) => sms.destinataire)).toEqual(['+33605922838', '+33712345678'])
    expect(envoi.envoyes[0]?.texte).toContain('SMS d’essai')
  })

  it('un compte refusé donne le code 1, la cause et le remède', async () => {
    const refuse: EnvoiSms = {
      ...envoiRetenu(),
      verifier: async () => {
        throw new ErreurConnecteur('SMS OVHcloud', 'identifiants', 'HTTP 403', 'Vérifiez les clés')
      },
    }
    const { code, sortie } = lancer([], OVH, refuse)
    expect(await code).toBe(CODES_SORTIE.echec)
    expect(sortie()).toContain('Compte SMS : ÉCHEC')
    expect(sortie()).toContain('Que faire : Vérifiez les clés')
  })

  it('SMS désactivé : rien à vérifier (code 0), mais un envoi demandé est une erreur d’usage', async () => {
    const desactive = lancer([], {})
    expect(await desactive.code).toBe(CODES_SORTIE.succes)
    expect(desactive.sortie()).toContain('SMS : désactivé')
    expect(await lancer(['--envoyer'], {}).code).toBe(CODES_SORTIE.usage)
  })

  it('numéro fixe, configuration fausse ou arguments inconnus : code 2', async () => {
    expect(await lancer(['--envoyer', '01 45 00 00 00'], OVH).code).toBe(CODES_SORTIE.usage)
    const faux = lancer([], { SMS_OVH_CLE_APPLICATION: 'cle' })
    expect(await faux.code).toBe(CODES_SORTIE.usage)
    expect(faux.sortie()).toContain('Configuration SMS invalide')
    const inconnu = lancer(['--tout'], OVH)
    expect(await inconnu.code).toBe(CODES_SORTIE.usage)
    expect(inconnu.erreurs).toEqual([USAGE_SMS])
  })
})

describe('téléphone du garage, source unique', () => {
  it('lit le téléphone validé de donnees/garage.json', async () => {
    expect(await lireTelephoneGarage({}, process.cwd())).toBe('06 05 92 28 38')
  })

  it('rend null si le fichier manque ou si le numéro n’est pas validé', async () => {
    const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-telephone-'))
    try {
      expect(await lireTelephoneGarage({ CHEMIN_DONNEES: dossier }, process.cwd())).toBeNull()
      await writeFile(
        join(dossier, 'garage.json'),
        JSON.stringify({
          identite: { telephone: { statut: 'a_valider', valeur: '06 00 00 00 00' } },
        }),
      )
      expect(await lireTelephoneGarage({ CHEMIN_DONNEES: dossier }, process.cwd())).toBeNull()
    } finally {
      await rm(dossier, { recursive: true, force: true })
    }
  })
})
