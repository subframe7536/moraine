import { Select } from '@src'
import type { SelectT } from '@src'

const TIMEZONE_GROUPS: SelectT.Entry[] = [
  {
    label: 'Americas',
    type: 'group',
    items: [
      { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
      { label: 'America/Chicago (UTC-6)', value: 'America/Chicago' },
      { label: 'America/Los_Angeles (UTC-8)', value: 'America/Los_Angeles' },
      { label: 'America/Sao_Paulo (UTC-3)', value: 'America/Sao_Paulo' },
    ],
  },
  {
    label: 'Europe',
    type: 'group',
    items: [
      { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
      { label: 'Europe/Frankfurt (UTC+1)', value: 'Europe/Frankfurt' },
      { label: 'Europe/Paris (UTC+1)', value: 'Europe/Paris' },
    ],
  },
  {
    label: 'Asia Pacific',
    type: 'group',
    items: [
      { label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
      { label: 'Asia/Singapore (UTC+8)', value: 'Asia/Singapore' },
      { label: 'Australia/Sydney (UTC+11)', value: 'Australia/Sydney' },
    ],
  },
]

export function GroupedItems() {
  return (
    <div class="max-w-xs w-full space-y-2">
      <label class="text-muted-foreground font-medium block text-xs">Workspace Timezone</label>
      <Select
        items={TIMEZONE_GROUPS}
        defaultValue="Europe/London"
        placeholder="Select timezone..."
      />
    </div>
  )
}
