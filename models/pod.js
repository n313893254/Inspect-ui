import { findBy, insertAt } from '@/utils/array'
import { escapeHtml } from '@/utils/string'

export default {
  statefulSet() {
    return findBy(this.metadata?.ownerReferences || [], 'kind', 'StatefulSet')
  },

  availableActions() {
    const out = []

    const removeAction = findBy(out, 'altAction', ' remove')
    let idx = out.length - 1

    if ( removeAction ) {
      idx = out.indexOf(removeAction)
    }

    const openShell = {
      action:     'openShell',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'Execute Shell',
      total:      1,
    }
    const openLogs = {
      action:     'openLogs',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'View Logs',
      total:      1,
    }

    insertAt(out, idx, openShell)
    insertAt(out, idx + 1, openLogs)
    insertAt(out, idx + 2, { divider: true })

    return out
  },

  openLogs() {
    return () => {
      this.$dispatch('wm/open', {
        id:        `${ this.id }-logs`,
        label:     this.nameDisplay,
        icon:      'file',
        component: 'ContainerLogs',
        attrs:     {
          pod:       this,
          container: this.defaultContainerName
        }
      }, { root: true })
    }
  },

  defaultContainerName() {
    const containers = this.spec.containers
    const desirable = containers.filter(c => c.name !== 'istio-proxy')

    if ( desirable.length ) {
      return desirable[0].name
    }

    return containers[0]?.name
  },

  openShell() {
    return () => {
      this.$dispatch('wm/open', {
        id:        `${ this.id }-shell`,
        label:     this.nameDisplay,
        icon:      'terminal',
        component: 'ContainerShell',
        attrs:     {
          pod:       this,
          container: this.defaultContainerName
        }
      }, { root: true })
    }
  },

  groupByLabel() {
    const name = this.statefulSet.name

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.shard', { 
        name: escapeHtml(name),
        span: chunks => chunks,
      })
    } else {
      return ''
    }
  },
}