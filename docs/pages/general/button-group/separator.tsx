import { Button, ButtonGroup, Switch } from '@src'
import { createSignal } from 'solid-js'

export function Separator() {
  const [showSeparator, setShowSeparator] = createSignal(true)

  return (
    <div class="flex flex-col gap-4 items-start">
      <Switch label="Show separators" checked={showSeparator()} onChange={setShowSeparator} />

      <ButtonGroup separator={showSeparator()} aria-label="Document actions">
        <Button leading="i-lucide:download">Export</Button>
        <Button leading="i-lucide:share-2">Share</Button>
        <Button leading="i-lucide:archive">Archive</Button>
      </ButtonGroup>
    </div>
  )
}
