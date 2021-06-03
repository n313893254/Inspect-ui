<script>
import ResourceList from '@/components/ResourceList'
import { STATE } from '@/config/table-headers'
import { allHash } from '@/utils/promise'

export default {
  props: {
    model: {
      type:    Object,
      default: () => ({})
    }
  },
  
  components: {
    ResourceList,
  },

  data() {
    const headers = [
      {
        ...STATE,
        formatterOpts: {
          arbitrary: true,
        },
      },
      {
        labelKey:      "tableHeaders.name",
        formatter:     'LinkDetail',
        name:          'name',
        value:         '$.metadata.fields[0]',
        formatterOpts: {
          canCopy: true,
        }
      }, {
        labelKey: "tableHeaders.type",
        name:     'type',
        value:    '$.metadata.fields[1]',
      }, {
        formatter: 'ServiceTargets',
        labelKey:  'tableHeaders.targetPort',
        name:      'targetPort',
        sort:      `$['spec']['targetPort']`,
        value:     `$['spec']['targetPort']`,
      }, {
        formatter: 'KeyValue',
        name:      'selector',
        labelKey:  'tableHeaders.selector',
        value:     `$['spec']['selector']`,
        sort:      `$['spec']['selector']`,
      }, {
        name:      'role',
        label:     '角色',
        value:     `$['metadata']['labels']['redis.cattle.io/role']`,
      }, {
        name:      'age',
        labelKey:  'tableHeaders.age',
        value:     'metadata.creationTimestamp',
        sort:      'metadata.creationTimestamp:desc',
        search:    false,
        formatter: 'LiveDate',
        width:     75,
        align:     'right'
      }
    ]

    return {
      headers,
      clusteredRedis: [],
    }
  },

  computed: {
    rows() {
      const services = this.$store.getters[`cluster/all`]('service') || []

      const out = services.filter(s => {
        const labels = s?.metadata?.labels || {}
        const labelMatch = ['redis', 'sentinel'].includes(labels['redis.cattle.io/component'])
                            && labels['redis.cattle.io/kind'] === this.model?.kind
                            && labels['redis.cattle.io/name'] === this.model?.metadata?.name
                            && ['master', 'slave', 'sentinel'].includes(labels['redis.cattle.io/role'])
        if (labelMatch) {
          return true
        } else {
          return false
        }
      })

      return out
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch

    const promise = {
      service: dispatch('cluster/findAll', {
        type: 'service',
      }),
    }
    
    await allHash(promise)
  }
}
</script>

<template>
  <ResourceList 
    :headers="headers"
    :rows="rows"
    :is-creatable="false"
    :row-actions="false"
    :show-groups="false"
    :table-actions="false"
    :is-yaml-creatable="false"
    :search="false"
  />
</template>