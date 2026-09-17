import fs from 'node:fs'
import path from 'node:path'

import { API } from 'typescript/unstable/sync'

const root = process.cwd()
const label = process.env.TYPE_PERF_LABEL ?? 'current'
const marker = '/*__COMPLETE__*/'
const tempDir = path.join(root, '.tmp', 'type-perf-completions')
const fixtureFile = path.join(tempDir, 'fixture.tsx')
const configFile = path.join(tempDir, 'tsconfig.json')

fs.mkdirSync(tempDir, { recursive: true })
fs.writeFileSync(
  configFile,
  `${JSON.stringify(
    {
      compilerOptions: {
        strict: true,
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'preserve',
        jsxImportSource: 'solid-js',
        lib: ['ESNext', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
        noEmit: true,
      },
      files: ['./fixture.tsx'],
    },
    null,
    2,
  )}\n`,
)

const typeConfig =
  process.env.TYPE_PERF_SIMPLE_ROOT === '1'
    ? `
declare module 'moraine' {
  interface MoraineTypeConfig {
    simpleRootAttributes: true
    simpleHtmlTags: true
  }
}
`
    : ''

const prefix = `
import { Button, Card, Dialog, Field, Input } from 'moraine'
import type { JSX } from 'solid-js'
${typeConfig}

interface CustomButtonProps {
  required: string
  customOnly?: boolean
  children?: JSX.Element
}

const CustomButton = (props: CustomButtonProps) => <button>{props.children}</button>
`

const commonRequired = [
  'class',
  'style',
  'id',
  'role',
  'tabIndex',
  'ref',
  'onClick',
  'onFocus',
  'onBlur',
  'onKeyDown',
  'onKeyUp',
  'onPointerDown',
]

const forbiddenExact = new Set(['onclick', 'onkeydown', 'onpointerdown'])
const forbiddenPrefixes = ['use:', 'on:', 'oncapture:', 'attr:', 'bool:', 'prop:']
const suggestedAria = ['aria-label', 'aria-labelledby', 'aria-describedby']

const intrinsicScenarios = [
  ['intrinsic-div', `<div ${marker} />`],
  ['intrinsic-button', `<button ${marker} />`],
  ['intrinsic-a', `<a ${marker} />`],
  ['intrinsic-input', `<input ${marker} />`],
  ['intrinsic-textarea', `<textarea ${marker} />`],
  ['intrinsic-form', `<form ${marker} />`],
  ['intrinsic-section', `<section ${marker} />`],
]

const scenarios = [
  {
    name: 'Button',
    code: `<Button ${marker} />`,
    required: [...commonRequired, 'variant', 'size', 'disabled', 'loading'],
  },
  {
    name: 'Button as=a',
    code: `<Button as="a" ${marker} />`,
    required: [...commonRequired, 'href', 'target', 'rel'],
  },
  {
    name: 'Card',
    code: `<Card ${marker} />`,
    required: commonRequired,
  },
  {
    name: 'Field',
    code: `<Field ${marker} />`,
    required: [...commonRequired, 'disabled', 'required'],
  },
  {
    name: 'Dialog.Trigger',
    code: `<Dialog.Trigger ${marker} />`,
    required: [...commonRequired, 'as'],
  },
  {
    name: 'Dialog.Trigger as=Button',
    code: `<Dialog.Trigger as={Button} ${marker} />`,
    required: ['variant', 'size', 'disabled', 'loading', 'onClick', 'onKeyDown'],
  },
  {
    name: 'Input',
    code: `<Input ${marker} />`,
    required: [
      ...commonRequired,
      'name',
      'value',
      'placeholder',
      'autocomplete',
      'disabled',
      'required',
    ],
  },
  {
    name: 'Button as=CustomButton',
    code: `<Button as={CustomButton} required="ok" ${marker} />`,
    required: ['customOnly'],
  },
]

const api = new API({ cwd: root })
let snapshot

function completionNames(code) {
  const full = `${prefix}\n${code}\n`
  const offset = full.indexOf(marker)
  if (offset < 0) {
    throw new Error(`Missing completion marker in ${code}`)
  }
  fs.writeFileSync(fixtureFile, full.replace(marker, ''))

  snapshot?.dispose()
  snapshot = api.updateSnapshot(
    snapshot ? { fileChanges: { changed: [fixtureFile] } } : { openProjects: [configFile] },
  )
  const project = snapshot.getProject(configFile) ?? snapshot.getProjects()[0]
  if (!project) {
    throw new Error('TypeScript did not load the completion fixture project')
  }
  const completions = project.checker.getCompletionsAtPosition(fixtureFile, offset)
  if (!completions) {
    throw new Error(`No completions for ${code}`)
  }
  return new Set(completions.entries.map((entry) => entry.name.replace(/\?$/, '')))
}

const nativeUniverse = new Set()
for (const [, code] of intrinsicScenarios) {
  for (const name of completionNames(code)) {
    nativeUniverse.add(name)
  }
}

const rows = []
let failed = false
for (const scenario of scenarios) {
  const names = completionNames(scenario.code)
  const aria = [...names].filter((name) => name.startsWith('aria-'))
  const events = [...names].filter((name) => name.startsWith('on'))
  const native = [...names].filter((name) => nativeUniverse.has(name))
  const missing = scenario.required.filter((name) => !names.has(name))
  const missingSuggestedAria = suggestedAria.filter((name) => !names.has(name))
  const forbidden = [...names].filter(
    (name) =>
      forbiddenExact.has(name) || forbiddenPrefixes.some((prefix) => name.startsWith(prefix)),
  )
  if (missing.length > 0 || forbidden.length > 0) {
    failed = true
  }
  rows.push({
    name: scenario.name,
    total: names.size,
    native: native.length,
    aria: aria.length,
    events: events.length,
    missing,
    missingSuggestedAria,
    forbidden,
  })
}

const outDir = path.join(root, '.tmp', 'type-perf', label)
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(
  path.join(outDir, 'completions.json'),
  `${JSON.stringify({ label, nativeUniverse: nativeUniverse.size, rows }, null, 2)}\n`,
)

console.log(
  'Scenario\tTotal\tDOM/native\tARIA\tEvents\tMissing required\tMissing suggested ARIA\tForbidden present',
)
for (const row of rows) {
  console.log(
    [
      row.name,
      row.total,
      row.native,
      row.aria,
      row.events,
      row.missing.join(',') || '-',
      row.missingSuggestedAria.join(',') || '-',
      row.forbidden.join(',') || '-',
    ].join('\t'),
  )
}

snapshot?.dispose()
api.close()

if (failed && process.env.TYPE_PERF_ENFORCE === '1') {
  process.exitCode = 1
}
