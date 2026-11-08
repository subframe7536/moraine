import type { Accessor } from 'solid-js'
import { createContext, createSignal, useContext } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { createContentAnatomy } from '../shared/overlay/content-anatomy'

import type { DrawerT } from './drawer.types'

/** Stack state a mounted content reports to its ambient parent drawer channel. */
export interface DrawerNestedReport {
  /** Mounted contents in the reporting subtree, itself included. */
  open: number
  /** Open drawers in the subtree; 0 once the reporting drawer starts closing. */
  active: number
  /** Height of the subtree's frontmost open popup in px; 0 while closed. */
  frontmostHeight: number
}

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
  /** This drawer's own measured popup height in px; 0 until measured. */
  readonly popupHeight: Accessor<number>
  /** Called by this drawer's own content to report its popup height. */
  readonly setPopupHeight: (height: number) => void
  /**
   * Called by a nested content to report its stack state, keyed by the reporting
   * channel so sibling drawers aggregate instead of overwriting each other.
   */
  readonly report: (report: DrawerNestedReport, reporter: DrawerNestedChannel) => void
  /** Drops a reporter's entry when its content unmounts. */
  readonly release: (reporter: DrawerNestedChannel) => void
  /** Called by a nested content on swipe changes; forwarded up the chain. */
  readonly reportSwipe: (swiping: boolean, progress: number) => void
}

export function createDrawerNestedChannel(parent?: DrawerNestedChannel): DrawerNestedChannel {
  const [popupHeight, setPopupHeight] = createSignal(0)
  const [openCount, setOpenCount] = createSignal(0)
  const [activeCount, setActiveCount] = createSignal(0)
  const [descendantHeight, setDescendantHeight] = createSignal(0)
  const [swiping, setSwiping] = createSignal(false)
  const [progress, setProgress] = createSignal(0)
  const reports = new Map<DrawerNestedChannel, DrawerNestedReport>()

  function aggregate(): void {
    let open = 0
    let active = 0
    let frontmostHeight = 0
    for (const report of reports.values()) {
      open += report.open
      active += report.active
      if (report.frontmostHeight > 0) {
        frontmostHeight = report.frontmostHeight
      }
    }
    setOpenCount(open)
    setActiveCount(active)
    setDescendantHeight(frontmostHeight)
  }

  return {
    openCount,
    activeCount,
    // A descendant reports its measured height asynchronously; until then the
    // own popup height is the best estimate (exact for same-height stacks).
    frontmostHeight: () =>
      activeCount() > 0 && descendantHeight() > 0 ? descendantHeight() : popupHeight(),
    swiping,
    progress,
    parent,
    popupHeight,
    setPopupHeight,
    report: (report, reporter) => {
      reports.set(reporter, report)
      aggregate()
    },
    release: (reporter) => {
      reports.delete(reporter)
      aggregate()
    },
    reportSwipe: (nextSwiping, nextProgress) => {
      setSwiping(nextSwiping)
      setProgress(nextProgress)
      parent?.reportSwipe(nextSwiping, nextProgress)
    },
  }
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
