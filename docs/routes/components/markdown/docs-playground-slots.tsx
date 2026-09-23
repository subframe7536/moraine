import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { Icon, Switch } from '../../../../src'
import { getDomSlotName } from '../../../build/api-doc/presentation'
import type { ComponentApi } from '../../../build/api-doc/types'

export const DocsPlaygroundApiContext = createContext<ComponentApi | undefined>()

interface SlotDescriptor {
  name: string
  domName: string
}

interface HighlightBox {
  top: number
  left: number
  width: number
  height: number
}

function getPortalRoot(element: HTMLElement, preview: HTMLElement): HTMLElement | undefined {
  if (preview.contains(element)) {
    return undefined
  }

  let root = element
  while (root.parentElement && root.parentElement !== preview.ownerDocument.body) {
    root = root.parentElement
  }
  return root.parentElement === preview.ownerDocument.body && !root.contains(preview)
    ? root
    : undefined
}

function getOwnedRoots(preview: HTMLElement): HTMLElement[] {
  const roots = [preview]
  for (let index = 0; index < roots.length; index++) {
    const root = roots[index]!
    for (const element of root.querySelectorAll<HTMLElement>(
      '[aria-controls], [aria-describedby]',
    )) {
      for (const id of `${element.getAttribute('aria-controls') ?? ''} ${element.getAttribute('aria-describedby') ?? ''}`
        .trim()
        .split(/\s+/)) {
        if (!id) {
          continue
        }
        const target = preview.ownerDocument.getElementById(id)
        const portalRoot = target && getPortalRoot(target, preview)
        if (portalRoot && !roots.includes(portalRoot)) {
          roots.push(portalRoot)
        }
      }
    }
  }
  return roots
}

function sameNodes(
  previous: Map<string, HTMLElement[]>,
  next: Map<string, HTMLElement[]>,
): boolean {
  if (previous.size !== next.size) {
    return false
  }
  for (const [slot, elements] of next) {
    const old = previous.get(slot)
    if (
      !old ||
      old.length !== elements.length ||
      elements.some((element, index) => element !== old[index])
    ) {
      return false
    }
  }
  return true
}

function sameBoxes(previous: HighlightBox[], next: HighlightBox[]): boolean {
  return (
    previous.length === next.length &&
    previous.every((box, index) => {
      const current = next[index]!
      return (
        box.top === current.top &&
        box.left === current.left &&
        box.width === current.width &&
        box.height === current.height
      )
    })
  )
}

