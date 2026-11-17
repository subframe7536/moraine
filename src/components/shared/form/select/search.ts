import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { collatorMatches, createSearchCollator } from '../../../../provider/locale/collator'
import { useLocale } from '../../../../provider/locale/locale-context'
import type { BaseSelectT } from '../../../base-select/base-select.types'

import { filterView, labelString } from './collection'
import { useSearchQuery } from './search-query'
import type { SearchProps, SelectView } from './types'

export function useComboboxSearch<T extends BaseSelectT.Item>(
  props: SearchProps<T>,
  enabled: Accessor<boolean>,
  source: Accessor<SelectView<T>>,
  resolve: Accessor<((item: T) => string) | undefined>,
) {
  const locale = useLocale().locale
  const search = useSearchQuery({
    get value() {
      return props.searchValue
    },
    get defaultValue() {
      return props.defaultSearchValue
    },
    get onValueChange() {
      return props.onSearchValueChange
    },
    get maxLength() {
      return props.searchMaxLength
    },
  })
  const view = createMemo(() => {
    const query = search.value()
    const method = props.filterMethod ?? 'contains'
    if (!enabled() || method === false || !query) {
      return source()
    }
    const collator = createSearchCollator(locale())
    return filterView(source(), (item) => {
      if (typeof method === 'function') {
        return method(query, item)
      }
      return collatorMatches(collator, method, labelString(item, resolve()), query)
    })
  })
  return { ...search, view }
}
