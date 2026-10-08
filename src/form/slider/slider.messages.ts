export interface SliderThumbContext {
  index: number
  total: number
}

export interface SliderValueTextContext {
  value: number
  index: number
  total: number
}

export const defaultSliderMessages = /* @__PURE__ */ Object.freeze({
  thumb: ({ index, total }: SliderThumbContext) =>
    total <= 1 ? 'Thumb' : `Thumb ${index + 1} of ${total}`,
  valueText: ({ value, index, total }: SliderValueTextContext) => {
    if (total === 2) {
      return `${value} ${index === 0 ? 'start' : 'end'} range`
    }
    if (total > 2) {
      return `${value} thumb ${index + 1} of ${total}`
    }
    return String(value)
  },
})
