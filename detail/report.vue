<script>
import CreateEditView from '@/mixins/origin-create-edit-view/impl'
import Loading from '@/components/Loading'
import {
  _VIEW, _CLONE, _STAGE, _CREATE, _YAML
} from '@/config/query-params'
import Masthead from '@/components/ResourceDetail/Masthead'
import { set } from '@/utils/object'
import ResourceTabs from '@/components/form/ResourceTabs'
import Tab from '@/components/Tabbed/Tab'
import SortableTable from '@/components/SortableTable'
import Polaris from '@/components/Polaris'
import { REASON, MESSAGE } from '@/config/table-headers'

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
    ResourceTabs,
    Tab,
    SortableTable,
    Polaris,
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
      report,
    }

    for ( const key in out ) {
      this[key] = out[key]
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
      report:          {
        eventResult:        [],
        sysComponentResult: [],
        workloadResult:     [],
        nodeResult:           [],
      },
    }
  },

  computed: {
    realMode() {
      // There are 5 "real" modes that you can start in: view, edit, create, stage, clone
      const realMode = modeFor(this.$route)

      return realMode
    }, 

    yamlHeaders() {
      return [
        {
          name:     'name',
          labelKey:  'generic.name',
          value:    'name',
          sort:     'name',
        },
        {
          name:     'kind',
          labelKey: 'generic.type',
          value:    'kind',
          sort:     'kind',
        },
        {
          label:     '概览',
          name:      'preview',
          formatter: 'PodBar',
        },
      ]
    },

    eventHeaders() {
      return [
        {
          name:          'podName',
          labelKey:      'tableHeaders.name',
          value:         'podName',
          sort:          ['nameSort'],
        },
        REASON,
        MESSAGE,
        {
          name:          'eventTime',
          labelKey:      'tableHeaders.lastUpdated',
          value:         'eventTime',
          sort:          'eventTime:desc',
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          width:         125
        },
      ]
    },

    sysComponentHeaders() {
      return [
        {
          name:      'severity',
          labelKey:  'tableHeaders.state',
          sort:      ['stateSort', 'nameSort'],
          value:     'severity',
          width:     100,
          default:   'unknown',
          formatter: 'StateFormatter',
        },
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'name',
          sort:          ['nameSort'],
        },
        MESSAGE,
        {
          name:      'errorTime',
          labelKey:  'tableHeaders.lastSeen',
          value:     'errorTime',
          sort:      ['errorTime'],
          formatter: 'LiveDate',
          width:     175
        },
      ]
    },

    nodeHeaders() {
      return [
        {
          name:      'severity',
          labelKey:  'tableHeaders.state',
          sort:      ['stateSort', 'nameSort'],
          value:     'severity',
          width:     100,
          default:   'unknown',
          formatter: 'StateFormatter',
        },
        {
          name:      'nodeName',
          labelKey:  'tableHeaders.nodeName',
          sort:      'nodeName',
          value:     'nodeName',
        },
        REASON,
        MESSAGE,
        {
          name:      'heartBeatTime',
          labelKey:  'tableHeaders.lastSeen',
          value:     'heartBeatTime',
          sort:      ['heartBeatTime'],
          formatter: 'LiveDate',
          width:     175
        }
      ]
    },
  },

  created() {
    // eslint-disable-next-line prefer-const
    let resource = this.resourceOverride || this.$route.params.resource
    const options = this.$store.getters[`type-map/optionsFor`](resource)

    if ( options.resource ) {
      resource = options.resource
    }
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
    <ResourceTabs v-model="value" :mode="mode">
      <Tab
        name="yaml"
        label-key="inspect.report.tabs.yaml.label"
        :weight="100"
      >
        <SortableTable
          :rows="report.workloadResult"
          :headers="yamlHeaders"
          key-field="id"
          :table-actions="false"
          :row-actions="false"
          group-by="namespace"
          group-label-key="nameNsDescription.namespace.label"
          :sub-expand-column="true"
          :search="false"
          :sub-rows="true"
          :sub-expandable="true"
        >
          <template #sub-row="{row, fullColspan}">
            <Polaris 
              :row="row"
              :full-colspan="fullColspan"
            />
          </template>
        </SortableTable>
      </Tab>
      <Tab
        name="event"
        label-key="inspect.report.tabs.event.label"
        :weight="99"
      >
        <SortableTable
          :rows="report.eventResult"
          :headers="eventHeaders"
          key-field="id"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          default-sort-by="date"
          group-by="namespace"
          group-label-key="nameNsDescription.namespace.label"
        />
      </Tab>
      <Tab
        name="sysComponent"
        label-key="inspect.report.tabs.sysComponent.label"
        :weight="98"
      >
        <SortableTable
          :rows="report.sysComponentResult"
          :headers="sysComponentHeaders"
          key-field="id"
          :search="false"
          :table-actions="false"
          :row-actions="false"
        />
      </Tab>
      <Tab
        name="node"
        label-key="inspect.report.tabs.node.label"
        :weight="97"
      >
        <SortableTable
          :rows="report.nodeResult"
          :headers="nodeHeaders"
          key-field="id"
          :search="false"
          :table-actions="false"
          :row-actions="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
