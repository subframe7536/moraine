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
// @ts-expect-error Separator accepts string | number | Component<SeparatorRenderProps>, not JSX.Element.
;<KbdGroup items={['Ctrl', 'K']} separator={<span />} />
// @ts-expect-error Reusable collection renderers require Component<ItemRenderProps>, not JSX.Element.
;<Toast itemRender={<span />} />

// @ts-expect-error Object is not a valid itemRender.
;<Breadcrumb itemRender={{ invalid: true }} />

;<Progress valueRender={<span />} />
;<Progress valueRender={(props) => <span>{props.percent}</span>} />
;<Breadcrumb itemRender={(props) => <span>{props.index}</span>} />
;<Select itemRender={(props) => <span>{props.item.label}</span>} />
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
;<KbdGroup items={['Ctrl', 'K']} separator={(props) => <span>{props.index}</span>} />
;<KbdGroup items={['Ctrl', 'K']} separator={1} />
;<Toast itemRender={(props) => <span>{props.options.title}</span>} />
