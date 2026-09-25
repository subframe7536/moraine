import { List } from 'moraine'
import type { ListT } from 'moraine'
import { useListVirtualizer } from 'moraine/virtualizer'

type Item = { label: string }

const items: Item[] = [{ label: 'Alpha' }]

;<List
  items={items}
  itemRender={(context) => {
    const item: Item = context.item
    const index: number = context.index
    void index
    return <li>{item.label}</li>
  }}
  ref={(element) => {
    const root: HTMLUListElement = element
    void root
  }}
/>

;<List
  as="div"
  items={items}
  itemRender={(context) => <div>{context.item.label}</div>}
  ref={(element) => {
    const root: HTMLDivElement = element
    void root
  }}
/>

const virtualizer = useListVirtualizer<Item, HTMLElement, HTMLLIElement>({
  estimateSize: () => 32,
})

;<List
  as="div"
  items={items}
  virtualRender={virtualizer.virtualRender}
  itemRender={(context) => {
    const rowProps: ListT.RowProps<HTMLLIElement> | undefined = context.props
    rowProps?.ref?.(document.createElement('li'))
    // @ts-expect-error Virtual row refs require the row element type.
    rowProps?.ref?.(document.createElement('div'))
    return <li {...rowProps}>{context.item.label}</li>
  }}
/>

const base: ListT.Base<Item, HTMLLIElement> = {
  items,
  itemRender: (context) => <li>{context.item.label}</li>,
}
void base

// @ts-expect-error Static JSX is not an item render component.
;<List items={items} itemRender={<li>Alpha</li>} />
// @ts-expect-error List content comes from items and itemRender.
;<List items={items} itemRender={(context) => <li>{context.item.label}</li>} children={<li />} />
// @ts-expect-error Root styles require a CSS properties object.
;<List items={items} itemRender={(context) => <li>{context.item.label}</li>} style="color: red" />
