<script>
import { REDIS_AUDIT_TYPES } from '@/config/types'
import CreateEditView from '@/mixins/origin-create-edit-view'
import { allHash } from '@/utils/promise'
import Loading from '@/components/Loading'
import CruResource from '@/components/CruResource'

export default {
  components: {
    Loading,
    CruResource,
  },

  mixins: [CreateEditView],

  props: {
    header: {
      type:    String,
      default: '',
    },
    mode: {
      default: 'create',
      type:    String,
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  data() {
    let type = this.$route.params.resource

    if (type === 'audit') {
      type = null
    }

    return {
      type,
      backupTime:      'noLimit',
      maintenanceTime: 'noLimit',
      backup:          {
        enabled: false,
      },
      versionsMap:    {},
      accessControl:  false,
      customResource: false,
      packageSelect:  'small',
      secret:         {},
      createSecret:   {
        name:     '',
        password: '',
      },
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch

    this.value = await dispatch('cluster/create', {
      type:     REDIS_AUDIT_TYPES.CLUSTERED_REDIS,
      metadata: {},
      spec:     {
        clusteredRedis:   {
          replicasPerShard: 1,
          shards:           3,
          resources:        {
            limits: {
              cpu:    '150m',
              memory: '200Mi',
            },
            requests: {
              cpu:    '150m',
              memory: '200Mi',
            },
          },
          passwordSecret: {},
          nodeSelector:   {},
          storage:        {
            type: 'ephemeral',
          },
          config: {},
        },
        exporter: {
          resources:        {
            limits: {
              cpu:    '150m',
              memory: '200Mi',
            },
            requests: {
              cpu:    '150m',
              memory: '200Mi',
            },
          },
        },
      },
    })

    const hash = await allHash({
      versionConfigmap: dispatch('cluster/find', {
        type: 'configmap',
        id:   'cattle-redis/redis-version-options',
      }),
      secrets: dispatch('cluster/findAll', {
        type: 'secret',
      }),
      storageclasses: dispatch('cluster/findAll', {
        type: 'storage.k8s.io.storageclass',
      }),
    })
    this.versionsMap = JSON.parse(hash.versionConfigmap.data.options)
    this.secrets = hash.secrets
    this.storageclasses = hash.storageclasses

    const namespaces = this.$store.getters[`cluster/all`]('namespace')

    if (!this.value.metadata.namespace) {
      this.value.metadata.namespace = (namespaces[0] || {}).id
    }
  },

  computed: {
    redisTypes() {
      return REDIS_AUDIT_TYPES
    },

    // array of id, label, description, initials for type selection step
    redisSubTypes() {
      const out = []

      for (const prop in this.redisTypes) {
        const type = this.redisTypes[prop]
        const subtype = {
          id:          type,
          description: `redis.typeDescriptions.'${ type }'`,
          label:       this.nameDisplayFor(type),
          bannerAbbrv: this.initialDisplayFor(type)
        }

        out.push(subtype)
      }

      return out
    },
  },

  methods: {
    nameDisplayFor(type) {
      const schema = this.$store.getters['cluster/schemaFor'](type)

      return this.$store.getters['type-map/labelFor'](schema) || ''
    },

    // TODO better images for workload types?
    // show initials of workload type in blue circles for now
    initialDisplayFor(type) {
      const typeDisplay = this.nameDisplayFor(type)

      return typeDisplay.split('').filter(letter => letter.match(/[A-Z]/)).join('') || 'B'
    },

    selectType(type) {
      if (!this.type && type) {
        this.$router.replace({ params: { resource: type } })
      } else {
        this.type = type
      }
    },
  },
}
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-else>
      <CruResource
        :validation-passed="true"
        :selected-subtype="type"
        :resource="value"
        :mode="mode"
        :errors="errors"
        :done-route="doneRoute"
        :subtypes="redisSubTypes"
        :show-footer="false"
        @finish="save"
        @select-type="selectType"
        @error="e=>errors = e"
        @apply-hooks="applyHooks"
      />
    </div>
  </div>
</template>