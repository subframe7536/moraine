import type { JSX } from '@solidjs/web'

export function renderWithProps<TProps extends object = Record<string, never>>(
  value: JSX.Element | ((props: TProps) => JSX.Element),
  props?: TProps,
): JSX.Element {
  if (typeof value === 'function') {
    return value((props ?? {}) as TProps)
  }

  return value
}
