import {
  AlertDialog,
  Breadcrumb,
  Combobox,
  CommandPalette,
  ContextMenu,
  DropdownMenu,
  KbdGroup,
  List,
  MultiSelect,
  NavigationMenu,
  Progress,
  Select,
  Toast,
} from 'moraine'

// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<Breadcrumb itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<Select itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<Combobox itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<MultiSelect itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<TagRenderProps>, not JSX.Element.
;<MultiSelect tagRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<CommandPalette itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<DropdownMenu.Content itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<ContextMenu.Content itemRender={<span />} />
// @ts-expect-error SeparatorRender accepts string | number | Component<SeparatorRenderProps>, not JSX.Element.
;<KbdGroup items={['Ctrl', 'K']} separatorRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<Toast itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<List items={['a', 'b']} itemRender={<span />} />
// @ts-expect-error Reusable collection renderers require Component<LinkRenderProps>, not JSX.Element.
;<NavigationMenu.Link href="/test" linkRender={<span />} />
// @ts-expect-error Host dialogRender requires Component<DialogRenderProps>, not JSX.Element.
;<AlertDialog dialogRender={<span />} />

// @ts-expect-error Object is not a valid itemRender.
;<Breadcrumb itemRender={{ invalid: true }} />

;<Progress valueRender={<span />} />
;<Progress valueRender={(props) => <span>{props.percent}</span>} />
;<Breadcrumb itemRender={(props) => <span>{props.index}</span>} />
;<Select itemRender={(props) => <span>{props.item.label}</span>} />
;<Select emptyRender={<span />} />
;<Select emptyRender={(props) => <span>Empty {String(props.selectedValue)}</span>} />
;<Combobox emptyRender={<span />} itemRender={(props) => <span>{props.item.label}</span>} />
;<MultiSelect
  emptyRender={<span />}
  tagOverflowRender={<span />}
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
;<KbdGroup items={['Ctrl', 'K']} separatorRender={(props) => <span>{props.index}</span>} />
;<KbdGroup items={['Ctrl', 'K']} separatorRender="/" />
;<KbdGroup items={['Ctrl', 'K']} separatorRender={1} />
;<Toast itemRender={(props) => <span>{props.options.title}</span>} />
;<List items={['a', 'b']} itemRender={(props) => <span>{props.item}</span>} />
;<NavigationMenu.Link href="/test" linkRender={(props) => <a {...props}>{props.children}</a>} />
;<AlertDialog dialogRender={(props) => <span>{props.options.title}</span>} />
