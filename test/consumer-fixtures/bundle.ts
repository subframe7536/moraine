import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

import { build } from 'vite'

import { createIsolatedConsumer, removeIsolatedConsumer } from './helpers.ts'

/** Builds a tree-shaken consumer of the published JavaScript entry. */
export async function buildConsumerBundle(source: string) {
  const consumer = createIsolatedConsumer()
  try {
    const entry = join(consumer.root, 'entry.js')
    writeFileSync(entry, source)
    const result = await build({
      root: consumer.root,
      configFile: false,
      logLevel: 'silent',
      build: {
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
