import { transformerVariantGroup } from '@subf/unocss'
import MagicString from 'magic-string'
import type { Plugin } from 'vite'

const CLASS_MODULE_RE = /\.class\.ts(?:\?.*)?$/

/** Expands UnoCSS variant groups in class modules before framework transforms run. */
export function variantGroupPlugin(): Plugin {
  // Keep utilities containing parentheses (e.g. h-(--size)) outside variant groups.
  const transformer = transformerVariantGroup({ separators: [':'] })

  return {
    name: 'moraine:variant-group',
    enforce: 'pre',
    transform: {
      order: 'pre',
      filter: {
        id: CLASS_MODULE_RE,
        code: /:\(/,
      },
      async handler(code, id) {
        const transformed = new MagicString(code)
        await transformer.transform(transformed, id, undefined as any)
        if (!transformed.hasChanged()) {
          return null
        }

        return {
          code: transformed.toString(),
          map: transformed.generateMap({ hires: true }),
        }
      },
    },
  }
}
