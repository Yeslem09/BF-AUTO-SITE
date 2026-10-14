import { describe, expect, it } from 'vitest'
import {
  brancheBrute,
  creerArbreEssai,
  lireArbreDuSite,
  questionBrute,
  resultatBrut,
  type ArbreBrut,
} from '../essais/arbre-essai.js'
import type { RegleArbre } from './anomalie.js'
import { examinerArbre } from './porte-arbre.js'

/** Règles qui refusent l'arbre ; liste vide s'il passe. */
function reglesEnDefaut(brut: unknown): readonly RegleArbre[] {
  const examen = examinerArbre(brut)
  return examen.accepte ? [] : examen.anomalies.map((anomalie) => anomalie.regle)
}

function messages(brut: unknown): string {
  const examen = examinerArbre(brut)
  return examen.accepte ? '' : examen.anomalies.map((anomalie) => anomalie.message).join('\n')
}

/** Injecte un défaut dans une copie neuve de l'arbre d'essai et rend les règles qui refusent. */
function injecter(defaut: (arbre: ArbreBrut) => void): readonly RegleArbre[] {
  const arbre = creerArbreEssai()
  defaut(arbre)
  return reglesEnDefaut(arbre)
}

describe('porte de l’arbre : arbres conformes', () => {
  it('accepte l’arbre versionné du site, sans aucune anomalie', () => {
    expect(messages(lireArbreDuSite())).toBe('')
    expect(examinerArbre(lireArbreDuSite()).accepte).toBe(true)
  })

  it('accepte l’arbre d’essai tel quel : chaque injection part d’un arbre vert', () => {
    expect(messages(creerArbreEssai())).toBe('')
  })

  it('l’arbre du site propose les 7 entrées de la première question, dans l’ordre du Kano', () => {
    const examen = examinerArbre(lireArbreDuSite())
    if (!examen.accepte) throw new Error('arbre refusé')
    expect(examen.arbre.branches.map((branche) => branche.libelle)).toEqual([
      'Un voyant s’allume',
      'Un bruit inhabituel',
      'Ça vibre ou la voiture tire d’un côté',
      'Une odeur, une fumée ou une fuite',
      'Elle démarre mal ou pas du tout',
      'Le freinage a changé',
      'Autre chose ou je ne sais pas',
    ])
  })

  it('l’arbre du site reste à relire : relu_par et relu_le vides, statut a_valider', () => {
    const brut = lireArbreDuSite()
    expect(brut.relu_par).toBe('')
    expect(brut.relu_le).toBe('')
    expect(brut.statut).toBe('a_valider')
  })
})

describe('porte de l’arbre : cinq questions au plus sur chaque chemin', () => {
  const allonger = (arbre: ArbreBrut, niveaux: number): void => {
    // Chemin bruit : Q1, Q2, bruit-moment, frein-bruit (4 questions) puis `niveaux` de plus.
    let precedente = questionBrute(arbre, 'frein-bruit')
    for (let rang = 1; rang <= niveaux; rang += 1) {
      const code = `question-ajoutee-${rang}`
      const sifflement = precedente.choix.find((choix) => choix.code === 'sifflement')
      if (sifflement === undefined) throw new Error('choix absent')
      delete sifflement.resultat
      sifflement.question = code
      const suivante = {
        code,
        intitule: 'Une question de plus ?',
        choix: [
          { code: 'sifflement', libelle: 'Oui', resultat: 'frein-sifflement' },
          { code: 'ne-sais-pas', libelle: 'Je ne sais pas', resultat: 'frein-sifflement' },
        ],
      }
      arbre.questions.push(suivante)
      precedente = suivante
    }
  }

  it('accepte un chemin de exactement 5 questions', () => {
    expect(injecter((arbre) => allonger(arbre, 1))).toEqual([])
  })

  it('refuse une sixième question ajoutée à une branche (vue rouge)', () => {
    expect(injecter((arbre) => allonger(arbre, 2))).toContain('questions-par-chemin')
  })

  it('refuse une boucle, qui ferait un chemin sans fin', () => {
    const regles = injecter((arbre) => {
      const choix = questionBrute(arbre, 'frein-bruit').choix[0]
      if (choix === undefined) throw new Error('choix absent')
      delete choix.resultat
      choix.question = 'bruit-moment'
    })
    expect(regles).toContain('questions-par-chemin')
  })
})

