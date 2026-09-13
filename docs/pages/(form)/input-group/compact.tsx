import { Input, InputGroup } from '@src'

export function Compact() {
  return (
    <InputGroup class="max-w-sm w-full">
      <InputGroup.Leading compact>https://</InputGroup.Leading>
      <Input aria-label="Website" placeholder="example.com" />
      <InputGroup.Trailing compact>.com</InputGroup.Trailing>
    </InputGroup>
  )
}
