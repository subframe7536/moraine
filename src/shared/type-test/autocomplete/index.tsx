import {
  Avatar,
  Badge,
  Button,
  Card,
  Collapsible,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Icon,
  Kbd,
  Modal,
  MoraineProvider,
  Popover,
  Sheet,
  Separator,
  Tooltip,
  createForm,
  useId,
} from 'moraine'
import type { ModalT } from 'moraine'
import { createDesign } from 'moraine/design'
import type { Component, JSX } from 'solid-js'
import * as v from 'valibot'

declare module 'moraine' {
  interface MoraineTypeConfig {
    enableRootAutocomplete: true
  }
}

const CustomRoot: Component<{ required: string; children?: JSX.Element }> = (props) => (
  <section>
    {props.required}
    {props.children}
  </section>
)
const foo = () => undefined
const generatedId = useId()
void generatedId
const acceptSpan = (element: HTMLSpanElement) => element.focus()
const acceptAnchor = (element: HTMLAnchorElement) => element.focus()
const modalContentContext: ModalT.ContentContext = { close: () => undefined }
modalContentContext.close()

;<Badge
  id="badge"
  title="status"
  hidden
  data-testid="badge"
  onClick={() => undefined}
  ref={(element) => acceptSpan(element)}
/>
;<Avatar text="MR" />
;<Card id="card" title="details" onClick={() => undefined} />
;<Icon name="i-lucide-search" aria-label="Search" hidden onClick={() => undefined} />
;<Icon name="i-lucide-search" class="size-4" style={{ color: 'red' }} />
;<Kbd value="K" class="px-2" style={{ color: 'red' }} />
;<Separator class="my-2" style={{ color: 'red' }} />
;<Button
  as="a"
  href="/docs"
  target="_blank"
  rel="noreferrer"
  onClick={() => undefined}
  ref={(element) => acceptAnchor(element)}
/>
;<Button as={CustomRoot} required="yes" />
;<Button as="input" type="checkbox" />
;<Modal defaultOpen>
  <Modal.Content overlay ariaLabel="Type fixture">
    Modal content
  </Modal.Content>
</Modal>
;<Dialog>
  <Dialog.Trigger as="a" data-testid="dialog-trigger" hidden href="/dialog">
    Open dialog
  </Dialog.Trigger>
  <Dialog.Content />
</Dialog>
;<Popover>
  <Popover.Trigger as="span" data-testid="popover-trigger" hidden>
    Open popover
  </Popover.Trigger>
  <Popover.Content />
</Popover>
;<Tooltip>
  <Tooltip.Trigger as="button" data-testid="tooltip-trigger" hidden type="button">
    Hover target
  </Tooltip.Trigger>
  <Tooltip.Content />
</Tooltip>
;<DropdownMenu>
  <DropdownMenu.Trigger as="button" data-testid="dropdown-trigger" hidden type="button">
    Open menu
  </DropdownMenu.Trigger>
  <DropdownMenu.Content items={[]} />
</DropdownMenu>
;<ContextMenu>
  <ContextMenu.Trigger as="div" data-testid="context-trigger" hidden>
    Open menu
  </ContextMenu.Trigger>
  <ContextMenu.Content items={[]} />
</ContextMenu>
;<Sheet>
  <Sheet.Trigger as="span" data-testid="sheet-trigger" hidden>
    Open sheet
  </Sheet.Trigger>
  <Sheet.Content />
</Sheet>

const rootOnlyForm = createForm({ schema: v.object({ email: v.string() }) })
;<rootOnlyForm.Form class="space-y-2" style={{ color: 'red' }} />

// @ts-expect-error Root-only components do not accept instance slot class maps.
;<Icon name="i-lucide-search" classes={{ root: 'size-4' }} />
// @ts-expect-error Root-only components do not accept instance slot style maps.
;<Kbd value="K" styles={{ root: { color: 'red' } }} />
// @ts-expect-error Root-only components do not accept instance slot class maps.
;<Separator classes={{ root: 'my-2' }} />
// @ts-expect-error The bound Form component does not accept instance slot style maps.
;<rootOnlyForm.Form styles={{ root: { color: 'red' } }} />

createDesign({
  form: { base: { root: 'space-y-2' } },
  icon: { base: { root: 'size-4' } },
  kbd: { base: { root: 'px-1' } },
  separator: { base: { root: 'border-t' } },
})

// @ts-expect-error Button<'a'> exposes anchor props and rejects button-only props.
;<Button as="a" formAction="/submit" />
// @ts-expect-error A span root rejects anchor-only attributes.
;<Badge href="/docs" />
// @ts-expect-error Avatar transition speed is no longer public.
;<Avatar transition="fast" />
// @ts-expect-error Lowercase event aliases are intentionally stripped.
;<Card onclick={() => undefined} />
// @ts-expect-error Solid directive prefixes are intentionally stripped.
;<Card use:foo={foo} />
// @ts-expect-error Required custom component props remain required through `as`.
;<Button as={CustomRoot} />
// @ts-expect-error Required custom component props must be supplied to the trigger.
;<Dialog.Trigger as={CustomRoot} />

// @ts-expect-error String root style is rejected
;<Button style="color: red" />

// @ts-expect-error String slot style is rejected
;<Modal defaultOpen styles={{ content: 'color: red' }} />

// @ts-expect-error Modal root no longer owns named slots.
;<Modal classes={{ trigger: 'trigger' }} />

// @ts-expect-error Collapsible rejects unknown named slots.
;<Collapsible classes={{ unknownSlot: 'trigger' }} />

// @ts-expect-error Provider variant defaults use variants, not defaultProps.
;<MoraineProvider config={{ button: { defaultProps: { size: 'sm' } } }} />

// @ts-expect-error Provider root styles use classes.root instead of class.
;<MoraineProvider config={{ button: { class: 'root' } }} />

// @ts-expect-error Provider root styles use styles.root instead of style.
;<MoraineProvider config={{ button: { style: { color: 'red' } } }} />

// @ts-expect-error Modal has no Provider configuration.
;<MoraineProvider config={{ modal: {} }} />

// @ts-expect-error Collapsible has no Provider configuration.
;<MoraineProvider config={{ collapsible: {} }} />

// @ts-expect-error String defineStyleVars extra styles are rejected
defineStyleVars({ base: { size: '1px' } })({}, 'color: red')

// @ts-expect-error String style values on MoraineProvider config are rejected
;<MoraineProvider config={{ button: { style: 'color: red' } }} />

// @ts-expect-error String styles values on MoraineProvider config are rejected
;<MoraineProvider config={{ button: { styles: { root: 'color: red' } } }} />
