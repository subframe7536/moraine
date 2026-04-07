import { Button, IconButton, cn } from '@src'
import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'

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
    if (!contentRef) {
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
      class={cn(
        isSource()
          ? 'group b-(1 border) rounded-xl bg-muted/40 relative overflow-hidden'
          : 'relative',
        props.class,
      )}
      style={props.style}
    >
      <Show
        when={props.html}
        fallback={
          <pre class="text-sm leading-relaxed m-0 p-4 bg-transparent overflow-x-auto">
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

            {/* eslint-disable-next-line solid/no-innerhtml -- shiki HTML generated at build time */}
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
                  'text-sm leading-relaxed bg-muted/70 h-full transition-height duration-300 ease-in-out [scrollbar-width:none] [&_code]:font-mono [&_pre]:(m-0 p-4 min-w-max) [&::-webkit-scrollbar]:hidden',
                  isExpandable() && !isExpanded() ? 'overflow-hidden' : 'overflow-auto',
                )}
                // oxlint-disable-next-line subf/solid-no-innerhtml
                innerHTML={html()}
              />

              <Show when={isExpandable() && !isExpanded()}>
                <div class="pointer-events-none inset-0 top-2 absolute from-background to-transparent bg-gradient-to-t" />
              </Show>

              <Show when={isExpandable() && !isExpanded()}>
                <Button
                  variant="outline"
                  aria-label="Expand code"
                  onClick={() => setIsExpanded(true)}
                  classes={{ root: 'absolute bottom-2 left-1/2 translate--1/2' }}
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
