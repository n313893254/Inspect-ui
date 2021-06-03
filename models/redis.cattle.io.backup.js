import { downloadFile } from '@/utils/download'
import { escapeHtml } from '@/utils/string'
import Vue from 'vue'
import { findBy } from '@/utils/array'

export default {
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
        path:           'spec.s3.endpoint',
        required:       true,
        translationKey: 'backup.s3.endpoint.label',
      },
      {
        nullable:       false,
        path:           'spec.s3.bucket',
        required:       true,
        translationKey: 'backup.s3.bucket.label',
      },
      {
        nullable:       false,
        path:           'spec.storageSecretName',
        required:       true,
        translationKey: 'backup.storageSecretName.label',
      },
      {
        nullable:       false,
        path:           'spec.redisName',
        required:       true,
        translationKey: 'backup.redisName.label',
      },
      {
        nullable:       false,
        path:           'spec.redisKind',
        required:       true,
        translationKey: 'backup.redisKind.label',
      },
    ]
  },

  restore() {
    return () => {
      const name = this.metadata?.name?.replace(/.*\//, '')

      const location = {
        name:   `c-cluster-product-resource-create`,
        params: {
          cluster:  this.$rootGetters['clusterId'],
          product:  'redis',
          resource: 'redis',
        },
        query: {
          backup: name
        }
      }

      this.currentRouter().push(location)
    }
  },

  displayType() {
    return '备份'
  },

  availableActions() {
    const all = [
      {
        action:  'goToEdit',
        label:   this.t('action.edit'),
        icon:    'icon icon-edit',
        enabled:  this.canUpdate && this.canCustomEdit,
      },
      {
        action:  'goToClone',
        label:   this.t('action.goToClone'),
        icon:    'icon icon-copy',
        enabled:  this.canCreate && this.canCustomEdit,
      },
      { divider: true },
      {
        action:  'goToEditYaml',
        label:   this.t('action.editYaml'),
        icon:    'icon icon-file',
        enabled: this.canUpdate && this.canYaml,
      },
      {
        action:  'goToViewYaml',
        label:   this.t('action.viewYaml'),
        icon:    'icon icon-file',
        enabled: !this.canUpdate && this.canYaml
      },
      {
        action:  'cloneYaml',
        label:   this.t('action.cloneYaml'),
        icon:    'icon icon-copy',
        enabled:  this.canCreate && this.canYaml,
      },
      {
        action:     'download',
        label:      this.t('action.download'),
        icon:       'icon icon-download',
        bulkable:   true,
        bulkAction: 'downloadBulk',
        enabled:    this.canYaml
      },
      {
        action:     'restore',
        label:      '从备份新建Redis服务',
        icon:       'icon icon-download',
        enabled:    this.canCreate,
      },
      { divider: true },
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    this.canDelete,
        bulkAction: 'promptRemove',
      },
      { divider: true },
      {
        action:  'viewInApi',
        label:   this.t('action.viewInApi'),
        icon:    'icon icon-external-link',
        enabled:  this.canViewInApi,
      }
    ]

    return all
  },

  downloadRestore() {
    const s3  = new AWS.S3({
      accessKeyId:      'myaccesskey' ,
      secretAccessKey:  'mysecretkey' ,
      endpoint:         'https://172.16.1.152:32066' ,
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    })

    s3.getObject({
      Bucket: 'test-backup',
      Key:    'maxresdefault.jpg',
    }, function(err, data) {
      if (err) {
        return alert('There was an error listing your albums: ' + err.message)
      } else {
        downloadFile('maxresdefault', data.Body, data.ContentType)
      }
    })
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

  displayRedisKind() {
    const redisKind = this.spec.redisKind
    
    if (redisKind === 'ClusteredRedis') {
      return '集群Redis'
    } else if (redisKind === 'Redis') {
      return '哨兵Redis'
    }
  },

  applyDefaults() {
    return () => {
      Vue.set(this, 'spec', {
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
      })
    }
  },

  details() {
    let out = []
    
    const secretName = this.spec?.storageSecretName

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

  auditEnabled() {
    const apps = this.$rootGetters[`project/all`]('app')
    const redisOperator = findBy(apps, 'name', 'redis-operator')

    if (!redisOperator) {
      return false
    }

    const answers = redisOperator.answers || {}
    return answers['global.enableAudit'] === 'true'
  },

  canUpdate() {
    return !this.auditEnabled
  },

  canCreate() {
    return !this.auditEnabled
  },

  canDelete() {
    return !this.auditEnabled
  },
}