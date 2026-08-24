import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

export function MultipleSelect() {
  const TEAM_MEMBERS: MultiSelectT.Item[] = [
    { label: 'Alex Morgan (Tech Lead)', value: 'alex', icon: 'i-lucide:user-check' },
    { label: 'Sarah Chen (Product Designer)', value: 'sarah', icon: 'i-lucide:palette' },
    { label: 'Jordan Lee (Backend Engineer)', value: 'jordan', icon: 'i-lucide:server' },
    { label: 'Marcus Vance (DevOps)', value: 'marcus', icon: 'i-lucide:cpu' },
    { label: 'Elena Rostova (Contractor - Inactive)', value: 'elena', disabled: true },
  ]

  const [assignees, setAssignees] = createSignal<MultiSelectT.Value[]>(['alex', 'sarah'])

  return (
    <div class="w-96 space-y-3">
      <label class="text-xs text-muted-foreground font-medium block">
        Assign reviewers to pull request
      </label>
      <MultiSelect
        options={TEAM_MEMBERS}
        value={assignees()}
        onChange={setAssignees}
        placeholder="Select team members..."
        allowClear
        classes={{ control: 'w-full' }}
      />
      <p class="text-xs text-muted-foreground">
        Assigned ({assignees().length}):{' '}
        <span class="text-foreground font-medium">{assignees().join(', ') || 'none'}</span>
      </p>
    </div>
  )
}
