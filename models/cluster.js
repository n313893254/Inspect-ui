export default {
  isReady() {
    return this.state === 'active'
  },

  openShell() {
    return () => {
      this.$dispatch('wm/open', {
        id:        `kubectl-${ this.id }`,
        label:     this.$rootGetters['i18n/t']('wm.kubectlShell.title', { name: this.name }),
        icon:      'terminal',
        component: 'KubectlShell',
        attrs:     {
          cluster: this,
          pod:     {}
        }
      }, { root: true })
    }
  },
}