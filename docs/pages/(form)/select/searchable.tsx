import { Select } from '@src'
import type { SelectT } from '@src'

export function Searchable() {
  const COUNTRIES: SelectT.Item[] = [
    { label: 'United States (USD $)', value: 'US', icon: 'i-lucide:dollar-sign' },
    { label: 'European Union (EUR €)', value: 'EU', icon: 'i-lucide:euro' },
    { label: 'United Kingdom (GBP £)', value: 'GB', icon: 'i-lucide:pound-sterling' },
    { label: 'Japan (JPY ¥)', value: 'JP', icon: 'i-lucide:japanese-yen' },
    { label: 'Canada (CAD $)', value: 'CA', icon: 'i-lucide:dollar-sign' },
    { label: 'Australia (AUD $)', value: 'AU', icon: 'i-lucide:dollar-sign' },
    { label: 'Switzerland (CHF)', value: 'CH', icon: 'i-lucide:coins' },
  ]

  return (
    <div class="w-80 space-y-2">
      <label class="text-xs text-muted-foreground font-medium block">
        Billing Country & Currency
      </label>
      <Select
        options={COUNTRIES}
        search
        leadingIcon="i-lucide-search"
        placeholder="Search country or currency..."
        defaultValue="US"
      />
    </div>
  )
}
