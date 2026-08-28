import { Select } from '@src'

const TIMEZONES = Array.from({ length: 50 }, (_, i) => ({
  label: `GMT+${i % 12}:00 - Region ${i + 1}`,
  value: `tz-${i + 1}`,
}))

export function Collections() {
  return (
    <div class="max-w-xs w-full">
      <Select
        search
        virtualized
        label="Timezone"
        placeholder="Search timezones..."
        items={TIMEZONES}
        defaultValue="tz-1"
      />
    </div>
  )
}
