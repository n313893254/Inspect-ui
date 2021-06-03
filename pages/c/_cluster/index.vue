<script>
import { NAME as INSPECT_TYPES } from '@/config/product/inspect'

export default {
  layout: 'plain',

  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product',
      params: {
        ...route.params,
        product: INSPECT_TYPES,
      }
    })
  },
}
</script>
