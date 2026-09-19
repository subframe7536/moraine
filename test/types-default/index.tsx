import './base-select'

import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Combobox,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Field,
  Icon,
  Input,
  InputGroup,
  Kbd,
  KbdGroup,
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
  Textarea,
  Tooltip,
  cn,
  createCn,
  createForm,
  useCn,
} from 'moraine'
import type {
  ButtonT,
  BadgeT,
  ButtonGroupT,
  Cn,
  CnConfig,
  CommandPaletteT,
  ComboboxT,
  DialogT,
  DropdownMenuT,
  FieldT,
  FormT,
  InputGroupT,
  InputT,
  ModalT,
  MultiSelectT,
  SelectT,
  SidebarFrameT,
  Tags,
  TextareaT,
  ValidComponent,
} from 'moraine'
import type {
  buttonRecipe,
  sliderRecipe as publicSliderRecipe,
  RecipeSlots,
  RecipeVariant,
} from 'moraine/styles'
import { defineTheme } from 'moraine/theme'
import type { Component, JSX } from 'solid-js'
import * as v from 'valibot'

type Assert<T extends true> = T
export type ComponentKinds = [
  Assert<ButtonT.Kind extends 'single' ? true : false>,
  Assert<ButtonGroupT.Kind extends 'composite' ? true : false>,
  Assert<DialogT.Kind extends 'composite' ? true : false>,
  Assert<SidebarFrameT.Kind extends 'composite' ? true : false>,
  Assert<SelectT.Kind extends 'single' ? true : false>,
  Assert<ComboboxT.Kind extends 'single' ? true : false>,
  Assert<FormT.Kind extends 'single' ? true : false>,
  Assert<FieldT.Kind extends 'single' ? true : false>,
  Assert<'root' extends keyof FieldT.Slot ? true : false>,
  Assert<'kind' extends keyof ButtonT.Props ? false : true>,
  Assert<'kind' extends keyof DialogT.Props ? false : true>,
]

export type RecipeVariants = [
  Assert<'descriptionPosition' extends keyof CommandPaletteT.Variant ? true : false>,
  Assert<'descriptionPosition' extends keyof CommandPaletteT.Item ? false : true>,
  Assert<'search' extends keyof SelectT.Variant ? false : true>,
  Assert<'search' extends keyof ComboboxT.Variant ? false : true>,
  Assert<'search' extends keyof MultiSelectT.Variant ? false : true>,
  Assert<'square' extends keyof BadgeT.Variant ? false : true>,
  Assert<'grouped' extends keyof InputT.Variant ? false : true>,
  Assert<'grouped' extends keyof TextareaT.Variant ? false : true>,
  Assert<'compact' extends keyof InputGroupT.Variant ? false : true>,
]

export type ReadOnlyContracts = [
  Assert<'readOnly' extends keyof SelectT.Props ? true : false>,
  Assert<'readOnly' extends keyof MultiSelectT.Props ? true : false>,
]

const destructiveMenuItem: DropdownMenuT.Item = {
  label: 'Delete',
  variant: 'destructive',
}
void destructiveMenuItem

const removedColorMenuItem: DropdownMenuT.Item = {
  label: 'Delete',
  // @ts-expect-error `color` was replaced by `variant`.
  color: 'destructive',
}
void removedColorMenuItem

const invalidMenuItemVariant: DropdownMenuT.Item = {
  label: 'Delete',
  // @ts-expect-error Menu item variants are limited to default and destructive.
  variant: 'danger',
}
void invalidMenuItemVariant

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
const InteractiveCustomRoot: Component<{
  required: string
  onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>
  children?: JSX.Element
}> = (props) => <div data-required={props.required}>{props.children}</div>
const TypedCustomRoot: Component<{
  type?: 'special'
  children?: JSX.Element
}> = (props) => <div data-type={props.type}>{props.children}</div>
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
;<Button
  onClick={(event) => {
    const button: HTMLButtonElement = event.currentTarget
    button.focus()
  }}
>
  Save
</Button>
;<ButtonGroup>
  <Button>Copy</Button>
  <ButtonGroup.Separator orientation="vertical" class="bg-input" style={{ opacity: 0.8 }} />
  <Button>Paste</Button>
</ButtonGroup>
;<Button
  as="a"
  href="/docs"
  target="_blank"
  rel="noreferrer"
  onClick={(event) => {
    const anchor: HTMLAnchorElement = event.currentTarget
    void anchor
  }}
  ref={(element) => acceptAnchor(element)}
/>
// @ts-expect-error Button<'a'> exposes anchor props and rejects button-only props.
;<Button as="a" formAction="/submit" />
;<Button as={CustomRoot} required="yes" />
;<Button as={TypedCustomRoot} type="special" />
// @ts-expect-error Custom roots do not gain undeclared DOM event props.
;<Button as={CustomRoot} required="yes" onClick={() => undefined} />
;<Button
  as={InteractiveCustomRoot}
  required="yes"
  onClick={(event) => {
    const div: HTMLDivElement = event.currentTarget
    void div
  }}
