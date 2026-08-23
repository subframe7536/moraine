import { createServer } from 'vite'
import solid from 'vite-plugin-solid'
import type { TestProject } from 'vitest/node'

type SsrFixture = () => unknown
type SsrFixtureModule = Record<string, unknown>

const fixtureModules = [
  '/src/elements/badge/badge.ssr.fixture.tsx',
  '/src/elements/button/button.ssr.fixture.tsx',
  '/src/elements/collapsible/collapsible.ssr.fixture.tsx',
  '/src/elements/progress/progress.ssr.fixture.tsx',
  '/src/elements/separator/separator.ssr.fixture.tsx',
  '/src/forms/checkbox/checkbox.ssr.fixture.tsx',
  '/src/forms/checkbox-group/checkbox-group.ssr.fixture.tsx',
  '/src/forms/file-upload/file-upload.ssr.fixture.tsx',
  '/src/forms/form/form.ssr.fixture.tsx',
  '/src/forms/form-field/form-field.ssr.fixture.tsx',
  '/src/forms/input/input.ssr.fixture.tsx',
  '/src/forms/input-number/input-number.ssr.fixture.tsx',
  '/src/forms/radio-group/radio-group.ssr.fixture.tsx',
  '/src/forms/select/multi-select.ssr.fixture.tsx',
  '/src/forms/select/select.ssr.fixture.tsx',
  '/src/forms/slider/slider.ssr.fixture.tsx',
  '/src/forms/switch/switch.ssr.fixture.tsx',
  '/src/forms/textarea/textarea.ssr.fixture.tsx',
  '/src/navigation/breadcrumb/breadcrumb.ssr.fixture.tsx',
  '/src/navigation/pagination/pagination.ssr.fixture.tsx',
  '/src/navigation/tabs/tabs.ssr.fixture.tsx',
  '/src/overlays/context-menu/context-menu.ssr.fixture.tsx',
  '/src/overlays/modal/modal.ssr.fixture.tsx',
  '/src/overlays/dialog/dialog.ssr.fixture.tsx',
  '/src/overlays/dropdown-menu/dropdown-menu.ssr.fixture.tsx',
  '/src/overlays/popover/popover.ssr.fixture.tsx',
  '/src/overlays/sheet/sheet.ssr.fixture.tsx',
  '/src/overlays/tooltip/tooltip.ssr.fixture.tsx',
]

export async function renderFixtures(
  project: TestProject,
  createViteServer: typeof createServer = createServer,
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
    for (const modulePath of fixtureModules) {
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
