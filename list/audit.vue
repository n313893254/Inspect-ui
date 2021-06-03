<script>
import ResourceTable from '@/components/ResourceTable'
import { STATE } from '@/config/table-headers'
import { REDIS_AUDIT_TYPES, SCHEMA } from '@/config/types'

const schema = {
  id:         'audit',
  type:       SCHEMA,
  attributes: {
    kind:       'Audit',
    namespaced: true
  },
  metadata: { name: 'audit' },
}

export default {
  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  components: {
    ResourceTable,
  },

  data() {
    const headers = [
      STATE, 
      {
        label:     "申请名称",
        name:      'metadata.name',
        formatter:     'LinkDetail',
      }, {
        label:         "资源名称",
        name:          'displayAuditName',
      }, {
        label: "资源类型",
        name:     'displayType',
      }, {
        label: "操作",
        name:     'displayOperation',
      }, {
        label:  "申请人",
        name:      'spec.applicantDisplayName',
      }, {
        label: "审批人",
        name:     'status.auditorDisplayName',
      }, {
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
      resources: [],
    }
  },

  async fetch() {
    let resources

    if ( this.allTypes ) {
      resources = await Promise.all(Object.values(REDIS_AUDIT_TYPES).map((type) => {
      // You may not have RBAC to see some of the types
        if ( !this.$store.getters['cluster/schemaFor'](type) ) {
          return null
        }

        return this.$store.dispatch('cluster/findAll', { type })
      }))
    } else {
      const type = this.$route.params.resource

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$store.dispatch('cluster/findAll', { type })

        resources = [resource]
      }
    }

    this.resources = resources
  },

  computed: {
    rows() {
      const out = []
      
      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue
        }

        for ( const row of typeRows ) {
          if (!this.allTypes || row.showAsAudit) {
            out.push(row)
          }
        }
      }

      return out
    },

    allTypes() {
      return this.$route.params.resource === schema.id
    },
  },

  typeDisplay() {
    const { params:{ resource:type } } = this.$route
    let paramSchema = schema

    if (type !== schema.id) {
      paramSchema = this.$store.getters['cluster/schemaFor'](type)
    }

    return this.$store.getters['type-map/labelFor'](paramSchema, 99)
  },
}
</script>

<template>
  <ResourceTable
    :schema="schema"
    :headers="headers"
    :rows="rows"
    :sub-rows="true"
    :is-creatable="true"
    :groupable="true"
  />
</template>