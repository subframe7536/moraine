import type { JSX } from 'solid-js'
import { Show, createEffect, createSignal, on, onCleanup, onMount } from 'solid-js'

import { Button, cn, Icon } from '../../../../../src/index.ts'
import type { IconT } from '../../../../../src/index.ts'
import {
  DOCS_BLOCK_CONTAINER_CLASS,
  DOCS_BLOCK_HEADER_CLASS,
  DOCS_CODE_CONTENT_CLASS,
  DOCS_CODE_EXPAND_BUTTON_CLASS,
  DOCS_CODE_FALLBACK_PRE_CLASS,
  DOCS_CODE_SOURCE_CLASS,
} from '../markdown.class.ts'

import { CopyButton } from './copy-button.tsx'

export { CopyButton, extractCodeText } from './copy-button.tsx'
export {
  DOCS_BLOCK_CONTAINER_CLASS,
  DOCS_BLOCK_HEADER_CLASS,
  DOCS_CODE_CONTENT_CLASS,
  DOCS_CODE_EXPAND_BUTTON_CLASS,
  DOCS_CODE_FALLBACK_PRE_CLASS,
  DOCS_CODE_SOURCE_CLASS,
}

const COLLAPSED_HEIGHT_PX = 150
const EXPANDED_HEIGHT_PX = 400

export namespace CodeBlockT {
  export type Variant = 'plain' | 'source' | 'tabs'

  export interface Props {
    html?: string
    code?: string
    lang?: string
    title?: string
    highlightedLines?: number[] | string
    variant?: Variant
    expandable?: boolean
    class?: string
    style?: JSX.CSSProperties
    children?: JSX.Element
  }
}

export type CodeBlockProps = CodeBlockT.Props
export type DocsCodeBlockProps = CodeBlockProps

export function getLanguageIcon(lang?: string, title?: string): IconT.Name {
  const name = (title ?? lang ?? '').toLowerCase()
  if (
    name.endsWith('.tsx') ||
    name.endsWith('.ts') ||
    name === 'tsx' ||
    name === 'ts' ||
    name === 'typescript'
  ) {
    return 'i-lucide:file-code'
  }
  if (
    name.endsWith('.jsx') ||
    name.endsWith('.js') ||
    name === 'jsx' ||
    name === 'js' ||
    name === 'javascript'
  ) {
    return 'i-lucide:file-code'
  }
  if (name.endsWith('.json') || name === 'json') {
    return 'i-lucide:file-json'
  }
  if (name.endsWith('.css') || name === 'css') {
    return 'i-lucide:palette'
  }
  if (
    name.endsWith('.sh') ||
    name.endsWith('.bash') ||
    name === 'bash' ||
    name === 'sh' ||
    name === 'shell' ||
    name === 'zsh' ||
    name === 'bun' ||
    name === 'pnpm' ||
    name === 'npm'
  ) {
    return 'i-lucide:terminal'
  }
  return 'i-lucide:file-text'
}

