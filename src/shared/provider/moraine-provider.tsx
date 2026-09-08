import type { JSX } from 'solid-js'
import { createMemo, useContext } from 'solid-js'

import { defaultTheme } from '../../theme/default-theme.ts'
import { THEME_LAYERS } from '../../theme/types.ts'
import type { MoraineTheme } from '../../theme/types.ts'

import { EMPTY_THEME_LAYERS, MoraineThemeContext } from './theme-context.tsx'

export interface MoraineProviderProps {
  /** Presentation layers appended to the inherited or official Theme. */
  theme?: MoraineTheme
  /** Components rendered inside this presentation boundary. */
  children?: JSX.Element
}

/** Supplies official presentation at a root, or appends to the inherited Theme. */
export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parent = useContext(MoraineThemeContext)
  const layers = createMemo(() => [
    ...(parent ? parent() : defaultTheme[THEME_LAYERS]),
    ...(props.theme?.[THEME_LAYERS] ?? EMPTY_THEME_LAYERS),
  ])
  return (
    <MoraineThemeContext.Provider value={layers}>{props.children}</MoraineThemeContext.Provider>
  )
}

/** Resets inherited presentation to the optional Theme supplied at this boundary. */
export function MoraineUnstyledProvider(props: MoraineProviderProps): JSX.Element {
  const layers = createMemo(() => props.theme?.[THEME_LAYERS] ?? EMPTY_THEME_LAYERS)
  return (
    <MoraineThemeContext.Provider value={layers}>{props.children}</MoraineThemeContext.Provider>
  )
}
