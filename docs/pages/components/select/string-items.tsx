import { Select } from '@src'
import type { SelectT } from '@src'

const MIXED_REGIONS: SelectT.Entry[] = [
  'us-east-1',
  { value: 'eu-west-1', label: 'eu-west-1', description: 'Ireland' },
  {
    type: 'group',
    label: 'Asia Pacific',
    items: ['ap-northeast-1', { value: 'ap-south-1', label: 'ap-south-1', disabled: true }],
  },
]

export function StringItems() {
  return (
    <div class="flex flex-col gap-3 max-w-xs w-full">
      <Select
        aria-label="Deploy region"
        items={['us-east-1', 'eu-west-1', 'ap-northeast-1']}
        defaultValue="us-east-1"
        allowClear
      />
      <Select
        aria-label="Deploy region with groups"
        items={MIXED_REGIONS}
        placeholder="Choose a region..."
        allowClear
      />
    </div>
  )
}
