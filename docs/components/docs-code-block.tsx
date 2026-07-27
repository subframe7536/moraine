import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'

import { Button, cn } from '../../src'

import {
  DOCS_CODE_BLOCK_CONTENT_CLASS,
  DOCS_CODE_BLOCK_INSTALL_CLASS,
  DOCS_CODE_BLOCK_ROOT_CLASS,
  DOCS_CODE_BLOCK_SOURCE_CLASS,
  DOCS_CODE_BLOCK_SOURCE_CONTENT_CLASS,
  DOCS_CODE_BLOCK_VIEWPORT_CLASS,
} from './docs-code-block.class'

const COLLAPSED_HEIGHT_PX = 150
const EXPANDED_HEIGHT_PX = 400

export namespace DocsCodeBlockT {
  export type Variant = 'plain' | 'source' | 'install'

  export interface Props {
    html: string
    variant?: Variant
    class?: string
    style?: JSX.CSSProperties
  }
}

export type DocsCodeBlockProps = DocsCodeBlockT.Props

export function DocsCodeBlock(props: DocsCodeBlockProps) {
  const isSource = () => props.variant === 'source'
  const isInstall = () => props.variant === 'install'
  const [isExpanded, setIsExpanded] = createSignal(false)
  const [isExpandable, setIsExpandable] = createSignal(false)
  const [hasMeasured, setHasMeasured] = createSignal(false)
  let contentRef: HTMLDivElement | undefined

  const updateExpandable = () => {
    if (!isSource() || !contentRef) {
      setIsExpandable(false)
      return
    }

    setIsExpandable(contentRef.scrollHeight > COLLAPSED_HEIGHT_PX)
    setHasMeasured(true)
  }

  const viewportHeight = () => {
    if (!hasMeasured()) {
      return `${COLLAPSED_HEIGHT_PX}px`
    }
    if (!isExpandable()) {
      return undefined
    }
    return `${isExpanded() ? Math.min(EXPANDED_HEIGHT_PX, contentRef?.scrollHeight ?? EXPANDED_HEIGHT_PX) : COLLAPSED_HEIGHT_PX}px`
  }

  createEffect(() => {
    if (props.html.length === 0) {
      return
    }
    queueMicrotask(updateExpandable)
  })

  onMount(() => {
    const observer = new ResizeObserver(updateExpandable)
    if (contentRef) {
      observer.observe(contentRef)
    }
    onCleanup(() => observer.disconnect())
  })

  return (
    <Show
      when={isSource()}
      fallback={
        <div
          class={cn(
            DOCS_CODE_BLOCK_CONTENT_CLASS,
            DOCS_CODE_BLOCK_ROOT_CLASS,
            isInstall() && DOCS_CODE_BLOCK_INSTALL_CLASS,
            props.class,
          )}
          style={props.style}
          // oxlint-disable-next-line subf/solid-no-innerhtml
          innerHTML={props.html}
        />
      }
    >
      <div
        class={cn(DOCS_CODE_BLOCK_ROOT_CLASS, DOCS_CODE_BLOCK_SOURCE_CLASS, props.class)}
        style={props.style}
      >
        <div class={DOCS_CODE_BLOCK_VIEWPORT_CLASS} style={{ height: viewportHeight() }}>
          <div
            ref={(element) => {
              contentRef = element
            }}
            class={cn(
              DOCS_CODE_BLOCK_SOURCE_CONTENT_CLASS,
              isExpandable() && !isExpanded() && 'pointer-events-none',
            )}
            // oxlint-disable-next-line subf/solid-no-innerhtml
            innerHTML={props.html}
          />

          <Show when={isExpandable() && !isExpanded()}>
            <div class="pointer-events-none inset-0 top-2 absolute from-background to-transparent bg-gradient-to-t" />
            <Button
              variant="outline"
              aria-label="Expand code"
              onClick={() => setIsExpanded(true)}
              class="bottom-2 left-1/2 absolute !translate--1/2"
            >
              Expand code
            </Button>
          </Show>
        </div>
      </div>
    </Show>
  )
}
