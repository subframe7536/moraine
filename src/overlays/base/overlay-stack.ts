import type { Accessor } from 'solid-js'

import { containsComposed } from './dom'

/**
 * Lightweight registry of currently present interactive overlays. The stack
 * preserves push order so that nested overlays (e.g. a popover opened from
 * inside a modal) layer correctly and only the topmost overlay reacts to
 * Escape, outside pointerdown, and outside focusin.
 */
export interface OverlayStackEntry {
  /** Element used to detect "inside" interactions for outside-handler logic. */
  contentElement: Accessor<HTMLElement | undefined>
  /** Trigger element used to detect interactions that should be ignored. */
  triggerElement: Accessor<HTMLElement | undefined>
  /** Document that owns the active content and its document-level interactions. */
  ownerDocument?: Document
}

const overlayStacks = new WeakMap<Document, OverlayStackEntry[]>()

function getOverlayDocument(entry: OverlayStackEntry): Document | undefined {
  return (
    entry.ownerDocument ??
    entry.contentElement()?.ownerDocument ??
    entry.triggerElement()?.ownerDocument
  )
}

function getOverlayStack(entry: OverlayStackEntry): OverlayStackEntry[] {
  const ownerDocument = getOverlayDocument(entry)
  if (!ownerDocument) {
    return []
  }

  let stack = overlayStacks.get(ownerDocument)
  if (!stack) {
    stack = []
    overlayStacks.set(ownerDocument, stack)
  }
  return stack
}

export function pushOverlayLayer(entry: OverlayStackEntry): () => void {
  const overlayStack = getOverlayStack(entry)
  overlayStack.push(entry)

  return () => {
    const index = overlayStack.indexOf(entry)

    if (index !== -1) {
      overlayStack.splice(index, 1)
    }
  }
}

export function isTopOverlay(entry: OverlayStackEntry): boolean {
  const overlayStack = getOverlayStack(entry)
  return overlayStack[overlayStack.length - 1] === entry
}

/** Returns whether a target belongs to this layer, its trigger, or a nested layer above it. */
export function isInsideOverlayLayer(entry: OverlayStackEntry, target: Node): boolean {
  if (
    (entry.contentElement() && containsComposed(entry.contentElement()!, target)) ||
    (entry.triggerElement() && containsComposed(entry.triggerElement()!, target))
  ) {
    return true
  }

  return isInsideDescendantOverlay(entry, target)
}

/**
 * Returns true when the target lives inside any overlay that was pushed onto
 * the stack AFTER the supplied entry. Used so that an outer overlay treats
 * its descendant overlays as "inside" interactions.
 */
export function isInsideDescendantOverlay(entry: OverlayStackEntry, target: Node): boolean {
  const overlayStack = getOverlayStack(entry)
  const index = overlayStack.indexOf(entry)

  if (index === -1) {
    return false
  }

  for (let cursor = index + 1; cursor < overlayStack.length; cursor++) {
    const above = overlayStack[cursor]
    const content = above?.contentElement()
    const trigger = above?.triggerElement()

    if (
      (content && containsComposed(content, target)) ||
      (trigger && containsComposed(trigger, target))
    ) {
      return true
    }
  }

  return false
}

/** Returns whether a branch contains content from a layer above the layer owning `target`. */
export function containsOverlayContentAbove(target: Node, branch: Element): boolean {
  const ownerDocument = target.ownerDocument
  const overlayStack = ownerDocument ? (overlayStacks.get(ownerDocument) ?? []) : []
  const ownerIndex = overlayStack.findIndex((entry) => {
    const content = entry.contentElement()
    return Boolean(content && containsComposed(content, target))
  })

  if (ownerIndex === -1) {
    return false
  }

  for (let index = ownerIndex + 1; index < overlayStack.length; index++) {
    const content = overlayStack[index]?.contentElement()
    if (content && containsComposed(branch, content)) {
      return true
    }
  }

  return false
}
