import { CopyButton as MoraineCopyButton } from '../../../../../src'

export function extractCodeText(element?: HTMLElement): string {
  if (!element) {
    return ''
  }
  const codeEl = element.querySelector('code')
  return codeEl?.textContent ?? element.textContent ?? ''
}

export function CopyButton(props: { code?: string; getTarget?: () => HTMLElement | undefined }) {
  return (
    <MoraineCopyButton value={() => props.code ?? extractCodeText(props.getTarget?.())} size="xs" />
  )
}
