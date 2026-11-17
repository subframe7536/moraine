export interface SliderThumbContext {
  index: number
  total: number
}

export interface SliderValueTextContext {
  value: number
  /** The value formatted with the slider's `formatOptions`. */
  text: string
  index: number
  total: number
}

export const defaultSliderMessages = /* @__PURE__ */ Object.freeze({
  thumb: ({ index, total }: SliderThumbContext) =>
    total <= 1 ? 'Thumb' : `Thumb ${index + 1} of ${total}`,
  valueText: ({ text, index, total }: SliderValueTextContext) => {
    if (total === 2) {
      return `${text} ${index === 0 ? 'start' : 'end'} range`
    }
    if (total > 2) {
      return `${text} thumb ${index + 1} of ${total}`
    }
    return text
  },
})
