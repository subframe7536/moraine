import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'

import { Button, cn } from '../../../../src/index.ts'

const DOCS_CODE_BLOCK_ROOT_CLASS =
  '[&_.expressive-code_.copy_button]:rounded-md! [&_.expressive-code_.copy_button]:focus-visible:(outline-none! ring-2! ring-ring! ring-offset-2! ring-offset-background!) [&_.expressive-code:has(pre_code>span:only-child)_.copy_button]:top-1/2! [&_.expressive-code:has(pre_code>span:only-child)_.copy_button]:-translate-y-1/2!'
const DOCS_CODE_BLOCK_SOURCE_CLASS =
  'group relative my-0 border-t border-border/60 overflow-hidden bg-muted/20'
const DOCS_CODE_BLOCK_INSTALL_CLASS =
  '[&_.expressive-code]:my-0 [&_.expressive-code_.frame]:shadow-none [&_.expressive-code_pre]:border-0 [&_.expressive-code_pre]:rounded-none [&_.expressive-code_pre>code]:py-2!'
const DOCS_CODE_BLOCK_VIEWPORT_CLASS =
  'relative transition-[height] duration-300 ease-in-out overflow-hidden motion-reduce:transition-none'
const DOCS_CODE_BLOCK_CONTENT_CLASS = '[&_.expressive-code]:my-2'
const DOCS_CODE_BLOCK_SOURCE_CONTENT_CLASS =
  'h-full overflow-x-auto [&_.expressive-code]:my-0 [&_.expressive-code_.frame]:shadow-none [&_.docs-code-copy-toolbar]:sticky! [&_.docs-code-copy-toolbar]:top-0 [&_.docs-code-copy-toolbar]:z-raised [&_.docs-code-copy-toolbar]:h-0 [&_.docs-code-copy-toolbar_.copy]:[inset-block-start:0.25rem]! [&_.docs-code-copy-toolbar_.copy]:[inset-inline-end:0.25rem]! [&_.expressive-code_pre]:border-0! [&_.expressive-code_pre]:rounded-none! [&_.expressive-code_pre]:font-mono'

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
            inert={isExpandable() && !isExpanded() ? true : undefined}
            // oxlint-disable-next-line subf/solid-no-innerhtml
            innerHTML={props.html}
          />

          <Show when={isExpandable() && !isExpanded()}>
            <div class="pointer-events-none inset-0 top-2 absolute from-background/90 to-transparent via-background/40 bg-gradient-to-t" />
            <Button
              variant="outline"
              size="sm"
              aria-label="Expand code"
              onClick={() => setIsExpanded(true)}
              class="docs-focus-visible rounded-lg shadow-xs bottom-3 left-1/2 absolute !translate-x--1/2"
            >
              Expand code
            </Button>
          </Show>
        </div>
      </div>
    </Show>
  )
}
