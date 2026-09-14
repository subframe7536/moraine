import { Select } from '@src'
import type { SelectT } from '@src'

export function GroupedOptions() {
  const REGION_OPTIONS: SelectT.Entry[] = [
    {
      label: 'Americas',
      type: 'group' as const,
      items: [
        { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
        { label: 'America/Chicago (UTC-6)', value: 'America/Chicago' },
        { label: 'America/Los_Angeles (UTC-8)', value: 'America/Los_Angeles' },
        { label: 'America/Sao_Paulo (UTC-3)', value: 'America/Sao_Paulo' },
      ],
    },
    {
      label: 'Europe',
      type: 'group' as const,
      items: [
        { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
        { label: 'Europe/Frankfurt (UTC+1)', value: 'Europe/Frankfurt' },
        { label: 'Europe/Paris (UTC+1)', value: 'Europe/Paris' },
      ],
    },
    {
      label: 'Asia Pacific',
      type: 'group' as const,
      items: [
        { label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
        { label: 'Asia/Singapore (UTC+8)', value: 'Asia/Singapore' },
        { label: 'Australia/Sydney (UTC+11)', value: 'Australia/Sydney' },
      ],
    },
  ]

  return (
    <div class="w-80 space-y-2">
      <label class="text-xs text-muted-foreground font-medium block">Workspace Timezone</label>
      <Select
        items={REGION_OPTIONS}
        defaultValue="Europe/London"
        placeholder="Select timezone..."
      />
    </div>
  )
}
