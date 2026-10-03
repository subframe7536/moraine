import { Button, Icon, cn } from '../../../../../src'
import { createClipboardCopy } from '../../../hooks/create-clipboard-copy'

export function extractCodeText(element?: HTMLElement): string {
  if (!element) {
    return ''
  }
  const codeEl = element.querySelector('code')
  return codeEl?.textContent ?? element.textContent ?? ''
}

export function CopyButton(props: { code?: string; getTarget?: () => HTMLElement | undefined }) {
  const clipboard = createClipboardCopy()
  const copied = () => clipboard.state() === 'copied'
  const label = () =>
    copied()
      ? 'Copied to clipboard'
      : clipboard.state() === 'failed'
        ? 'Copy failed; try again'
        : 'Copy code'
  const handleCopy = () => {
    const text = props.code ?? extractCodeText(props.getTarget?.())
    if (text) {
      return clipboard.copy(text)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={label()}
      title={label()}
      onClick={handleCopy}
      class="text-muted-foreground rounded-md size-7 transition-colors hover:text-foreground hover:bg-muted/80"
    >
      <Icon
        name={copied() ? 'i-lucide:check' : 'i-lucide:copy'}
        class={cn('size-3.5', copied() && 'text-primary')}
      />
    </Button>
  )
}
