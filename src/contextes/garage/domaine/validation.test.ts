import { beforeEach, describe, expect, it } from 'vitest'
import {
  aValider,
  donneesDuSite,
  donneesEssai,
  remplacer,
  valide,
  type Donnees,
} from '../essais/donnees-essai.js'
import { ErreurDonneesGarage } from './erreurs.js'
import { validerDonneesGarage } from './validation.js'

/** Renvoie la liste des problèmes levés, ou échoue si la validation passe. */
function problemes(brut: unknown): readonly string[] {
  try {
    validerDonneesGarage(brut)
  } catch (erreur) {
    if (erreur instanceof ErreurDonneesGarage) return erreur.problemes
    throw erreur
  }
  throw new Error('la validation aurait dû échouer')
}

let essai: Donnees = {}
beforeEach(async () => {
  essai = await donneesEssai()
})

describe('validation du fichier du garage : cas nominaux', () => {
  it('lit le vrai fichier du site : identité validée, horaires proposés, prénom inconnu', async () => {
    const garage = validerDonneesGarage(await donneesDuSite())
    expect(garage.identite.nom).toMatchObject({ statut: 'valide', valeur: 'BF Auto' })
    expect(garage.identite.telephone.valeur).toEqual({
      affichable: '06 05 92 28 38',
      lien: 'tel:+33605922838',
    })
    expect(garage.horaires.statut).toBe('a_valider')
    expect(garage.horaires.source).toBe('proposition')
    expect(garage.horaires.valeur?.lundi).toEqual([
      { ouverture: 510, fermeture: 720 },
      { ouverture: 840, fermeture: 1140 },
    ])
    expect(garage.horaires.valeur?.dimanche).toEqual([])
    expect(garage.socle.prenomGaragiste).toMatchObject({ statut: 'a_valider', valeur: null })
    expect(garage.mediateur.valeur).toBeNull()
  })

  it('le vrai fichier ferme le garage à 19 h tous les jours ouvrés proposés (fermeture constatée)', async () => {
    const semaine = validerDonneesGarage(await donneesDuSite()).horaires.valeur
    const fermetures = Object.values(semaine ?? {}).flatMap((plages) =>
      plages.length === 0 ? [] : [plages.at(-1)?.fermeture],
    )
    expect(new Set(fermetures.slice(0, 5))).toEqual(new Set([1140]))
  })

  it('lit la configuration d’essai, entièrement validée, et normalise ses valeurs', () => {
    const garage = validerDonneesGarage(essai)
    expect(garage.editeur.siret.valeur).toBe('12345678200002')
    expect(garage.socle.accueilSansRendezVous.valeur).toBe(true)
    expect(garage.suivi.lienAvisGoogle.valeur).toBe('https://avis.example/bf-auto-essai')
  })

  it('refuse une racine qui n’est pas un objet', () => {
    expect(problemes([])).toEqual(['la racine doit être un objet JSON'])
  })
})

describe('validation : règles du statut de chaque valeur', () => {
  it('une valeur validée a une source', () => {
    remplacer(essai, 'identite.courriel', { statut: 'valide', valeur: 'a@b.fr' })
    expect(problemes(essai)).toEqual([
      'identite.courriel.source : obligatoire pour une valeur validée',
    ])
  })

  it('une valeur validée a une valeur', () => {
    remplacer(essai, 'mediateur', { statut: 'valide', valeur: null, source: 'essai' })
    expect(problemes(essai)).toEqual([
      'mediateur : valeur validée absente : passer le statut à « a_valider » avec une note',
    ])
  })

  it('une valeur à valider dit ce qu’il reste à obtenir', () => {
    remplacer(essai, 'socle_de_confiance.prenom_garagiste', { statut: 'a_valider', valeur: null })
    expect(problemes(essai)).toEqual([
      'socle_de_confiance.prenom_garagiste.note : obligatoire : dire ce qu’il reste à obtenir',
    ])
  })

  it('une proposition dit sa source', () => {
    remplacer(essai, 'horaires.source', undefined)
    remplacer(essai, 'horaires.statut', 'a_valider')
    remplacer(essai, 'horaires.note', 'à confirmer')
    delete (essai['horaires'] as Donnees)['source']
    expect(problemes(essai)).toEqual([
      'horaires.source : obligatoire pour une proposition (« proposition » pour la démonstration)',
    ])
  })

  it('refuse un statut inconnu et un champ inconnu dans une valeur', () => {
    remplacer(essai, 'identite.accroche', {
      statut: 'ok',
      valeur: 'x',
      source: 'essai',
      commentaire: '',
    })
    const liste = problemes(essai)
    expect(liste).toContain('identite.accroche.statut : « valide » ou « a_valider » attendu')
    expect(liste).toContain('identite.accroche.commentaire : champ inconnu')
  })

  it('le nom, l’adresse et le téléphone sont indispensables, même à valider', () => {
    remplacer(essai, 'identite.telephone', aValider('numéro à obtenir'))
    expect(problemes(essai)).toEqual([
      'identite.telephone.valeur : indispensable au rendu du site : la renseigner',
    ])
  })

  it('signale un groupe manquant et une clé mal orthographiée', () => {
    delete essai['mediateur']
    remplacer(essai, 'pratique.stationement', valide('x'))
    const liste = problemes(essai)
    expect(liste).toContain('mediateur : champ manquant')
    expect(liste).toContain('pratique.stationement : champ inconnu')
  })
})

