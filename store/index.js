import Steve from '@/plugins/steve'
import {
  NAMESPACE, NORMAN
} from '@/config/types'
import { CLUSTER as CLUSTER_PREF, LAST_NAMESPACE } from '@/store/prefs'
import { allHash } from '@/utils/promise'
import { findBy, addObject } from '@/utils/array'
import { ApiError } from '@/utils/error'
import { NAME as EXPLORER } from '@/config/product/explorer'
import { DEV } from '@/store/prefs'
import { SCHEMA } from '@/config/types'

export const plugins = [
  Steve({ namespace: 'rancher', baseUrl: '/v3' }),
  Steve({ namespace: 'project', baseUrl: '' }),
  Steve({ namespace: 'cluster', baseUrl: '' }),
  Steve({ namespace: 'clusterScope', baseUrl: '' }),
]

export const state = () => {
  return {
    rancherReady:     false,
    clusterId:        null,
    productId:        'redis',
    namespaceFilters: [],
    clusterReady:     false,
    projectReady:     false,
  }
}

export const getters = {
  clusterId(state) {
    return state.clusterId
  },

  projectId(state) {
    return state.projectId
  },

  productId(state) {
    return state.productId
  },
  
  defaultClusterId(state, getters) {
    const all = getters['rancher/all']('cluster')
    const clusters = [...all]
    const desired = getters['prefs/get'](CLUSTER_PREF)

    if ( clusters.find(x => x.id === desired) ) {
      return desired
    } else if ( clusters.length ) {
      return clusters[0].id
    }

    return null
  },

  currentCluster(state, getters) {
    return getters['rancher/byId']('cluster', state.clusterId)
  },

  currentProject(state, getters) {
    return getters['rancher/byId']('project', state.projectId)
  },

  currentUser(state, getters) {
    const users = getters['rancher/all']('user')

    return findBy(users, 'me', true)
  },

  namespaces(state, getters) {
    return () => {
      const out = {}

      const clusterId = getters['currentCluster']?.id

      if ( !clusterId ) {
        return out
      }

      const namespaces = getters[`cluster/all`](NAMESPACE)
      const filters = state.namespaceFilters.filter(x => !x.startsWith('namespaced://'))
      const includeAll = getters.isAllNamespaces
      const includeSystem = filters.includes('all://system')
      const includeUser = filters.includes('all://user')
      const includeOrphans = filters.includes('all://orphans')

      // Special cases to pull in all the user, system, or orphaned namespaces
      if ( includeAll || includeOrphans || includeSystem || includeUser ) {
        for ( const ns of namespaces ) {
          if (
            includeAll ||
            ( includeOrphans && !ns.projectId ) ||
            ( includeUser && !ns.isSystem ) ||
            ( includeSystem && ns.isSystem )
          ) {
            out[ns.id] = true
          }
        }
      }

      // Individual requests for a specific project/namespace
      if ( !includeAll ) {
        for ( const filter of filters ) {
          const [type, id] = filter.split('://', 2)

          if ( !type ) {
            continue
          }

          if ( type === 'ns' ) {
            out[id] = true
          }
        }
      }

      return out
    }
  },

  isMultipleNamespaces() {
    return true
  },

  defaultNamespace(state, getters, rootState, rootGetters) {
    const filteredMap = getters['namespaces']()
    const isAll = getters['isAllNamespaces']
    const all = getters[`cluster/all`](NAMESPACE).map(x => x.id)
    let out

    function isOk() {
      if ( !out ) {
        return false
      }

      return (isAll && all.includes(out) ) ||
             (!isAll && filteredMap && filteredMap[out] )
    }

    out = rootGetters['prefs/get'](LAST_NAMESPACE)
    if ( isOk() ) {
      return out
    }

    out = 'default'
    if ( isOk() ) {
      return out
    }

    if ( !isAll ) {
      const keys = Object.keys(filteredMap)

      if ( keys.length ) {
        return keys[0]
      }
    }

    return all[0]
  },

  backToRancherLink(state) {
    const clusterId = state.clusterId

    let link = '/g'

    if ( clusterId ) {
      link = `/c/${ escape(clusterId) }`
    }

    if ( process.env.dev ) {
      link = `https://localhost:8000${ link }`
    }

    return link
  },

  rancherLink() {
    if ( process.env.dev ) {
      return `https://localhost:8000/`
    }

    return '/'
  },

  currentProduct(state, getters) {
    const active = getters['type-map/activeProducts']

    let out = findBy(active, 'name', state.productId)

    if ( !out ) {
      out = findBy(active, 'name', EXPLORER)
    }

    if ( !out ) {
      out = active[0]
    }

    return out
  },

  clusterReady(state) {
    return state.clusterReady === true
  },

  projectReady(state) {
    return state.projectReady === true
  },

  isAllNamespaces(state, getters) {
    const product = getters['currentProduct']

    if ( !product ) {
      return true
    }

    if ( product.showWorkspaceSwitcher ) {
      return false
    }

    if ( !product.showNamespaceFilter ) {
      return true
    }

    return state.namespaceFilters.filter(x => !`${ x }`.startsWith('namespaced://')).length === 0
  },
}

export const mutations = {
  setCluster(state, neu) {
    state.clusterId = neu
  },

  setProject(state, neu) {
    state.projectId = neu
  },

  updateNamespaces(state, { all }) {
    if ( all ) {
      state.allNamespaces = all
    }
  },

  setError(state, obj) {
    const err = new ApiError(obj)

    console.log('Loading error', err) // eslint-disable-line no-console

    state.error = err
    state.cameFromError = true
  },

  cameFromError(state) {
    state.cameFromError = true
  },

  clusterChanged(state, ready) {
    state.clusterReady = ready
  },

  projectChanged(state, ready) {
    state.projectReady = ready
  },
}

