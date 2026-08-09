import { createServer } from 'vite'
import solid from 'vite-plugin-solid'

const [modulePath, exportName] = process.argv.slice(2)

if (!modulePath?.startsWith('/src/') || !exportName) {
  throw new Error('Expected an absolute /src/ module path and export name')
}

const server = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  plugins: [
    solid({
      dev: false,
      hot: false,
      solid: { generate: 'ssr', hydratable: true },
    }),
  ],
  server: { middlewareMode: true },
})

try {
  const fixture = (await server.ssrLoadModule(modulePath)) as Record<string, unknown>
  const renderFixture = fixture[exportName]

  if (typeof renderFixture !== 'function') {
    throw new TypeError(`SSR fixture export is not callable: ${exportName}`)
  }

  process.stdout.write(String(renderFixture()))
} finally {
  await server.close()
}
