import { InputNumber } from '@src'

export function Stepping() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <InputNumber defaultValue={100} step={5} largeStep={25} label="Step by 5 (PageUp: 25)" />
      <InputNumber
        defaultValue={0.5}
        step={0.1}
        minValue={0}
        maxValue={1}
        label="Decimal step (0.1)"
      />
    </div>
  )
}