export function CodeBlock(props: CodeBlockProps) {
  const variant = () => props.variant ?? 'plain'
  const isSource = () => variant() === 'source'
  const isTabs = () => variant() === 'tabs'
  const isExpandableProp = () => props.expandable ?? isSource()

  const [isExpanded, setIsExpanded] = createSignal(false)
  const [isExpandable, setIsExpandable] = createSignal(false)
  const [hasMeasured, setHasMeasured] = createSignal(false)
  let contentRef: HTMLDivElement | undefined

  const updateExpandable = () => {
    if (!isExpandableProp() || !contentRef) {
      setIsExpandable(false)
      return
    }
    setIsExpandable(contentRef.scrollHeight > COLLAPSED_HEIGHT_PX)
    setHasMeasured(true)
  }

  const viewportHeight = () => {
    if (!isExpandableProp()) {
      return undefined
    }
    if (!hasMeasured()) {
      return `${COLLAPSED_HEIGHT_PX}px`
    }
    if (!isExpandable()) {
      return undefined
    }
    return `${isExpanded() ? Math.min(EXPANDED_HEIGHT_PX, contentRef?.scrollHeight ?? EXPANDED_HEIGHT_PX) : COLLAPSED_HEIGHT_PX}px`
  }

  createEffect(
    on([() => props.html, () => props.code], ([html, code]) => {
      if (html !== undefined || code !== undefined) {
        queueMicrotask(updateExpandable)
      }
    }),
  )

  onMount(() => {
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(updateExpandable)
    if (contentRef) {
      observer.observe(contentRef)
    }
    onCleanup(() => observer.disconnect())
  })

  const hasHeader = () => Boolean(props.title && !isTabs())

  return (
    <div
      class={cn(
        isTabs()
          ? 'group my-0 relative overflow-hidden'
          : isSource()
            ? DOCS_CODE_SOURCE_CLASS
            : DOCS_BLOCK_CONTAINER_CLASS,
        props.class,
      )}
      style={props.style}
    >
      <Show when={hasHeader()}>
        <div class={DOCS_BLOCK_HEADER_CLASS}>
          <div class="text-muted-foreground font-mono flex gap-2 truncate items-center text-xs">
            <Icon
              name={getLanguageIcon(props.lang, props.title)}
              class="text-muted-foreground shrink-0 size-4"
            />
            <span class="text-foreground/90 font-medium truncate">{props.title}</span>
          </div>
          <div class="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <CopyButton code={props.code} getTarget={() => contentRef} />
          </div>
        </div>
      </Show>

      <Show when={!hasHeader()}>
        <div class="opacity-0 transition-opacity right-2.5 top-2.5 absolute z-10 focus-within:opacity-100 group-hover:opacity-100">
          <CopyButton code={props.code} getTarget={() => contentRef} />
        </div>
      </Show>

      <div
        class={cn(
          isExpandableProp() &&
            'transition-[height] duration-300 ease-in-out relative overflow-hidden motion-reduce:transition-none',
        )}
        style={{ height: viewportHeight() }}
      >
        <div
          ref={(el) => {
            contentRef = el
            queueMicrotask(updateExpandable)
          }}
          tabIndex={-1}
          class={cn(
            'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent outline-none overscroll-x-contain h-full overflow-x-auto',
            isExpandable() && !isExpanded() && 'pointer-events-none',
          )}
          inert={isExpandable() && !isExpanded() ? true : undefined}
        >
          <Show
            when={props.html}
            fallback={
              <pre tabIndex={-1} class={DOCS_CODE_FALLBACK_PRE_CLASS}>
                <code class={props.lang ? `language-${props.lang}` : undefined}>
                  {props.code ?? props.children}
                </code>
              </pre>
            }
          >
            {(html) => (
              <div
                tabIndex={-1}
                class={DOCS_CODE_CONTENT_CLASS}
                // oxlint-disable-next-line subf/solid-no-innerhtml
                innerHTML={html()}
              />
            )}
          </Show>
        </div>

        <Show when={isExpandable() && !isExpanded()}>
          <div class="h-16 pointer-events-none inset-x-0 bottom-0 absolute from-card to-transparent via-card/70 bg-gradient-to-t" />
        </Show>

        <Show when={isExpandable()}>
          <Show when={!isExpanded()}>
            <Button
              variant="outline"
              size="sm"
              aria-label="Expand code"
              onClick={() => setIsExpanded(true)}
              class={DOCS_CODE_EXPAND_BUTTON_CLASS}
            >
              Expand code
            </Button>
          </Show>
          <Show when={isExpanded()}>
            <Button
              variant="outline"
              size="sm"
              aria-label="Collapse code"
              onClick={() => setIsExpanded(false)}
              class={DOCS_CODE_EXPAND_BUTTON_CLASS}
            >
              Collapse code
            </Button>
          </Show>
        </Show>
      </div>
    </div>
  )
}

export const DocsCodeBlock = CodeBlock
