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
        path:           'spec.clusteredRedis.metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      {
        nullable:       false,
        path:           'spec.clusteredRedis.spec.clusteredRedis.shards',
        required:       true,
        translationKey: 'clusteredRedis.shards.label',
      },
      {
        nullable:       false,
        path:           'spec.clusteredRedis.spec.clusteredRedis.replicasPerShard',
        required:       true,
        translationKey: 'clusteredRedis.replicasPerShard.label',
      },
    ]
  },

  displayAuditName() {
    return this.spec?.clusteredRedis?.metadata?.name
  },

  displayRedisKind() {
    return '集群Redis'
  },

  displayType() {
    return '集群Redis'
  },

  applyDefaults() {
    return () => {
      Vue.set(this, 'spec', {
        operation:      'CREATE',
        clusteredRedis: {
          metadata: {
            namespace: 'default',
            name:      ''
          },
          spec: {
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
            network: {},
          },
          kind:       'ClusteredRedis',
          apiVersion: 'redis.cattle.io/v1alpha1',
          type:       'redis.cattle.io.clusteredredis',
        }
      })
    }
  },
}