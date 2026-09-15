import './base-select'

import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Combobox,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Icon,
  Input,
  InputGroup,
  Kbd,
  List,
  Modal,
  MoraineProvider,
  MultiSelect,
  Popover,
  Resizable,
  Select,
  Separator,
  Sheet,
  SidebarFrame,
  TagsInput,
  Textarea,
  Tooltip,
  cn,
  createCn,
  createForm,
  useCn,
} from 'moraine'
import type {
  ButtonT,
  Cn,
  CnConfig,
  CommandPaletteT,
  ComboboxT,
  DialogT,
  FormT,
  InputGroupT,
  InputT,
  ModalT,
  MultiSelectT,
  SelectT,
  SidebarFrameT,
  SliderT,
  TagsInputT,
  TextareaT,
} from 'moraine'
import { atomicRecipe, createTheme, defaultTheme, emptyTheme, slotRecipe } from 'moraine/theme'
import type { Component, JSX } from 'solid-js'
import * as v from 'valibot'

type Assert<T extends true> = T
export type ComponentKinds = [
  Assert<ButtonT.Kind extends 'single' ? true : false>,
  Assert<DialogT.Kind extends 'composite' ? true : false>,
  Assert<SidebarFrameT.Kind extends 'composite' ? true : false>,
  Assert<SelectT.Kind extends 'single' ? true : false>,
  Assert<ComboboxT.Kind extends 'single' ? true : false>,
  Assert<TagsInputT.Kind extends 'single' ? true : false>,
  Assert<FormT.Kind extends 'single' ? true : false>,
  Assert<'kind' extends keyof ButtonT.Props ? false : true>,
  Assert<'kind' extends keyof DialogT.Props ? false : true>,
]

export type RecipeVariants = [
  Assert<'descriptionPosition' extends keyof CommandPaletteT.Variant ? true : false>,
  Assert<'descriptionPosition' extends keyof CommandPaletteT.Item ? false : true>,
  Assert<'search' extends keyof SelectT.Variant ? false : true>,
  Assert<'search' extends keyof ComboboxT.Variant ? false : true>,
  Assert<'search' extends keyof MultiSelectT.Variant ? false : true>,
]

export type ReadOnlyContracts = [
  Assert<'readOnly' extends keyof SelectT.Props ? true : false>,
  Assert<'readOnly' extends keyof MultiSelectT.Props ? true : false>,
]

export type SlotContracts = [
  Assert<'root' extends keyof ButtonT.Slot ? true : false>,
  // @ts-expect-error SlotName aliases are not part of the component namespace contract.
  ButtonT.SlotName,
]

// @ts-expect-error Recipe entry is internal and not exported.
type RecipeEntry = typeof import('moraine/recipe')
// @ts-expect-error Recipe APIs are not public from root.
type RootRecipe = typeof import('moraine').recipe
// @ts-expect-error Provider APIs are only public from the root entry.
type UtilsProvider = typeof import('moraine/utils').MoraineProvider
// @ts-expect-error Root helpers are not part of the low-level utils entry.
type UtilsCn = typeof import('moraine/utils').cn
// @ts-expect-error CSS-variable types are not public from utils.
type UtilsStyleVarRecord = import('moraine/utils').StyleVarRecord

export type PublicEntryIsolation = [
  RecipeEntry,
  RootRecipe,
  UtilsProvider,
  UtilsCn,
  UtilsStyleVarRecord,
]

const CustomRoot: Component<{ required: string; children?: JSX.Element }> = (props) => (
  <section data-required={props.required}>{props.children}</section>
)
const modalContentContext: ModalT.ContentContext = { close: () => undefined }
modalContentContext.close()

const foo = () => undefined
const acceptSpan = (element: HTMLSpanElement) => element.focus()
const acceptAnchor = (element: HTMLAnchorElement) => element.focus()
const divRef = (element: HTMLDivElement) => element.focus()

;<Badge aria-label="status" data-testid="badge" ref={(element) => acceptSpan(element)}>
  Ready
</Badge>
// @ts-expect-error Badge's root ref must target HTMLSpanElement.
;<Badge ref={divRef} />
// @ts-expect-error A span root rejects anchor-only attributes.
;<Badge href="/docs" />

;<Avatar text="MR" />
;<AvatarGroup items={[{ text: 'MR' }]} />
;<Button onClick={() => undefined}>Save</Button>
;<Button
  as="a"
  href="/docs"
  target="_blank"
  rel="noreferrer"
  onClick={() => undefined}
  ref={(element) => acceptAnchor(element)}
