// Guards the argument IntelliSense: asks the real TypeScript LanguageService
// (the same engine editors use) what it suggests inside uicons method calls,
// and fails if the literal vocabulary ever disappears again.
//
// Why this exists: completions resolve from the *instantiated* argument type,
// and an unresolved generic instantiates to its default — which silently hides
// the vocabulary unless it lives in the property type (see `Hint` in
// src/types.ts). Run with: node scripts/check-intellisense.mjs
import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PROBE = `
import { UICONS } from './src/index.ts'

const icons = new UICONS({ path: 'https://x.com', data: { gym: ['0.webp'] } })
icons.gym({ teamId: "/*teamId*/" })
icons.weather({ timeOfDay: "/*timeOfDay*/" })
icons.reward({ questRewardType: "/*questRewardType*/" })
icons.pokestop({ lureId: "/*lureId*/" })
icons.type({ typeId: "/*typeId*/" })
`

// marker -> completions that must all be offered at that cursor
const EXPECT = {
  teamId: ['0', '1', '2', '3'],
  timeOfDay: ['day', 'night'],
  questRewardType: ['item', 'stardust', 'mega_resource'],
  lureId: ['501', '502', '503', '504'],
  typeId: ['1', '18'],
}

const probePath = path.join(ROOT, '__check_intellisense.ts')
const files = new Map([[probePath, PROBE]])
const configFile = ts.readConfigFile(path.join(ROOT, 'tsconfig.json'), ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, ROOT)

const host = {
  getScriptFileNames: () => [...parsed.fileNames, probePath],
  getScriptVersion: () => '1',
  getScriptSnapshot: (f) => {
    if (files.has(f)) return ts.ScriptSnapshot.fromString(files.get(f))
    return fs.existsSync(f)
      ? ts.ScriptSnapshot.fromString(fs.readFileSync(f, 'utf8'))
      : undefined
  },
  getCurrentDirectory: () => ROOT,
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: (f) => files.has(f) || ts.sys.fileExists(f),
  readFile: (f) => (files.has(f) ? files.get(f) : ts.sys.readFile(f)),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
}
const ls = ts.createLanguageService(host, ts.createDocumentRegistry())

let failed = false
for (const [marker, expected] of Object.entries(EXPECT)) {
  const pos = PROBE.indexOf(`/*${marker}*/`)
  const offered = new Set(
    (ls.getCompletionsAtPosition(probePath, pos, {})?.entries ?? []).map((e) => e.name)
  )
  const missing = expected.filter((v) => !offered.has(v))
  if (missing.length) {
    failed = true
    console.error(`✗ ${marker}: missing suggestions [${missing.join(', ')}] (got ${offered.size} entries)`)
  } else {
    console.log(`✓ ${marker}: ${expected.join(', ')} all offered (${offered.size} entries)`)
  }
}

process.exit(failed ? 1 : 0)
