import { FormField, MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

const TECH_GROUPS: MultiSelectT.Item[] = [
  {
    label: 'Frontend Frameworks',
    children: [
      { label: 'TypeScript', value: 'ts' },
      { label: 'SolidJS', value: 'solid' },
      { label: 'Tailwind CSS', value: 'tailwind' },
    ],
  },
  {
    label: 'Backend & Systems',
    children: [
      { label: 'Rust', value: 'rust' },
      { label: 'Go', value: 'go' },
      { label: 'Node.js', value: 'node' },
    ],
  },
]

export function LargeCollections() {
  const [selected, setSelected] = createSignal(['ts', 'solid'])

  return (
    <div class="max-w-md w-full">
      <FormField label="Technology Stack" description="Grouped tags with multi-selection support.">
        <MultiSelect
          placeholder="Choose technologies..."
          options={TECH_GROUPS}
          value={selected()}
          onChange={setSelected}
          allowClear
        />
      </FormField>
    </div>
  )
}
