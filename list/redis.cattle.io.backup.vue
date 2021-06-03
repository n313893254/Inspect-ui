<script>
import ResourceTable from '@/components/ResourceTable'
import { STATE } from '@/config/table-headers'

export default {
  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
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
        labelKey:  "tableHeaders.name",
        name:      'metadata.name',
        formatter: 'LinkDetail',
      }, {
        labelKey: "tableHeaders.type",
        name:     'displayRedisKind',
      }, {
        labelKey: "redis.backup.redisName.label",
        name:     'spec.redisName',
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
    }
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
  />
</template>