import { Select } from '@src'
import type { SelectT } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const ITEMS: SelectT.Entry[] = [
  {
    type: 'group',
    label: 'Client frameworks',
    items: [
      {
        label: 'SolidJS',
        description: 'Fine-grained reactivity',
        value: 'solid',
        icon: 'i-lucide:atom',
      },
      {
        label: 'Vue.js',
        description: 'Progressive framework',
        value: 'vue',
        icon: 'i-lucide:sparkles',
      },
      { label: 'React', value: 'react', icon: 'i-lucide:box' },
    ],
  },
  { type: 'separator' },
  {
    type: 'group',
    label: 'Compiler-based frameworks',
    items: [
      { label: 'Svelte', value: 'svelte', icon: 'i-lucide:flame' },
      { label: 'Astro', value: 'astro', icon: 'i-lucide:rocket' },
    ],
  },
]

export default function SelectPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'outline',
          options: [
            { label: 'Outline', value: 'outline' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'None', value: 'none' },
          ],
        },
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'allowClear', label: 'Clearable', defaultValue: true },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <Select
          items={ITEMS}
          defaultValue="solid"
          leadingIcon="i-lucide:code"
          placeholder="Select a framework..."
          variant={props.variant}
          size={props.size}
          allowClear={props.allowClear}
          disabled={props.disabled}
          class="max-w-72 min-w-40 w-60%"
        />
      )}
    </DocsPlayground>
  )
}