/>
// @ts-expect-error Button<'a'> exposes anchor props and rejects button-only props.
;<Button as="a" formAction="/submit" />
;<Button as={CustomRoot} required="yes" />
// @ts-expect-error Required custom component props remain required through `as`.
;<Button as={CustomRoot} />
;<Button as="input" type="checkbox" />

;<Card aria-describedby="details" onClick={() => undefined} />
// @ts-expect-error Div roots reject anchor attributes.
;<Card href="/details" />
// @ts-expect-error Lowercase event aliases are intentionally stripped.
;<Card onclick={() => undefined} />
// @ts-expect-error Solid directive prefixes are intentionally stripped.
;<Card use:foo={foo} />

;<Icon name="i-lucide-search" aria-label="Search" data-testid="icon" />
;<Icon name="i-lucide-search" class="size-4" style={{ color: 'red' }} />
// @ts-expect-error Root-only components do not accept instance slot class maps.
;<Icon name="i-lucide-search" classes={{ root: 'size-4' }} />

;<Kbd value="K" class="px-2" style={{ color: 'red' }} />
// @ts-expect-error Root-only components do not accept instance slot style maps.
;<Kbd value="K" styles={{ root: { color: 'red' } }} />

;<Separator class="my-2" style={{ color: 'red' }} />
// @ts-expect-error Root-only components do not accept instance slot class maps.
;<Separator classes={{ root: 'my-2' }} />

;<List id="items" items={[1, 2]} itemRender={(context) => context.item} />

;<Modal defaultOpen>
  <Modal.Overlay />
  <Modal.Content ariaLabel="Type fixture">Modal content</Modal.Content>
</Modal>
// @ts-expect-error String root style is rejected
;<Button style="color: red" />
// @ts-expect-error String slot style is rejected
;<Modal defaultOpen styles={{ content: 'color: red' }} />
// @ts-expect-error Modal root no longer owns named slots.
;<Modal classes={{ trigger: 'trigger' }} />

;<Dialog>
  <Dialog.Trigger as={CustomRoot} data-testid="dialog-trigger" required="dialog">
    Open dialog
  </Dialog.Trigger>
  <Dialog.Content />
</Dialog>
// @ts-expect-error Required custom component props must be supplied to the trigger.
;<Dialog.Trigger as={CustomRoot} />

;<Popover>
  <Popover.Trigger as={CustomRoot} data-testid="popover-trigger" required="popover">
    Open popover
  </Popover.Trigger>
  <Popover.Content>
    <span>Content</span>
  </Popover.Content>
</Popover>

;<Tooltip>
  <Tooltip.Trigger as={CustomRoot} data-testid="tooltip-trigger" required="tooltip">
    Hover target
  </Tooltip.Trigger>
  <Tooltip.Content />
</Tooltip>

;<ContextMenu>
  <ContextMenu.Trigger as={CustomRoot} data-testid="context-trigger" required="context">
    Open menu
  </ContextMenu.Trigger>
  <ContextMenu.Content items={[]} />
</ContextMenu>

;<Sheet>
  <Sheet.Trigger as={CustomRoot} data-testid="sheet-trigger" required="sheet">
    Open sheet
  </Sheet.Trigger>
  <Sheet.Content />
</Sheet>

;<DropdownMenu>
  <DropdownMenu.Trigger as={CustomRoot} data-testid="dropdown-trigger" required="dropdown">
    Open menu
  </DropdownMenu.Trigger>
  <DropdownMenu.Content items={[]} />
</DropdownMenu>

// Polymorphic Button triggers:
;<DropdownMenu>
  <DropdownMenu.Trigger
    as={Button}
    type="button"
    variant="ghost"
    size="icon-xs"
    trailing="i-lucide:chevron-down"
  >
    Open menu
  </DropdownMenu.Trigger>
  {/* @ts-expect-error invalid variant should be rejected on Button trigger */}
  <DropdownMenu.Trigger as={Button} variant="invalid-variant" />
  {/* @ts-expect-error completely unknown prop should be rejected on Button trigger */}
  <DropdownMenu.Trigger as={Button} unknownProperty="test" />
  <DropdownMenu.Content items={[]} />
</DropdownMenu>

;<Dialog>
  <Dialog.Trigger as={Button} variant="outline" size="sm">
    Open dialog
  </Dialog.Trigger>
  <Dialog.Content />
