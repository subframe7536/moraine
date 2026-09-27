import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

const TEAM_MEMBERS: MultiSelectT.Item[] = [
  {
    label: 'Sarah Connor',
    value: 'sarah',
    icon: 'i-lucide:user',
    description: 'sarah@example.com · Admin',
  },
  {
    label: 'Alex Rivera',
    value: 'alex',
    icon: 'i-lucide:user',
    description: 'alex@example.com · Designer',
  },
  {
    label: 'Elena Rostova',
    value: 'elena',
    icon: 'i-lucide:user',
    description: 'elena@example.com · Engineer',
  },
  {
    label: 'David Kim',
    value: 'david',
    icon: 'i-lucide:user',
    description: 'david@example.com · DevOps',
  },
  {
    label: 'Marcus Vance',
    value: 'marcus',
    icon: 'i-lucide:user',
    description: 'marcus@example.com · QA',
  },
]

export function UserChips() {
  return (
    <div class="max-w-md w-full space-y-2">
      <label class="text-muted-foreground font-medium block text-xs">Project Assignees</label>
      <MultiSelect
        items={TEAM_MEMBERS}
        defaultValue={['sarah', 'alex']}
        search
        openOnControlClick
        placeholder="Assign teammates..."
        allowClear
      />
    </div>
  )
}
