import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import { IconButton, cn } from '../../src'

const COPY_SUCCESS_TIMEOUT_MS = 3000

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

  return (
    <div
      class={cn(
        isSource()
          ? 'group b-(1 border) rounded-xl bg-muted/70 relative overflow-hidden'
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
                root: [
                  'text-muted-foreground p-1.5 end-2 top-2 absolute z-1 hover:(text-foreground bg-muted)',
                  isSource() &&
                    'opacity-0 pointer-events-none transition-[opacity,colors] focus-visible:(opacity-100 pointer-events-auto) group-hover:(opacity-100 pointer-events-auto)',
                ],
              }}
              loadingAuto
              onClick={() => copyCode(html())}
            />

            {/* eslint-disable-next-line solid/no-innerhtml -- shiki HTML generated at build time */}
            <div
              class="text-sm leading-relaxed overflow-x-auto [&_code]:font-mono [&_pre]:(m-0 p-4)"
              // oxlint-disable-next-line solid/no-innerhtml
              innerHTML={html()}
            />
          </>
        )}
      </Show>
    </div>
  )
}
