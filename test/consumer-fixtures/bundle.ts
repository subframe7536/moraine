import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

import { build } from 'vite'
import solid from 'vite-plugin-solid'

import { createIsolatedConsumer, removeIsolatedConsumer } from './helpers'

/** Builds a tree-shaken consumer of the published JavaScript entry. */
export async function buildConsumerBundle(
  source: string,
  options: { mode?: 'esm' | 'client' | 'ssr'; virtualizer?: boolean } = {},
) {
  const consumer = createIsolatedConsumer(options)
  try {
    const entry = join(
      consumer.root,
      options.mode === 'esm' || !options.mode ? 'entry.js' : 'entry.tsx',
    )
    writeFileSync(entry, source)
    const result = await build({
      root: consumer.root,
      configFile: false,
      logLevel: 'silent',
      plugins:
        options.mode && options.mode !== 'esm'
          ? [
              solid({
                dev: false,
                hot: false,
                ssr: options.mode === 'ssr',
                solid: { hydratable: true },
              }),
            ]
          : [],
      ssr: { noExternal: true },
      build: {
        ssr: options.mode === 'ssr',
        write: false,
        minify: false,
        lib: { entry, formats: ['es'] },
      },
    })
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) =>
      'output' in item ? item.output : [],
    )
    const chunks = outputs.filter((item) => item.type === 'chunk')
    const code = chunks.map((chunk) => chunk.code).join('\n')
    return {
      code,
      modules: chunks.flatMap((chunk) => Object.keys(chunk.modules)),
      raw: Buffer.byteLength(code),
      gzip: gzipSync(code).byteLength,
    }
  } finally {
    removeIsolatedConsumer(consumer)
  }
}