describe('validation : formes des valeurs', () => {
  it.each([
    ['identite.telephone', valide('06 05 92 28'), /n’est pas un numéro français/],
    ['identite.courriel', valide('garage@'), /n’est pas une adresse de courriel/],
    ['editeur.siret', valide('12345678200003'), /n’est pas un SIRET valide/],
    ['suivi_client.lien_avis_google', valide('http://avis.example'), /n’est pas une adresse https/],
    ['suivi_client.delai_rappel', valide('dans-l-heure'), /inconnu \(prochaine-demi-journee\)/],
    ['socle_de_confiance.accueil_sans_rendez_vous', valide('oui'), /true ou false attendu/],
    ['pratique.moyens_paiement', valide(['carte', 'bitcoin']), /« bitcoin » inconnu/],
    ['pratique.moyens_paiement', valide(['carte', 'carte']), /moyen de paiement en double/],
    ['pratique.reperes', valide([]), /liste de 1 à 8 textes attendue/],
    ['marque.nom_de_domaine', valide('https://bfauto-choisy.fr'), /n’est pas un nom de domaine/],
    ['marque.nom_de_domaine', valide('BFAuto-Choisy.fr'), /n’est pas un nom de domaine/],
  ])('refuse %s = %j', (chemin, valeur, message) => {
    remplacer(essai, chemin, valeur)
    expect(problemes(essai)).toEqual([expect.stringMatching(message)])
  })

  it('refuse les prix du socle : ils vivent dans le catalogue, seule source des prix (AE-05)', () => {
    remplacer(
      essai,
      'socle_de_confiance.taux_horaire',
      valide({ montant_ttc: 60, date_effet: '2026-01-01' }),
    )
    expect(problemes(essai)).toEqual([expect.stringMatching(/taux_horaire/)])
  })

  it('refuse une photo hors du dossier des images du garage', () => {
    remplacer(
      essai,
      'socle_de_confiance.photo_facade',
      valide({
        chemin: 'https://banque.example/garage.jpg',
        texte_alternatif: 'x',
        largeur: 10,
        hauteur: 10,
      }),
    )
    expect(problemes(essai)).toEqual([expect.stringMatching(/chemin d’image sous \/img\/garage\//)])
  })

  it('refuse un prestataire d’envoi au rôle inconnu', () => {
    remplacer(
      essai,
      'hebergement.prestataires_envoi',
      valide([{ role: 'pigeon', nom: 'x', lieu_traitement: 'y' }]),
    )
    expect(problemes(essai)).toEqual([
      expect.stringMatching(/« pigeon » inconnu \(courriel, sms\)/),
    ])
  })

  it('refuse un code postal écrit en nombre (le zéro initial se perdrait)', () => {
    remplacer(
      essai,
      'identite.adresse',
      valide({ voie: '7 rue Demanieux', code_postal: 94600, ville: 'Choisy-le-Roi' }),
    )
    expect(problemes(essai)).toEqual([
      expect.stringMatching(/^identite\.adresse\.valeur\.code_postal : /),
    ])
  })
})

describe('validation : semaine type', () => {
  const avecLundi = (plages: unknown) => {
    const semaine = (essai['horaires'] as Donnees)['valeur'] as Donnees
    semaine['lundi'] = plages
    return essai
  }

  it('refuse une ouverture après la fermeture', () => {
    expect(problemes(avecLundi([{ ouverture: '19:00', fermeture: '09:00' }]))).toEqual([
      'horaires.valeur.lundi[0] : l’ouverture (19:00) doit précéder la fermeture (09:00)',
    ])
  })

  it.each(['9h00', '9:00', '24:00', '12:60', ''])('refuse l’heure mal écrite %j', (heure) => {
    expect(problemes(avecLundi([{ ouverture: heure, fermeture: '19:00' }]))).toEqual([
      expect.stringMatching(/^horaires\.valeur\.lundi\[0\]\.ouverture : .* format HH:MM/),
    ])
  })

  it('refuse des plages qui se chevauchent, se touchent ou sont dans le désordre', () => {
    for (const plages of [
      [
        { ouverture: '09:00', fermeture: '13:00' },
        { ouverture: '12:00', fermeture: '19:00' },
      ],
      [
        { ouverture: '09:00', fermeture: '12:00' },
        { ouverture: '12:00', fermeture: '19:00' },
      ],
      [
        { ouverture: '14:00', fermeture: '19:00' },
        { ouverture: '09:00', fermeture: '12:00' },
      ],
    ]) {
      expect(problemes(avecLundi(plages))).toEqual([
        expect.stringMatching(/^horaires\.valeur\.lundi : les plages 1 et 2/),
      ])
    }
  })

  it('refuse une semaine sans aucune plage d’ouverture', () => {
    const vide = {
      lundi: [],
      mardi: [],
      mercredi: [],
      jeudi: [],
      vendredi: [],
      samedi: [],
      dimanche: [],
    }
    remplacer(essai, 'horaires', valide(vide))
    expect(problemes(essai)).toEqual([
      'horaires.valeur : aucune plage d’ouverture : renseigner au moins un jour',
    ])
  })

  it('refuse un jour manquant et un jour mal orthographié', () => {
    const semaine = (essai['horaires'] as Donnees)['valeur'] as Donnees
    semaine['mecredi'] = semaine['mercredi']
    delete semaine['mercredi']
    const liste = problemes(essai)
    expect(liste).toContain('horaires.valeur.mercredi : champ manquant')
    expect(liste).toContain('horaires.valeur.mecredi : champ inconnu')
  })
})
