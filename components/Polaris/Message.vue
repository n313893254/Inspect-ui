<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    iconClass() {
      const success = this.row.success

      if (success) {
        return {
          success:          true,
          'icon-checkmark': true,
        }
      }

      let severity = this.row.severity

      if (severity === 'danger') {
        severity = 'close'
      }

      return {
        [`icon-${severity}`]: true,
        [severity]:           true,
        failure:              true,
      }
    }
  },
}
</script>

<template>
  <span>
    <i class="icon" :class="iconClass" />
    <span>
      {{ row.message }}
    </span>
  </span>
</template>

<style lang="scss" scoped>
.failure.warning {
  color: #DAC342;
}
.failure.close {
  color: #F64747;
}
.success {
  color: #5D995D;
}
</style>

