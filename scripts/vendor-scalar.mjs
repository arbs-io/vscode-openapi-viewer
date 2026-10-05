// Vendors the Scalar API Reference standalone bundle into assets/scalar.
// Usage: node scripts/vendor-scalar.mjs <version>
//
// Bidirectional control characters are rewritten as \uXXXX escapes. The
// bundle only uses them inside string/template literals (invisible-character
// detection and HTML entity tables), where the escape is equivalent, and
// keeping them raw hides text direction changes from reviewers (Trojan Source).
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

const pkg = '@scalar/api-reference'
const entry = 'package/dist/browser/standalone.js'
const bidi = /[؜‎‏‪-‮⁦-⁩]/g

const version = process.argv[2]
if (!version) {
  console.error('usage: node scripts/vendor-scalar.mjs <version>')
  process.exit(1)
}

async function download() {
  const meta = await fetch(`https://registry.npmjs.org/${pkg}/${version}`)
  if (!meta.ok) throw new Error(`${pkg}@${version}: HTTP ${meta.status}`)
  const { dist } = await meta.json()

  const response = await fetch(dist.tarball)
  if (!response.ok) throw new Error(`${dist.tarball}: HTTP ${response.status}`)
  const tarball = Buffer.from(await response.arrayBuffer())

  const [algorithm, expected] = dist.integrity.split('-')
  const actual = createHash(algorithm).update(tarball).digest('base64')
  if (actual !== expected) throw new Error(`integrity mismatch for ${pkg}@${version}`)
  return gunzipSync(tarball)
}

// Minimal ustar reader: 512-byte headers followed by padded file contents
function readEntry(tar, name) {
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512)
    const field = (start, length) =>
      header.toString('utf8', start, start + length).replace(/\0.*$/s, '')
    const fileName = field(0, 100)
    if (!fileName) break
    const size = Number.parseInt(field(124, 12).trim() || '0', 8)
    const prefix = field(345, 155)
    const path = prefix ? `${prefix}/${fileName}` : fileName
    if (path === name) {
      return tar.toString('utf8', offset + 512, offset + 512 + size)
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  throw new Error(`${name} not found in ${pkg}@${version}`)
}

const source = readEntry(await download(), entry)
const escaped = source.replace(
  bidi,
  (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`
)
const output =
  `/*! ${pkg} ${version} | MIT | https://github.com/scalar/scalar */\n` +
  escaped.replace(/\n\/\/# sourceMappingURL=\S+\s*$/, '\n')

writeFileSync('assets/scalar/standalone.js', output)
console.log(
  `assets/scalar/standalone.js: ${pkg} ${version}, ` +
    `${source.match(bidi)?.length ?? 0} bidi characters escaped`
)
