import type { FormStore } from '@formisch/solid'

import { createContextProvider } from '../../shared/create-context-provider'

/** Generic Formisch store shared by Moraine's high-level form adapters. */
export type FormContextValue = FormStore

export const [FormProvider, useFormContext] = createContextProvider<FormContextValue | null>(
  'Form',
  null,
)
