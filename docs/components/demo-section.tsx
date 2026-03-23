import { Show } from 'solid-js'
import type { JSX } from 'solid-js'

import { ShikiCodeBlock } from './shiki-code-block'

export interface DemoSectionProps {
  title: string
  description: string
  code?: string
  children: JSX.Element
}

export const DemoSection = (props: DemoSectionProps) => {
  return (
    <section class="relative space-y-4">
      <div class="space-y-1">
        <h2 class="text-lg">{props.title}</h2>
        <p class="text-sm text-muted-foreground">{props.description}</p>
      </div>
      <div class="border border-border rounded-2xl bg-background shadow-sm overflow-hidden">
        <div class="p-6 flex items-center justify-center">{props.children}</div>
        <Show when={props.code}>
          <ShikiCodeBlock html={props.code} class="border-t border-border bg-muted/70" />
        </Show>
      </div>
    </section>
  )
}
