import { set } from '@/utils/object'
import { colorForState } from '@/plugins/steve/resource-instance'
import { escapeHtml } from '@/utils/string'
// import moment from '@nuxtjs/moment'

export default {
  redisDetail() {
    const id = this.spec?.redisName?.replace(/.*\//, '')

    return {
      name:   `c-cluster-redis-service-namespace-id`,
      params: {
        cluster:   this.$rootGetters['clusterId'],
        namespace: this.metadata?.namespace,
        id,
      }
    }  
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
      { divider: true },
      {
        action:     'approve',
        label:      '通过',
        icon:       'icon icon-checkmark',
        enabled:    this.stateDisplay === 'Pending',
      },
      {
        action:     'reject',
        label:      '驳回',
        icon:       'icon icon-close',
        enabled:    this.stateDisplay === 'Pending',
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

  approve() {
    let data = {}
    
    const currentUser = this.$rootGetters['currentUser']
    set(data, 'status.result', 'Approved')
    set(data, 'status.auditor', currentUser.id)
    set(data, 'status.auditorDisplayName', currentUser.name)
    set(data, 'status.completionTime', new Date().toISOString())

    this.saveStatus({
      data,
    }).catch(err => {
      this.$dispatch('growl/fromError', { title: '通过错误', err, }, { root: true })
    })
  },

  reject() {
    let data = {}
    
    const currentUser = this.$rootGetters['currentUser']
    set(data, 'status.result', 'Rejected')
    set(data, 'status.auditor', currentUser.id)
    set(data, 'status.auditorDisplayName', currentUser.name)
    set(data, 'status.completionTime', new Date().toISOString())
    
    this.saveStatus({
      data,
    }).catch(err => {
      this.$dispatch('growl/fromError', { title: '驳回错误', err, }, { root: true })
    })
  },

  stateDisplay() {
    return this.status?.result || 'Pending'
  },

  stateColor() {
    const out = colorForState.call(
      this,
      this.status?.result,
    )

    return out
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

  showAsAudit() {
    return true
  },

  doneRoute() {
    return 'c-cluster-product-resource'
  },

  doneParams() {
    return ({
      product:  'redis',
      resource: 'audit',
    })
  },

  displayOperation() {
    const operation = this.spec.operation

    if (operation === 'CREATE') {
      return '创建'
    } else if (operation === 'UPDATE') {
      return '更新'
    } else if (operation === 'DELETE') {
      return '删除'
    }
  },
}