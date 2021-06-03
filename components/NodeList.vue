<script>
import ResourceTable from '@/components/ResourceList'
import { STATE } from '@/config/table-headers'
import { allHash } from '@/utils/promise'
import { findBy } from '@/utils/array'

export default {
  components: {
    ResourceTable,
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
        name:      'displayName',
      },
      {
        label:       '角色',
        name:        'role',
        sort:        'role:desc',
        defaultSort: true,
        descending:  true,
      },
      {
        label:     "访问地址",
        formatter: 'LinkShardEndPoint',
        name:      'ip',
      },
      {
        label:     'Pod',
        name:      'podName',
        formatter: 'LinkPod',
        value:     'metadata.name',
      },
      {
        name:      'age',
        labelKey:  'tableHeaders.age',
        value:     'metadata.creationTimestamp',
        sort:      'metadata.creationTimestamp:desc',
        search:    false,
        formatter: 'LiveDate',
        width:     75,
        align:     'right'
      },
    ]

    return {
      headers,
      nodes: [],
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch

    await allHash({
      pods: dispatch('cluster/findAll', {
        type: 'pod',
      }),
      statefulsets: dispatch('cluster/findAll', {
        type: 'apps.statefulset',
      }),
    })
  },

  computed: {
    pods() {
      const statefulsets = this.statefulsets || []

      const out = statefulsets.reduce((sum, s) => {
        return [...sum, ...(s.pods || [])]
      }, [])

      return out
    },

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
    rows: async function (nVal=[]) {
      const dispatch = this.$store.dispatch
      
      const out = this.pods.map(pod => {
        const finder = findBy(nVal, 'podName', pod.metadata.name) || {}

        return dispatch('cluster/create', {
          ...finder,
          ...pod,
          displayName: (finder.id || '').substr(0, 7) || '-',
          role:        finder.role || '-',
        })
      })

      const res = await Promise.all(out)
      this.nodes = res
    },

    pods: async function (nVal=[]) {
      const dispatch = this.$store.dispatch

      const out = nVal.map(pod => {
        const finder = findBy(this.rows, 'podName', pod.metadata.name) || {}

        return dispatch('cluster/create', {
          ...finder,
          ...pod,
          displayName: (finder.id || '').substr(0, 7) || '-',
          role:        finder.role || '-',
        })
      })

      const res = await Promise.all(out)
      this.nodes = res
    },
  },
}
</script>

<template>
  <div>
    <ResourceTable 
      :headers="headers"
      :rows="nodes"
      :is-creatable="false"
      :is-yaml-creatable="false"
      :table-actions="false"
      :search="false"
    />
  </div>
</template>