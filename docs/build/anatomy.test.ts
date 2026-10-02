// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { renderAnatomyText } from '../shared/anatomy.ts'

import { extractAnatomyConfig, validateAnatomy, validateAnatomyConfig } from './anatomy.ts'
import type { ComponentApi } from './api-doc/types.ts'

const api: ComponentApi = {
  key: 'card',
  name: 'Card',
  kind: 'composite',
  dataAttributes: [],
  slots: ['root', 'header', 'title'],
  parts: [
    {
      id: 'card-header',
      name: 'Card.Header',
      access: { kind: 'attached', root: 'Card', member: 'Header' },
      props: [],
    },
  ],
}
const source = (value: string) => `## Anatomy\n\n<Anatomy value={${value}} />`
const config = {
  root: { slot: 'root', element: 'section' },
  children: [
    { part: 'Card.Header', slot: 'header', children: [{ slot: 'title', element: 'h2' }] },
    { internal: 'measurement-wrapper', children: [{ slot: 'title' }] },
  ],
}

describe('Anatomy static config', () => {
  test('parses DOM roots, nested parts and slots, internal wrappers, and element annotations', async () => {
    expect(await validateAnatomy(source(JSON.stringify(config)), 'card.mdx', api)).toEqual(config)
    expect(
      await validateAnatomy(
        source("{root: {noDom: true}, children: [{internal: 'positioner'}]}"),
        'card.mdx',
        api,
      ),
    ).toEqual({ root: { noDom: true }, children: [{ internal: 'positioner' }] })
  })

  test('serializes the shared hierarchy as a dense text tree', () => {
    expect(renderAnatomyText('Card', validateAnatomyConfig(config, 'card.mdx', api))).toBe(
      [
        'Card [component; slot=root; <section>]',
        '├── Card.Header [part; slot=header]',
        '│   └── title [slot; <h2>]',
        '└── measurement-wrapper [internal]',
        '    └── title [slot]',
      ].join('\n'),
    )
    expect(renderAnatomyText('Card', { root: { noDom: true } })).toBe('Card [component; no DOM]')
  })

  test.each([
    [{ root: {} }, 'root requires'],
    [{ root: { slot: 'other' } }, 'root requires'],
    [{ root: { slot: 'root', noDom: true } }, 'root requires'],
    [{ root: { noDom: true, element: 'div' } }, 'root requires'],
    [{ root: { slot: 'root', element: '<script>' } }, 'element annotation'],
    [{ root: { noDom: true }, children: [{ slot: 'unknown' }] }, 'unknown slot unknown'],
    [{ root: { noDom: true }, children: [{ part: 'Card.Unknown' }] }, 'unknown part Card.Unknown'],
    [
      { root: { noDom: true }, children: [{ part: 'Card.Header', slot: 'unknown' }] },
      'unknown slot unknown',
    ],
    [
      { root: { noDom: true }, children: [{ part: 'Card.Header', internal: 'wrapper' }] },
      'mixed discriminators',
    ],
    [
      { root: { noDom: true }, children: [{ slot: 'title', internal: 'wrapper' }] },
      'mixed discriminators',
    ],
    [{ root: { noDom: true }, children: [{}] }, 'discriminator'],
    [{ root: { noDom: true }, children: 'title' }, 'children must be an array'],
    [{ root: { noDom: true }, component: 'Card' }, 'unknown field component'],
  ])('rejects malformed config %j with its source path', (value, message) => {
    expect(() => validateAnatomyConfig(value, 'components/card.mdx', api)).toThrow(
      `components/card.mdx`,
    )
    expect(() => validateAnatomyConfig(value, 'components/card.mdx', api)).toThrow(message)
  })

  test.each([
    'config',
    '{root: makeRoot()}',
    "{root: {slot: 'root'}, ...config}",
    '{root: {slot: root}}',
    "{root: {['slot']: 'root'}}",
    "{root: {get slot() {return 'root'}}}",
    "{root: {slot: 'root'}, children: [node]}",
    "{root: {slot: 'root'}, children: [...nodes]}",
    "{root: {slot: 'root'}, children: [() => 'title']}",
    "{root: {slot: 'root'}, children: [null]}",
    "{root: {slot: 'root'}, root: {noDom: true}}",
  ])('rejects non-static or ambiguous MDX values: %s', async (value) => {
    await expect(extractAnatomyConfig(source(value), 'card.mdx')).rejects.toThrow('card.mdx')
  })

  test('allows omitted Anatomy, including examples that only appear in code fences', async () => {
    await expect(validateAnatomy('## Usage\n\nUse Card.', 'card.mdx', api)).resolves.toBeUndefined()
    await expect(
      validateAnatomy('```mdx\n## Anatomy\n<Anatomy value={config} />\n```', 'card.mdx', api),
    ).resolves.toBeUndefined()
  })

  test('requires one heading and one component when present, ignoring examples in code fences', async () => {
    await expect(
      extractAnatomyConfig('## Anatomy\n```text\nCard\n```', 'card.mdx'),
    ).rejects.toThrow('exactly one')
    await expect(
      extractAnatomyConfig(`${source('{root: {noDom: true}}')}\n\n## Anatomy`, 'card.mdx'),
    ).rejects.toThrow('exactly one')
    await expect(
      extractAnatomyConfig(
        `${source('{root: {noDom: true}}')}\n\n<Anatomy value={{root: {noDom: true}}} />`,
        'card.mdx',
      ),
    ).rejects.toThrow('exactly one')
    await expect(
      extractAnatomyConfig(
        `${source('{root: {noDom: true}}')}\n\n\`\`\`mdx\n## Anatomy\n<Anatomy value={config} />\n\`\`\``,
        'card.mdx',
      ),
    ).resolves.toEqual({ root: { noDom: true } })
    await expect(
      extractAnatomyConfig('## Anatomy\n\n<Anatomy {...props} />', 'card.mdx'),
    ).rejects.toThrow('static value')
  })
})