/>
// @ts-expect-error Required custom component props remain required through `as`.
;<Button as={CustomRoot} />
;<Button as="input" type="checkbox" />

;<Button
  as="svg"
  viewBox="0 0 24 24"
  preserveAspectRatio="xMidYMid meet"
  stroke-width={2}
  shape-rendering="geometricPrecision"
  ref={(element) => {
    const svg: SVGSVGElement = element
    void svg
  }}
  onClick={(event) => {
    const svg: SVGSVGElement = event.currentTarget
    void svg
  }}
/>
// @ts-expect-error Lowercase event aliases remain excluded.
;<Button as="svg" onclick={() => undefined} />
// @ts-expect-error Lowercase keyboard aliases remain excluded.
;<Button as="svg" onkeydown={() => undefined} />
// @ts-expect-error Solid directive syntax remains excluded.
;<Button as="svg" use:foo={foo} />
// @ts-expect-error Solid namespaced event syntax remains excluded.
;<Button as="svg" on:click={foo} />
// @ts-expect-error Solid namespaced attribute syntax remains excluded.
;<Button as="svg" attr:foo="bar" />

;<Card
  id="card"
  role="region"
  tabIndex={0}
  aria-label="Card"
  aria-describedby="details"
  data-testid="card"
  onClick={(event) => event.currentTarget.focus()}
/>
// @ts-expect-error Div roots reject anchor attributes.
;<Card href="/details" />
// @ts-expect-error Lowercase event aliases are intentionally excluded.
;<Card onclick={() => undefined} />
// @ts-expect-error Lowercase keyboard aliases are intentionally excluded.
;<Card onkeydown={() => undefined} />
// @ts-expect-error Lowercase pointer aliases are intentionally excluded.
;<Card onpointerdown={() => undefined} />
// @ts-expect-error Solid directive prefixes are intentionally excluded.
;<Card use:foo={foo} />
// @ts-expect-error Solid namespaced event syntax is intentionally excluded.
;<Card on:click={foo} />
// @ts-expect-error Solid namespaced attribute syntax is intentionally excluded.
;<Card attr:foo="bar" />

;<Icon name="i-lucide-search" aria-label="Search" data-testid="icon" />
;<Icon name="i-lucide-search" class="size-4" style={{ color: 'red' }} />
// @ts-expect-error Root-only components do not accept instance slot class maps.
;<Icon name="i-lucide-search" classes={{ root: 'size-4' }} />

;<Kbd value="K" class="px-2" style={{ color: 'red' }} />
// @ts-expect-error Root-only components do not accept instance slot style maps.
;<Kbd value="K" styles={{ root: { color: 'red' } }} />

;<KbdGroup items={['meta', 'k']} />
;<KbdGroup
  items={[{ value: 'meta', label: 'Command' }, 'k']}
  separator="/"
  size="sm"
  variant="outline"
/>
// @ts-expect-error KbdGroup no longer supports multi-step sequences.
;<KbdGroup sequence={[['meta', 'k']]} />
// @ts-expect-error KbdGroup no longer supports divider render props.
;<KbdGroup items={['meta', 'k']} dividerRender="+" />
// @ts-expect-error KbdGroup is data-driven and rejects composed children.
;<KbdGroup items={['meta', 'k']} children={<Kbd value="meta" />} />

;<Separator class="my-2" style={{ color: 'red' }} />
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
// @ts-expect-error Custom trigger roots do not gain undeclared DOM event props.
;<Dialog.Trigger as={CustomRoot} required="dialog" onClick={() => undefined} />
;<Dialog.Trigger
  as={InteractiveCustomRoot}
  required="dialog"
  onClick={(event) => {
    const div: HTMLDivElement = event.currentTarget
    void div
  }}
/>
;<Dialog.Trigger
  as="a"
  href="/docs"
  onClick={(event) => {
    const anchor: HTMLAnchorElement = event.currentTarget
    void anchor
  }}
/>

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
  <SidebarFrame.Main>
    <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
    Main
  </SidebarFrame.Main>
</SidebarFrame>
;<SidebarFrame.Trigger as={Button} variant="ghost" size="sm" leading="i-lucide-menu">
  Toggle
</SidebarFrame.Trigger>
;<SidebarFrame.Trigger as={CustomRoot} required="sidebar">
  Toggle
</SidebarFrame.Trigger>
// @ts-expect-error Required custom component props remain required through `as`.
;<SidebarFrame.Trigger as={CustomRoot} />
// @ts-expect-error Invalid Button props remain rejected.
;<SidebarFrame.Trigger as={Button} variant="invalid" />

