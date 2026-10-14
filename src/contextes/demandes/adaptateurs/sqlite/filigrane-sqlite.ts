import type { Base } from './base.js'

/** Point de reprise du relevé de la boîte (Kano connecteurs, C5), par dossier lu. */
export interface FiligraneStocke {
  readonly validiteUid: string
  readonly dernierUid: number
}

export interface DepotFiligrane {
  lire(dossier: string): FiligraneStocke | null
  ecrire(dossier: string, filigrane: FiligraneStocke): void
}

export function creerDepotFiligraneSqlite(base: Base): DepotFiligrane {
  const lecture = base.prepare<[string], { validite_uid: string; dernier_uid: number }>(
    'SELECT validite_uid, dernier_uid FROM demandes_filigrane_boite WHERE dossier = ?',
  )
  const ecriture = base.prepare(
    `INSERT INTO demandes_filigrane_boite (dossier, validite_uid, dernier_uid) VALUES (?, ?, ?)
     ON CONFLICT (dossier) DO UPDATE SET validite_uid = excluded.validite_uid, dernier_uid = excluded.dernier_uid`,
  )
  return {
    lire(dossier) {
      const ligne = lecture.get(dossier)
      return ligne === undefined
        ? null
        : { validiteUid: ligne.validite_uid, dernierUid: ligne.dernier_uid }
    },
    ecrire(dossier, filigrane) {
      ecriture.run(dossier, filigrane.validiteUid, filigrane.dernierUid)
    },
  }
}
