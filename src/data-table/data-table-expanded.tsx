import type { RowData } from '@tanstack/solid-table'
import type { Component, JSX } from 'solid-js'
import { Show, onCleanup } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../provider'
import type { SlotOverrides } from '../provider'
import type { DisclosureState } from '../shared/disclosure-state'
import { createDisclosureState } from '../shared/disclosure-state'

import {
  DATA_TABLE_EXPANDED_BODY_CLASS,
  DATA_TABLE_EXPANDED_WRAPPER_CLASS,
  dataTableDataAttributes,
  dataTableExpandedWrapperDataAttributes,
  dataTableRecipe,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

export function createDataTableRowDisclosure(open: () => boolean): DisclosureState {
  return createDisclosureState({
    open,
    transition: true,
  })
}

export function DataTableExpandedRow<TData extends RowData>(props: {
  disclosure: DisclosureState
  initiallyExpanded: boolean
  colSpan: number
  row: DataTableT.Row<TData>
  render: Component<DataTableT.ExpandedRowRenderProps<TData>>
  slotOverrides: SlotOverrides
}): JSX.Element {
  const {
    slots: { expandedRow: expandedRowSlot, expandedCell: expandedCellSlot },
  } = useRecipe(
    dataTableRecipe,
    {},
    {
      varsSlot: 'expandedCell',
      data: {
        expandedRow: dataTableDataAttributes.expandedRow(() => ({
          expanded: props.disclosure.open,
          closed: props.disclosure.closed,
        })),
        expandedCell: dataTableDataAttributes.expandedCell(() => ({
          expanded: props.disclosure.open,
          closed: props.disclosure.closed,
        })),
      },
      context: () => props.slotOverrides,
      own: {
        expandedCell: () => ({
          style: {
            '--mo-collapsible-content-height': `${props.disclosure.contentHeight()}px`,
          },
        }),
      },
    },
  )

  return (
    <Show when={props.disclosure.shouldMount()}>
      <tr data-slot="data-table-expanded-row" {...expandedRowSlot}>
        <td data-slot="data-table-expanded-cell" colSpan={props.colSpan} {...expandedCellSlot}>
          <div
            ref={(element) => {
              onCleanup(props.disclosure.registerPresenceElement(element))
            }}
            data-slot="data-table-expanded-content"
            hidden={props.disclosure.hidden()}
            inert={props.disclosure.inert()}
            aria-hidden={props.disclosure.ariaHidden()}
            class={DATA_TABLE_EXPANDED_WRAPPER_CLASS}
            style={{
              animation:
                props.initiallyExpanded && props.disclosure.initialOpen() ? 'none' : undefined,
              height:
                props.initiallyExpanded && props.disclosure.initialOpen() ? 'auto' : undefined,
            }}
            // oxlint-disable-next-line moraine/data-attributes-in-slot-binding -- The wrapper is a private host with a static class constant and no recipe slot.
            {...dataTableExpandedWrapperDataAttributes({
              expanded: props.disclosure.open,
              closed: props.disclosure.closed,
              transition: true,
            })}
          >
            <div
              ref={(element) => {
                onCleanup(props.disclosure.registerMeasureElement(element))
              }}
              class={DATA_TABLE_EXPANDED_BODY_CLASS}
            >
              <Dynamic component={props.render} row={props.row} />
            </div>
          </div>
        </td>
      </tr>
    </Show>
  )
}
