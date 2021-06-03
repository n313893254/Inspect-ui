import { escapeHtml } from '@/utils/string'
import { findBy } from '@/utils/array'

export default {
  showAsRedis() {
    return true
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