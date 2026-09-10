import type { JSX } from 'solid-js'
import { createMemo, useContext } from 'solid-js'

import type { MoraineTheme } from '../../theme/types'
import type { CnConfig } from '../style/cn'
import { createCn } from '../style/cn'

import { MoraineCnContext } from './cn-context'
import { MoraineThemeContext } from './theme-context'

export interface MoraineProviderProps {
  /** Replaces inherited presentation. Undefined inherits the parent Theme; emptyTheme clears it. */
  theme?: MoraineTheme
  /** Undefined inherits the parent merger; an object replaces it with Moraine defaults plus this config. */
  cnConfig?: CnConfig
  /** Components that receive the theme and class merging rules. */
  children?: JSX.Element
}

/** Provides a theme to descendant components; roots default to empty presentation. */
export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parent = useContext(MoraineThemeContext)
  const theme = () => props.theme ?? parent()
  const parentCn = useContext(MoraineCnContext)
  const currentCn = createMemo(() => {
    const config = props.cnConfig
    return config === undefined ? parentCn() : createCn(config)
  })
  return (
    <MoraineThemeContext.Provider value={theme}>
      <MoraineCnContext.Provider value={currentCn}>{props.children}</MoraineCnContext.Provider>
    </MoraineThemeContext.Provider>
  )
}
