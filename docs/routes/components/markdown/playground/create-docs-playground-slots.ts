import { createEffect, createMemo, createSignal, on, onCleanup, onMount, untrack } from 'solid-js'

import { getDomSlotName } from '../../../../build/api-doc/presentation'
import type { ComponentApi } from '../../../../build/api-doc/types'

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

export function createDocsPlaygroundSlots(props: {
  api: ComponentApi
  preview: () => HTMLElement | undefined
}) {
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
  const [autoHover, setAutoHoverState] = createSignal(false)
  const [locked, setLocked] = createSignal<string>()
  const [boxes, setBoxes] = createSignal<HighlightBox[]>([])
  const activeSlot = createMemo(() => listHovered() ?? previewHovered() ?? locked())
  const clearHighlight = () => {
    setListHovered(undefined)
    setPreviewHovered(undefined)
    setLocked(undefined)
  }

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
        clearHighlight()
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

  function setAutoHover(value: boolean) {
    setAutoHoverState(value)
    if (!value) {
      setPreviewHovered(undefined)
    }
  }

  function toggleSlot(name: string) {
    if (locked() === name) {
      clearHighlight()
    } else {
      setLocked(name)
    }
  }

  return {
    slots,
    nodes,
    autoHover,
    setAutoHover,
    locked,
    toggleSlot,
    setListHovered,
    boxes,
    activeSlot,
  }
}
