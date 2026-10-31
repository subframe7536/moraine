import { Button, Icon, InputGroup, Textarea } from '@src'

export function TextareaEditor() {
  return (
    <div class="max-w-md w-full">
      <InputGroup orientation="vertical">
        <InputGroup.Leading>
          <div class="flex gap-2 w-full items-center">
            <Icon name="i-lucide:file-code-2" />
            <span class="font-medium font-mono">script.js</span>
            <div class="ms-auto flex gap-1 items-center">
              <Button type="button" variant="ghost" size="icon-sm">
                <Icon name="i-lucide:refresh-cw" />
                <span class="sr-only">Refresh</span>
              </Button>
              <Button type="button" variant="ghost" size="icon-sm">
                <Icon name="i-lucide:copy" />
                <span class="sr-only">Copy</span>
              </Button>
            </div>
          </div>
        </InputGroup.Leading>
        <Textarea
          id="input-group-code-editor"
          aria-label="JavaScript source"
          placeholder="console.log('Hello, world!');"
          rows={8}
        />
        <InputGroup.Trailing>
          <div class="flex gap-2 w-full items-center justify-between">
            <span>Line 1, Column 1</span>
            <Button type="button" size="sm" trailing="i-lucide:corner-down-left">
              Run
            </Button>
          </div>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
