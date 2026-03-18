import type { JSX } from 'solid-js'
import { For, Show, createSignal } from 'solid-js'

import type { PropDoc } from '../vite-plugin/api-doc'

export interface PropsTableProps {
  props: ComponentPropsDoc
}

export interface InheritedGroupDoc {
  from: string
  props: PropDoc[]
}

export interface ComponentPropsDoc {
  own: PropDoc[]
  inherited: InheritedGroupDoc[]
}

export function PropsTable(props: PropsTableProps): JSX.Element {
  return (
    <div class="bg-background flex flex-col gap-4">
      <Show when={props.props.own.length > 0}>
        <PropRows props={props.props.own} />
      </Show>

      <For each={props.props.inherited}>{(group) => <InheritedGroup group={group} />}</For>
    </div>
  )
}

function normalizeType(type: string): string {
  if (type.endsWith('T.Classes')) {
    return `Partial<Record<${type.split('T.')[0]}Slots, ClassValue>>`
  }
  if (type.endsWith('T.Styles')) {
    return `Partial<Record<${type.split('T.')[0]}Slots, JSX.CSSProperties>>`
  }
  return type
}

function PropRows(tableProps: { props: PropDoc[] }): JSX.Element {
  return (
    <div class="b-1 b-zinc-200/80 rounded-lg overflow-x-auto">
      <table class="text-sm w-full border-collapse">
        <thead>
          <tr class="text-xs text-zinc-500 tracking-wider text-left bg-zinc-50 uppercase">
            <th class="font-medium px-3 py-2">Prop</th>
            <th class="font-medium px-3 py-2">Type</th>
            <th class="font-medium px-3 py-2">Default</th>
            <th class="font-medium px-3 py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          <For each={tableProps.props}>
            {(prop) => (
              <tr class="b-t b-zinc-100 hover:bg-zinc-50/50">
                <td class="text-xs text-primary font-mono px-3 py-2 whitespace-nowrap">
                  {prop.name}
                  {prop.required ? '*' : ''}
                </td>
                <td class="px-3 py-2">
                  <code class="text-xs text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-100">
                    {normalizeType(prop.type)}
                  </code>
                </td>
                <td class="text-xs text-zinc-500 px-3 py-2">
                  <Show when={prop.defaultValue} fallback={<span class="text-zinc-300">—</span>}>
                    <code class="px-1.5 py-0.5 rounded bg-zinc-100">{prop.defaultValue}</code>
                  </Show>
                </td>
                <td class="text-zinc-600 px-3 py-2">
                  <Show when={prop.description} fallback={<span class="text-zinc-300">—</span>}>
                    {prop.description}
                  </Show>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}

function InheritedGroup(groupProps: { group: InheritedGroupDoc }): JSX.Element {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <button
        type="button"
        class="text-xs text-zinc-500 flex gap-1.5 cursor-pointer transition-colors items-center hover:text-zinc-700"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          class="inline-block transition-transform"
          style={{ transform: open() ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        Inherited from <code class="text-zinc-600 font-mono">{groupProps.group.from}</code>
        <span class="text-zinc-400">({groupProps.group.props.length})</span>
      </button>

      <Show when={open()}>
        <div class="mt-2">
          <PropRows props={groupProps.group.props} />
        </div>
      </Show>
    </div>
  )
}
