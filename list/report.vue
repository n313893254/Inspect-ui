<script>
import ResourceTable from '@/components/ResourceTable'
import Loading from '@/components/Loading'
import AsyncButton from '@/components/AsyncButton'
import Masthead from '@/components/ResourceList/Masthead'

export default {
  components: {
    Loading,
    ResourceTable,
    Masthead,
    AsyncButton,
  },

  async fetch() {
    const store = this.$store
    const resource = this.resource

    let hasFetch = false

    const inStore = store.getters['currentProduct'].inStore
    const schema = store.getters[`${ inStore }/schemaFor`](resource)

    if ( !hasFetch ) {
      if ( !schema ) {
        store.dispatch('loadingError', `Type ${ resource } not found`)

        return
      }

      this.rows = await store.dispatch(`${ inStore }/findAll`, { type: resource })
    }
  },

  data() {
    const getters = this.$store.getters
    const params = { ...this.$route.params }
    const resource = params.resource

    const inStore = getters['currentProduct'].inStore
    const schema = getters[`${ inStore }/schemaFor`](resource)

    const showMasthead = getters[`type-map/optionsFor`](resource).showListMasthead

    return {
      schema,
      showMasthead: showMasthead === undefined ? true : showMasthead,
      resource,

      // Provided by fetch later
      rows:              null,
      customTypeDisplay: null,
    }
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema)
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema)
    },

  },

  methods: {
    async refreshReport(buttonDone) {
      try {
        await this.$store.dispatch('inspect/request', {
          url:           '/v1/reports?action=createReport',
          method:        'post',
          data:          { },
        })

        buttonDone(true)
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: '运行健康检查失败', err }, { root: true })
        buttonDone(false)
      }
    },
  },
} 
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :type-display="customTypeDisplay"
      :schema="schema"
      :resource="resource"
    >
      <template slot="extraActions">
        <AsyncButton
          mode="refresh"
          :action-label="t('inspect.report.create')"
          :waiting-label="t('inspect.report.create')"
          :success-label="t('inspect.report.create')"
          :error-label="t('inspect.report.create')"
          @click="refreshReport"
        />
      </template>
    </Masthead>
    <ResourceTable 
      :schema="schema" 
      :rows="rows" 
      :headers="headers" 
      :group-by="groupBy" 
    />
  </div>
</template>

<style lang="scss" scoped>
  .header {
    position: relative;
  }
  H2 {
    position: relative;
    margin: 0 0 20px 0;
  }
  .right-action {
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>
