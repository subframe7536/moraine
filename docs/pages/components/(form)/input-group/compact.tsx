import { Button, Icon, Input, InputGroup } from '@src'
import { createSignal } from 'solid-js'

export function Compact() {
  const [txt, setTxt] = createSignal('')
  return (
    <InputGroup class="max-w-sm w-full">
      <InputGroup.Leading>https://</InputGroup.Leading>
      <Input aria-label="Website" placeholder="example.com" value={txt()} onValueChange={setTxt} />
      <InputGroup.Trailing compact>
        <Button size="icon-xs" variant="ghost" onClick={() => setTxt('')}>
          <Icon name="i-lucide:x" />
        </Button>
      </InputGroup.Trailing>
    </InputGroup>
  )
}