export function DocsPlaygroundSlots(props: {
  api: ComponentApi
  preview: () => HTMLElement | undefined
}): JSX.Element {
  const slots: SlotDescriptor[] = untrack(() =>
    props.api.slots.map((name) => ({
      name,
      domName: getDomSlotName(props.api.key, name),
    })),
  )
  const slotByDomName = new Map(slots.map((slot) => [slot.domName, slot.name]))
  const [nodes, setNodes] = createSignal(new Map<string, HTMLElement[]>())
  const [listHovered, setListHovered] = createSignal<string>()
  const [previewHovered, setPreviewHovered] = createSignal<string>()
  const [autoHover, setAutoHover] = createSignal(true)
  const [locked, setLocked] = createSignal<string>()
  const [boxes, setBoxes] = createSignal<HighlightBox[]>([])
  const [mounted, setMounted] = createSignal(false)
  const activeSlot = createMemo(() => listHovered() ?? previewHovered() ?? locked())

  onMount(() => {
    const preview = props.preview()
    if (!preview) {
      return
    }
    const doc = preview.ownerDocument
    let roots: HTMLElement[] = [preview]

    const scan = () => {
      roots = getOwnedRoots(preview)
      const next = new Map<string, HTMLElement[]>()
      for (const root of roots) {
        for (const element of root.querySelectorAll<HTMLElement>('[data-slot]')) {
          const slot = slotByDomName.get(element.dataset.slot ?? '')
          if (!slot) {
            continue
          }
          const elements = next.get(slot) ?? []
          elements.push(element)
          next.set(slot, elements)
        }
      }
      if (!sameNodes(nodes(), next)) {
        setNodes(next)
      }
      if (locked() && !next.has(locked()!)) {
        setLocked(undefined)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!autoHover()) {
        return
      }
      const target = event.target
      if (!(target instanceof Element) || !roots.some((root) => root.contains(target))) {
        setPreviewHovered(undefined)
        return
      }
      let element: Element | null = target
      while (element) {
        const slot = slotByDomName.get(element.getAttribute('data-slot') ?? '')
        if (slot) {
          setPreviewHovered(slot)
          return
        }
        element = element.parentElement
      }
      setPreviewHovered(undefined)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLocked(undefined)
      }
    }
    const observer = new MutationObserver(scan)
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-slot', 'aria-controls', 'aria-describedby'],
    })
    doc.addEventListener('pointermove', onPointerMove)
    doc.addEventListener('keydown', onKeyDown)
    scan()
    setMounted(true)
    onCleanup(() => {
      observer.disconnect()
      doc.removeEventListener('pointermove', onPointerMove)
      doc.removeEventListener('keydown', onKeyDown)
    })
  })

  createEffect(
    on([activeSlot, nodes], ([slot, currentNodes]) => {
      const elements = slot ? (currentNodes.get(slot) ?? []) : []
      const view = props.preview()?.ownerDocument.defaultView
      if (!view || elements.length === 0) {
        setBoxes([])
        return
      }

      let frame = 0
      const update = () => {
        frame = 0
        const next = elements.flatMap((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
            ? [{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }]
            : []
        })
        if (!sameBoxes(boxes(), next)) {
          setBoxes(next)
        }
      }
      const schedule = () => {
        if (!frame) {
          frame = view.requestAnimationFrame(update)
        }
      }
      const resizeObserver =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
      for (const element of elements) {
        resizeObserver?.observe(element)
      }
      view.addEventListener('resize', schedule)
      view.addEventListener('scroll', schedule, true)
      schedule()
      onCleanup(() => {
        if (frame) {
          view.cancelAnimationFrame(frame)
        }
        resizeObserver?.disconnect()
        view.removeEventListener('resize', schedule)
        view.removeEventListener('scroll', schedule, true)
      })
    }),
  )

  return (
    <section class="pt-3 border-t border-border/60" aria-label="Component slots">
      <div class="mb-2 flex gap-2 items-center justify-between">
        <span class="text-xs text-foreground/90 font-semibold flex gap-1.5 items-center">
          <Icon name="i-lucide:layers" class="text-muted-foreground size-3.5" />
          <span>Slots</span>
        </span>
        <Switch
          size="sm"
          label="Auto"
          checked={autoHover()}
          onChange={(value) => {
            setAutoHover(value)
            if (!value) {
              setPreviewHovered(undefined)
            }
          }}
        />
      </div>
      <div class="flex flex-wrap gap-1.5">
        <For each={slots}>
          {(slot) => (
            <button
              type="button"
              class="text-xs font-mono px-2 py-1 border border-border rounded-md transition-colors aria-pressed:(text-primary border-primary bg-primary/12) disabled:(opacity-40 cursor-not-allowed) enabled:hover:(border-primary/60 bg-primary/8)"
              disabled={!nodes().has(slot.name)}
              aria-pressed={locked() === slot.name}
              onPointerEnter={() => setListHovered(slot.name)}
              onPointerLeave={() => setListHovered(undefined)}
              onFocus={() => setListHovered(slot.name)}
              onBlur={() => setListHovered(undefined)}
              onClick={() =>
                setLocked((current) => (current === slot.name ? undefined : slot.name))
              }
            >
              {slot.name}
            </button>
          )}
        </For>
      </div>
      <Show when={mounted()}>
        {(_ready) => (
          <Portal mount={props.preview()!.ownerDocument.body}>
            <div aria-hidden="true" class="pointer-events-none inset-0 fixed z-[2147483647]">
              <For each={boxes()}>
                {(box, index) => (
                  <div
                    data-docs-slot-highlight={activeSlot()}
                    class="border-2 border-primary rounded-sm bg-primary/10 shadow-[0_0_0_2px_var(--background)] absolute"
                    style={{
                      top: `${box.top}px`,
                      left: `${box.left}px`,
                      width: `${box.width}px`,
                      height: `${box.height}px`,
                    }}
                  >
                    <Show when={index() === 0}>
                      <span class="text-[10px] text-primary-foreground font-mono px-1.5 py-0.5 rounded-sm bg-primary whitespace-nowrap left-0 absolute -top-6">
                        {activeSlot()}
                      </span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Portal>
        )}
      </Show>
    </section>
  )
}
