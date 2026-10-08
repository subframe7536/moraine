import type { MoraineMessages } from '../../provider/locale/messages.types'

export const defaultSliderMessages: MoraineMessages['slider'] = /* @__PURE__ */ Object.freeze({
  thumb: ({ index, total }) => (total <= 1 ? 'Thumb' : `Thumb ${index + 1} of ${total}`),
  valueText: ({ value, index, total }) => {
    if (total === 2) {
      return `${value} ${index === 0 ? 'start' : 'end'} range`
    }
    if (total > 2) {
      return `${value} thumb ${index + 1} of ${total}`
    }
    return String(value)
  },
})
