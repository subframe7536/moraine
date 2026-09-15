import { Select } from '@src'

const frameworks = [
  { value: 'solid', label: 'Solid' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
]

export default function Example() {
  return (
    <Select
      search
      items={frameworks}
      placeholder="Search frameworks…"
      class="min-w-52"
    />
  )
}
