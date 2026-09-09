import type { JSX } from 'solid-js'
import { useContext } from 'solid-js'

import type { MoraineTheme } from '../../theme/types.ts'

import { MoraineThemeContext } from './theme-context.tsx'

export interface MoraineProviderProps {
  /** Replaces inherited presentation. Undefined inherits the parent Theme; emptyTheme clears it. */
  theme?: MoraineTheme
  /** Components that receive the theme. */
  children?: JSX.Element
}

/** Provides a theme to descendant components; roots default to empty presentation. */
export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parent = useContext(MoraineThemeContext)
  const theme = () => props.theme ?? parent()
  return <MoraineThemeContext.Provider value={theme}>{props.children}</MoraineThemeContext.Provider>
}
