import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const from = resolve(root, 'node_modules/mathlive/fonts')
const to = resolve(root, 'public/mathlive-fonts')

await mkdir(dirname(to), { recursive: true })
await cp(from, to, { recursive: true })
