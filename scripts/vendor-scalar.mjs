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
const registry = 'https://registry.npmjs.org'
const entry = 'package/dist/browser/standalone.js'
const bidi = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g
const semver = /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z.-]{1,64})?$/

const version = process.argv[2] ?? ''
if (!semver.test(version)) {
  console.error('usage: node scripts/vendor-scalar.mjs <version>, e.g. 1.73.0')
  process.exit(1)
}

async function download() {
  const metaUrl = new URL(`/${pkg}/${encodeURIComponent(version)}`, registry)
  const meta = await fetch(metaUrl)
  if (!meta.ok) throw new Error(`${pkg}@${version}: HTTP ${meta.status}`)
  const { dist } = await meta.json()

  // Only ever download tarballs served by the npm registry itself
  const tarballUrl = new URL(dist.tarball)
  if (tarballUrl.origin !== registry) {
    throw new Error(`unexpected tarball location: ${tarballUrl.origin}`)
  }

  const response = await fetch(tarballUrl)
  if (!response.ok) throw new Error(`${tarballUrl}: HTTP ${response.status}`)
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
    const field = (start, length) => {
      const value = header.subarray(start, start + length)
      const end = value.indexOf(0)
      return value.toString('utf8', 0, end === -1 ? value.length : end)
    }
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
  (c) => String.raw`\u` + c.codePointAt(0).toString(16).padStart(4, '0')
)
const banner = `/*! ${pkg} ${version} | MIT | https://github.com/scalar/scalar */\n`
const sourceMap = '\n//# sourceMappingURL='
const mapIndex = escaped.lastIndexOf(sourceMap)
const body = mapIndex === -1 ? escaped : `${escaped.slice(0, mapIndex)}\n`

writeFileSync('assets/scalar/standalone.js', banner + body)
console.log(
  `assets/scalar/standalone.js: ${pkg} ${version}, ` +
    `${source.match(bidi)?.length ?? 0} bidi characters escaped`
)
