<script>
export default {
  props: {
    value: {
      type:     Array,
      default: () => []
    }
  },

  computed: {
    string() {
      if (this.value && this.value.length > 0) {
        return (this.value || []).join(', ')
      } else {
        return '-'
      }
    }
  },
}
</script>

<template>
  <span>
    {{ string }}
  </span>
</template>
