import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const extId = manifest.browser_specific_settings.gecko.id

// Find default-release profile
const firefoxDir = join(homedir(), '.mozilla', 'firefox')
const profile = readdirSync(firefoxDir).find(d => d.endsWith('.default-release'))
if (!profile) {
  console.error('No Firefox default-release profile found')
  process.exit(1)
}

const extensionsDir = join(firefoxDir, profile, 'extensions')
mkdirSync(extensionsDir, { recursive: true })

const proxyFile = join(extensionsDir, extId)
const projectDir = resolve('.')

writeFileSync(proxyFile, projectDir)
console.log(`Installed proxy: ${proxyFile} → ${projectDir}`)
console.log('Restart Firefox to load the extension.')
