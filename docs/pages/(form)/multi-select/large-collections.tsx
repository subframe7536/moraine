import { MultiSelect } from '@src'

const TECH_GROUPS = [
  {
    label: 'Frontend',
    items: [
      { label: 'TypeScript', value: 'ts' },
      { label: 'SolidJS', value: 'solid' },
      { label: 'Tailwind CSS', value: 'tailwind' },
    ],
  },
  {
    label: 'Backend',
    items: [
      { label: 'Rust', value: 'rust' },
      { label: 'Go', value: 'go' },
      { label: 'Node.js', value: 'node' },
    ],
  },
]

export function LargeCollections() {
  return (
    <div class="max-w-md w-full">
      <MultiSelect
        search
        label="Technology stack"
        placeholder="Choose technologies..."
        items={TECH_GROUPS}
        defaultValue={['ts', 'solid']}
      />
    </div>
  )
}
