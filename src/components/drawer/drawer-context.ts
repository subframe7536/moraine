import type { Accessor } from 'solid-js'
import { createContext, createSignal, useContext } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { createContentAnatomy } from '../shared/overlay/content-anatomy'

import type { DrawerT } from './drawer.types'

/**
 * Per-drawer channel shared with drawers nested inside its content. A nested
 * content reports its presence, frontmost height, and swipe state upward so
 * each ancestor can recede into the stack visual.
 */
export interface DrawerNestedChannel {
  /** Number of mounted contents nested inside this drawer, at any depth. */
  readonly openCount: Accessor<number>
  /** Number of open drawers nested inside this drawer; exiting drawers do not count. */
  readonly activeCount: Accessor<number>
  /** Height of the frontmost open drawer in this subtree, in px. */
  readonly frontmostHeight: Accessor<number>
  /** Whether a nested drawer is currently being swiped. */
  readonly swiping: Accessor<boolean>
  /** Swipe progress of the frontmost nested drawer, in [0, 1]. */
  readonly progress: Accessor<number>
  /** The ambient parent drawer channel this drawer reports to, when nested. */
  readonly parent?: DrawerNestedChannel
  /** Called by this drawer's own content to report its popup height. */
  readonly setPopupHeight: (height: number) => void
  /** Called by a nested content to report its mounted drawer count; 0 on unmount. */
  readonly reportOpen: (count: number) => void
  /** Called by a nested content to report its open drawer count; 0 when it starts closing. */
  readonly reportActive: (count: number) => void
  /** Called by a nested content to report its subtree frontmost height; 0 on unmount. */
  readonly reportFrontmostHeight: (height: number) => void
  /** Called by a nested content on swipe changes; forwarded up the chain. */
  readonly reportSwiping: (swiping: boolean) => void
  /** Called by a nested content on swipe progress; forwarded up the chain. */
  readonly reportProgress: (progress: number) => void
}

export interface DrawerContextValue {
  readonly slotOverrides: { classes?: DrawerT.Classes; styles?: DrawerT.Styles }
  readonly nested: DrawerNestedChannel
  side?: DrawerT.Variants['side'] | null
  overlay?: boolean
  closable?: boolean
  closeIcon?: DrawerT.Base['closeIcon']
  handle?: boolean
  translations?: DrawerT.Translations
  snapPoints?: DrawerT.SnapPoint[]
  snapToSequentialPoints?: boolean
  closeOnEscape?: boolean
  onClosePrevent?: () => void
  snapPoint: Accessor<DrawerT.SnapPoint | null>
  setSnapPoint: (snapPoint: DrawerT.SnapPoint | null) => void
}

const DrawerCtx = createContext<DrawerContextValue | undefined>(undefined, { name: 'Drawer' })

export const DrawerProvider = DrawerCtx.Provider

export function useDrawerContext(): DrawerContextValue {
  const context = useContext(DrawerCtx)
  if (!context) {
    throw new Error('useDrawerContext must be used within <DrawerProvider />')
  }
  return context
}

/** Reads the ambient drawer context when this drawer is nested inside one. */
export function useOptionalDrawerContext(): DrawerContextValue | undefined {
  return useContext(DrawerCtx)
}

export function createDrawerContentRegistration() {
  const registration = createContentAnatomy()
  const [bodyCount, setBodyCount] = createSignal(0)
  const [footerCount, setFooterCount] = createSignal(0)
  return {
    ...registration,
    registerBody: () => {
      setBodyCount((count) => count + 1)
      return () => setBodyCount((count) => count - 1)
    },
    registerFooter: () => {
      setFooterCount((count) => count + 1)
      return () => setFooterCount((count) => count - 1)
    },
    hasBody: () => bodyCount() > 0,
    hasFooter: () => footerCount() > 0,
  }
}

export interface DrawerContentContext extends ReturnType<typeof createDrawerContentRegistration> {
  readonly variants: Required<DrawerT.Variants>
}

export const [DrawerContentProvider, useDrawerContent] =
  /* @__PURE__ */ createContextProvider<DrawerContentContext>('DrawerContent')
