import { Field, Input } from '@src'
import { createMemo, createSignal, For, Show } from 'solid-js'

const PROJECTS = ['Atlas design system', 'Billing portal', 'Customer dashboard', 'Release tracker']

export function ControlledInput() {
  const [query, setQuery] = createSignal('')
  const matches = createMemo(() =>
    PROJECTS.filter((project) => project.toLowerCase().includes(query().trim().toLowerCase())),
  )

  return (
    <div class="max-w-md w-full space-y-3">
      <Field label="Find a project">
        <Input value={query()} onValueChange={setQuery} placeholder="Search projects..." />
      </Field>
      <Show when={matches().length} fallback={<p class="text-sm">No matching projects.</p>}>
        <ul class="divide-border divide-y text-sm">
          <For each={matches()}>{(project) => <li class="py-2">{project}</li>}</For>
        </ul>
      </Show>
    </div>
  )
}
