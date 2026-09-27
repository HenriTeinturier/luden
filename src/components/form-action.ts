import { createContext } from 'react'

export type FormAction = { formId: string; busy: boolean; uploading: boolean }

// The header submits the real HTML form; validation and saving stay in GameForm.
export const FormActionContext = createContext<(action: FormAction | null) => void>(() => undefined)
