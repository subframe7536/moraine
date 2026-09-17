/** Lightweight type-only style contract used by theme declarations. */
export interface StyleContract<Slots extends string, Variants = never> {
  readonly slots: Slots
  readonly variants: Variants
}

type Size = 'sm' | 'md' | 'lg'
type InputVariant = 'outline' | 'subtle' | 'ghost' | 'none'
type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
type SelectSlots =
  | 'control'
  | 'content'
  | 'listbox'
  | 'item'
  | 'group'
  | 'groupLabel'
  | 'separator'
  | 'empty'
  | 'leading'
  | 'clear'
  | 'itemLeading'
  | 'itemLabel'
  | 'itemDescription'
  | 'itemTrailing'

type MenuSlots =
  | 'trigger'
  | 'overlay'
  | 'content'
  | 'group'
  | 'label'
  | 'separator'
  | 'item'
  | 'itemLeading'
  | 'itemWrapper'
  | 'itemLabel'
  | 'itemDescription'
  | 'itemTrailing'
  | 'itemKbds'
  | 'itemIndicator'
  | 'itemSub'

export interface MoraineStyleSchema {
  accordion: StyleContract<
    | 'root'
    | 'item'
    | 'header'
    | 'trigger'
    | 'leading'
    | 'label'
    | 'trailing'
    | 'content'
    | 'contentInner'
  >
  avatar: StyleContract<
    'root' | 'image' | 'fallback' | 'fallbackIcon' | 'badge',
    { size?: Size; badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }
  >
  avatarGroup: StyleContract<
    'root' | 'item' | 'count' | 'image' | 'fallback' | 'fallbackIcon' | 'badge',
    { size?: Size }
  >
  badge: StyleContract<
    'root' | 'leading' | 'label' | 'trailing',
    { variant?: 'solid' | 'subtle' | 'surface' | 'outline'; size?: Size; square?: boolean }
  >
  buttonGroup: StyleContract<
    'root' | 'separator',
    { variant?: ButtonVariant; size?: Size; orientation?: 'horizontal' | 'vertical' }
  >
  button: StyleContract<
    'root' | 'loading' | 'leading' | 'label' | 'trailing',
    {
      variant?: ButtonVariant
      size?:
        | 'xs'
        | 'sm'
        | 'md'
        | 'lg'
        | 'xl'
        | 'icon-xs'
        | 'icon-sm'
        | 'icon-md'
        | 'icon-lg'
        | 'icon-xl'
    }
  >
  card: StyleContract<
    'root' | 'header' | 'title' | 'description' | 'action' | 'body' | 'footer',
    { compact?: boolean }
  >
  collapsible: StyleContract<'root' | 'trigger' | 'contentWrapper' | 'content'>
  icon: StyleContract<'root'>
  kbd: StyleContract<'root', { size?: Size; variant?: 'default' | 'outline' | 'invert' }>
  kbdGroup: StyleContract<
    'root' | 'item',
    { size?: Size; variant?: 'default' | 'outline' | 'invert' }
  >
  progress: StyleContract<
    'root' | 'status' | 'track' | 'indicator' | 'steps' | 'step',
    {
      orientation?: 'horizontal' | 'vertical'
      size?: Size
      animation?: 'carousel' | 'reverse' | 'swing' | 'elastic'
    }
  >
  resizable: StyleContract<
    'root' | 'panel' | 'divider' | 'handle' | 'crossTarget',
    { orientation?: 'horizontal' | 'vertical' | null }
  >
  separator: StyleContract<'root', { orientation?: 'horizontal' | 'vertical' }>
  baseSelect: StyleContract<
    | 'control'
    | 'trigger'
    | 'content'
    | 'listbox'
    | 'item'
    | 'group'
    | 'groupLabel'
    | 'separator'
    | 'empty',
    { size?: Size }
  >
  checkbox: StyleContract<
    'root' | 'control' | 'indicator' | 'icon' | 'wrapper' | 'container' | 'label' | 'description',
    { size?: Size; variant?: 'card' | 'list'; indicator?: 'start' | 'end' | 'hidden' }
  >
  checkboxGroup: StyleContract<
    | 'root'
    | 'fieldset'
    | 'legend'
    | 'item'
    | 'container'
    | 'control'
    | 'indicator'
    | 'icon'
    | 'wrapper'
    | 'label'
    | 'description',
    { orientation?: 'horizontal' | 'vertical'; size?: Size; variant?: 'card' | 'table' | 'list' }
  >
  combobox: StyleContract<
    SelectSlots | 'input' | 'trigger',
    { variant?: InputVariant; size?: Size }
  >
  field: StyleContract<
    | 'root'
    | 'wrapper'
    | 'labelWrapper'
    | 'label'
    | 'container'
    | 'description'
    | 'error'
    | 'hint'
    | 'help',
    { size?: Size; orientation?: 'vertical' | 'horizontal' }
  >
  fileUpload: StyleContract<
    | 'root'
    | 'control'
    | 'wrapper'
    | 'icon'
    | 'label'
    | 'description'
    | 'files'
    | 'file'
    | 'filePreview'
    | 'fileMeta'
    | 'fileName'
    | 'fileSize'
    | 'fileRemove',
    { size?: Size }
  >
  form: StyleContract<'root'>
  input: StyleContract<
    'root',
    {
      size?: Size
      variant?: InputVariant
      grouped?: boolean
      groupedOrientation?: 'horizontal' | 'vertical'
    }
  >
  inputGroup: StyleContract<
    'root' | 'leading' | 'trailing',
    {
      size?: Size
      variant?: InputVariant
      orientation?: 'horizontal' | 'vertical'
      compact?: boolean
    }
  >
  inputNumber: StyleContract<
    'root' | 'input' | 'increment' | 'decrement' | 'controls',
    {
      size?: Size
      variant?: InputVariant
      align?: 'center' | 'start'
      orientation?: 'horizontal' | 'vertical'
    }
  >
  multiSelect: StyleContract<
    | SelectSlots
    | 'input'
    | 'trigger'
    | 'tagsContainer'
    | 'tag'
    | 'tagLabel'
    | 'tagRemove'
    | 'tagOverflow',
    { variant?: InputVariant; size?: Size }
  >
  radioGroup: StyleContract<
    'root' | 'item' | 'control' | 'container' | 'indicator' | 'wrapper' | 'label' | 'description',
    {
      orientation?: 'horizontal' | 'vertical'
      size?: Size
      variant?: 'card' | 'table' | 'list'
      indicator?: 'start' | 'end' | 'hidden'
    }
  >
  select: StyleContract<SelectSlots | 'trigger' | 'value', { variant?: InputVariant; size?: Size }>
  slider: StyleContract<
    'root' | 'track' | 'range' | 'divider' | 'thumb',
    { orientation?: 'horizontal' | 'vertical'; size?: Size; variant?: 'default' | 'bold' }
  >
  switch: StyleContract<
    'root' | 'track' | 'thumb' | 'icon' | 'wrapper' | 'label' | 'description',
    { size?: Size }
  >
  textarea: StyleContract<
    'root',
    {
      size?: Size
      variant?: InputVariant
      grouped?: boolean
      groupedOrientation?: 'horizontal' | 'vertical'
    }
  >
  breadcrumb: StyleContract<
    'root' | 'list' | 'item' | 'link' | 'page' | 'leading' | 'label' | 'separator',
    { size?: Size; wrap?: boolean }
  >
  commandPalette: StyleContract<
    | 'root'
    | 'inputWrapper'
    | 'input'
    | 'listbox'
    | 'footer'
    | 'group'
    | 'label'
    | 'item'
    | 'itemLeading'
    | 'itemWrapper'
    | 'itemLabel'
    | 'itemDescription'
    | 'itemTrailing'
    | 'search'
    | 'close'
    | 'empty',
    { descriptionPosition?: 'bottom' | 'trailing' }
  >
  pagination: StyleContract<
    'root' | 'list' | 'listItem' | 'item' | 'prev' | 'next' | 'ellipsis' | 'controlLabel',
    {
      size?: Size
      variant?: ButtonVariant
      activeVariant?: ButtonVariant
      controlVariant?: ButtonVariant
    }
  >
  sidebarFrame: StyleContract<
    'root' | 'sidebar' | 'sidebarHeader' | 'sidebarBody' | 'sidebarFooter' | 'main',
    { side?: 'left' | 'right'; variant?: 'default' | 'floating' | 'inset' }
  >
  stepper: StyleContract<
    | 'root'
    | 'header'
    | 'item'
    | 'trigger'
    | 'indicator'
    | 'icon'
    | 'separator'
    | 'wrapper'
    | 'title'
    | 'description'
    | 'content',
    { orientation?: 'horizontal' | 'vertical'; size?: Size }
  >
  tabs: StyleContract<
    'root' | 'list' | 'indicator' | 'trigger' | 'leading' | 'label' | 'trailing' | 'content',
    { orientation?: 'horizontal' | 'vertical'; variant?: 'pill' | 'link'; size?: Size }
  >
  contextMenu: StyleContract<MenuSlots, { size?: Size }>
  dialog: StyleContract<
    | 'trigger'
    | 'content'
    | 'overlay'
    | 'header'
    | 'wrapper'
    | 'title'
    | 'description'
    | 'close'
    | 'body'
    | 'footer',
    { fullscreen?: boolean; scrollable?: boolean }
  >
  dropdownMenu: StyleContract<MenuSlots, { size?: Size }>
  modal: StyleContract<'overlay' | 'content'>
  popover: StyleContract<'trigger' | 'content' | 'body'>
  sheet: StyleContract<
    | 'trigger'
    | 'content'
    | 'overlay'
    | 'header'
    | 'wrapper'
    | 'title'
    | 'description'
    | 'actions'
    | 'close'
    | 'body'
    | 'footer',
    { side?: 'top' | 'right' | 'bottom' | 'left'; inset?: boolean }
  >
  tooltip: StyleContract<
    'trigger' | 'content' | 'positioner' | 'text' | 'kbds' | 'kbd',
    { invert?: boolean }
  >
}
