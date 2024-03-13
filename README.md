# UICONS.js

UICONS.js is a JavaScript class wrapper around the [UICONS](https://github.com/UIcons/UIcons) specification. It can be used with any file extensions. Works in the browser and in Node.js.

## Usage

```
npm install uicons.js
yarn add uicons.js
pnpm add uicons.js
```

```typescript
import { UICONS } from 'uicons.js'

const uicons = new UICONS('https://www.uicons-repo.com')

// Async initialization fetches the index.json file for you
await uicons.remoteInit()

// Sync initialization if you already have contents of the index.json
const indexJson = await fetch('https://www.uicons-repo.com/index.json').then(res => res.json())
uicons.init(indexJson)

// Below are some example usages with variable names for demonstration, see intellisense in your IDE for type information
const pokemon = uicons.getPokemon(pokemon_id, form_id, evolution_id, gender_id, costume_id, alignment_id, shiny)
const type = uicons.getType(type_id)
const pokestop = uicons.getPokestop(lure_id, invasion_active, quest_active, ar, power, display)
const reward = uicons.getReward(reward_type_id, reward_id, amount)
const invasion = uicons.getInvasion(grunt_id, confirmed)
const gym = uicons.getGym(team_id, trainer_count, in_battle, ex, ar)
const egg = uicons.getEgg(raid_level, hatched, ex)
const team = uicons.getTeam(team_id)
const weather = uicons.getWeather(weather_id)
const nest = uicons.getNest(type_id)
const misc = uicons.getMisc(filename_without_extension)
const device = uicons.getDevice(online)
const spawnpoint = uicons.getSpawnpoint(has_known_tth)
```
