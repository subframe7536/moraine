import { FormField, Select } from '@src'
import type { SelectT } from '@src'
import { createSignal } from 'solid-js'

const REGIONS: SelectT.Item<string>[] = [
  {
    label: 'North America',
    children: [
      { label: 'US East (N. Virginia)', value: 'us-east-1' },
      { label: 'US West (Oregon)', value: 'us-west-2' },
      { label: 'Canada (Central)', value: 'ca-central-1' },
    ],
  },
  {
    label: 'Europe',
    children: [
      { label: 'EU (Frankfurt)', value: 'eu-central-1' },
      { label: 'EU (Ireland)', value: 'eu-west-1' },
      { label: 'EU (London)', value: 'eu-west-2' },
    ],
  },
  {
    label: 'Asia Pacific',
    children: [
      { label: 'Asia (Tokyo)', value: 'ap-northeast-1' },
      { label: 'Asia (Singapore)', value: 'ap-southeast-1' },
      { label: 'Asia (Sydney)', value: 'ap-southeast-2' },
    ],
  },
]

export function Collections() {
  const [region, setRegion] = createSignal('us-east-1')

  return (
    <div class="max-w-sm w-full">
      <FormField
        label="Deployment Region"
        description="Choose the closest primary region for low latency."
      >
        <Select<string>
          search
          options={REGIONS}
          value={region()}
          onChange={(val) => val && setRegion(val)}
          placeholder="Select a region..."
        />
      </FormField>
    </div>
  )
}
