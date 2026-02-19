import type { Scalar, Zero } from './general.js'
import type { FlagSuffix, OptionalScalarSuffix } from './helpers.js'

type OptionalScalar = Scalar | undefined

type PokemonFileName<
  PokemonId extends Scalar,
  Evolution extends OptionalScalar = undefined,
  Form extends OptionalScalar = undefined,
  Costume extends OptionalScalar = undefined,
  Gender extends OptionalScalar = undefined,
  Alignment extends OptionalScalar = undefined,
  Bread extends OptionalScalar = undefined,
  Shiny extends boolean | undefined = undefined,
> = `${PokemonId}${OptionalScalarSuffix<Bread, '_b'>}${OptionalScalarSuffix<
  Evolution,
  '_e'
>}${OptionalScalarSuffix<Form, '_f'>}${OptionalScalarSuffix<
  Costume,
  '_c'
>}${OptionalScalarSuffix<Gender, '_g'>}${OptionalScalarSuffix<
  Alignment,
  '_a'
>}${FlagSuffix<Shiny, '_s'>}`

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
