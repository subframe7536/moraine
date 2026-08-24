import { CheckboxGroup } from '@src'

const REGIONS = [
  { value: 'us-east', label: 'US East (N. Virginia)', description: 'Primary edge cluster' },
  { value: 'eu-central', label: 'EU Central (Frankfurt)', description: 'Low latency Europe' },
  { value: 'ap-east', label: 'AP East (Tokyo)', description: 'Asia-Pacific gateway' },
]

const PLATFORMS = [
  { value: 'macos', label: 'macOS', description: 'Apple Silicon & Intel' },
  { value: 'linux', label: 'Linux', description: 'x86_64 and arm64' },
  { value: 'windows', label: 'Windows', description: 'Windows 10/11' },
]

export function Orientation() {
  return (
    <div class="gap-4 grid md:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-xl space-y-2">
        <CheckboxGroup
          legend="Deployment regions (Vertical)"
          items={REGIONS}
          defaultValue={['us-east', 'eu-central']}
        />
      </div>
      <div class="p-4 b-(1 border) rounded-xl space-y-2">
        <CheckboxGroup
          legend="Supported platforms (Horizontal)"
          items={PLATFORMS}
          orientation="horizontal"
          defaultValue={['macos', 'linux']}
          classes={{
            fieldset: 'flex-wrap',
            item: 'min-w-28 flex-1',
          }}
        />
      </div>
    </div>
  )
}
