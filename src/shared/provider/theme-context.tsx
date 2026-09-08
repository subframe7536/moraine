import type { Accessor, Owner } from 'solid-js'
import { DEV, createContext, getOwner, useContext } from 'solid-js'

import type { CompiledThemeLayer } from '../../theme/types.ts'

export const EMPTY_THEME_LAYERS: readonly CompiledThemeLayer[] = Object.freeze([])

export const MoraineThemeContext = createContext<Accessor<readonly CompiledThemeLayer[]>>()
const warnedOwners = new WeakSet<Owner>()
let warnedWithoutOwner = false

export function useThemeLayers(): Accessor<readonly CompiledThemeLayer[]> {
  const context = useContext(MoraineThemeContext)
  if (context) {
    return context
  }

  if (DEV && process.env.NODE_ENV !== 'test') {
    let owner = getOwner()
    while (owner?.owner) {
      owner = owner.owner
    }
    if (owner ? !warnedOwners.has(owner) : !warnedWithoutOwner) {
      if (owner) {
        warnedOwners.add(owner)
      } else {
        warnedWithoutOwner = true
      }
      console.warn(
        '[Moraine] Component rendered outside of MoraineProvider. Rendering unstyled. Wrap your application in <MoraineProvider> to enable presentation.',
      )
    }
  }
  return () => EMPTY_THEME_LAYERS
}
