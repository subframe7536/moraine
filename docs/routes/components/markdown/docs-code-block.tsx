import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'

import { Button, cn, Icon } from '../../../../src/index'
import type { IconT } from '../../../../src/index'

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

function getLanguageIcon(lang?: string, title?: string): IconT.Name {
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

function extractCodeText(element?: HTMLElement): string {
  if (!element) {
    return ''
  }
  const codeEl = element.querySelector('code')
  return codeEl?.textContent ?? element.textContent ?? ''
}

export function CopyButton(props: { code?: string; getTarget?: () => HTMLElement | undefined }) {
  const [copied, setCopied] = createSignal(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })

  const handleCopy = async () => {
    const text = props.code ?? extractCodeText(props.getTarget?.())
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy code:', e)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={copied() ? 'Copied to clipboard' : 'Copy code'}
      title={copied() ? 'Copied' : 'Copy code'}
      onClick={handleCopy}
      class="text-muted-foreground rounded-md size-7 transition-colors hover:text-foreground hover:bg-muted/80"
    >
      <Icon
        name={copied() ? 'i-lucide:check' : 'i-lucide:copy'}
        class={cn('size-3.5', copied() && 'text-primary')}
      />
    </Button>
  )
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

  createEffect(() => {
    if (props.html !== undefined || props.code !== undefined) {
      queueMicrotask(updateExpandable)
    }
  })

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
            ? 'group relative my-0 overflow-hidden border-t border-border/70 bg-card/30'
            : 'group relative my-4 overflow-hidden border border-border/70 rounded-xl bg-card/40 shadow-xs',
        props.class,
      )}
      style={props.style}
    >
      <Show when={hasHeader()}>
        <div class="px-3 py-1.5 border-b border-border/60 bg-muted/40 flex h-10 items-center justify-between">
          <div class="text-xs text-muted-foreground font-mono flex gap-2 truncate items-center">
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
            updateExpandable()
          }}
          class={cn(
            'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent overscroll-x-contain h-full overflow-x-auto',
            isExpandable() && !isExpanded() && 'pointer-events-none',
          )}
          inert={isExpandable() && !isExpanded() ? true : undefined}
        >
          <Show
            when={props.html}
            fallback={
              <pre class="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent text-sm leading-relaxed font-mono m-0 p-4 overflow-x-auto">
                <code class={props.lang ? `language-${props.lang}` : undefined}>
                  {props.code ?? props.children}
                </code>
              </pre>
            }
          >
            {(html) => (
              <div
                class="text-sm leading-relaxed font-mono p-4 overflow-x-auto [&_pre]:m-0 [&_pre]:p-0 [&_pre]:border-0! [&_pre]:rounded-none! [&_pre]:bg-transparent!"
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
              class="text-xs border-border/80 rounded-lg bg-background/95 shadow-xs bottom-3 left-1/2 absolute backdrop-blur-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 -translate-x-1/2"
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
              class="text-xs border-border/80 rounded-lg bg-background/95 shadow-xs bottom-3 left-1/2 absolute backdrop-blur-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 -translate-x-1/2"
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
