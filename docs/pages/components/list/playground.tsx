import { List } from '@src'
import { Show } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const TASKS = [
  { id: 'design', title: 'Review onboarding designs', owner: 'Elena' },
  { id: 'billing', title: 'Fix invoice rounding', owner: 'Marcus' },
  { id: 'release', title: 'Draft 0.9 release notes', owner: 'Priya' },
  { id: 'audit', title: 'Rotate staging credentials', owner: 'Ops' },
  { id: 'search', title: 'Index archived projects', owner: 'Jonas' },
  { id: 'support', title: 'Answer escalated tickets', owner: 'Support' },
]

export default function ListPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'count',
          label: 'Items',
          defaultValue: 3,
          options: [
            { label: 'None', value: 0 },
            { label: '3', value: 3 },
            { label: '6', value: 6 },
          ],
        },
        {
          kind: 'select',
          prop: 'as',
          label: 'Root',
          defaultValue: 'ul',
          options: [
            { label: 'ul', value: 'ul' },
            { label: 'ol', value: 'ol' },
          ],
        },
        { kind: 'switch', prop: 'showIndex', label: 'Show index', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="border border-border rounded-md max-w-sm w-full">
          <List
            as={props.as}
            items={TASKS.slice(0, props.count)}
            fallback={<li class="text-sm text-muted-foreground px-3 py-6 text-center">No tasks</li>}
            itemRender={(row) => (
              <li class="px-3 py-2 border-b border-border flex gap-3 items-center last:border-b-0">
                <Show when={props.showIndex}>
                  <span class="text-xs text-muted-foreground font-mono w-4">{row.index + 1}</span>
                </Show>
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">{row.item.title}</div>
                  <div class="text-xs text-muted-foreground">{row.item.owner}</div>
                </div>
              </li>
            )}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
