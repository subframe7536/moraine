import {
  AlertDialog,
  BoldSlider,
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
// @ts-expect-error KbdGroup separator accepts string | number | Component<SeparatorRenderProps>, not JSX.Element.
;<KbdGroup items={['Ctrl', 'K']} separator={<span />} />
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

;<Progress valueLabel />
;<Progress valueLabel={({ percent }) => `${percent}%`} />
;<BoldSlider
  label={<b>Blur</b>}
  valueLabel={({ percent, value, max }) => `${value}/${max} ${percent}%`}
/>
// @ts-expect-error BoldSlider valueLabel receives `{ percent, value, max }`, not a number.
;<BoldSlider valueLabel={(value: number) => `${value}`} />
;<Breadcrumb itemRender={(props) => <span>{props.index}</span>} />
;<Select itemRender={(props) => <span>{props.item.label}</span>} />
;<Select emptyRender={<span />} />
;<Select emptyRender={(props) => <span>Empty {String(props.selectedValue)}</span>} />
;<Combobox emptyRender={<span />} itemRender={(props) => <span>{props.item.label}</span>} />
;<Combobox emptyRender={(props) => <span>No match for {props.searchValue}</span>} />
;<MultiSelect
  emptyRender={(props) => <span>No match for {props.searchValue}</span>}
  tagOverflowRender={<span />}
  itemRender={(props) => <span>{props.item.label}</span>}
  tagRender={(props) => <button onClick={props.remove}>{props.label}</button>}
/>
;<CommandPalette
  emptyRender={<span />}
  footerRender={<span />}
  items={[
    {
      type: 'group',
      children: [{ value: 'save', leadingRender: <span />, trailingRender: <span /> }],
    },
  ]}
  itemRender={(props) => <span>{props.item.value}</span>}
/>
;<DropdownMenu.Content itemRender={(props) => <span>{props.item.label}</span>} />
;<ContextMenu.Content itemRender={(props) => <span>{props.item.label}</span>} />
;<DropdownMenu.Content headerRender={(props) => <span>{props.sub}</span>} />
;<ContextMenu.Content footerRender={(props) => <span>{props.sub}</span>} />
// @ts-expect-error menu header and footer mount once per menu layer, so they take a component
;<DropdownMenu.Content headerRender={<span />} />
// @ts-expect-error menu header and footer mount once per menu layer, so they take a component
;<ContextMenu.Content footerRender={<span />} />
;<KbdGroup items={['Ctrl', 'K']} separator={(props) => <span>{props.index}</span>} />
;<KbdGroup items={['Ctrl', 'K']} separator="/" />
;<KbdGroup items={['Ctrl', 'K']} separator="1" />
;<Toast itemRender={(props) => <span>{props.options.title}</span>} />
;<List items={['a', 'b']} itemRender={(props) => <span>{props.item}</span>} />
;<NavigationMenu.Link href="/test" linkRender={(props) => <a {...props}>{props.children}</a>} />
;<AlertDialog dialogRender={(props) => <span>{props.options.title}</span>} />
