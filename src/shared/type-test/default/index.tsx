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
  List,
  Modal,
  MoraineProvider,
  Popover,
  Sheet,
  Tooltip,
  defineStyleVars,
} from 'moraine'
import type { AvatarGroupT, AvatarT, ModalT } from 'moraine'
import type { Component, JSX } from 'solid-js'

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
;<Button as={CustomRoot} required="yes" />
;<List items={[1, 2]} itemRender={(context) => context.item} />
;<Modal defaultOpen>
  <Modal.Content overlay ariaLabel="Type fixture">
    Modal content
  </Modal.Content>
</Modal>

;<Dialog data-testid="dialog-trigger">
  {(props) => (
    <CustomRoot {...props} required="dialog">
      Open dialog
    </CustomRoot>
  )}
</Dialog>
;<Popover data-testid="popover-trigger">
  {(props) => (
    <CustomRoot {...props} required="popover">
      Open popover
    </CustomRoot>
  )}
</Popover>
;<Tooltip data-testid="tooltip-trigger">
  {(props) => (
    <CustomRoot {...props} required="tooltip">
      Hover target
    </CustomRoot>
  )}
</Tooltip>
;<DropdownMenu items={[]} data-testid="dropdown-trigger">
  {(props) => (
    <CustomRoot {...props} required="dropdown">
      Open menu
    </CustomRoot>
  )}
</DropdownMenu>
;<ContextMenu items={[]} data-testid="context-trigger">
  {(props) => (
    <CustomRoot {...props} required="context">
      Open menu
    </CustomRoot>
  )}
</ContextMenu>
;<Sheet data-testid="sheet-trigger">
  {(props) => (
    <CustomRoot {...props} required="sheet">
      Open sheet
    </CustomRoot>
  )}
</Sheet>

const acceptSpan = (element: HTMLSpanElement) => element.focus()
const divRef = (element: HTMLDivElement) => element.focus()

;<Badge ref={(element) => acceptSpan(element)} />

// @ts-expect-error Badge's root ref must target HTMLSpanElement.
;<Badge ref={divRef} />

;<Badge id="badge" />
;<Card onClick={() => undefined} />
;<Card href="/details" />
// @ts-expect-error Required custom component props must be supplied in the callback.
;<Dialog>{(props) => <CustomRoot {...props} />}</Dialog>
;<List id="items" items={[1]} itemRender={(context) => context.item} />

const avatarItem: AvatarT.Item = {}
const avatarBase: AvatarT.Base = { text: 'MR' }
const avatarGroupItem: AvatarGroupT.Item = { text: 'MR' }
void avatarItem
void avatarBase
void avatarGroupItem

// @ts-expect-error String root style is rejected
;<Button style="color: red" />

// @ts-expect-error String slot style is rejected
;<Modal defaultOpen styles={{ content: 'color: red' }} />

// @ts-expect-error String defineStyleVars extra styles are rejected
defineStyleVars({ base: { size: '1px' } })({}, 'color: red')

// @ts-expect-error String style values on MoraineProvider config are rejected
;<MoraineProvider config={{ button: { style: 'color: red' } }} />

// @ts-expect-error String styles values on MoraineProvider config are rejected
;<MoraineProvider config={{ button: { styles: { root: 'color: red' } } }} />
