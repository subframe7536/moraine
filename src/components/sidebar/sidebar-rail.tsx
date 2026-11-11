import type { JSX } from 'solid-js'
import { Show, createSignal, splitProps } from 'solid-js'

import { useMessages } from '../../provider/locale/locale-context'
import { createKeyDownHandler } from '../../shared/keyboard'
import type { KeyEvent } from '../../shared/keyboard'
import { callHandler, callRef } from '../../shared/utils'
import { createSplitterHandle } from '../shared/splitter'

import { useSidebarContext, useSidebarStyles } from './sidebar-context'
import { defaultSidebarMessages } from './sidebar.messages'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'

const KEYBOARD_STEP = 16
const KEYBOARD_STEP_SHIFT = 1

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function callRailEvent<E extends Event>(
  event: E,
  handler: unknown,
  internal: (event: E) => void,
): void {
  const result = callHandler(event, handler)
  if (!result.defaultPrevented) {
    internal(event)
  }
}

interface RailDragSession {
  sign: number
  total: number
  startWidth: number
  baselineWidth: number | undefined
}

/** Drag separator between `Sidebar.Panel` and `Sidebar.Inset` that resizes the panel. */
export function SidebarRail(props: SidebarT.RailProps): JSX.Element {
  const context = useSidebarContext()
  const [local, rest] = splitProps(props, [
    'disabled',
    'aria-label',
    'class',
    'style',
    'ref',
    'onClick',
    'onKeyDown',
    'onPointerDown',
    'onMouseEnter',
    'onMouseLeave',
    'onFocus',
    'onBlur',
  ])
  const messages = useMessages('sidebar', defaultSidebarMessages, () => context.translations?.())

  const disabled = () => local.disabled === true

  const [element, setElement] = createSignal<HTMLDivElement>()
  let session: RailDragSession | null = null
  let sessionMoved = false

  const measureSign = (): number => {
    const railRect = element()?.getBoundingClientRect()
    const panelRect = context.panelElement()?.getBoundingClientRect()
    if (!railRect || !panelRect) {
      return 1
    }
    return railRect.left + railRect.width / 2 >= panelRect.left + panelRect.width / 2 ? 1 : -1
  }

  const measuredPanelWidth = (): number =>
    context.panelElement()?.getBoundingClientRect().width ?? context.minWidth()

  function applyDrag(deltaPx: number): void {
    if (!session) {
      const startWidth = context.isOpen() ? (context.width() ?? measuredPanelWidth()) : 0
      session = {
        sign: measureSign(),
        total: 0,
        startWidth,
        baselineWidth: context.width(),
      }
      context.setResizing(true)
    }

    session.total += deltaPx
    if (deltaPx !== 0) {
      sessionMoved = true
    }

    const candidate = session.startWidth + session.sign * session.total
    if (candidate < context.minWidth() / 2) {
      if (context.isOpen()) {
        context.setOpen(false)
      }
      return
    }

    if (!context.isOpen()) {
      context.setOpen(true)
    }
    const next = clamp(candidate, context.minWidth(), context.maxWidth())
    if (next !== context.width()) {
      context.setWidth(next)
    }
  }

  function endDrag(): void {
    context.setResizing(false)
    const finished = session
    session = null
    const finalWidth = context.width()
    if (
      finished &&
      finalWidth !== undefined &&
      finalWidth !== (finished.baselineWidth ?? finished.startWidth)
    ) {
      context.commitWidth(finalWidth)
    }
  }

  /** Sets width and commits when it changed; returns whether the key was handled. */
  function applyWidth(target: number): boolean {
    const next = clamp(target, context.minWidth(), context.maxWidth())
    if (next === context.width()) {
      return false
    }
    context.setWidth(next)
    context.commitWidth(next)
    return true
  }

  const dispatchKeyDown = createKeyDownHandler<HTMLDivElement>({
    keys: (event: KeyEvent<HTMLDivElement>) => {
      const open = context.isOpen()
      const sign = measureSign()
      const step = event.shiftKey ? KEYBOARD_STEP_SHIFT : KEYBOARD_STEP
      const startWidth = () => context.width() ?? measuredPanelWidth()
      const resize = (delta: number): void => {
        if (applyWidth(startWidth() + delta)) {
          event.preventDefault()
        }
      }
      const snap = (target: number): void => {
        if (applyWidth(target)) {
          event.preventDefault()
        }
      }

      return {
        Enter: {
          preventDefault: false,
          handle: () => {
            context.toggle()
            event.preventDefault()
          },
        },
        [sign >= 0 ? 'ArrowRight' : 'ArrowLeft']: open
          ? { preventDefault: false, handle: () => resize(step) }
          : undefined,
        [sign >= 0 ? 'ArrowLeft' : 'ArrowRight']: open
          ? { preventDefault: false, handle: () => resize(-step) }
          : undefined,
        Home: open ? { preventDefault: false, handle: () => snap(context.minWidth()) } : undefined,
        End: open ? { preventDefault: false, handle: () => snap(context.maxWidth()) } : undefined,
      }
    },
  })

  const bindings = createSplitterHandle({
    orientation: () => 'horizontal',
    disabled,
    intersection: () => false,
    onDrag: (deltaPx) => applyDrag(deltaPx),
    onDragEnd: endDrag,
    onKeyDown: (event) => dispatchKeyDown(event),
  })

  const { slotWith } = useSidebarStyles('rail', local)
  const railSlot = slotWith('rail', {
    data: sidebarDataAttributes.rail({
      active: bindings.active,
      closed: () => !context.isOpen(),
      dragging: bindings.dragging,
    }),
  })

  function onClick(): void {
    if (disabled()) {
      return
    }
    if (sessionMoved) {
      sessionMoved = false
      return
    }
    context.toggle()
  }

  return (
    <Show when={!context.isMobile()}>
      <div
        data-slot="sidebar-rail"
        {...railSlot}
        {...rest}
        role="separator"
        aria-orientation="vertical"
        aria-controls={context.panelId()}
        aria-valuemin={0}
        aria-valuemax={context.maxWidth()}
        aria-valuenow={context.isOpen() ? context.width() : 0}
        aria-label={local['aria-label'] ?? messages().resize}
        aria-disabled={disabled() ? 'true' : undefined}
        tabIndex={disabled() ? -1 : 0}
        ref={(node: HTMLDivElement) => {
          setElement(node)
          bindings.setElement(node)
          callRef(local.ref, node)
        }}
        onClick={(event) => callRailEvent(event, local.onClick, onClick)}
        onKeyDown={(event) => callRailEvent(event, local.onKeyDown, bindings.onKeyDown)}
        onPointerDown={(event) => {
          sessionMoved = false
          callRailEvent(event, local.onPointerDown, bindings.onPointerDown)
        }}
        onMouseEnter={(event) => callRailEvent(event, local.onMouseEnter, bindings.onMouseEnter)}
        onMouseLeave={(event) => callRailEvent(event, local.onMouseLeave, bindings.onMouseLeave)}
        onFocus={(event) => callRailEvent(event, local.onFocus, bindings.onFocus)}
        onBlur={(event) => callRailEvent(event, local.onBlur, bindings.onBlur)}
      />
    </Show>
  )
}
