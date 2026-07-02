import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'

import { Button, IconButton, cn } from '../../src'

const COPY_SUCCESS_TIMEOUT_MS = 3000
const COLLAPSED_HEIGHT_PX = 150
const EXPANDED_HEIGHT_PX = 400

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

function extractCodeText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const text = doc.querySelector('pre code')?.textContent ?? doc.body.textContent ?? ''
  return text
}

async function copyCode(html: string): Promise<void> {
  const plainText = extractCodeText(html)

  if (typeof ClipboardItem !== 'undefined') {
    const item = new ClipboardItem({
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
      'text/html': new Blob([html], { type: 'text/html' }),
    })
    await navigator.clipboard.write([item])
    await wait(COPY_SUCCESS_TIMEOUT_MS)
    return
  }

  await navigator.clipboard.writeText(plainText)
  await wait(COPY_SUCCESS_TIMEOUT_MS)
}

export type ShikiCodeBlockVariant = 'plain' | 'source'

export interface ShikiCodeBlockProps {
  html?: string
  lang?: string
  class?: string
  style?: JSX.CSSProperties
  variant?: ShikiCodeBlockVariant
  children?: JSX.Element
}

export const ShikiCodeBlock = (props: ShikiCodeBlockProps) => {
  const isSource = () => props.variant === 'source'
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
    if (!isSource()) {
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
    if (props.html === undefined) {
      return
    }

    queueMicrotask(updateExpandable)
  })

  onMount(() => {
    const observer = new ResizeObserver(() => {
      updateExpandable()
    })

    if (contentRef) {
      observer.observe(contentRef)
    }

    onCleanup(() => {
      observer.disconnect()
    })
  })

  return (
    <div
      class={cn(isSource() ? 'group docs-code-block-source' : 'docs-code-block', props.class)}
      style={props.style}
    >
      <Show
        when={props.html}
        fallback={
          <pre class="text-sm leading-relaxed m-0 p-4 bg-muted/55 overflow-x-auto">
            <code class="font-mono">{props.children}</code>
          </pre>
        }
      >
        {(html) => (
          <>
            <IconButton
              name="i-lucide:copy"
              loadingIcon="i-lucide:check"
              size="md"
              classes={{
                root: 'text-muted-foreground p-1.5 end-2 top-2 absolute z-2 transition-colors duration-300 hover:(text-foreground bg-background)',
              }}
              loadingAuto
              onClick={() => copyCode(html())}
            />

            <div
              class="transition-[height] duration-300 ease-in-out relative overflow-hidden"
              style={{ height: viewportHeight() }}
            >
              <div
                ref={(el) => {
                  contentRef = el
                  updateExpandable()
                }}
                class={cn(
                  'docs-code-block-inner h-full transition-height duration-300 ease-in-out [&_code]:font-mono',
                  isExpandable() && !isExpanded() ? 'overflow-hidden' : 'overflow-auto',
                )}
                // oxlint-disable-next-line subf/solid-no-innerhtml
                innerHTML={html().replace(/^<pre/, '<pre tabindex="-1"')}
              />

              <Show when={isExpandable() && !isExpanded()}>
                <div class="pointer-events-none inset-0 top-2 absolute from-background to-transparent bg-gradient-to-t" />
              </Show>

              <Show when={isSource() && isExpandable() && !isExpanded()}>
                <Button
                  variant="outline"
                  aria-label="Expand code"
                  onClick={() => setIsExpanded(true)}
                  class={'translate--1/2 bottom-2 left-1/2 absolute'}
                >
                  Expand code
                </Button>
              </Show>
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
