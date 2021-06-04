import { get } from '@/utils/object'
import { allHash } from '@/utils/promise'
import { applyProducts } from '@/store/type-map'

export default async function({
  route, store
}) {
  if (route.path && typeof route.path === 'string') {
    // Ignore webpack hot module reload requests
    if ( route.path.startsWith('/__webpack_hmr/') ) {
      return
    }

    // Ignore the error page
    if ( route.path.startsWith('/fail-whale') ) {
      return
    }
  }

  await applyProducts(store)

  try {
    await store.dispatch('loadInspect')
  } catch (e) {
    console.log(e, 'e')
    // return redirect(302, '/auth/login')
  }

  // return redirect(302, '/clusters')
}