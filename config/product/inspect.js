export const NAME = 'inspect'
import { DSL } from '@/store/type-map'

export function init(store) {
  const {
    product,
  } = DSL(store, NAME)

  product({
    removable:           false,
    weight:              3,
    showNamespaceFilter: false,
    icon:                'compass',
    inStore:             'inspect',
  })
}