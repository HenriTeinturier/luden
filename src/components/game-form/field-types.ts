import type { GameInput } from '../../lib/validation'
export type ChangeGameField = <K extends keyof GameInput>(key: K, value: GameInput[K]) => void
export type ChangeExperienceField = <K extends keyof GameInput['experience']>(
  key: K,
  value: GameInput['experience'][K],
) => void
export type GameFieldsProps = {
  data: GameInput
  change: ChangeGameField
  experience?: ChangeExperienceField
}
