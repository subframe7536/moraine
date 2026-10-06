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
        Math.abs(box.top - current.top) < 0.5 &&
        Math.abs(box.left - current.left) < 0.5 &&
        Math.abs(box.width - current.width) < 0.5 &&
        Math.abs(box.height - current.height) < 0.5
      )
    })
  )
}

function isOverflowClipped(value?: string | null): boolean {
  return value === 'hidden' || value === 'auto' || value === 'scroll' || value === 'clip'
}

function getVisibleHighlightBox(
  element: HTMLElement,
  view: Window,
  doc: Document,
): HighlightBox | undefined {
  if (typeof element.checkVisibility === 'function' && !element.checkVisibility()) {
    return undefined
  }

  const elementStyle = view.getComputedStyle(element)
  if (elementStyle.display === 'none' || elementStyle.visibility === 'hidden') {
    return undefined
  }

  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return undefined
  }

  let top = rect.top
  let bottom = rect.bottom
  let left = rect.left
  let right = rect.right

  let parent = element.parentElement
  while (parent && parent !== doc.body) {
    const parentStyle = view.getComputedStyle(parent)
    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
      return undefined
    }

    const isClippedX =
      isOverflowClipped(parentStyle.overflowX) || isOverflowClipped(parentStyle.overflow)
    const isClippedY =
      isOverflowClipped(parentStyle.overflowY) || isOverflowClipped(parentStyle.overflow)

    if (isClippedX || isClippedY) {
      const parentRect = parent.getBoundingClientRect()
      if (parentRect.width > 0 || parentRect.height > 0) {
        if (isClippedY) {
          top = Math.max(top, parentRect.top)
          bottom = Math.min(bottom, parentRect.bottom)
        }
        if (isClippedX) {
          left = Math.max(left, parentRect.left)
          right = Math.min(right, parentRect.right)
        }
        if (bottom <= top || right <= left) {
          return undefined
        }
      }
    }

    parent = parent.parentElement
  }

  const viewportWidth = view.innerWidth || doc.documentElement.clientWidth
  const viewportHeight = view.innerHeight || doc.documentElement.clientHeight

  if (viewportWidth > 0 && viewportHeight > 0) {
    top = Math.max(top, 0)
    bottom = Math.min(bottom, viewportHeight)
    left = Math.max(left, 0)
    right = Math.min(right, viewportWidth)

    if (bottom <= top || right <= left) {
      return undefined
    }
  }

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  }
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
  const [hoveredElement, setHoveredElement] = createSignal<HTMLElement>()
  const [autoHover, setAutoHoverState] = createSignal(false)
  const [locked, setLocked] = createSignal<string>()
  const [boxes, setBoxes] = createSignal<HighlightBox[]>([])
  const activeSlot = createMemo(() => listHovered() ?? previewHovered() ?? locked())
  const clearHighlight = () => {
    setListHovered(undefined)
    setPreviewHovered(undefined)
    setHoveredElement(undefined)
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
        if (root.hasAttribute('data-slot')) {
          const slot = slotByDomName.get(root.dataset.slot ?? '')
          if (slot) {
            const elements = next.get(slot) ?? []
            elements.push(root)
            next.set(slot, elements)
          }
        }
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
      if (hoveredElement() && !hoveredElement()!.isConnected) {
        setHoveredElement(undefined)
        setPreviewHovered(undefined)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!autoHover()) {
        return
      }
      const target = event.target
      if (!(target instanceof Element) || !roots.some((root) => root.contains(target))) {
        setPreviewHovered(undefined)
        setHoveredElement(undefined)
        return
      }
      let element: Element | null = target
      while (element) {
        const slot = slotByDomName.get(element.getAttribute('data-slot') ?? '')
        if (slot) {
          setPreviewHovered(slot)
          setHoveredElement(element as HTMLElement)
          return
        }
        element = element.parentElement
      }
      setPreviewHovered(undefined)
      setHoveredElement(undefined)
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
    on(
      [activeSlot, nodes, hoveredElement, autoHover, listHovered],
      ([slot, currentNodes, currentHoveredElement, isAutoHover, currentListHovered]) => {
        const isHoveringElement = Boolean(
          isAutoHover && currentHoveredElement && !currentListHovered,
        )
        const elements: HTMLElement[] = slot
          ? isHoveringElement && currentHoveredElement
            ? [currentHoveredElement]
            : (currentNodes.get(slot) ?? [])
          : []
        const view = props.preview()?.ownerDocument.defaultView
        if (!view || elements.length === 0) {
          setBoxes([])
          return
        }

        let frame = 0
        const update = () => {
          frame = 0
          const doc = props.preview()?.ownerDocument ?? document
          const next = elements.flatMap((element) => {
            const box = getVisibleHighlightBox(element, view, doc)
            return box ? [box] : []
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
        const preview = props.preview()
        if (preview) {
          resizeObserver?.observe(preview)
        }
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
      },
    ),
  )

  function setAutoHover(value: boolean) {
    setAutoHoverState(value)
    if (value) {
      setLocked(undefined)
    } else {
      setPreviewHovered(undefined)
      setHoveredElement(undefined)
    }
  }

  function toggleSlot(name: string) {
    if (locked() === name) {
      clearHighlight()
    } else {
      setLocked(name)
      if (autoHover()) {
        setAutoHoverState(false)
        setPreviewHovered(undefined)
        setHoveredElement(undefined)
      }
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
    hoveredElement,
  }
}
