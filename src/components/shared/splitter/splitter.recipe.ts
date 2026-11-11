import { createDataAttributes } from '../../../theme/style-contract'

// Keep these literal names in sync with the SPLITTER_*_ATTRIBUTE constants
// in manager.ts; the api-doc extractor only resolves literal args.
export const splitterDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('splitter-root'),
  intersection: /* @__PURE__ */ createDataAttributes(
    'splitter-start-target',
    'splitter-end-target',
  ),
}
