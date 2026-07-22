# Migrating from v2 to v3

v3 changes the **call signatures and types only**. Runtime lookup behavior — the candidate
search loops, fallbacks to `0.{ext}`, and returning `''` for missing categories — is
unchanged from v2, with two degenerate-input fixes:

- Empty file lists in the index (e.g. `{ gym: [] }`) are now treated like missing
  categories (`''`, or the usual fallbacks for `reward`/`tappable`). v2 produced broken
  `0.[object Object]` / `0.undefined` URLs for these.
- `misc()` with no argument now looks up `0.{ext}` directly; v2 first probed the literal
  file name `undefined.{ext}`. The returned URL is identical either way.

**Requires TypeScript >= 5.0** (v3 uses `const` type parameters).

## Why

Every icon method now takes a single optional object instead of positional arguments.
When the UICONS spec grows (as it did with `bread`, `ar`, `power`, ...), a new option is
just a new optional key — no more breaking argument reorders or ever-longer
`pokemon(1, 0, 0, 0, 0, 0, 0, true)` calls to reach the last parameter.

The object form also enables exact return types: with statically known index data, each
method's return type is the precise URL string literal it will return at runtime (see
[New typing powers](#new-typing-powers)).

## Constructor changes

The deprecated `new UICONS(path, label)` overload is **removed from the types** (untyped
JS callers still get the old behavior plus a dev-mode deprecation warning). Use the
options object:

```ts
// v2 (removed)
const uicons = new UICONS('https://example.com/uicons', 'cagemons')

// v3
const uicons = new UICONS({ path: 'https://example.com/uicons', label: 'cagemons' })
```

`new UICONS(path)` with just a string still works.

New optional `extension` option — a **type-level only** hint that narrows return types
when the index data is not statically known (e.g. when using `remoteInit`). At runtime
the extension is always derived from the index data, exactly as in v2:

```ts
const uicons = new UICONS({ path: 'https://example.com/uicons', extension: 'webp' })
const ready = await uicons.remoteInit()
ready.team({ teamId: 1 })
// type: `https://example.com/uicons/team/${'1' | '0'}.webp`  (instead of ...${string})
```

## Method mapping

`has(location, fileName)` is unchanged. Every other method takes one optional object.
All keys are optional with the same defaults as v2.

| v2 positional call | v3 object call |
| --- | --- |
| `background(backgroundId)` | `background({ id })` |
| `device(online)` | `device({ online })` |
| `gym(teamId, trainerCount, inBattle, ex, ar, power)` | `gym({ teamId, trainerCount, inBattle, ex, ar, power })` |
| `invasion(gruntId, confirmed)` | `invasion({ gruntId, confirmed })` |
| `misc(fileName)` | `misc({ fileName })` |
| `nest(typeId)` | `nest({ typeId })` |
| `pokemon(pokemonId, evolution, form, costume, gender, alignment, bread, shiny)` | `pokemon({ pokemonId, evolution, form, costume, gender, alignment, bread, shiny })` |
| `pokestop(lureId, displayTypeId, questActive, ar, power)` | `pokestop({ lureId, displayTypeId, questActive, ar, power })` |
| `raidEgg(level, hatched, ex)` | `raidEgg({ level, hatched, ex })` |
| `reward(questRewardType, rewardIdOrAmount, amount, evolution)` | `reward({ questRewardType, rewardId, amount, evolution })` |
| `spawnpoint(hasTth)` | `spawnpoint({ hasTth })` |
| `station(active)` | `station({ active })` |
| `tappable(tappableType)` | `tappable({ tappableType })` |
| `team(teamId)` | `team({ teamId })` |
| `type(typeId)` | `type({ typeId })` |
| `weather(weatherId, severityLevel, timeOfDay)` | `weather({ weatherId, severityLevel, timeOfDay })` |

### reward(): `rewardIdOrAmount` renamed to `rewardId`

The second positional parameter of v2's `reward()` is now the `rewardId` key. The runtime
still resolves the file name from `+rewardId || +amount || 0`.

Note that v2's two-arg convenience overload `reward('stardust', 500)` fed its second
argument into the *rewardIdOrAmount* slot, not `amount` — so the 1:1 translation is
`rewardId`, by position, not by the overload's parameter name. Passing `amount: 500`
instead would additionally try the `500_a500` variant first, which can resolve to a
different file when the repository contains `_a` variants:

```ts
// v2
uicons.reward('item', 1)
uicons.reward('stardust', 500)          // two-arg convenience overload

// v3
uicons.reward({ questRewardType: 'item', rewardId: 1 })
uicons.reward({ questRewardType: 'stardust', rewardId: 500 })
```

## init() / remoteInit() return re-typed instances

Both return the **same instance** (same object identity), re-typed with the index data it
was initialized with. Capture the return value to get the narrowed types:

```ts
const ready = await new UICONS('https://example.com/uicons').remoteInit()
// ready: UICONS<'https://example.com/uicons', string, UiconsIndex>

const typed = new UICONS('https://example.com/uicons').init(indexJson)
// typed: UICONS<'https://example.com/uicons', string, typeof indexJson>
```

`init` captures its argument with a `const` type parameter, so passing an object literal
needs no `as const` to get exact types.

## New typing powers

With a literal `path` and literal `data`, every method's return type is the **exact URL
string** the runtime will produce — the type system simulates the same candidate search
(suffix combinations in runtime try-order, first file present in the index wins, else
`0.{ext}`):

```ts
const uicons = new UICONS({
  path: 'https://example.com/uicons',
  data: { team: ['0.webp', '1.webp'] },
})

const mystic = uicons.team({ teamId: 1 })
//    ^? "https://example.com/uicons/team/1.webp"
const missing = uicons.team({ teamId: 9 })
//    ^? "https://example.com/uicons/team/0.webp"   (fallback, 9.webp not in index)
```

Degradation is graceful and honest:

- **No data, literal args** — a union of the candidate URLs, e.g.
  `` `${path}/team/${'1' | '0'}.${ext}` `` (extension from the `extension` hint, else `string`).
- **Widened or union args** — a coarse type covering any file in the category plus the fallback.
- **Category absent from the data** — return type is `''`, matching the runtime.
- **`has()`** — returns literal `true` / `false` when statically resolvable.
