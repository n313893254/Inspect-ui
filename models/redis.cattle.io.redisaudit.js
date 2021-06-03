import Audit from './audit'
import Vue from 'vue'

export default {
  ...Audit,

  customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'nameNsDescription.audit.name.label',
        type:           'dnsLabel',
      },
      {
        nullable:       false,
        path:           'spec.redis.metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      {
        nullable:       false,
        path:           'spec.redis.spec.redis.replicas',
        required:       true,
        translationKey: 'redis.replicas.label',
      },
      {
        nullable:       false,
        path:           'spec.redis.spec.sentinel.replicas',
        required:       true,
        translationKey: 'redis.sentinel.label',
      },
    ]
  },

  displayAuditName() {
    return this.spec?.redis?.metadata?.name
  },

  displayRedisKind() {
    return '哨兵Redis'
  },

  displayType() {
    return '哨兵Redis'
  },

  applyDefaults() {
    return () => {
      Vue.set(this, 'spec', {
        operation: 'CREATE',
        redis:     {
          metadata: {
            name:      '',
            namespace: 'default',
          },
          spec: {
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
            restore: {
              backupSource: {},
            },
          },
          kind:       'redis',
          apiVersion: 'redis.cattle.io/v1alpha1',
          type:       'redis.cattle.io.redis',
        },
      })
    }
  },
}