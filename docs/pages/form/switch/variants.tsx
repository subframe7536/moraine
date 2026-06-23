import { Switch } from '@src'

export function Variants() {
  return (
    <div class="flex flex-col gap-3 max-w-xl">
      <Switch
        label="Sync in progress"
        description="Loading state"
        loading
        checked
        checkedIcon="i-lucide-check"
        uncheckedIcon="i-lucide-x"
      />
      <Switch
        label="Dark mode"
        description="Custom icons"
        defaultChecked
        checkedIcon="i-lucide-moon-star"
        uncheckedIcon="i-lucide-sun"
      />
      <Switch
        label="Billing lock"
        description="Disabled"
        disabled
        checked
        checkedIcon="i-lucide-lock"
        uncheckedIcon="i-lucide-unlock"
      />
    </div>
  )
}
