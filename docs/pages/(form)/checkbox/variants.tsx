import { Checkbox } from '@src'

export function Variants() {
  return (
    <div class="gap-8 grid sm:grid-cols-2">
      <div class="space-y-3">
        <Checkbox label="List / start" description="Default list style" defaultChecked />
        <Checkbox
          label="List / end"
          description="Indicator at the end"
          indicator="end"
          defaultChecked
        />
        <Checkbox
          label="List / hidden"
          description="Only text, no visible indicator"
          indicator="hidden"
          defaultChecked
        />
      </div>

      <div class="space-y-3">
        <Checkbox
          variant="card"
          label="Card variant"
          description="Whole card area is clickable"
          defaultChecked
        />
        <Checkbox
          variant="card"
          label="Card / end"
          description="Card with trailing indicator"
          indicator="end"
        />
        <Checkbox variant="card" label="Card / disabled" description="Disabled state" disabled />
      </div>
    </div>
  )
}