export const actions = {
  async loadRancher({
    state, dispatch, commit
  }) {
    if (state.rancherReady) {
      return
    }

    console.log('Loading Rancher...') // eslint-disable-line no-console

    try {
      const principals = await dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  {
          url: 'principals',
        }
      })

      const me = findBy(principals, 'me', true)

      commit('auth/hasAuth', true)
      commit('auth/loggedInAs', me.id)
    } catch (e) {
      // Maybe not Rancher
    }

    await dispatch('rancher/loadSchemas', true)

    await allHash({
      cluster: dispatch('rancher/findAll', {
        type: NORMAN.CLUSTER,
        opt:  { url: NORMAN.CLUSTER }
      }),
      users: dispatch('rancher/findAll', { type: 'user' })
    })

    console.log(`Done loading Rancher`) // eslint-disable-line no-console
  },

  async loadCluster({
    state, dispatch, commit
  }, id) {
    if ( state.clusterId && state.clusterId === id ) {
      // Do nothing, we're already connected/connecting to this cluster
      return
    }

    if ( state.clusterId && id ) {
      // Clear the old cluster state out if switching to a new one.
      // If there is not an id then stay connected to the old one behind the scenes,
      // so that the nav and header stay the same when going to things like prefs
      commit('clusterChanged', false)

      await dispatch('cluster/unsubscribe')
      await dispatch('clusterScope/unsubscribe')
      commit('cluster/reset')
      commit('clusterScope/reset')
    }

    if ( id ) {
      // Remember the new one
      // dispatch('prefs/set', { key: CLUSTER_PREF, value: id })
      commit('setCluster', id)
    }

    console.log(`Loading cluster...`, id) // eslint-disable-line no-console

    const clusterBase = `/k8s/clusters/${ escape(id) }/v1`
    const clusterScopeBase = `/v3/clusters/${ escape(id) }`

    // Update the Steve client URLs
    commit('cluster/applyConfig', { baseUrl: clusterBase })
    commit('clusterScope/applyConfig', { baseUrl: clusterScopeBase })

    await Promise.all([
      dispatch('cluster/loadSchemas', true),
      dispatch('clusterScope/loadSchemas', true),
    ])

    dispatch('cluster/subscribe')

    const res = await allHash({
      namespaces:  dispatch('cluster/findAll', { type: NAMESPACE, opt: { url: 'namespaces' } }),
      configmaps:  dispatch('cluster/findAll', { type: 'configmap' }),
      deployments: dispatch('cluster/findAll', { type: 'apps.deployment', }),
    })

    commit('updateNamespaces', {
      all: res.namespaces
    })

    commit('clusterChanged', true)

    console.log('Done loading cluster.') // eslint-disable-line no-console
  },

  async loadProject({
    state, commit, dispatch
  }, id) {
    if ( state.projectId && state.projectId === id ) {
      // Do nothing, we're already connected/connecting to this cluster
      return
    }

    if ( state.projectId && id ) {
      commit('projectChanged', false)

      await dispatch('project/unsubscribe')
      await dispatch('projectScopeer/unsubscribe')
      commit('project/reset')
      commit('projectScopeer/reset')
    }

    if ( id ) {
      // Remember the new one
      commit('setProject', id)
    }

    console.log(`Loading project...`) // eslint-disable-line no-console

    const projectBase = `/v3/project/${escape(id)}`

    // Update the Steve client URLs
    commit('project/applyConfig', { baseUrl: projectBase })

    await Promise.all([
      dispatch('project/loadSchemas', true),
    ])

    dispatch('project/subscribe')

    await allHash({
      apps: dispatch('project/findAll', { type: 'app' })
    })

    commit('projectChanged', true)
  },

  nuxtClientInit({ rootState }, nuxt) {
    Object.defineProperty(rootState, '$router', { value: nuxt.app.router })
    Object.defineProperty(rootState, '$route', { value: nuxt.route })
  },

  activeProducts(state, getters, rootState, rootGetters) {
    const knownTypes = {}
    const knownGroups = {}
    const isDev = rootGetters['prefs/get'](DEV)

    if ( state.schemaGeneration < 0 ) {
      // This does nothing, but makes activeProducts depend on schemaGeneration
      // so that it can be used to update the product list on schema change.
      return
    }


    return state.products.filter((p) => {
      const module = p.inStore

      if ( p['public'] === false && !isDev ) {
        return false
      }

      if ( p.ifGetter && !rootGetters[p.ifGetter] ) {
        return false
      }

      if ( !knownTypes[module] ) {
        const schemas = rootGetters[`${module}/all`](SCHEMA)

        knownTypes[module] = []
        knownGroups[module] = []

        for ( const s of schemas ) {
          knownTypes[module].push(s._id)

          if ( s._group ) {
            addObject(knownGroups[module], s._group)
          }
        }
      }

      if ( p.ifHaveType && !knownTypes[module].find((t) => t.match(stringToRegex(p.ifHaveType)) ) ) {
        return false
      }

      if ( p.ifHaveGroup && !knownGroups[module].find((t) => t.match(stringToRegex(p.ifHaveGroup)) ) ) {
        return false
      }

      return true
    })
  },

  loadingError({ commit, state }, err) {
    commit('setError', err)
    const router = state.$router

    router.replace('/fail-whale')
  }
} 

// Regexes can't be represented in state because they don't serialize to JSON..
const regexCache = {}

function stringToRegex(str) {
  let out = regexCache[str]

  if ( !out ) {
    out = new RegExp(str)
    regexCache[str] = out
  }

  return out
}

export const strict = false