describe('porte de l’arbre : sept choix au plus par question', () => {
  it('refuse un huitième choix sur une question de branche', () => {
    const regles = injecter((arbre) => {
      const question = questionBrute(arbre, 'vibrations-ressenti')
      for (let rang = 1; rang <= 6; rang += 1) {
        question.choix.unshift({
          code: `choix-${rang}`,
          libelle: `Choix ${rang}`,
          resultat: 'vibrations-a-situer',
        })
      }
    })
    expect(regles).toContain('choix-par-question')
  })

  it('refuse une question des signes à 8 choix (6 signes, plus « Aucun » et « Je ne sais pas »)', () => {
    const regles = injecter((arbre) => {
      arbre.signes.push(
        { code: 'signe-5', libelle: 'Un cinquième signe', niveau: 'ne-pas-rouler' },
        { code: 'signe-6', libelle: 'Un sixième signe', niveau: 'ne-pas-rouler' },
      )
      brancheBrute(arbre, 'bruit').signes.push('signe-5', 'signe-6')
    })
    expect(regles).toContain('choix-par-question')
  })

  it('refuse une première question à 8 choix', () => {
    const regles = injecter((arbre) => {
      for (let rang = 1; rang <= 3; rang += 1) {
        arbre.branches.push({
          ...brancheBrute(arbre, 'voyant'),
          code: `branche-${rang}`,
          libelle: `Branche ${rang}`,
        })
      }
    })
    expect(regles).toContain('choix-par-question')
  })
})

describe('porte de l’arbre : « Je ne sais pas » sur chaque question', () => {
  it('refuse une question dont on a retiré « Je ne sais pas » (vue rouge)', () => {
    const regles = injecter((arbre) => {
      const question = questionBrute(arbre, 'bruit-moment')
      question.choix = question.choix.filter((choix) => choix.code !== 'ne-sais-pas')
    })
    expect(regles).toEqual(['ne-sais-pas-absent'])
  })

  it('refuse un choix « ne-sais-pas » dont le libellé ne le dit pas', () => {
    const regles = injecter((arbre) => {
      const choix = questionBrute(arbre, 'voyant-type').choix.find(
        (candidat) => candidat.code === 'ne-sais-pas',
      )
      if (choix === undefined) throw new Error('choix absent')
      choix.libelle = 'Autre symbole'
    })
    expect(regles).toContain('ne-sais-pas-absent')
  })

  it('refuse une première question sans « Autre chose ou je ne sais pas »', () => {
    const regles = injecter((arbre) => {
      arbre.branches = arbre.branches.filter((branche) => branche.code !== 'ne-sais-pas')
      arbre.questions = arbre.questions.filter((question) => question.code !== 'autre-situation')
      arbre.resultats = arbre.resultats.filter(
        (resultat) => !['autre-inquietude', 'autre-a-voir'].includes(resultat.code),
      )
    })
    expect(regles).toEqual(['ne-sais-pas-absent'])
  })
})

describe('porte de l’arbre : signes de danger', () => {
  it('refuse un signe de danger qui ne mène pas à « ne-pas-rouler » (vue rouge)', () => {
    const regles = injecter((arbre) => {
      const signe = arbre.signes.find((candidat) => candidat.code === 'direction')
      if (signe === undefined) throw new Error('signe absent')
      signe.niveau = 'a-controler'
    })
    expect(regles).toEqual(['signe-sans-arret'])
  })

  it('refuse une branche dont la question des signes ne demande plus la pédale de frein', () => {
    const regles = injecter((arbre) => {
      const branche = brancheBrute(arbre, 'bruit')
      branche.signes = branche.signes.filter((signe) => signe !== 'pedale-molle')
    })
    expect(regles).toEqual(['signe-obligatoire-absent'])
  })

  it('refuse une branche sans le voyant rouge ou sans la fumée', () => {
    for (const retire of ['voyant-rouge', 'fumee-brule']) {
      const regles = injecter((arbre) => {
        const branche = brancheBrute(arbre, 'voyant')
        branche.signes = branche.signes.filter((signe) => signe !== retire)
      })
      expect(regles).toEqual(['signe-obligatoire-absent'])
    }
  })

  it('refuse un signe du voyant rouge qui ne cite plus aucun exemple', () => {
    const regles = injecter((arbre) => {
      const signe = arbre.signes.find((candidat) => candidat.code === 'voyant-rouge')
      if (signe === undefined) throw new Error('signe absent')
      signe.libelle = 'Un voyant rouge reste allumé'
    })
    expect(regles).toEqual(['signe-sans-exemple'])
  })
})

