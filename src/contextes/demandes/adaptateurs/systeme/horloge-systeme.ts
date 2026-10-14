import type { Horloge } from '../../application/ports.js'

export const horlogeSysteme: Horloge = { maintenant: () => new Date() }
