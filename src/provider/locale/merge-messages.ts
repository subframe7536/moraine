import type { MoraineMessages, MoraineMessagesInput } from './messages.types'

const cache = new WeakMap<MoraineMessages, WeakMap<object, MoraineMessages>>()

function mergeGroup<T extends object>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) {
    return base
  }
  return Object.freeze({ ...base, ...patch })
}

/** Deep-merges a partial pack over a resolved message object. Repeated pairs are cached. */
export function mergeMessages(
  base: MoraineMessages,
  input: MoraineMessagesInput | undefined,
): MoraineMessages {
  if (input === undefined) {
    return base
  }

  let byInput = cache.get(base)
  if (!byInput) {
    byInput = new WeakMap()
    cache.set(base, byInput)
  }
  const cached = byInput.get(input)
  if (cached) {
    return cached
  }

  const merged = {
    dialog: mergeGroup(base.dialog, input.dialog),
    sheet: mergeGroup(base.sheet, input.sheet),
    commandPalette: mergeGroup(base.commandPalette, input.commandPalette),
    select: mergeGroup(base.select, input.select),
    combobox: mergeGroup(base.combobox, input.combobox),
    multiSelect: mergeGroup(base.multiSelect, input.multiSelect),
    pagination: mergeGroup(base.pagination, input.pagination),
    inputNumber: mergeGroup(base.inputNumber, input.inputNumber),
    fileUpload: mergeGroup(base.fileUpload, input.fileUpload),
    tagsField: mergeGroup(base.tagsField, input.tagsField),
    resizable: mergeGroup(base.resizable, input.resizable),
    sidebarFrame: mergeGroup(base.sidebarFrame, input.sidebarFrame),
    form: mergeGroup(base.form, input.form),
    kbd: mergeGroup(base.kbd, input.kbd),
  } satisfies MoraineMessages

  const frozen = Object.freeze(merged)
  byInput.set(input, frozen)
  return frozen
}
