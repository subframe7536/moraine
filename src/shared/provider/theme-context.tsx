import type { Accessor } from 'solid-js'
import { createContext, useContext } from 'solid-js'

import { emptyTheme } from '../../theme/types'
import type { MoraineTheme } from '../../theme/types'

export const MoraineThemeContext = createContext<Accessor<MoraineTheme>>(() => emptyTheme)

export function useTheme(): Accessor<MoraineTheme> {
  return useContext(MoraineThemeContext)
}
