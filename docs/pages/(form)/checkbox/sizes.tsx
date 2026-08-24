import { Checkbox } from '@src'

export function Sizes() {
  return (
    <div class="flex flex-col gap-3 max-w-xl">
      <Checkbox
        size="sm"
        label="Select order #4819 for batch export"
        description="Small compact row checkbox (sm)"
        defaultChecked
      />
      <Checkbox
        size="md"
        label="Allow team members to edit this workspace"
        description="Standard form field size with regular line height (md)"
        defaultChecked
      />
      <Checkbox
        size="lg"
        label="Confirm production deployment to 12 edge regions"
        description="Prominent action checkbox with larger hit target (lg)"
      />
    </div>
  )
}
