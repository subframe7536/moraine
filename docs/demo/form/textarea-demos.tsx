import { createSignal } from 'solid-js'

import { Textarea } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

export default () => {
  const [value, setValue] = createSignal('Type here to see autoresize...')

  return (
    <DemoPage componentKey="textarea">
      <DemoSection title="Basic" description="Textarea with variants and autoresize.">
        <div class="flex flex-col gap-4 max-w-md">
          <Textarea placeholder="Default outline" />
          <Textarea variant="subtle" placeholder="Subtle variant" />
          <Textarea placeholder="Autoresize" autoresize value={value()} onValueChange={setValue} />
        </div>
      </DemoSection>
    </DemoPage>
  )
}
