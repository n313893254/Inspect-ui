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
        path:           'spec.backup.metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      {
        nullable:       false,
        path:           'spec.backup.spec.s3.endpoint',
        required:       true,
        translationKey: 'backup.s3.endpoint.label',
      },
      {
        nullable:       false,
        path:           'spec.backup.spec.s3.bucket',
        required:       true,
        translationKey: 'backup.s3.bucket.label',
      },
      {
        nullable:       false,
        path:           'spec.backup.spec.storageSecretName',
        required:       true,
        translationKey: 'backup.storageSecretName.label',
      },
      {
        nullable:       false,
        path:           'spec.backup.spec.redisName',
        required:       true,
        translationKey: 'backup.redisName.label',
      },
      {
        nullable:       false,
        path:           'spec.backup.spec.redisKind',
        required:       true,
        translationKey: 'backup.redisKind.label',
      },
    ]
  },

  displayAuditName() {
    return this.spec?.backup?.metadata?.name
  },

  displayRedisKind() {
    const redisKind = this.spec.backup.spec.redisKind
    
    if (redisKind === 'ClusteredRedis') {
      return '集群Redis'
    } else if (redisKind === 'Redis') {
      return '哨兵Redis'
    }
  },

  displayType() {
    return '备份'
  },

  applyDefaults() {
    return () => {
      Vue.set(this, 'spec', {
        operation: 'CREATE',
        backup:    {
          metadata: {
            namespace: 'default',
            name:      ''
          },
          spec: {
            redisKind:     'ClusteredRedis',
            redisName:     '',
            s3:            {},
            storageSecret: {},
            backupJob:     {
              resources: {
                limits: {
                  cpu:    '1',
                  memory: '4Gi',
                }
              }
            },
            cleanRemoteBackup: false,
          },
          kind:       'Backup',
          apiVersion: 'redis.cattle.io/v1alpha1',
        }
      })
    }
  },
}