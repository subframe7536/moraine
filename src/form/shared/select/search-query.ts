import { useControllableValue } from '../../../shared/use-controllable-value.ts'

/** Controlled or uncontrolled text used to search a collection. */
interface SearchQueryOptions {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  maxLength?: number
}

/** Creates query state without coupling it to an input or collection. */
export function useSearchQuery(options: SearchQueryOptions = {}) {
  const [value, setValue] = useControllableValue<string>({
    value: () => options.value,
    defaultValue: () => options.defaultValue ?? '',
  })

  function updateValue(nextValue: string): string {
    const next = options.maxLength === undefined ? nextValue : nextValue.slice(0, options.maxLength)
    if (next === value()) {
      return next
    }
    setValue(next)
    options.onValueChange?.(next)
    return next
  }

  return { value, setValue: updateValue }
}
