import { createServerEntry } from 'solid-file-router'
import { FileRouter } from 'virtual:routes'

export default createServerEntry((props) => <FileRouter base={props.base} url={props.url} />)
