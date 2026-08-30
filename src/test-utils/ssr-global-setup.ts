import { createServer } from 'vite'
import solid from 'vite-plugin-solid'
import type { TestProject } from 'vitest/node'

type SsrFixture = () => unknown
type SsrFixtureModule = Record<string, unknown>

const getFixtureModules = (): string[] =>
  Object.keys(import.meta.glob('/src/**/*.ssr.fixture.tsx')).sort()

export async function renderFixtures(
  project: TestProject,
  createViteServer: typeof createServer = createServer,
  modules: string[] = getFixtureModules(),
): Promise<void> {
  const server = await createViteServer({
    appType: 'custom',
    configFile: false,
    root: project.config.root,
    logLevel: 'silent',
    plugins: [solid({ dev: false, hot: false, ssr: true })],
    server: { middlewareMode: true },
  })
  const runner = (
    server.environments.ssr as typeof server.environments.ssr & {
      runner: { import: <T>(id: string) => Promise<T> }
    }
  ).runner
  const markup: Record<string, string> = {}

  try {
    for (const modulePath of modules) {
      const fixtureModule = await runner.import<SsrFixtureModule>(modulePath)
      for (const [exportName, candidate] of Object.entries(fixtureModule)) {
        if (!/^render.*Fixture$/.test(exportName)) {
          continue
        }
        if (typeof candidate !== 'function') {
          throw new TypeError(`SSR fixture export is not callable: ${modulePath}#${exportName}`)
        }

        const value = (candidate as SsrFixture)()
        if (typeof value !== 'string') {
          throw new TypeError(
            `SSR fixture export must return a string: ${modulePath}#${exportName}`,
          )
        }
        markup[`${modulePath}#${exportName}`] = value
      }
    }

    project.provide('ssrFixtures', markup)
  } finally {
    await server.close()
  }
}

export async function setup(project: TestProject): Promise<void> {
  await renderFixtures(project)
  project.onTestsRerun(() => renderFixtures(project))
}
