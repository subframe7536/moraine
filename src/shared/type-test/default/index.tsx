import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Icon,
  Kbd,
  List,
  Modal,
  MoraineProvider,
  Popover,
  Sheet,
  Separator,
  Tooltip,
  createForm,
  useId,
} from 'moraine'
import type { AvatarGroupT, AvatarT, ModalT } from 'moraine'
import { createDesign } from 'moraine/design'
import { createContextProvider, renderComponentOrElement } from 'moraine/utils'
import type { Component, JSX } from 'solid-js'
import * as v from 'valibot'

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
// @ts-expect-error Provider types are only public from the root entry.
type UtilsMoraineConfig = import('moraine/utils').MoraineConfig

export type PublicEntryIsolation = [
  RecipeEntry,
  RootRecipe,
  UtilsProvider,
  UtilsCn,
  UtilsStyleVarRecord,
  UtilsMoraineConfig,
]

const CustomRoot: Component<{ required: string; children?: JSX.Element }> = (props) => (
  <section data-required={props.required}>{props.children}</section>
)
const modalContentContext: ModalT.ContentContext = { close: () => undefined }
modalContentContext.close()

;<Badge aria-label="status" data-testid="badge">
  Ready
</Badge>
;<Avatar text="MR" />
;<AvatarGroup items={[{ text: 'MR' }]} />
;<Button onClick={() => undefined}>Save</Button>
;<Card aria-describedby="details" />
;<Icon name="i-lucide-search" aria-label="Search" data-testid="icon" />
;<Icon name="i-lucide-search" class="size-4" style={{ color: 'red' }} />
;<Kbd value="K" class="px-2" style={{ color: 'red' }} />
;<Separator class="my-2" style={{ color: 'red' }} />
;<Button as={CustomRoot} required="yes" />
;<List items={[1, 2]} itemRender={(context) => context.item} />
;<Modal defaultOpen>
  <Modal.Content overlay ariaLabel="Type fixture">
    Modal content
  </Modal.Content>
</Modal>

;<Dialog>
  <Dialog.Trigger as={CustomRoot} data-testid="dialog-trigger" required="dialog">
    Open dialog
  </Dialog.Trigger>
  <Dialog.Content />
</Dialog>
;<Popover>
  <Popover.Trigger as={CustomRoot} data-testid="popover-trigger" required="popover">
    Open popover
  </Popover.Trigger>
  <Popover.Content />
</Popover>
;<Tooltip>
  <Tooltip.Trigger as={CustomRoot} data-testid="tooltip-trigger" required="tooltip">
    Hover target
  </Tooltip.Trigger>
  <Tooltip.Content />
</Tooltip>
;<DropdownMenu>
  <DropdownMenu.Trigger as={CustomRoot} data-testid="dropdown-trigger" required="dropdown">
    Open menu
  </DropdownMenu.Trigger>
  <DropdownMenu.Content items={[]} />
</DropdownMenu>
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

const acceptSpan = (element: HTMLSpanElement) => element.focus()
const divRef = (element: HTMLDivElement) => element.focus()

;<Badge ref={(element) => acceptSpan(element)} />

// @ts-expect-error Badge's root ref must target HTMLSpanElement.
;<Badge ref={divRef} />

;<Badge id="badge" />
;<Card onClick={() => undefined} />
;<Card href="/details" />
// @ts-expect-error Required custom component props must be supplied to the trigger.
;<Dialog.Trigger as={CustomRoot} />
;<List id="items" items={[1]} itemRender={(context) => context.item} />

const rootOnlyForm = createForm({ schema: v.object({ email: v.string() }) })
;<rootOnlyForm.Form class="space-y-2" style={{ color: 'red' }} />

const avatarItem: AvatarT.Item = {}
const avatarBase: AvatarT.Base = { text: 'MR' }
const avatarGroupItem: AvatarGroupT.Item = { text: 'MR' }
const generatedId = useId()
void createContextProvider
void renderComponentOrElement
void avatarItem
void avatarBase
void avatarGroupItem
void generatedId

// @ts-expect-error String root style is rejected
;<Button style="color: red" />

// @ts-expect-error String slot style is rejected
;<Modal defaultOpen styles={{ content: 'color: red' }} />

// @ts-expect-error Modal root no longer owns named slots.
;<Modal classes={{ trigger: 'trigger' }} />

// @ts-expect-error The legacy config prop is removed.
;<MoraineProvider config={{}} />

// @ts-expect-error A Design is required.
;<MoraineProvider />

// @ts-expect-error String defineStyleVars extra styles are rejected
defineStyleVars({ base: { size: '1px' } })({}, 'color: red')

const design = createDesign({
  button: { base: { root: 'rounded-lg' }, defaultVariants: { size: 'sm' } },
  form: { base: { root: 'space-y-2' } },
  icon: { base: { root: 'size-4' } },
  kbd: { base: { root: 'px-1' } },
  modal: { base: { content: 'p-4' } },
  separator: { base: { root: 'border-t' } },
})
;<MoraineProvider design={design}>
  <Button />
</MoraineProvider>

// @ts-expect-error Unknown component names are rejected.
createDesign({ unknownComponent: {} })
// @ts-expect-error List has no Design slots.
createDesign({ list: { base: { root: 'p-4' } } })
createDesign({ collapsible: { base: { content: 'overflow-hidden' } } })
// @ts-expect-error Collapsible has no visual variants.
createDesign({ collapsible: { defaultVariants: { size: 'sm' } } })
// @ts-expect-error Unknown slots are rejected.
createDesign({ button: { base: { missing: 'p-4' } } })
// @ts-expect-error Variant defaults are constrained to component variants.
createDesign({ button: { defaultVariants: { size: 'huge' } } })
// @ts-expect-error Design does not accept inline styles.
createDesign({ button: { styles: { root: { color: 'red' } } } })
// @ts-expect-error Design does not accept legacy class maps.
createDesign({ button: { classes: { root: 'p-4' } } })
// @ts-expect-error Variant selectors are constrained.
createDesign({ button: { variants: { size: { huge: { root: 'p-4' } } } } })
// @ts-expect-error Compound slots are constrained.
createDesign({ button: { compoundVariants: [{ size: 'sm', class: { missing: 'p-4' } }] } })
