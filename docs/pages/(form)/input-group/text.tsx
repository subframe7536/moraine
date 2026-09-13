import { Input, InputGroup, Textarea } from '@src'

export function TextContent() {
  return (
    <div class="gap-4 grid max-w-sm w-full">
      <InputGroup>
        <InputGroup.Leading>$</InputGroup.Leading>
        <Input aria-label="Amount" inputMode="decimal" placeholder="0.00" />
        <InputGroup.Trailing>USD</InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <InputGroup.Leading compact>https://</InputGroup.Leading>
        <Input aria-label="Website" placeholder="example.com" />
        <InputGroup.Trailing compact>.com</InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <Input aria-label="Username" placeholder="Enter your username" />
        <InputGroup.Trailing>@company.com</InputGroup.Trailing>
      </InputGroup>
      <InputGroup orientation="vertical">
        <Textarea aria-label="Message" placeholder="Enter your message" rows={3} />
        <InputGroup.Trailing>
          <span class="text-xs">120 characters left</span>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
