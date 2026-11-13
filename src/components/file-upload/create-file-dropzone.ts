import type { Accessor, JSX } from 'solid-js'
import { createSignal } from 'solid-js'

import { callHandler } from '../../shared/utils'

import { isFileDragEvent } from './file-input-sync'

export interface CreateFileDropzoneOptions {
  dropzone: Accessor<boolean>
  interactive: Accessor<boolean>
  onDragOver: Accessor<JSX.EventHandlerUnion<HTMLDivElement, DragEvent> | undefined>
  onDragLeave: Accessor<JSX.EventHandlerUnion<HTMLDivElement, DragEvent> | undefined>
  onDrop: Accessor<JSX.EventHandlerUnion<HTMLDivElement, DragEvent> | undefined>
  onFiles: (files: File[]) => void
}

export function createFileDropzone(options: CreateFileDropzoneOptions): {
  dragging: Accessor<boolean>
  resetDragging: () => void
  onDragOver: JSX.EventHandler<HTMLElement, DragEvent>
  onDragLeave: JSX.EventHandler<HTMLElement, DragEvent>
  onDrop: JSX.EventHandler<HTMLElement, DragEvent>
} {
  const [dragging, setDragging] = createSignal(false)

  const onDragOver: JSX.EventHandler<HTMLElement, DragEvent> = (event) => {
    if (!options.dropzone()) {
      return
    }

    callHandler(event, options.onDragOver())

    if (event.defaultPrevented || !options.interactive() || !isFileDragEvent(event)) {
      return
    }

    event.preventDefault()
    try {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }
    } catch {
      // Some browser engines expose a read-only dropEffect.
    }
    setDragging(true)
  }

  const onDragLeave: JSX.EventHandler<HTMLElement, DragEvent> = (event) => {
    if (!options.dropzone()) {
      return
    }

    callHandler(event, options.onDragLeave())

    if (event.defaultPrevented) {
      return
    }

    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
      return
    }

    setDragging(false)
  }

  const onDrop: JSX.EventHandler<HTMLElement, DragEvent> = (event) => {
    if (!options.dropzone()) {
      return
    }

    callHandler(event, options.onDrop())
    setDragging(false)

    if (event.defaultPrevented || !options.interactive() || !isFileDragEvent(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    options.onFiles(Array.from(event.dataTransfer?.files ?? []))
  }

  return { dragging, resetDragging: () => setDragging(false), onDragOver, onDragLeave, onDrop }
}
