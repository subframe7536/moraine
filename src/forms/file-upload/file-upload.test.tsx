import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { FileUpload } from './file-upload'

function createFile(name: string, type = 'text/plain', content = 'content'): File {
  return new File([content], name, { type })
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')

  if (!input) {
    throw new Error('File input not found')
  }

  return input as HTMLInputElement
}

async function setInputFiles(input: HTMLInputElement, files: File[]): Promise<void> {
  await fireEvent.change(input, {
    target: { files },
    currentTarget: { files },
  })
}

async function dropFiles(target: HTMLElement, files: File[]): Promise<void> {
  let dataTransfer:
    | DataTransfer
    | {
        files: File[] | FileList
        items: Array<{ kind: string; type: string; getAsFile: () => File }>
        types: string[]
      }

  if (typeof DataTransfer !== 'undefined') {
    const transfer = new DataTransfer()
    for (const file of files) {
      transfer.items.add(file)
    }
    dataTransfer = transfer
  } else {
    dataTransfer = {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    }
  }

  await fireEvent.dragOver(target, { dataTransfer })
  await fireEvent.drop(target, { dataTransfer })
}

function createForm(validateOn: Array<'blur' | 'change' | 'input'>) {
  const state = { value: null as File | null }

  const screen = render(() => (
    <Form
      state={state}
      validateOn={validateOn}
      validateOnInputDelay={0}
      validate={(currentState) => {
        const file = currentState?.value as File | undefined
        if (file?.name === 'valid.txt') {
          return []
        }

        return [{ name: 'value', message: 'Error message' }]
      }}
    >
      <FormField name="value" label="Upload" hint="Hint" description="Description" help="Help">
        <FileUpload
          id="upload-input"
          onValueChange={(nextValue) => {
            state.value = (Array.isArray(nextValue) ? nextValue[0] : nextValue) ?? null
          }}
        />
      </FormField>
    </Form>
  ))

  return {
    screen,
    input: () => screen.container.querySelector('#upload-input') as HTMLInputElement,
  }
}

