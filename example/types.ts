export interface Form {
  attack?: number
  defense?: number
  stamina?: number
  tempEvolutions?: Record<string, Form>
}

export interface Pokemon extends Required<Form> {
  forms: Record<string, Form>
}

export interface RawMon {
  id: number
  form?: number
  evo?: number
}

export interface Props {
  title: string
  src: string
  cry: string
}

export interface Asset {
  name: string
  path: string
}

export type Setter = React.Dispatch<React.SetStateAction<Asset>>
