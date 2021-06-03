<script>
import ResourceList from '@/components/ResourceList'
import { STATE } from '@/config/table-headers'
import { allHash } from '@/utils/promise'
import { filterBy, findBy } from '@/utils/array'

export default {
  components: {
    ResourceList,
  },

  props: {
    rows: {
      type:    Array,
      default: () => []
    },
    model: {
      type:    Object,
      default: () => {}
    },
  },

  data() {
    const headers = [
      STATE,
      {
        labelKey:  "tableHeaders.name",
        name:      'metadata.name',
      },
      {
        label:     '槽/密钥空间',
        name:      'slots',
        formatter: 'List',
      },
      {
        label:     "工作负载",
        formatter: 'LinkShardStatefulSet',
        name:      'metadata.name',
      },
      {
        label:     '节点数',
        name:      'pods',
        formatter: 'PodBar',
      },
      {
        label:     '访问地址',
        name:      'poi',
        formatter: 'LinkShardEndPoint',
      },
    ]

    return {
      headers,
      clusteredRedis: [],
      shards:          [],
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch

    await allHash({
      shards: dispatch('cluster/loadAll', {
        type: 'shard',
        data: this.rows,
      }),
      statefulsets: dispatch('cluster/findAll', {
        type: 'apps.statefulset',
      }),
      pods: dispatch('cluster/findAll', {
        type: 'pod',
      }),
    })
  },

  computed: {
    statefulsets() {
      const statefulsets = this.$store.getters[`cluster/all`]('apps.statefulset')

      const out = (statefulsets || []).filter(s => {
        return ((s?.metadata?.labels || {})['redis.cattle.io/kind'] === this.model?.kind) 
              && ((s?.metadata?.labels || {})['redis.cattle.io/name'] === this.model?.metadata?.name)
              && s?.metadata?.namespace === this.model?.metadata?.namespace
      })

      return out
    }
  },

  watch: {
    rows: async function (nVal) {
      const dispatch = this.$store.dispatch
      const shards = nVal

      const filter = filterBy(shards, 'role', 'master')

      const out = this.statefulsets.map(s => {
        const finder = findBy(filter, 'statefulSet', s.metadata.name)

        return dispatch('cluster/create', {
          ...finder,
          ...s,
        })
      })
      const res = await Promise.all(out)

      this.shards = res
    },

    statefulsets: async function (nVal) {
      const dispatch = this.$store.dispatch
      const shards = this.rows

      const filter = filterBy(shards, 'role', 'master')

      const out = nVal.map(s => {
        const finder = findBy(filter, 'statefulSet', s.metadata.name)

        return dispatch('cluster/create', {
          ...finder,
          ...s,
        })
      })
      const res = await Promise.all(out)

      this.shards = res
    }
  },
}
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <ResourceList 
      :headers="headers"
      :rows="shards"
      :is-creatable="false"
      :row-actions="false"
      :show-groups="false"
      :table-actions="false"
      :is-yaml-creatable="false"
      :search="false"
    />
  </div>
</template>