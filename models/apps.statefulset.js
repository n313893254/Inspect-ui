export default {
  canDelete() {
    return false
  },

  pods() {
    const pods = this.$getters['all']('pod')

    const out = filterResourcesByOwner(pods, this.metadata.name)

    return out
  },
}

function filterResourcesByOwner(resourceList, ownerId) {
  return resourceList.filter((resource) => {
    const { metadata:{ ownerReferences = [] } } = resource
    return (ownerReferences.filter((owner) => {
      return owner.name === ownerId
    }).length)
  })
}