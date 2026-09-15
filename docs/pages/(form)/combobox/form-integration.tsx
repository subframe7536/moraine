import { Combobox } from '@src'

export function FormIntegration() {
  return (
    <form class="max-w-xs space-y-2">
      <Combobox
        name="framework"
        required
        defaultValue="solid"
        items={[
          { label: 'SolidJS', value: 'solid' },
          { label: 'Vue', value: 'vue' },
          { label: 'React', value: 'react' },
        ]}
      />
      <div class="flex gap-2">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </form>
  )
}
