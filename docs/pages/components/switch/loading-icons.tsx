import { Switch } from '@src'

export function LoadingIcons() {
  return (
    <div class="max-w-sm space-y-3">
      <Switch
        checked
        loading
        label="Sync preferences"
        description="The visual loading state is supplied by the application."
        checkedIcon="i-lucide:cloud-check"
        uncheckedIcon="i-lucide:cloud-off"
      />
      <Switch
        defaultChecked
        label="Use dark theme"
        checkedIcon="i-lucide:moon"
        uncheckedIcon="i-lucide:sun"
      />
    </div>
  )
}
