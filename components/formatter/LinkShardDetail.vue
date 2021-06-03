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
    to() {
      const shardId = this.row?.metadata?.name
      const { namespace, id } = this.$router.currentRoute.params

      return {
        name:   `c-cluster-redis-service-redis.cattle.io.clusteredredis-namespace-id-shard-shardId`,
        params: {
          cluster: this.$store.getters['clusterId'],
          namespace,
          id,
          shardId,
        }
      }
    },
  }
}
</script>

<template>
  <span>
    <n-link v-if="to" :to="to">
      {{ value }}
    </n-link>
  </span>
</template>
