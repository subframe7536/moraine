import { Icon, Input, InputGroup } from '@src'

export function Alignment() {
  return (
    <div class="gap-4 grid max-w-md w-full">
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:globe" />
          https://
        </InputGroup.Leading>
        <Input aria-label="Website" placeholder="example.com" />
        <InputGroup.Trailing>.com</InputGroup.Trailing>
      </InputGroup>
      <InputGroup orientation="vertical">
        <InputGroup.Leading>Project website</InputGroup.Leading>
        <Input aria-label="Website details" placeholder="example.com" />
        <InputGroup.Trailing>Use your public domain.</InputGroup.Trailing>
      </InputGroup>
      <InputGroup dir="rtl">
        <InputGroup.Leading>
          <Icon name="i-lucide:search" />
        </InputGroup.Leading>
        <Input aria-label="Search" placeholder="بحث..." />
        <InputGroup.Trailing>١٢ نتيجة</InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