describe('porte de l’arbre : planchers par branche', () => {
  for (const branche of ['bruit', 'freinage', 'vibrations']) {
    it(`refuse un résultat « Pas d’urgence » ajouté à la branche ${branche}`, () => {
      const regles = injecter((arbre) => {
        const depart = questionBrute(arbre, brancheBrute(arbre, branche).depart)
        depart.choix.unshift({ code: 'rassurant', libelle: 'Rien de grave', resultat: 'rassurant' })
        arbre.resultats.push({
          code: 'rassurant',
          niveau: 'sans-urgence',
          pistes: [{ texte: 'Rien de grave.', verification: 'rien.' }],
        })
      })
      expect(regles).toEqual(['plancher-non-tenu'])
    })

    it(`refuse la branche ${branche} avec un plancher « Pas d’urgence »`, () => {
      const regles = injecter((arbre) => {
        brancheBrute(arbre, branche).plancher = 'sans-urgence'
      })
      expect(regles).toContain('plancher-obligatoire')
    })
  }

  it('refuse un arbre sans branche Freinage', () => {
    const regles = injecter((arbre) => {
      arbre.branches = arbre.branches.filter((branche) => branche.code !== 'freinage')
      arbre.questions = arbre.questions.filter((q) => q.code !== 'freinage-changement')
      arbre.resultats = arbre.resultats.filter((r) => r.code !== 'freinage-a-situer')
    })
    expect(regles).toEqual(['plancher-obligatoire'])
  })
})

describe('porte de l’arbre : mots et gestes interdits', () => {
  const avecPiste = (texte: string) =>
    injecter((arbre) => {
      const piste = resultatBrut(arbre, 'bruit-roulement').pistes[0]
      if (piste === undefined) throw new Error('piste absente')
      piste.texte = texte
    })

  it.each([
    ['Sûrement un roulement.'],
    ['Un roulement, c’est certain.'],
    ['Certainement un roulement.'],
    ['Forcément un roulement.'],
    ['Un roulement garanti.'],
    ['Un roulement, à notre avis.'],
    ['Un roulement dans 80 % des cas.'],
    ['Un roulement à 120 € environ.'],
    ['Un roulement pour quelques euros.'],
  ])('refuse « %s »', (texte) => {
    expect(avecPiste(texte)).toEqual(['mot-interdit'])
  })

  it('cherche par mots entiers : « certaines » et « garantie » ne sont pas signalés', () => {
    expect(avecPiste('Certaines pièces sous garantie.')).toEqual([])
  })

  it('cherche aussi dans les libellés de questions et de choix', () => {
    const regles = injecter((arbre) => {
      questionBrute(arbre, 'bruit-moment').intitule = 'Votre avis sur ce bruit ?'
    })
    expect(regles).toEqual(['mot-interdit'])
  })

  it('refuse un conseil de suppression d’un dispositif antipollution', () => {
    expect(avecPiste('Supprimer le filtre à particules.')).toEqual(['geste-interdit'])
  })

  it('refuse un geste de bricolage sur les freins', () => {
    expect(avecPiste('Démonter l’étrier pour voir.')).toEqual(['geste-interdit'])
  })
})

describe('porte de l’arbre : chaque résultat porte niveau, mention, actions et pistes', () => {
  it('refuse un résultat sans niveau (vue rouge)', () => {
    const regles = injecter((arbre) => {
      delete resultatBrut(arbre, 'bruit-roulement').niveau
    })
    expect(regles).toEqual(['structure'])
    const arbre = creerArbreEssai()
    delete resultatBrut(arbre, 'bruit-roulement').niveau
    expect(messages(arbre)).toContain('niveau')
  })

  it('refuse un arbre sans mention, que chaque résultat doit porter', () => {
    const regles = injecter((arbre) => {
      delete arbre.mention
    })
    expect(regles).toEqual(['structure'])
  })

  it('refuse un arbre sans action', () => {
    expect(
      injecter((arbre) => {
        arbre.actions = []
      }),
    ).toEqual(['structure'])
  })

  it('refuse des actions sans « Être rappelé » ou sans « Appeler »', () => {
    expect(
      injecter((arbre) => {
        arbre.actions = ['appeler', 'imprimer']
      }),
    ).toEqual(['actions-incompletes'])
    expect(
      injecter((arbre) => {
        arbre.actions = ['rappel']
      }),
    ).toEqual(['actions-incompletes'])
  })

  it('refuse un résultat sans piste ou avec quatre pistes', () => {
    expect(
      injecter((arbre) => {
        resultatBrut(arbre, 'bruit-roulement').pistes = []
      }),
    ).toEqual(['pistes-par-resultat'])
    expect(
      injecter((arbre) => {
        const piste = { texte: 'Une piste.', verification: 'une vérification.' }
        resultatBrut(arbre, 'bruit-roulement').pistes = [piste, piste, piste, piste]
      }),
    ).toEqual(['pistes-par-resultat'])
  })

  it('refuse une piste en deux phrases ou sans point final', () => {
    const regles = (texte: string) =>
      injecter((arbre) => {
        const piste = resultatBrut(arbre, 'bruit-roulement').pistes[0]
        if (piste === undefined) throw new Error('piste absente')
        piste.verification = texte
      })
    expect(regles('le jeu de la roue. Puis le pneu.')).toEqual(['piste-une-phrase'])
    expect(regles('le jeu de la roue')).toEqual(['piste-une-phrase'])
  })
})

