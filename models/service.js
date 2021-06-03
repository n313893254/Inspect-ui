export default {
  externalLocation() {
    const id = this.id?.replace(/.*\//, '')

    const namespace = this.$rootGetters[`cluster/byId`]('namespace', this.metadata?.namespace)
    const projectId = namespace.metadata.labels['field.cattle.io/projectId']
    const clusterId = this.$rootGetters['clusterId']

    return `${window.location.origin}/p/${clusterId}:${projectId}/dns/${namespace.id}:${id}`
  },

  displayType() {
    return this?.spec?.type
  },

  targetEndPoint() {
    const fields = this.metadata?.fields || []
    return `${fields[2]}${fields[4]}`
  }
}