import { beforeEach, describe, expect, it } from 'vitest'
import { creerBancAcces, jetonDuLien, type BancAcces } from '../adaptateurs/essai/banc.js'
import { creerMessagerieRetenue, type MessagerieRetenue } from '../adaptateurs/essai/doublures.js'
import { creerRegistreDemandesMemoire } from '../adaptateurs/memoire/registre-demandes-memoire.js'
import {
  creerDemanderLienConnexion,
  type DependancesDemanderLien,
} from './demander-lien-connexion.js'
import type { Alerteur } from './ports.js'

const MINUTE = 60_000
const ADRESSE_GARAGISTE = 'garagiste@exemple.fr'
const URL_PUBLIQUE = 'https://garage.exemple'

let banc: BancAcces
let messagerie: MessagerieRetenue
let alertes: string[]

beforeEach(() => {
  banc = creerBancAcces()
  messagerie = creerMessagerieRetenue()
  alertes = []
})

function demanderLien(surcharges: Partial<DependancesDemanderLien> = {}) {
  const alerteur: Alerteur = {
    alerter: async (objet) => {
      alertes.push(objet)
    },
  }
  return creerDemanderLienConnexion({
    ...banc,
    registre: creerRegistreDemandesMemoire(),
    canalGaragiste: { messagerie, destinataire: ADRESSE_GARAGISTE, remise: 'courriel' },
    alerteur,
    adresseDuLien: (jeton) => `${URL_PUBLIQUE}/garagiste/connexion/lien?jeton=${jeton}`,
    ...surcharges,
  })
}

describe('demander un lien de connexion (US-33)', () => {
  it('envoie le lien au seul canal configuré, et ne garde en base que son empreinte', async () => {
    const resultat = await demanderLien()({ adresseClient: '203.0.113.7', retour: undefined })
    expect(resultat).toEqual({ issue: 'envoye', remise: 'courriel', lienVisible: null })
    expect(messagerie.envoyes).toHaveLength(1)
    const [message] = messagerie.envoyes
    expect(message?.destinataire).toBe(ADRESSE_GARAGISTE)
    const jeton = jetonDuLien(message?.texte ?? '')
    expect(banc.depot.trouverLien(jeton)).toBeNull()
    expect(banc.depot.trouverLien(banc.hachage.empreinte(jeton))?.retour).toBe('/garagiste')
  })

  it('n’accepte comme retour qu’un chemin de l’espace, quel que soit le contenu de la requête', async () => {
    const demander = demanderLien()
    await demander({ adresseClient: '203.0.113.7', retour: 'https://pirate.exemple/garagiste' })
    await demander({ adresseClient: '203.0.113.7', retour: '/garagiste/demandes' })
    const [premier, second] = messagerie.envoyes.map((message) =>
      banc.depot.trouverLien(banc.hachage.empreinte(jetonDuLien(message.texte))),
    )
    expect(premier?.retour).toBe('/garagiste')
    expect(second?.retour).toBe('/garagiste/demandes')
  })

  it('refuse la sixième demande de la même adresse dans l’heure, avec le délai d’attente', async () => {
    const demander = demanderLien()
    for (let rang = 0; rang < 5; rang += 1) {
      expect((await demander({ adresseClient: '203.0.113.7', retour: undefined })).issue).toBe(
        'envoye',
      )
      banc.horloge.avancer(MINUTE)
    }
    const refus = await demander({ adresseClient: '203.0.113.7', retour: undefined })
    expect(refus).toEqual({ issue: 'trop-de-demandes', attenteMs: 55 * MINUTE })
    expect(messagerie.envoyes).toHaveLength(5)
    // Une autre adresse n'en pâtit pas, et l'attente écoulée rouvre la porte.
    expect((await demander({ adresseClient: '198.51.100.2', retour: undefined })).issue).toBe(
      'envoye',
    )
    banc.horloge.avancer(55 * MINUTE)
    expect((await demander({ adresseClient: '203.0.113.7', retour: undefined })).issue).toBe(
      'envoye',
    )
  })

  it('alerte Anthony à la vingt et unième demande de l’heure, une seule fois, sans verrouiller le compte', async () => {
    const demander = demanderLien()
    for (let rang = 0; rang < 20; rang += 1) {
      await demander({ adresseClient: `203.0.113.${rang % 4}`, retour: undefined })
    }
    expect(alertes).toEqual([])
    const vingtEtUnieme = await demander({ adresseClient: '198.51.100.9', retour: undefined })
    expect(alertes).toEqual(['Alerte : demandes de lien de connexion inhabituelles'])
    expect(vingtEtUnieme.issue).toBe('envoye')
    await demander({ adresseClient: '198.51.100.10', retour: undefined })
    expect(alertes).toHaveLength(1)
  })

  it('dit que le canal manque, sans rien créer, tant que l’adresse du garagiste n’est pas configurée', async () => {
    const resultat = await demanderLien({ canalGaragiste: null })({
      adresseClient: '203.0.113.7',
      retour: undefined,
    })
    expect(resultat).toEqual({ issue: 'canal-absent' })
    expect(banc.depot.trouverLien(banc.hachage.empreinte(banc.generateur.generer()))).toBeNull()
  })

  it('dit l’échec quand le serveur d’envoi ne répond pas', async () => {
    messagerie.tomberEnPanne()
    const resultat = await demanderLien()({ adresseClient: '203.0.113.7', retour: undefined })
    expect(resultat.issue).toBe('echec-envoi')
  })

  it('ne rend le lien à la page qu’en démonstration', async () => {
    const resultat = await demanderLien({
      canalGaragiste: { messagerie, destinataire: ADRESSE_GARAGISTE, remise: 'demonstration' },
    })({ adresseClient: '203.0.113.7', retour: undefined })
    expect(resultat).toEqual({
      issue: 'envoye',
      remise: 'demonstration',
      lienVisible: `${URL_PUBLIQUE}/garagiste/connexion/lien?jeton=${jetonDuLien(messagerie.envoyes[0]?.texte ?? '')}`,
    })
  })

  it('écrit au journal sans serveur d’envoi : le lien ne revient pas à la page, et le résultat le dit', async () => {
    const resultat = await demanderLien({
      canalGaragiste: { messagerie, destinataire: ADRESSE_GARAGISTE, remise: 'journal' },
    })({ adresseClient: '203.0.113.7', retour: undefined })
    expect(resultat).toEqual({ issue: 'envoye', remise: 'journal', lienVisible: null })
  })
})
