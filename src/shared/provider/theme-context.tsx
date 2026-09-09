import type { Accessor } from 'solid-js'
import { createContext, useContext } from 'solid-js'

import { emptyTheme } from '../../theme/types.ts'
import type { MoraineTheme } from '../../theme/types.ts'

export const MoraineThemeContext = createContext<Accessor<MoraineTheme>>(() => emptyTheme)

export function useTheme(): Accessor<MoraineTheme> {
  return useContext(MoraineThemeContext)
}
