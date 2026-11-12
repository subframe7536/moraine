import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on, untrack } from 'solid-js'

import type { OverlayMenuGroup } from './menu.utils'
import type { OverlayMenuItem } from './types'

export function createMenuRadioState<TItem extends OverlayMenuItem = OverlayMenuItem>(options: {
  groups: Accessor<OverlayMenuGroup<TItem>[]>
}) {
  const groups = options.groups
  const [radioGroupValues, setRadioGroupValues] = createSignal<Record<string, string | undefined>>(
    untrack(() => {
      const initialValues: Record<string, string | undefined> = {}

      for (const group of groups()) {
        for (const item of group.items) {
          if (
            item.type === 'radio' &&
            item.group &&
            item.value !== undefined &&
            (item.checked ?? item.defaultChecked)
          ) {
            initialValues[item.group] = item.value
          }
        }
      }

      return initialValues
    }),
  )

  const radioItemSnapshot = () =>
    groups().map((group) =>
      group.items.map((item) => ({
        type: item.type,
        group: 'group' in item ? item.group : undefined,
        value: 'value' in item ? item.value : undefined,
        checked: 'checked' in item ? item.checked : undefined,
      })),
    )

  createEffect(
    on(radioItemSnapshot, (itemGroups) => {
      const controlledGroups = new Set<string>()
      const controlledValues: Record<string, string | undefined> = {}

      for (const group of itemGroups) {
        for (const item of group) {
          if (
            item.type !== 'radio' ||
            !item.group ||
            item.value === undefined ||
            item.checked === undefined
          ) {
            continue
          }

          controlledGroups.add(item.group)
          if (item.checked) {
            controlledValues[item.group] = item.value
          }
        }
      }

      if (controlledGroups.size === 0) {
        return
      }

      setRadioGroupValues((currentValues) => {
        const nextValues = { ...currentValues }

        for (const group of controlledGroups) {
          delete nextValues[group]
          if (controlledValues[group] !== undefined) {
            nextValues[group] = controlledValues[group]
          }
        }

        return nextValues
      })
    }),
  )

  return { radioGroupValues, setRadioGroupValues }
}
