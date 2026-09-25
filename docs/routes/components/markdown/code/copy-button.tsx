import { createSignal, onCleanup } from 'solid-js'

import { Button, Icon, cn } from '../../../../../src'

export function extractCodeText(element?: HTMLElement): string {
  if (!element) {
    return ''
  }
  const codeEl = element.querySelector('code')
  return codeEl?.textContent ?? element.textContent ?? ''
}

export function CopyButton(props: { code?: string; getTarget?: () => HTMLElement | undefined }) {
  const [copied, setCopied] = createSignal(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })

  const handleCopy = async () => {
    const text = props.code ?? extractCodeText(props.getTarget?.())
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy code:', e)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={copied() ? 'Copied to clipboard' : 'Copy code'}
      title={copied() ? 'Copied' : 'Copy code'}
      onClick={handleCopy}
      class="text-muted-foreground size-7 transition-colors rounded-md hover:text-foreground hover:bg-muted/80"
    >
      <Icon
        name={copied() ? 'i-lucide:check' : 'i-lucide:copy'}
        class={cn('size-3.5', copied() && 'text-primary')}
      />
    </Button>
  )
}
