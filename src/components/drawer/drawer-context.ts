import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { createContentAnatomy } from '../shared/overlay/content-anatomy'

import type { DrawerT } from './drawer.types'

export interface DrawerContextValue {
  readonly slotOverrides: { classes?: DrawerT.Classes; styles?: DrawerT.Styles }
  side?: DrawerT.Variants['side'] | null
  overlay?: boolean
  closable?: boolean
  closeIcon?: DrawerT.Base['closeIcon']
  handle?: boolean
  translations?: DrawerT.Translations
  snapPoints?: DrawerT.SnapPoint[]
  snapToSequentialPoints?: boolean
  snapPoint: Accessor<DrawerT.SnapPoint | null>
  setSnapPoint: (snapPoint: DrawerT.SnapPoint | null) => void
}

export const [DrawerProvider, useDrawerContext] =
  /* @__PURE__ */ createContextProvider<DrawerContextValue>('Drawer')

export interface DrawerContentContext extends ReturnType<typeof createContentAnatomy> {
  readonly variants: Required<DrawerT.Variants>
}

export const [DrawerContentProvider, useDrawerContent] =
  /* @__PURE__ */ createContextProvider<DrawerContentContext>('DrawerContent')
