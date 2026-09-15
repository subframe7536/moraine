import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import type { BaseSelectT } from '../base-select.types.ts'
import { useSearchValue } from '../utils.ts'

import { filterView, labelString } from './collection.ts'
import type { SearchProps, SelectView } from './types.ts'

export function useComboboxSearch<T extends BaseSelectT.Item>(
  props: SearchProps<T>,
  enabled: Accessor<boolean>,
  source: Accessor<SelectView<T>>,
  resolve: Accessor<((item: T) => string) | undefined>,
) {
  const { query, setQuery } = useSearchValue(props)
  const view = createMemo(() => {
    if (!enabled() || props.filterItem === false || !query()) {
      return source()
    }
    const input = query().toLowerCase()
    return filterView(source(), (item) => {
      if (typeof props.filterItem === 'function') {
        return props.filterItem(query(), item)
      }
      const text = labelString(item, resolve()).toLowerCase()
      if (props.filterItem === 'startsWith') {
        return text.startsWith(input)
      }
      if (props.filterItem === 'endsWith') {
        return text.endsWith(input)
      }
      return text.includes(input)
    })
  })
  return { query, setQuery, view }
}
