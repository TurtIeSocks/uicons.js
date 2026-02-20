import type { Scalar } from './general.js'

/**
 * Supported positional argument tuples for {@link UICONS.pokemon}.
 */
export type PokemonArgs =
  | []
  | [pokemonId: Scalar]
  | [pokemonId: Scalar, evolution: Scalar]
  | [pokemonId: Scalar, evolution: Scalar, form: Scalar]
  | [pokemonId: Scalar, evolution: Scalar, form: Scalar, costume: Scalar]
  | [
      pokemonId: Scalar,
      evolution: Scalar,
      form: Scalar,
      costume: Scalar,
      gender: Scalar,
    ]
  | [
      pokemonId: Scalar,
      evolution: Scalar,
      form: Scalar,
      costume: Scalar,
      gender: Scalar,
      alignment: Scalar,
    ]
  | [
      pokemonId: Scalar,
      evolution: Scalar,
      form: Scalar,
      costume: Scalar,
      gender: Scalar,
      alignment: Scalar,
      bread: Scalar,
    ]
  | [
      pokemonId: Scalar,
      evolution: Scalar,
      form: Scalar,
      costume: Scalar,
      gender: Scalar,
      alignment: Scalar,
      bread: Scalar,
      shiny: boolean,
    ]