</Dialog>

;<Popover>
  <Popover.Trigger as={Button} variant="secondary" size="md">
    Open popover
  </Popover.Trigger>
  <Popover.Content />
</Popover>

;<Tooltip>
  <Tooltip.Trigger as={Button} variant="ghost" size="xs">
    Hover target
  </Tooltip.Trigger>
  <Tooltip.Content />
</Tooltip>

;<Resizable>
  <Resizable.Panel id="navigation" min="20%">
    Navigation
  </Resizable.Panel>
  <Resizable.Handle action="collapse">{(state) => String(state.collapsed)}</Resizable.Handle>
  <Resizable.Panel>Main</Resizable.Panel>
</Resizable>

;<SidebarFrame isMobile={false}>
  <SidebarFrame.Sidebar>
    <SidebarFrame.SidebarHeader>Header</SidebarFrame.SidebarHeader>
    <SidebarFrame.SidebarBody>Navigation</SidebarFrame.SidebarBody>
    <SidebarFrame.SidebarFooter>Footer</SidebarFrame.SidebarFooter>
  </SidebarFrame.Sidebar>
  <SidebarFrame.Main>Main</SidebarFrame.Main>
</SidebarFrame>

const rootOnlyForm = createForm({ schema: v.object({ email: v.string() }) })
;<rootOnlyForm.Form class="space-y-2" style={{ color: 'red' }} />
// @ts-expect-error The bound Form component does not accept instance slot style maps.
;<rootOnlyForm.Form styles={{ root: { color: 'red' } }} />

;<Input
  form="checkout"
  list="cities"
  enterkeyhint="next"
  ref={(element) => {
    const input: HTMLInputElement = element
    input.select()
  }}
  onChange={(event) => event.currentTarget.select()}
  onPaste={(event) => event.currentTarget.checkValidity()}
/>
// @ts-expect-error Unknown native props are rejected.
;<Input unknownNativeProp="invalid" />
// @ts-expect-error Input only has a root slot.
;<Input classes={{ input: 'p-2' }} />
// @ts-expect-error Native refs use ref.
;<Input inputRef={() => undefined} />

;<Textarea
  form="checkout"
  wrap="soft"
  ref={(element) => {
    const textarea: HTMLTextAreaElement = element
    void textarea.rows
  }}
  onChange={(event) => event.currentTarget.rows}
  onValueChange={(value) => {
    const text: string = value
    void text
  }}
/>
// @ts-expect-error Native change handlers receive events, not normalized strings.
;<Textarea onChange={(value: string) => value.trim()} />
// @ts-expect-error Textarea only has a root slot.
;<Textarea styles={{ footer: { color: 'red' } }} />
// @ts-expect-error Native refs use ref.
;<Textarea textareaRef={() => undefined} />

;<Select
  items={[{ label: 'One', value: 1 }]}
  readOnly
  onChange={(value) => {
    const selected: number | null = value
    void selected
  }}
/>
;<MultiSelect items={[{ label: 'One', value: 1 }]} readOnly />
;<Combobox items={[{ label: 'One', value: 1 }]} openOnControlClick={false} />
;<TagsInput tokenSeparators={[',', ';']} />

export type NativeTextSlots = [
  Assert<'orientation' extends keyof InputGroupT.Variant ? true : false>,
  Assert<'orientation' extends keyof InputGroupT.PartVariant ? false : true>,
  Assert<'compact' extends keyof InputGroupT.PartVariant ? true : false>,
  Assert<'align' extends keyof InputGroupT.PartVariant ? false : true>,
  Assert<'orientation' extends keyof InputGroupT.PartBase ? false : true>,
  Assert<keyof InputT.Slot extends 'root' ? true : false>,
  Assert<keyof TextareaT.Slot extends 'root' ? true : false>,
  Assert<InputGroupT.Kind extends 'composite' ? true : false>,
]

;<InputGroup orientation="vertical">
  <InputGroup.Leading compact>Header</InputGroup.Leading>
  <Input />
  <InputGroup.Trailing>Suffix</InputGroup.Trailing>
</InputGroup>
// @ts-expect-error Position comes from the component and orientation.
;<InputGroup.Leading align="left" />
// @ts-expect-error Orientation belongs to InputGroup, not a part.
;<InputGroup.Trailing orientation="vertical" />
// @ts-expect-error Orientation supports the two layout axes only.
;<InputGroup orientation="inline" />

