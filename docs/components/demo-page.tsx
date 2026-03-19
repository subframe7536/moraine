import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'

import { Badge } from '../../src'

import { PropsTable } from './props-table'
import type { ComponentPropsDoc } from './props-table'

// ── Types ────────────────────────────────────────────────────────────

interface ComponentIndexEntry {
  name: string
  key: string
  category: string
  description?: string
  sourcePath?: string
  polymorphic: boolean
}

interface ComponentApiDoc {
  component: ComponentIndexEntry
  slots: string[]
  props: ComponentPropsDoc
}

export interface DemoPageProps {
  componentKey: string
  /** Auto-injected by vite-plugin-demo-source at build time */
  apiDoc?: ComponentApiDoc
  children: JSX.Element
}

export const DemoPage = (props: DemoPageProps) => {
  const component = () => props.apiDoc?.component
  const propsDoc = () => props.apiDoc?.props ?? { own: [], inherited: [] }
  const slots = () => props.apiDoc?.slots ?? []

  const hasProps = () => {
    const data = propsDoc()
    return data.own.length > 0 || data.inherited.length > 0
  }

  return (
    <main class="text-zinc-900 p-6 min-h-screen w-full sm:p-10">
      <div class="mx-auto flex flex-col gap-8 max-w-5xl">
        <header class="text-foreground">
          <div class="flex flex-wrap gap-2 items-center">
            <Show when={component()?.category}>
              <p class="text-sm text-zinc-700 tracking-[0.22em] uppercase">
                {component()!.category}
              </p>
            </Show>
            <Show when={component()?.polymorphic}>
              <Badge>Polymorphic</Badge>
            </Show>
          </div>
          <h1 class="text-2xl font-semibold mt-2 sm:text-3xl">
            <Show when={component()?.name} fallback={props.componentKey}>
              {component()!.name}
            </Show>
          </h1>
          <Show when={component()?.description}>
            <p class="text-sm text-zinc-600 mt-2 max-w-2xl sm:text-base">
              {component()!.description}
            </p>
          </Show>
          <Show when={component()?.sourcePath}>
            <p class="text-xs text-zinc-500 font-mono mt-3">{component()!.sourcePath}</p>
          </Show>
        </header>

        {props.children}

        <Show when={slots().length > 0}>
          <section>
            <h2 class="text-sm text-zinc-600 tracking-[0.16em] font-semibold mb-4 uppercase">
              Slots
            </h2>
            <div class="flex flex-wrap gap-2">
              <For each={slots()}>{(slot) => <Badge>{slot}</Badge>}</For>
            </div>
          </section>
        </Show>

        <Show when={hasProps()}>
          <section>
            <h2 class="text-sm text-zinc-600 tracking-[0.16em] font-semibold mb-4 uppercase">
              Props
            </h2>
            <PropsTable props={propsDoc()} />
          </section>
        </Show>
      </div>
    </main>
  )
}