describe('porte de l’arbre : cohérence', () => {
  it('refuse une question ou un résultat qu’aucune branche n’atteint', () => {
    expect(
      injecter((arbre) => {
        arbre.resultats.push({
          code: 'oublie',
          niveau: 'a-controler',
          pistes: [{ texte: 'Oublié.', verification: 'rien.' }],
        })
      }),
    ).toEqual(['orphelin'])
  })

  it('refuse une référence inconnue, un code en double ou un code réservé', () => {
    expect(
      injecter((arbre) => {
        brancheBrute(arbre, 'voyant').depart = 'inexistante'
      }),
    ).toContain('structure')
    expect(
      injecter((arbre) => {
        arbre.resultats.push({ ...resultatBrut(arbre, 'bruit-roulement') })
      }),
    ).toContain('structure')
    expect(
      injecter((arbre) => {
        questionBrute(arbre, 'voyant-type').code = 'signes'
        brancheBrute(arbre, 'voyant').depart = 'signes'
      }),
    ).toContain('structure')
  })

  it('lit la famille facultative d’une piste et refuse une famille qui n’est pas un code', () => {
    const arbre = creerArbreEssai()
    const pistes = resultatBrut(arbre, 'frein-sifflement').pistes
    expect(pistes.map((piste) => piste.famille)).toEqual(['freinage', 'freinage'])
    expect(messages(arbre)).toBe('')
    const [premiere] = pistes
    if (premiere === undefined) throw new Error('piste absente')
    premiere.famille = 'Freinage et disques'
    expect(messages(arbre)).toContain(
      'resultats[4].pistes[0].famille : code attendu : minuscules, chiffres et tirets',
    )
  })

  it('rassemble toutes les anomalies de structure d’un coup, avec leur chemin', () => {
    const arbre = creerArbreEssai() as unknown as Record<string, unknown>
    arbre['version'] = ''
    arbre['champ_inconnu'] = true
    delete arbre['question_signes']
    const texte = messages(arbre)
    expect(texte).toContain('version : texte non vide attendu')
    expect(texte).toContain('champ_inconnu : champ inconnu')
    expect(texte).toContain('question_signes : champ manquant')
  })

  it('exige une relecture complète et datée, et un statut qui la suit', () => {
    const reluSansDate = { ...creerArbreEssai(), relu_par: 'Garagiste', statut: 'valide' }
    expect(reglesEnDefaut(reluSansDate)).toEqual(['structure'])
    const dateImpossible = {
      ...creerArbreEssai(),
      relu_par: 'Garagiste',
      relu_le: '2026-02-30',
      statut: 'valide',
    }
    expect(messages(dateImpossible)).toContain('relu_le')
    const statutIncoherent = { ...creerArbreEssai(), statut: 'valide' }
    expect(messages(statutIncoherent)).toContain('a_valider')
    const relu = { ...creerArbreEssai(), relu_par: 'Garagiste', relu_le: '2026-10-01' }
    expect(messages(relu)).toContain('valide')
  })

  it('refuse une branche non validée qui n’existe pas', () => {
    expect(
      injecter((arbre) => {
        arbre.branches_non_validees = ['inexistante']
      }),
    ).toEqual(['structure'])
  })

  it('refuse un fichier qui n’est pas un objet', () => {
    expect(reglesEnDefaut([])).toEqual(['structure'])
    expect(reglesEnDefaut(null)).toEqual(['structure'])
  })
})