;<MoraineProvider />
;<MoraineProvider theme={defaultTheme} />
;<MoraineProvider theme={emptyTheme} />
// @ts-expect-error Undefined inherits; null is not a reset value.
;<MoraineProvider theme={null} />

const theme = createTheme({
  extends: defaultTheme,
  button: { base: { root: 'rounded-lg' }, defaults: { size: 'sm' } },
  commandPalette: { defaults: { descriptionPosition: 'trailing' } },
  form: { base: { root: 'space-y-2' } },
  icon: { base: { root: 'size-4' } },
  kbd: { base: { root: 'px-1' } },
  modal: { base: { content: 'p-4' } },
  combobox: { base: { control: 'min-w-48' } },
  multiSelect: { defaults: { size: 'sm' } },
  select: { defaults: { size: 'sm' } },
  tagsInput: { base: { control: 'min-w-48' } },
  separator: {
    base: { root: 'border-t' },
    variants: { orientation: { vertical: { root: 'h-full' } } },
  },
  sheet: { variants: { side: { left: { content: 'left-0' } } } },
})
;<MoraineProvider theme={theme}>
  <Button />
</MoraineProvider>

// @ts-expect-error Unknown component names are rejected.
createTheme({ unknownComponent: {} })
// @ts-expect-error List has no Theme slots.
createTheme({ list: { base: { root: 'p-4' } } })
createTheme({ collapsible: { base: { content: 'overflow-hidden' } } })
// @ts-expect-error Collapsible has no visual variants.
createTheme({ collapsible: { defaults: { size: 'sm' } } })
// @ts-expect-error Unknown slots are rejected.
createTheme({ button: { base: { missing: 'p-4' } } })
// @ts-expect-error Variant defaults are constrained to component variants.
createTheme({ button: { defaults: { size: 'huge' } } })
// @ts-expect-error Theme does not accept inline styles.
createTheme({ button: { styles: { root: { color: 'red' } } } })
// @ts-expect-error Variant selectors are constrained.
createTheme({ button: { variants: { size: { huge: { root: 'p-4' } } } } })
createTheme({
  // @ts-expect-error Compound slots are constrained.
  button: { compoundVariants: [{ variants: { size: 'sm' }, missing: 'p-4' }] },
})
// @ts-expect-error Null is a suppression value for instances, not a Theme default.
createTheme({ button: { defaults: { size: null } } })

const cnConfig = {
  cacheSize: 0,
  prefix: 'tw',
  extend: { classGroups: { density: ['density-roomy', 'density-compact'] } },
} satisfies CnConfig
const customCn: Cn = createCn(cnConfig)
const scopedCn: Cn = useCn()
const mergedClass: string | undefined = cn(customCn('p-2'), scopedCn('p-4'))
const atomic = atomicRecipe({ variants: { size: { sm: 'p-2' } } })
const slots = slotRecipe<ButtonT.Slot, ButtonT.Variant>({ base: { root: 'p-2' } })
const atomicResult: string | undefined = atomic.resolve({ size: 'sm' }, customCn, 'p-4')
const slotResult: string | undefined = slots.resolve({ size: 'sm' }, customCn).classes.root
const emptySlots = slotRecipe<{ root: unknown }, never>({ base: { root: 'p-2' } })
emptySlots.resolve(undefined, customCn)
// @ts-expect-error resolve preserves inferred variant values.
atomic.resolve({ size: 'invalid' }, customCn)
// @ts-expect-error resolve preserves slot names.
void slots.resolve(undefined, customCn).classes.unknown
// @ts-expect-error Provider only accepts an extension object.
;<MoraineProvider cnConfig={customCn} />
;<MoraineProvider cnConfig={cnConfig}>
  <Button class={mergedClass}>
    {atomicResult}
    {slotResult}
  </Button>
</MoraineProvider>

const sliderRecipe = slotRecipe<SliderT.Slot, SliderT.Variant>({
  variants: { size: { sm: { '--s-size': '4px' }, lg: { '--s-size': '6px' } } },
})
sliderRecipe({ size: 'sm', variant: null })
// @ts-expect-error Invalid component variant value.
sliderRecipe({ size: 'huge' })
// @ts-expect-error Invalid component variant dimension.
sliderRecipe({ unknown: true })
createTheme({ slider: sliderRecipe.options })
slotRecipe<SliderT.Slot, SliderT.Variant>({
  // @ts-expect-error Custom property names must start with --.
  base: { size: '4px' },
})
