import { createSignal, Show } from 'solid-js'
import type { JSX } from 'solid-js'

import { Button } from '../../src'

// ── DemoSection with source code preview ───────────────────────────────

export interface DemoSectionProps {
  title: string
  description: string
  code?: string
  children: JSX.Element
}

export const DemoSection = (props: DemoSectionProps) => {
  const [showCode, setShowCode] = createSignal(false)

  return (
    <section class="border border-zinc-200/80 rounded-2xl bg-white/80 shadow-sm relative overflow-hidden backdrop-blur-sm">
      <div class="p-5">
        <div class="mb-4">
          <h2 class="text-sm text-zinc-600 tracking-[0.16em] font-semibold uppercase">
            {props.title}
          </h2>
          <p class="text-sm text-zinc-600 mt-1">{props.description}</p>
        </div>
        {props.children}
      </div>

      <Show when={props.code}>
        <Button
          variant="ghost"
          classes={{
            base: [
              'absolute end-2 top-2',
              showCode() ? 'bg-zinc-100 text-zinc-800' : 'text-zinc-500 hover:text-zinc-600',
            ],
          }}
          onClick={() => setShowCode((v) => !v)}
          leading="i-lucide:code-xml"
        >
          Source
        </Button>

        <Show when={showCode()}>
          {/* eslint-disable-next-line solid/no-innerhtml -- shiki HTML generated at build time */}
          <div
            class="text-xs leading-relaxed b-t border-zinc-100 overflow-x-auto [&_pre]:(m-0 p-4 bg-transparent)"
            // oxlint-disable-next-line solid/no-innerhtml
            innerHTML={props.code}
          />
        </Show>
      </Show>
    </section>
  )
}
