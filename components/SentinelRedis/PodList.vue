<script>
import ResourceList from '@/components/ResourceList'
import { STATE } from '@/config/table-headers'
import { findBy } from '@/utils/array'
import { allHash } from '@/utils/promise'

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
        formatter: 'LinkPod',
      },
      {
        label:     "工作负载",
        name:      'statefulSet.name',
        formatter: 'LinkShardStatefulSet',
      },
      {
        label:     '角色',
        name:      'role',
      },
      {
        label:     "访问地址",
        formatter: 'LinkShardEndPoint',
        name:      'ip',
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
      podRows: [],
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch

    await allHash({
      pods: dispatch('cluster/findAll', {
        type: 'pod',
      }),
    })
  },

  computed: {
    pods() {
      const pods = this.$store.getters[`cluster/all`]('pod') || []
      const out =  pods.filter(s => {
        return (
          (s?.metadata?.labels || {})['redis.cattle.io/kind'] === this.model?.kind
          && ((s?.metadata?.labels || {})['redis.cattle.io/name'] === this.model?.metadata?.name)
          && ((s?.metadata?.labels || {})['redis.cattle.io/component'] === 'redis')
        )
      })

      return out
    }
  },

  watch: {
    pods: async function (nVal=[]) {
      const dispatch = this.$store.dispatch

      const redis = this.$store.getters[`cluster/all`]('redis.cattle.io.redis')
      const { namespace, id } = this.$router.currentRoute.params

      const finder = findBy(redis, 'id', `${namespace}/${id}`) || {}

      const nodes = finder?.status?.nodes

      const out = nVal.map(s => {
        const finder = findBy(nodes, 'podName', s?.metadata?.name)

        return dispatch('cluster/create', {
          ...finder,
          ...s,
        })
      })

      const res = await Promise.all(out)
      this.podRows = res
    }
  }
}
</script>

<template>
  <div>
    <ResourceList 
      :headers="headers"
      :rows="podRows"
      :is-creatable="false"
      :row-actions="false"
      :show-groups="false"
      :table-actions="false"
      :is-yaml-creatable="false"
      :search="false"
    />
  </div>
</template>