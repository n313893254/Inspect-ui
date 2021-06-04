<script>
import CreateEditView from '@/mixins/origin-create-edit-view/impl'
import Loading from '@/components/Loading'
import {
  _VIEW, _EDIT, _CLONE, _STAGE, _CREATE,
  AS, _YAML, _DETAIL, _CONFIG, PREVIEW, _MONITORING
} from '@/config/query-params'
import Masthead from '@/components/ResourceDetail/Masthead'
import isEqual from 'lodash/isEqual'
import { clone, set } from '@/utils/object'

function modeFor(route) {
  if ( route.params.id ) {
    return route.query.mode || _VIEW
  } else {
    return _CREATE
  }
}

async function getYaml(model) {
  let yaml
  const opt = { headers: { accept: 'application/yaml' } }

  if ( model.hasLink('rioview') ) {
    yaml = (await model.followLink('rioview', opt)).data
  } else if ( model.hasLink('view') ) {
    yaml = (await model.followLink('view', opt)).data
  }

  return yaml
}

export default {
  components: {
    Loading,
    Masthead,
  },

  mixins: [CreateEditView],

  props: {
    storeOverride: {
      type:    String,
      default: null,
    },

    resourceOverride: {
      type:    String,
      default: null,
    },

    parentRouteOverride: {
      type:    String,
      default: null,
    },
  },
  async fetch() {
    const store = this.$store
    const route = this.$route
    const params = route.params
    const inStore = this.storeOverride || store.getters['currentProduct']?.inStore
    const realMode = this.realMode

    // eslint-disable-next-line prefer-const
    let { namespace, id } = params
    let resource = this.resourceOverride || params.resource

    // There are 5 "real" modes that can be put into the query string
    // These are mapped down to the 3 regular page "mode"s that create-edit-view components
    // know about:  view, edit, create (stage and clone become "create")
    const mode = ((realMode === _STAGE || realMode === _CLONE) ? _CREATE : realMode)

    let as

    this.as = as

    const options = store.getters[`type-map/optionsFor`](resource)

    if ( options.resource ) {
      resource = options.resource
    }

    const schema = store.getters[`${ inStore }/schemaFor`](resource)
    let originalModel, model, yaml, report

    let fqid = id

    if ( schema.attributes?.namespaced && namespace ) {
      fqid = `${ namespace }/${ fqid }`
    }

    try {
      originalModel = await store.dispatch(`${ inStore }/find`, {
        type: resource,
        id:   fqid,
        opt:  { watch: true }
      })

      report = await this.$store.dispatch('inspect/request', {
        url:           '/v1/reports?action=viewReport',
        method:        'post',
        data:          {
          id: fqid,
        },
      })

      console.log(report, 'report')
    } catch(e) {
      store.commit('setError', e)

      return this.$router.push('/fail-whale')
    }

    if (realMode === _VIEW) {
      model = originalModel
    } else {
      model = await store.dispatch(`${ inStore }/clone`, { resource: originalModel })
    }

    if ( as === _YAML ) {
      yaml = await getYaml(originalModel)
    }

    if ( realMode === _CLONE || realMode === _STAGE ) {
      model.cleanForNew()
      yaml = model.cleanYaml(yaml, realMode)
    }

    // Ensure labels & annotations exists, since lots of things need them
    if ( !model.metadata ) {
      set(model, 'metadata', {})
    }

    if ( !model.metadata.annotations ) {
      set(model, 'metadata.annotations', {})
    }

    if ( !model.metadata.labels ) {
      set(model, 'metadata.labels', {})
    }

    const out = {
      resource,
      as,
      yaml,
      originalModel,
      mode,
      value: model,
    }

    for ( const key in out ) {
      this[key] = out[key]
    }

    if ( this.realMode === _CREATE ) {
      this.value.applyDefaults(this, realMode)
    }
  },

  data() {
    const getters = this.$store.getters
    const params = { ...this.$route.params }
    const resource = params.resource
    const showMasthead = getters[`type-map/optionsFor`](resource).showListMasthead

    return {
      resourceSubtype: null,

      // Set by fetch
      hasCustomDetail: null,
      hasCustomEdit:   null,
      resource:        null,
      asYaml:          null,
      yaml:            null,
      originalModel:   null,
      mode:            null,
      as:              null,
      value:           null,
      model:           null,
      hasMonitoring:   null,
      showMasthead:    showMasthead === undefined ? true : showMasthead,
    }
  },

  computed: {
    realMode() {
      // There are 5 "real" modes that you can start in: view, edit, create, stage, clone
      const realMode = modeFor(this.$route)

      return realMode
    },

    isView() {
      return this.mode === _VIEW
    },

    isYaml() {
      return this.as === _YAML
    },

    isDetail() {
      return this.as === _DETAIL
    },

    offerPreview() {
      return this.as === _YAML && [_EDIT, _CLONE, _STAGE].includes(this.mode)
    },

    showComponent() {
      switch ( this.as ) {
      case _DETAIL: return this.detailComponent
      case _CONFIG: return this.editComponent
      case _MONITORING: return this.monitoringComponent
      }

      return null
    },
  },

  watch: {
    '$route.query'(inNeu, inOld) {
      const neu = clone(inNeu)
      const old = clone(inOld)

      delete neu[PREVIEW]
      delete old[PREVIEW]

      if ( !this.isView ) {
        delete neu[AS]
        delete old[AS]
      }

      if ( !isEqual(neu, old) ) {
        this.$fetch()
      }
    },

    // Auto refresh YAML when the model changes
    async 'value.metadata.resourceVersion'(a, b) {
      if ( this.mode === _VIEW && this.as === _YAML && a && b && a !== b) {
        this.yaml = await getYaml(this.originalModel)
      }
    }
  },

  created() {
    // eslint-disable-next-line prefer-const
    const id = this.$route.params.id
    let resource = this.resourceOverride || this.$route.params.resource
    const options = this.$store.getters[`type-map/optionsFor`](resource)

    if ( options.resource ) {
      resource = options.resource
    }

    this.detailComponent = this.$store.getters['type-map/importDetail'](resource, id)
    this.editComponent = this.$store.getters['type-map/importEdit'](resource, id)
    this.monitoringComponent = this.$store.getters['type-map/importMonitoring'](resource, id)
  },

  methods: {
    setSubtype(subtype) {
      this.resourceSubtype = subtype
    }
  }
}
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :resource="resource"
      :value="originalModel"
      :mode="mode"
      :real-mode="realMode"
      :as="as"
      :has-detail="false"
      :has-edit="false"
      :has-monitoring="false"
      :resource-subtype="resourceSubtype"
      :parent-route-override="parentRouteOverride"
      :store-override="storeOverride"
    />
  </div>
</template>
