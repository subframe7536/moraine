import { Button, Icon, InputGroup, Textarea } from '@src'

export function TextareaEditor() {
  return (
    <InputGroup orientation="vertical" class="max-w-md w-full">
      <InputGroup.Leading>
        <Icon name="i-lucide:file-code-2" />
        <span class="font-medium font-mono">script.js</span>
        <Button type="button" variant="ghost" size="icon-xs" class="ms-auto">
          <Icon name="i-lucide:refresh-cw" />
          <span class="sr-only">Refresh</span>
        </Button>
        <Button type="button" variant="ghost" size="icon-xs">
          <Icon name="i-lucide:copy" />
          <span class="sr-only">Copy</span>
        </Button>
      </InputGroup.Leading>
      <Textarea
        id="input-group-code-editor"
        aria-label="JavaScript source"
        placeholder="console.log('Hello, world!');"
        class="font-mono min-h-50"
      />
      <InputGroup.Trailing>
        <span>Line 1, Column 1</span>
        <Button type="button" size="sm" class="ms-auto" trailing="i-lucide:corner-down-left">
          Run
        </Button>
      </InputGroup.Trailing>
    </InputGroup>
  )
}
