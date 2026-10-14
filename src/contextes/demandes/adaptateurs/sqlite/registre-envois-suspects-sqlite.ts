import type { RegistreEnvoisSuspects } from '../../application/ports.js'
import type { Base } from './base.js'

/** Envois suspects : un jeton et deux dates, aucune donnée personnelle. */
export function creerRegistreEnvoisSuspectsSqlite(base: Base): RegistreEnvoisSuspects {
  const inserer = base.prepare(
    'INSERT OR IGNORE INTO demandes_envois_suspects (jeton, recu_le) VALUES (?, ?)',
  )
  const remplacer = base.prepare(
    'UPDATE demandes_envois_suspects SET jeton = ? WHERE jeton = ? AND confirme_le IS NULL',
  )
  const confirmer = base.prepare(
    'UPDATE demandes_envois_suspects SET confirme_le = ? WHERE jeton = ? AND confirme_le IS NULL',
  )
  const compter = base
    .prepare(
      'SELECT COUNT(*) FROM demandes_envois_suspects WHERE confirme_le IS NULL AND recu_le >= ?',
    )
    .pluck()
  const purger = base.prepare('DELETE FROM demandes_envois_suspects WHERE recu_le < ?')

  return {
    async noter(jeton, recuLe, remplace) {
      if (remplace !== null && remplacer.run(jeton, remplace).changes > 0) return
      inserer.run(jeton, recuLe.toISOString())
    },
    async confirmer(jeton, instant) {
      confirmer.run(instant.toISOString(), jeton)
    },
    async compterNonConfirmesDepuis(debut) {
      const nombre: unknown = compter.get(debut.toISOString())
      return typeof nombre === 'number' ? nombre : 0
    },
    async purger(limite) {
      return purger.run(limite.toISOString()).changes
    },
  }
}
