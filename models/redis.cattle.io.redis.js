import { escapeHtml } from '@/utils/string'
import Redis from './redis'
import Vue from 'vue'

export default {
  ...Redis,
  customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      {
        nullable:       false,
        path:           'spec.redis.replicas',
        required:       true,
        translationKey: 'redis.replicas.label',
      },
      {
        nullable:       false,
        path:           'spec.sentinel.replicas',
        required:       true,
        translationKey: 'redis.sentinel.label',
      },
    ]
  },

  availableActions() {
    const out = this._standardActions

    return out
  },

  listLocation() {
    return {
      name:   `c-cluster-redis-service`,
      params: {
        cluster: this.$rootGetters['clusterId'],
      }
    }
  },

  displayType() {
    return '哨兵Redis'
  },

  groupByLabel() {
    const name = this.metadata.namespace

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.namespace', { 
        name: escapeHtml(name),
        span: chunks => chunks,
      })
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInANamespace')
    }
  },

  monitoringEnabled() {
    return !!this.spec?.exporter?.image
  },

  doneOverride() {
    return () => this.currentRouter().replace({
      name:   'c-cluster-product-resource',
      params: { 
        resource: 'redis',
        cluster:  this.$rootGetters['clusterId'],
        product:  'redis',
      }
    })
  },

  applyDefaults() {
    return () => {
      Vue.set(this, 'spec', {
        redis:    {
          replicas: 3,
          storage:        {
            type: 'ephemeral',
          },
        },
        sentinel: {
          replicas: 3,
        },
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
      })
    }
  },

  details() {
    let out = []
    
    const secretName = this.spec?.redis?.passwordSecret?.name

    if (secretName) {
      const namespace = this.metadata.namespace

      const currentNamespace = this.$rootGetters[`cluster/byId`]('namespace', namespace)

      const projectId = currentNamespace.metadata.labels['field.cattle.io/projectId']
      const clusterId = this.$rootGetters['clusterId']

      const externalLink = `${window.location.origin}/p/${clusterId}:${projectId}/secrets/${projectId}:${secretName}`

      out.push({
        label:         this.t('clusteredRedis.detailTop.secret'),
        formatter:     'LinkName',
        formatterOpts: {
          externalLink,
        },
        content: secretName,
      })
    }

    return out
  },
}