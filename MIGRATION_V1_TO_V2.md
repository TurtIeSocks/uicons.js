# V1 -> V2 Migration Guide

`uicons.js` V2 replaces positional public method arguments with a single object argument for all public methods except `has`.

## Quick Rules

- Every public API now takes one object argument - this reduces the need to have breaking changes as the standard expands.
- `has(location, fileName)`, `init`, and `remoteInit` are unchanged.

## Call Mapping

| V1 (positional)                                                                        | V2 (object arg)                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `uicons.background(id)`                                                                | `uicons.background({ id })`                                                                |
| `uicons.device(online)`                                                                | `uicons.device({ online })`                                                                |
| `uicons.gym(teamId, trainerCount, inBattle, ex, ar, power)`                            | `uicons.gym({ teamId, trainerCount, inBattle, ex, ar, power })`                            |
| `uicons.invasion(gruntId, confirmed)`                                                  | `uicons.invasion({ gruntId, confirmed })`                                                  |
| `uicons.misc(fileName)`                                                                | `uicons.misc({ fileName })`                                                                |
| `uicons.nest(typeId)`                                                                  | `uicons.nest({ typeId })`                                                                  |
| `uicons.pokemon(pokemonId, evolution, form, costume, gender, alignment, bread, shiny)` | `uicons.pokemon({ pokemonId, evolution, form, costume, gender, alignment, bread, shiny })` |
| `uicons.pokestop(lureId, displayTypeId, questActive, ar, power)`                       | `uicons.pokestop({ lureId, displayTypeId, questActive, ar, power })`                       |
| `uicons.raidEgg(level, hatched, ex)`                                                   | `uicons.raidEgg({ level, hatched, ex })`                                                   |
| `uicons.reward(questRewardType, rewardIdOrAmount, amount)`                             | `uicons.reward({ questRewardType, rewardIdOrAmount, amount })`                             |
| `uicons.spawnpoint(hasTth)`                                                            | `uicons.spawnpoint({ hasTth })`                                                            |
| `uicons.station(active)`                                                               | `uicons.station({ active })`                                                               |
| `uicons.tappable(tappableType)`                                                        | `uicons.tappable({ tappableType })`                                                        |
| `uicons.team(teamId)`                                                                  | `uicons.team({ teamId })`                                                                  |
| `uicons.type(typeId)`                                                                  | `uicons.type({ typeId })`                                                                  |
| `uicons.weather(weatherId, severityLevel, timeOfDay)`                                  | `uicons.weather({ weatherId, severityLevel, timeOfDay })`                                  |
| `uicons.has(location, fileName)`                                                       | `uicons.has(location, fileName)`                                                           |

## Examples

### Common API Updates

```ts
// V1
uicons.team(Rpc.Team.TEAM_BLUE)
uicons.weather(4, 2, 'night')
uicons.reward('item', 1, 10)

// V2
uicons.team({ teamId: Rpc.Team.TEAM_BLUE })
uicons.weather({ weatherId: 4, severityLevel: 2, timeOfDay: 'night' })
uicons.reward({ questRewardType: 'item', rewardIdOrAmount: 1, amount: 10 })
```

## Notes

- Behavior and return type inference are preserved; only invocation shape changed.
- If you had wrappers around positional APIs, convert wrapper signatures to object args first, then pass through fields.
