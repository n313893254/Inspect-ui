<script>
export default {
  props: {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    opts: {
      type:    Object,
      default: null,
    }
  },

  computed: {
    href() {
      const { namespace } = this.$router.currentRoute.params

      const currentNamespace = this.$store.getters[`cluster/byId`]('namespace', namespace)

      const projectId = currentNamespace.metadata.labels['field.cattle.io/projectId']
      const clusterId = this.$store.getters['clusterId']

      return `${window.location.origin}/p/${clusterId}:${projectId}/workload/statefulset:${namespace}:${this.row.statefulSet}`
    },
  }
}
</script>

<template>
  <span>
    <a v-if="href" :href="href" target="_blank" rel="noopener nofollow">
      {{ row.nodeName }}
    </a>
  </span>
</template>