describe('FileUpload', () => {
  test('renders base attributes and text', () => {
    const screen = render(() => (
      <FileUpload
        id="upload-input"
        name="attachments"
        accept="image/*"
        multiple
        required
        disabled
        label="Upload files"
        description="PNG, JPG up to 2MB"
      />
    ))

    const input = getFileInput(screen.container)

    expect(input.getAttribute('id')).toBe('upload-input')
    expect(input.getAttribute('name')).toBe('attachments')
    expect(input.getAttribute('accept')).toBe('image/*')
    expect(input.multiple).toBe(true)
    expect(input.required).toBe(true)
    expect(input.disabled).toBe(true)
    expect(screen.getByText('Upload files')).not.toBeNull()
    expect(screen.getByText('PNG, JPG up to 2MB')).not.toBeNull()
  })

  test('single mode emits File | null', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)

    const first = createFile('first.txt')
    await setInputFiles(input, [first])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith(first)
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(1)
  })

  test('multiple mode appends files and emits File[]', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload multiple onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)

    const first = createFile('first.txt')
    const second = createFile('second.txt')

    await setInputFiles(input, [first])
    await setInputFiles(input, [second])

    expect(onValueChange).toHaveBeenCalledTimes(2)
    expect(onValueChange).toHaveBeenLastCalledWith([first, second])
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(2)
  })

  test('dropzone flow accepts files when enabled', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload multiple dropzone onValueChange={onValueChange} />)
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const file = createFile('drop.txt')

    await dropFiles(base, [file])

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith([file])
  })

  test('dropzone=false does not process drop files', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <FileUpload multiple dropzone={false} onValueChange={onValueChange} />
    ))
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const file = createFile('drop-disabled.txt')

    await dropFiles(base, [file])

    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('dropzone drag-over uses color feedback without scale transform', async () => {
    const screen = render(() => <FileUpload dropzone />)
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    expect(base.className).not.toContain('scale-[')

    await fireEvent.dragOver(base)

    await waitFor(() => {
      expect(base.className).toContain('bg-primary/8')
    })
    expect(base.className).not.toContain('scale-[')
  })

  test('remove file updates list and emitted value for multiple mode', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload multiple onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)

    const first = createFile('first.txt')
    const second = createFile('second.txt')
    await setInputFiles(input, [first, second])

    let removeButtons = screen.container.querySelectorAll('[data-slot="fileRemove"]')
    expect(removeButtons.length).toBe(2)

    await fireEvent.click(removeButtons[0]!)
    expect(onValueChange).toHaveBeenLastCalledWith([second])

    removeButtons = screen.container.querySelectorAll('[data-slot="fileRemove"]')
    await fireEvent.click(removeButtons[0]!)
    expect(onValueChange).toHaveBeenLastCalledWith([])
    expect(screen.container.querySelectorAll('[data-slot="file"]').length).toBe(0)
  })

  test('remove file emits null in single mode', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)
    const file = createFile('single.txt')

    await setInputFiles(input, [file])

    const removeButton = screen.container.querySelector('[data-slot="fileRemove"]') as HTMLElement
    await fireEvent.click(removeButton)

    expect(onValueChange).toHaveBeenNthCalledWith(1, file)
    expect(onValueChange).toHaveBeenNthCalledWith(2, null)
  })

  test('preview creates and revokes object URL for image files', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => 'blob:preview-image')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    try {
      const screen = render(() => <FileUpload multiple />)
      const input = getFileInput(screen.container)
      const image = createFile('image.png', 'image/png', 'img')
      const text = createFile('note.txt', 'text/plain')

      await setInputFiles(input, [image, text])

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(screen.container.querySelector('[data-slot="files"]')).not.toBeNull()

      const removeButtons = screen.container.querySelectorAll('[data-slot="fileRemove"]')
      await fireEvent.click(removeButtons[0]!)

      await waitFor(() => {
        expect(revokeObjectURL).toHaveBeenCalled()
      })
    } finally {
      createObjectURL.mockRestore()
      revokeObjectURL.mockRestore()
    }
  })

  test('preview=false hides file list', async () => {
    const screen = render(() => <FileUpload preview={false} />)
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('file.txt')])

    expect(screen.container.querySelector('[data-slot="files"]')).toBeNull()
  })

  test('clears hidden input and supports selecting same file again after remove', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <FileUpload onValueChange={onValueChange} />)
    const input = getFileInput(screen.container)
    const file = createFile('repeat.txt')

    await setInputFiles(input, [file])
    await fireEvent.click(screen.container.querySelector('[data-slot="fileRemove"]') as HTMLElement)
    await setInputFiles(input, [file])

    expect(onValueChange).toHaveBeenCalledTimes(3)
    expect(onValueChange).toHaveBeenNthCalledWith(1, file)
    expect(onValueChange).toHaveBeenNthCalledWith(2, null)
    expect(onValueChange).toHaveBeenNthCalledWith(3, file)
  })

  test('integrates with form validation on change', async () => {
    const { screen, input } = createForm(['change'])

    await setInputFiles(input(), [createFile('invalid.txt')])
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    await setInputFiles(input(), [createFile('valid.txt')])
    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('integrates with form validation on input', async () => {
    const { screen, input } = createForm(['input'])

    await setInputFiles(input(), [createFile('invalid.txt')])
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    await setInputFiles(input(), [createFile('valid.txt')])
    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('forwards aria-invalid and aria-describedby to hidden input', async () => {
    const { screen, input } = createForm(['change'])

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    const inputEl = input()
    expect(inputEl.getAttribute('aria-invalid')).toBe('true')

    const describedBy = inputEl.getAttribute('aria-describedby') ?? ''
    expect(describedBy).toContain('-error')
    expect(describedBy).toContain('-hint')
    expect(describedBy).toContain('-description')
    expect(describedBy).toContain('-help')
  })

  test('applies class overrides for root and file slots', async () => {
    const screen = render(() => (
      <FileUpload multiple classes={{ root: 'root-override', file: 'file-override' }} />
    ))
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('styled.txt')])

    const root = screen.container.querySelector('[data-slot="root"]')
    const file = screen.container.querySelector('[data-slot="file"]')

    expect(root?.className).toContain('root-override')
    expect(file?.className).toContain('file-override')
  })

  test('applies style overrides for root and file slots', async () => {
    const screen = render(() => (
      <FileUpload multiple styles={{ root: { width: '200px' }, file: { width: '200px' } } as any} />
    ))
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('styled.txt')])

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const file = screen.container.querySelector('[data-slot="file"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(file?.style.width).toBe('200px')
  })

  test('calls onFileReject when files are rejected', async () => {
    const onFileReject = vi.fn()
    const screen = render(() => <FileUpload multiple maxFiles={1} onFileReject={onFileReject} />)
    const input = getFileInput(screen.container)

    await setInputFiles(input, [createFile('a.txt'), createFile('b.txt')])

    expect(onFileReject).toHaveBeenCalledTimes(1)
  })
})
