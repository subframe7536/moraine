import { Show } from 'solid-js'
import type { JSX } from 'solid-js'

import { Button, Icon } from '../../src'

// ── DemoSection with source code preview ───────────────────────────────

export interface DemoSectionProps {
  title: string
  description: string
  code?: string
  children: JSX.Element
}

export const DemoSection = (props: DemoSectionProps) => {
  return (
    <section class="relative">
      <div class="mb-4">
        <h2 class="text-sm text-zinc-600 tracking-[0.16em] font-semibold uppercase">
          {props.title}
        </h2>
        <p class="text-sm text-zinc-600 mt-1">{props.description}</p>
      </div>
      <div class="border border-zinc-200/80 rounded-xl overflow-hidden backdrop-blur-sm">
        <div class="p-6">{props.children}</div>
        <Show when={props.code}>
          <div class="relative">
            <Button
              size="icon-md"
              variant="ghost"
              classes={{ root: 'absolute end-2 top-2' }}
              loadingAuto
              onClick={() => {
                return navigator.clipboard.write([new ClipboardItem({ 'text/html': props.code! })])
              }}
            >
              {(state) => <Icon name={state.loading ? 'i-lucide:check' : 'i-lucide:copy'} />}
            </Button>

            {/* eslint-disable-next-line solid/no-innerhtml -- shiki HTML generated at build time */}
            <div
              class="text-xs leading-relaxed b-t border-zinc-100 overflow-x-auto [&_pre]:(m-0 p-4 bg-transparent)"
              // oxlint-disable-next-line solid/no-innerhtml
              innerHTML={props.code}
            />
          </div>
        </Show>
      </div>
    </section>
  )
}
