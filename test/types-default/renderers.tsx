import {
  Breadcrumb,
  Combobox,
  CommandPalette,
  ContextMenu,
  DropdownMenu,
  KbdGroup,
  MultiSelect,
  Progress,
  Select,
} from 'moraine'

// @ts-expect-error The removed rendering alias is not a public API.
type RemovedRenderType = import('moraine').ComponentOrElement
export type PublicRenderTypes = [RemovedRenderType]

// @ts-expect-error Each step requires its own renderer instance.
;<Progress stepRender={<span />} />
// @ts-expect-error Each breadcrumb requires its own renderer instance.
;<Breadcrumb itemRender={<span />} />
// @ts-expect-error Each option requires its own renderer instance.
;<Select itemRender={<span />} />
// @ts-expect-error Select no longer supports virtual rendering.
;<Select virtualRender={() => <span />} />
// @ts-expect-error Select no longer exposes a virtual scrolling bridge.
;<Select scrollToItem={() => {}} />
// @ts-expect-error Each option requires its own renderer instance.
;<Combobox itemRender={<span />} />
// @ts-expect-error Each option requires its own renderer instance.
;<MultiSelect itemRender={<span />} />
// @ts-expect-error Each tag requires its own renderer instance.
;<MultiSelect tagRender={<span />} />
// @ts-expect-error Each command requires its own renderer instance.
;<CommandPalette itemRender={<span />} />
// @ts-expect-error Each menu item requires its own renderer instance.
;<DropdownMenu.Content itemRender={<span />} />
// @ts-expect-error Each menu item requires its own renderer instance.
;<ContextMenu.Content itemRender={<span />} />
// @ts-expect-error Each separator requires its own renderer instance.
;<KbdGroup items={['Ctrl', 'K']} separator={<span />} />

;<Progress statusRender={<span />} stepRender={(props) => <span>{props.step}</span>} />
;<Breadcrumb itemRender={(props) => <span>{props.index}</span>} />
;<Select itemRender={(props) => <span>{props.item.label}</span>} />
;<Combobox emptyRender={<span />} itemRender={(props) => <span>{props.item.label}</span>} />
;<MultiSelect
  emptyRender={<span />}
  tagOverflow={<span />}
  itemRender={(props) => <span>{props.item.label}</span>}
  tagRender={(props) => <span>{props.label}</span>}
/>
;<CommandPalette
  emptyRender={<span />}
  footerRender={<span />}
  groups={[
    {
      id: 'commands',
      items: [{ value: 'save', leadingRender: <span />, trailingRender: <span /> }],
    },
  ]}
  itemRender={(props) => <span>{props.item.value}</span>}
/>
;<DropdownMenu.Content itemRender={(props) => <span>{props.item.label}</span>} />
;<ContextMenu.Content itemRender={(props) => <span>{props.item.label}</span>} />
;<KbdGroup items={['Ctrl', 'K']} separator={(props) => <span>{props.index}</span>} />
;<KbdGroup items={['Ctrl', 'K']} separator={1} />
