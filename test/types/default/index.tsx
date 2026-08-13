import {
  Badge,
  Button,
  Card,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Icon,
  List,
  Modal,
  Popover,
  Sheet,
  Tooltip,
} from 'moraine'
import type { ModalT } from 'moraine'
import type { Component, JSX } from 'solid-js'

const CustomRoot: Component<{ required: string; children?: JSX.Element }> = (props) => (
  <section data-required={props.required}>{props.children}</section>
)
const modalContentContext: ModalT.ContentContext = { close: () => undefined }
modalContentContext.close()

;<Badge aria-label="status" data-testid="badge">
  Ready
</Badge>
;<Button onClick={() => undefined}>Save</Button>
;<Card aria-describedby="details" />
;<Icon name="i-lucide-search" aria-label="Search" data-testid="icon" />
;<Button as={CustomRoot} required="yes" />
;<List items={[1, 2]} itemRender={(context) => context.item} />
;<Modal defaultOpen>
  <Modal.Overlay />
  <Modal.Content ariaLabel="Type fixture" contentRender="Modal content" />
</Modal>

;<Dialog>
  {(props) => (
    <CustomRoot {...props} required="dialog">
      Open dialog
    </CustomRoot>
  )}
</Dialog>
;<Popover>
  {(props) => (
    <CustomRoot {...props} required="popover">
      Open popover
    </CustomRoot>
  )}
</Popover>
;<Tooltip>
  {(props) => (
    <CustomRoot {...props} required="tooltip">
      Hover target
    </CustomRoot>
  )}
</Tooltip>
;<DropdownMenu items={[]}>
  {(props) => (
    <CustomRoot {...props} required="dropdown">
      Open menu
    </CustomRoot>
  )}
</DropdownMenu>
;<ContextMenu items={[]}>
  {(props) => (
    <CustomRoot {...props} required="context">
      Open menu
    </CustomRoot>
  )}
</ContextMenu>
;<Sheet>
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
