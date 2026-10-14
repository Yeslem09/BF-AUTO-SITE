import { describe, expect, it } from 'vitest'
import { arbreAccepte, lireArbreDuSite } from '../essais/arbre-essai.js'
import { creerRetrouverResume } from './retrouver-resume.js'

describe('retrouver le résumé d’un pré-diagnostic depuis son code', () => {
  const retrouver = creerRetrouverResume(arbreAccepte(lireArbreDuSite()))

  it('reconstitue un résultat en toutes lettres, pour le garagiste', () => {
    expect(retrouver('bruit.aucun.freinage.sifflement')).toEqual({
      symptome: { identifiant: 'bruit', libelle: 'Un bruit inhabituel' },
      reponses: [
        { question: 'Que remarquez-vous ?', reponse: 'Un bruit inhabituel' },
        { question: 'Remarquez-vous l’un de ces signes ?', reponse: 'Aucun de ces signes' },
        { question: 'Quand entendez-vous ce bruit ?', reponse: 'Quand je freine' },
        {
          question: 'À quoi ressemble ce bruit quand vous freinez ?',
          reponse: 'Un sifflement ou un grincement aigu',
        },
      ],
      urgence: 'a-controler',
      conclusion:
        'Roulez prudemment et faites contrôler dans les prochains jours. Pistes évoquées : ' +
        'Des plaquettes de frein arrivées à leur témoin d’usure, qui siffle pour le signaler ; ' +
        'Des plaquettes ou des disques encrassés, ou durcis par une surchauffe.',
    })
  })

  it('reconstitue un arrêt : urgence « ne-pas-rouler » et consigne donnée', () => {
    const resume = retrouver('freinage.pedale-molle')
    expect(resume?.urgence).toBe('ne-pas-rouler')
    expect(resume?.reponses[1]).toEqual({
      question: 'Remarquez-vous l’un de ces signes ?',
      reponse: 'La pédale de frein est molle ou s’enfonce',
    })
    expect(resume?.conclusion).toBe(
      'Ne roulez pas : appelez-nous. Consigne donnée : ne pas rouler, se mettre en sécurité, appeler l’assistance de son assureur, et le 112 en cas de danger immédiat.',
    )
  })

  it('dit au garagiste quand le conducteur ne sait pas si un signe de danger est présent', () => {
    const resume = retrouver('ne-sais-pas.ne-sais-pas.ne-sais-pas')
    expect(resume?.urgence).toBe('a-controler')
    expect(resume?.conclusion).toBe(
      'Roulez prudemment et faites contrôler dans les prochains jours. Réponses insuffisantes pour orienter : l’atelier doit voir la voiture. Le conducteur ne sait pas si un signe de danger est présent.',
    )
  })

  it.each([
    ['inconnu.aucun.x'],
    ['bruit.aucun'],
    ['bruit.aucun.freinage'],
    ['bruit.aucun.freinage.sifflement.en-trop'],
    ['bruit.aucun.vitesse.sifflement'],
    ['bruit.inconnu.vitesse'],
    ['<script>alert(1)</script>'],
    [''],
  ])('rend null pour un code inconnu, incomplet ou enrichi : « %s »', (code) => {
    expect(retrouver(code)).toBeNull()
  })
})
