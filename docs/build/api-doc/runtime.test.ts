import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { RuntimeExtractor } from './runtime'

async function fixture(source: string) {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-runtime-'))
  await mkdir(path.join(projectRoot, 'src'), { recursive: true })
  await writeFile(path.join(projectRoot, 'src/fixture.tsx'), source, 'utf8')
  return {
    projectRoot,
    cleanup: () => rm(projectRoot, { recursive: true, force: true }),
  }
}

describe('RuntimeExtractor', () => {
  test('preserves uncertainty when only part of an attribute value is static', async () => {
    const testProject = await fixture(`
      function DynamicValues() {
        return (
          <div
            data-slot="root"
            aria-checked={indeterminate() ? 'mixed' : checked()}
            aria-expanded={open()}
            aria-label={count() <= 1 ? 'Thumb' : \`Thumb \${index() + 1} of \${count()}\`}
            data-disabled={disabled() ? '' : undefined}
            data-static=""
            data-state={open() ? 'open' : 'closed'}
          />
        )
      }
      function StaticValues() {
        return <div data-slot="root" aria-checked={mixed() ? 'mixed' : false} />
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const dynamic = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'DynamicValues',
        publicSlotNames: new Set(['root']),
        targetFallback: 'root',
      })
      const attributes = dynamic.targets[0]?.attributes
      expect(attributes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'aria-checked', value: { kind: 'dynamic' } }),
          expect.objectContaining({ name: 'aria-expanded', value: { kind: 'boolean' } }),
          expect.objectContaining({ name: 'aria-label', value: { kind: 'dynamic' } }),
          expect.objectContaining({ name: 'data-disabled', value: { kind: 'presence' } }),
          expect.objectContaining({ name: 'data-static', value: { kind: 'presence' } }),
          expect.objectContaining({
            name: 'data-state',
            value: { kind: 'enum', values: ['closed', 'open'] },
          }),
        ]),
      )

      const staticallyEnumerable = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'StaticValues',
        publicSlotNames: new Set(['root']),
        targetFallback: 'root',
      })
      expect(staticallyEnumerable.targets[0]?.attributes).toEqual([
        expect.objectContaining({
          name: 'aria-checked',
          value: { kind: 'enum', values: ['false', 'mixed'] },
        }),
      ])
    } finally {
      await testProject.cleanup()
    }
  })

  test('extracts only the requested implementation and preserves value semantics', async () => {
    const testProject = await fixture(`
      function Root() {
        return <div data-slot="root" data-disabled={disabled() ? '' : undefined} role="group" />
      }
      function Item() {
        return (
          <button
            data-slot="item"
            data-side={side()}
            aria-checked={mixed() ? 'mixed' : false}
            aria-controls={contentId()}
            role="checkbox"
          />
        )
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Item',
        publicSlotNames: new Set(['root', 'item']),
        targetFallback: 'item',
        defaultElement: 'button',
      })

      expect(result.targets.map((target) => target.name)).toEqual(['item'])
      expect(result.targets[0]?.attributes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'aria-checked',
            value: { kind: 'enum', values: ['false', 'mixed'] },
          }),
          expect.objectContaining({ name: 'aria-controls', value: { kind: 'dynamic' } }),
          expect.objectContaining({ name: 'data-side', value: { kind: 'dynamic' } }),
          expect.objectContaining({ name: 'role', value: { kind: 'literal', value: 'checkbox' } }),
        ]),
      )
    } finally {
      await testProject.cleanup()
    }
  })

  test('recognizes presence, spread attributes, conditional targets, and CSS declarations', async () => {
    const testProject = await fixture(`
      function Demo() {
        const dataAttrs = () => ({
          'data-disabled': disabled() ? '' : undefined,
          'data-state': state() === 'open' ? 'open' : 'closed',
        })
        return (
          <div data-slot="root" {...dataAttrs()}>
            <Show when={visible()}>
              <div data-slot="wrapper" style={{ '--size': size(), width: 'var(--external)' }} />
            </Show>
            <div data-slot="positioner" data-internal="" />
          </div>
        )
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Demo',
        publicSlotNames: new Set(['root', 'wrapper']),
        targetFallback: 'root',
        defaultElement: 'div',
      })

      expect(result.targets.map((target) => target.name)).toEqual(['root', 'wrapper'])
      expect(result.targets.find((target) => target.name === 'root')?.attributes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'data-disabled', value: { kind: 'presence' } }),
          expect.objectContaining({
            name: 'data-state',
            value: { kind: 'enum', values: ['closed', 'open'] },
          }),
        ]),
      )
      expect(result.targets.find((target) => target.name === 'wrapper')?.condition).toBe(
        'Conditional',
      )
      expect(result.cssVariables).toEqual([
        expect.objectContaining({ name: '--size', target: 'wrapper' }),
      ])
    } finally {
      await testProject.cleanup()
    }
  })

  test('follows a repository-local delegated primitive and createComponent props', async () => {
    const testProject = await fixture(`
      import { createComponent, mergeProps } from 'solid-js'
      import { SharedTrigger } from './shared'
      function Trigger() {
        const triggerProps = mergeProps(
          { 'aria-haspopup': 'dialog', 'data-expanded': open() ? '' : undefined },
          props,
        )
        return createComponent(SharedTrigger, triggerProps)
      }
    `)
    await writeFile(
      path.join(testProject.projectRoot, 'src/shared.tsx'),
      `
        export function SharedTrigger(props) {
          return <button data-slot="trigger" aria-controls={contentId()} {...props} />
        }
      `,
      'utf8',
    )

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Trigger',
        publicSlotNames: new Set(['trigger']),
        targetFallback: 'trigger',
      })

      expect(result.targets).toEqual([
        expect.objectContaining({
          name: 'trigger',
          attributes: expect.arrayContaining([
            expect.objectContaining({ name: 'aria-controls', value: { kind: 'dynamic' } }),
            expect.objectContaining({
              name: 'aria-haspopup',
              value: { kind: 'literal', value: 'dialog' },
            }),
            expect.objectContaining({ name: 'data-expanded', value: { kind: 'presence' } }),
          ]),
        }),
      ])
      expect(extractor.diagnostics).toEqual([])
    } finally {
      await testProject.cleanup()
    }
  })

  test('does not merge an unmapped delegated root into its parent target', async () => {
    const testProject = await fixture(`
      import { Child, Helper } from './shared'
      function Demo() {
        return (
          <div data-slot="root">
            <Child />
            <Child slotName="leading" />
            <Helper />
          </div>
        )
      }
      function Wrapper() {
        return <Child />
      }
    `)
    await writeFile(
      path.join(testProject.projectRoot, 'src/shared.tsx'),
      `
        export function Child(props) {
          return <span data-slot={props.slotName ?? 'root'} aria-hidden="true" role="img" />
        }
        export function Helper() {
          return <div data-slot="content" data-expanded="" />
        }
      `,
      'utf8',
    )

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Demo',
        publicSlotNames: new Set(['root', 'leading', 'content']),
        targetFallback: 'root',
      })

      expect(result.targets.find((target) => target.name === 'root')?.attributes).toEqual([])
      expect(result.targets.find((target) => target.name === 'leading')?.attributes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'aria-hidden' }),
          expect.objectContaining({ name: 'role', value: { kind: 'literal', value: 'img' } }),
        ]),
      )
      expect(result.targets.find((target) => target.name === 'content')?.attributes).toEqual([
        expect.objectContaining({ name: 'data-expanded', value: { kind: 'presence' } }),
      ])

      const wrapper = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Wrapper',
        publicSlotNames: new Set(['close']),
        targetFallback: 'close',
      })
      expect(wrapper.targets).toEqual([
        expect.objectContaining({
          name: 'close',
          attributes: expect.arrayContaining([
            expect.objectContaining({ name: 'aria-hidden' }),
            expect.objectContaining({ name: 'role' }),
          ]),
        }),
      ])
    } finally {
      await testProject.cleanup()
    }
  })

  test('lets explicit public targets beat an earlier internal host fallback', async () => {
    const testProject = await fixture(`
      function Content() {
        return (
          <Show when={present()}>
            <div data-slot="positioner">
              <div data-slot="content" data-expanded={open() ? '' : undefined} />
            </div>
          </Show>
        )
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Content',
        publicSlotNames: new Set(['content']),
        targetFallback: 'content',
        defaultElement: 'div',
      })

      expect(result.targets).toEqual([
        expect.objectContaining({
          name: 'content',
          slot: 'content',
          selector: '[data-slot="content"]',
          element: 'div',
          attributes: [
            expect.objectContaining({ name: 'data-expanded', value: { kind: 'presence' } }),
          ],
        }),
      ])
      expect(extractor.diagnostics).toEqual([])
    } finally {
      await testProject.cleanup()
    }
  })

  test('diagnoses incompatible physical nodes that claim one public target', async () => {
    const testProject = await fixture(`
      function Content() {
        return (
          <>
            <div data-slot="content" />
            <span data-slot="content" />
          </>
        )
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Content',
        publicSlotNames: new Set(['content']),
        targetFallback: 'content',
      })
      expect(extractor.diagnostics).toEqual([
        expect.stringContaining('target content resolved to incompatible physical nodes'),
      ])
    } finally {
      await testProject.cleanup()
    }
  })

  test('uses delegated physical hosts while retaining call-site aliases', async () => {
    const testProject = await fixture(`
      import { Icon, Modal } from './shared'
      function Parent() {
        return (
          <button data-slot="root">
            <Icon slotName="leading" aria-hidden="true" role={role()} />
            <Modal.Close data-slot="contentClose" aria-label="Close" />
          </button>
        )
      }
    `)
    await writeFile(
      path.join(testProject.projectRoot, 'src/shared.tsx'),
      `
        export function Icon(props) {
          return <div data-slot={props.slotName ?? 'icon'} role="img" {...props} />
        }
        export function ModalClose(props) {
          const tag = () => props.as ?? 'button'
          return <Dynamic component={tag()} data-slot="close" {...props} />
        }
        export function Modal() {}
        Modal.Close = ModalClose
      `,
      'utf8',
    )

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Parent',
        publicSlotNames: new Set(['root', 'leading', 'contentClose']),
        targetFallback: 'root',
        defaultElement: 'button',
      })

      expect(result.targets.find((target) => target.name === 'leading')).toEqual(
        expect.objectContaining({
          element: 'div',
          selector: '[data-slot="leading"]',
          attributes: expect.arrayContaining([
            expect.objectContaining({ name: 'role', value: { kind: 'dynamic' } }),
          ]),
        }),
      )
      expect(result.targets.find((target) => target.name === 'contentClose')).toEqual(
        expect.objectContaining({ element: 'button', selector: '[data-slot="contentClose"]' }),
      )
      expect(extractor.diagnostics).toEqual([])
    } finally {
      await testProject.cleanup()
    }
  })

  test('promotes static data-slot values from object and mergeProps spreads', async () => {
    const testProject = await fixture(`
      function Trigger() {
        const triggerProps = {
          'data-slot': 'trigger',
          'data-expanded': open() ? '' : undefined,
        }
        return <Dynamic {...triggerProps} component="button" />
      }
      function MergedTrigger() {
        const state = { 'data-slot': 'trigger', 'data-expanded': open() ? '' : undefined }
        const triggerProps = mergeProps({}, state)
        return <Dynamic component="button" {...triggerProps} />
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      for (const implementationName of ['Trigger', 'MergedTrigger']) {
        const result = await extractor.extractRuntimeMetadata({
          sourcePath: 'src/fixture.tsx',
          implementationName,
          publicSlotNames: new Set(['trigger']),
          targetFallback: 'trigger',
        })
        expect(result.targets).toEqual([
          expect.objectContaining({
            name: 'trigger',
            slot: 'trigger',
            selector: '[data-slot="trigger"]',
            element: 'button',
            attributes: [
              expect.objectContaining({ name: 'data-expanded', value: { kind: 'presence' } }),
            ],
          }),
        ])
      }
      expect(extractor.diagnostics).toEqual([])
    } finally {
      await testProject.cleanup()
    }
  })

  test('extracts recipe declarations on their target without treating references as declarations', async () => {
    const testProject = await fixture(`
      import { createStyles } from './styles'
      import { demoRecipe } from './fixture.recipe'
      function Demo() {
        const resolved = createStyles(demoRecipe, {})
        return <div data-slot="root" {...resolved.styles.root} />
      }
    `)
    await writeFile(
      path.join(testProject.projectRoot, 'src/fixture.recipe.ts'),
      `
        const defineRecipe = (...args) => args
        export const demoRecipe = defineRecipe('demo', {
          base: { root: 'w-(--reference-only)' },
          variants: { size: { sm: { '--declared': '1rem' } } },
        })
      `,
      'utf8',
    )

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Demo',
        publicSlotNames: new Set(['root']),
        targetFallback: 'root',
      })

      expect(result.cssVariables).toEqual([
        expect.objectContaining({
          name: '--declared',
          target: 'root',
          condition: 'Variant-dependent',
        }),
      ])
    } finally {
      await testProject.cleanup()
    }
  })

  test('keeps anatomy in render order while sorting attributes deterministically', async () => {
    const testProject = await fixture(`
      function Demo() {
        return (
          <div data-slot="root">
            <div data-slot="zeta" data-z="" data-a="" />
            <div data-slot="alpha" />
          </div>
        )
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Demo',
        publicSlotNames: new Set(['root', 'zeta', 'alpha']),
        targetFallback: 'root',
      })

      expect(result.targets.map((target) => target.name)).toEqual(['root', 'zeta', 'alpha'])
      expect(result.targets[1]?.attributes.map((attribute) => attribute.name)).toEqual([
        'data-a',
        'data-z',
      ])
    } finally {
      await testProject.cleanup()
    }
  })

  test('does not guess an unrecognized target as root', async () => {
    const testProject = await fixture(`
      function Demo() {
        return <section><div data-unknown="" /></section>
      }
    `)

    try {
      const extractor = new RuntimeExtractor(testProject.projectRoot)
      const result = await extractor.extractRuntimeMetadata({
        sourcePath: 'src/fixture.tsx',
        implementationName: 'Demo',
        publicSlotNames: new Set(['root']),
        targetFallback: 'root',
        defaultElement: 'section',
      })

      expect(result.targets).toEqual([
        expect.objectContaining({ name: 'root', element: 'section', attributes: [] }),
      ])
    } finally {
      await testProject.cleanup()
    }
  })
})