const rootOnlyForm = createForm({ schema: v.object({ email: v.string() }) })
;<Field label="Email" name="email" description="Standalone field">
  <Input />
</Field>
;<rootOnlyForm.Field name="email" label="Email">
  <Input />
</rootOnlyForm.Field>
// @ts-expect-error Bound fields require a schema-aware name.
;<rootOnlyForm.Field label="Missing name">
  <Input />
</rootOnlyForm.Field>
// @ts-expect-error Unknown schema keys are rejected.
;<rootOnlyForm.Field name="unknown">
  <Input />
</rootOnlyForm.Field>
// @ts-expect-error Old FormField component export is removed.
type OldFormField = typeof import('moraine').FormField
// @ts-expect-error Old FormFieldT type export is removed.
type OldFormFieldT = import('moraine').FormFieldT
// @ts-expect-error Old FormFieldProps type export is removed.
type OldFormFieldProps = import('moraine').FormFieldProps
void (null as unknown as OldFormField)
void (null as unknown as OldFormFieldT)
void (null as unknown as OldFormFieldProps)
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
;<MultiSelect
  createItem={(input) => ({ label: input, value: input })}
  tokenSeparators={[',', ';']}
/>

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
;<MoraineProvider />
;<MoraineProvider theme={null} />

const theme = defineTheme({
  button: { base: { root: 'rounded-lg' }, defaultVariants: { size: 'sm' } },
  commandPalette: { defaultVariants: { descriptionPosition: 'trailing' } },
  form: { base: { root: 'space-y-2' } },
  field: { base: { root: 'space-y-2' }, defaultVariants: { size: 'sm' } },
  icon: { base: { root: 'size-4' } },
  kbd: { base: { root: 'px-1' } },
  modal: { base: { content: 'p-4' } },
  combobox: { base: { control: 'min-w-48' } },
  multiSelect: { defaultVariants: { size: 'sm' } },
  select: { defaultVariants: { size: 'sm' } },
  badge: { defaultVariants: { square: true } },
  input: { defaultVariants: { grouped: true, groupedOrientation: 'horizontal' } },
  inputGroup: { defaultVariants: { compact: true } },
  textarea: { defaultVariants: { grouped: true, groupedOrientation: 'vertical' } },
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
defineTheme({ unknownComponent: {} })
// @ts-expect-error Old formField theme key is removed.
defineTheme({ formField: { base: { root: 'space-y-2' } } })
// @ts-expect-error List has no Theme slots.
defineTheme({ list: { base: { root: 'p-4' } } })
defineTheme({ collapsible: { base: { content: 'overflow-hidden' } } })
// @ts-expect-error Collapsible has no visual variants.
defineTheme({ collapsible: { defaultVariants: { size: 'sm' } } })
// @ts-expect-error Unknown slots are rejected.
defineTheme({ button: { base: { missing: 'p-4' } } })
// @ts-expect-error Variant defaults are constrained to component variants.
defineTheme({ button: { defaultVariants: { size: 'huge' } } })
// @ts-expect-error Theme does not accept inline styles.
defineTheme({ button: { styles: { root: { color: 'red' } } } })
// @ts-expect-error Variant selectors are constrained.
defineTheme({ button: { variants: { size: { huge: { root: 'p-4' } } } } })
defineTheme({
  // @ts-expect-error Compound slots are constrained.
  button: { compoundVariants: [{ variants: { size: 'sm' }, missing: 'p-4' }] },
})
defineTheme({ button: { defaultVariants: { size: null } } })
// @ts-expect-error ButtonGroup theme size is constrained to implemented recipe sizes.
defineTheme({ buttonGroup: { defaultVariants: { size: 'icon-md' } } })

const cnConfig = {
  cacheSize: 0,
  prefix: 'tw',
  extend: { classGroups: { density: ['density-roomy', 'density-compact'] } },
} satisfies CnConfig
const customCn: Cn = createCn(cnConfig)
const scopedCn: Cn = useCn()
const _mergedClass: string | undefined = cn(customCn('p-2'), scopedCn('p-4'))
type ButtonRecipeSlots = RecipeSlots<typeof buttonRecipe>
type SliderRecipeVariant = RecipeVariant<typeof publicSliderRecipe>
const buttonRoot: keyof ButtonRecipeSlots = 'root'
const sliderSize: SliderRecipeVariant['size'] = 'sm'
void [buttonRoot, sliderSize]

export type DefaultTagAssertions = [
  Assert<Tags extends keyof JSX.IntrinsicElements ? true : false>,
  Assert<'svg' extends Tags ? true : false>,
  Assert<'div' extends Tags ? true : false>,
  Assert<Tags extends ValidComponent ? true : false>,
  Assert<((props: any) => any) extends ValidComponent ? true : false>,
  Assert<string & {} extends ValidComponent ? true : false>,
]
