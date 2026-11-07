export interface PinInputContext {
  index: number
  length: number
}

export const defaultPinInputMessages = /* @__PURE__ */ Object.freeze({
  input: ({ index, length }: PinInputContext) => `Pin input ${index} of ${length}`,
})
