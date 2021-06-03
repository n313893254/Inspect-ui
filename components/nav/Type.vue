<script>
export default {
  props: {
    type: {
      type:     Object,
      required: true,
    },
    isRoot: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    return {
      addonLinkActive: false,
    }
  },

  watch: {
    '$route': {
      handler: function () {
        const currentRoute = this.$router.currentRoute

        if (this.type.name === 'redis-service') {
          const resource = currentRoute?.params?.resource
          if ( resource === 'redis.cattle.io.clusteredredis' || resource === 'redis.cattle.io.redis') {
            return this.addonLinkActive = true
          }
        }

        if (this.type.name === 'redis-approval') {
          const resource = currentRoute?.params?.resource
          if ( resource === 'redis.cattle.io.clusteredredisaudit' || resource === 'redis.cattle.io.redisaudit' || resource === 'redis.cattle.io.backupaudit') {
            return this.addonLinkActive = true
          }
        }
        
        this.addonLinkActive = false
      },
      immediate: true,
    }
  }
}
</script>

<template>
  <n-link
    :key="type.name"
    :to="type.route"
    class="child"
    :class="{
      'root': isRoot,
      'addon-link-active': addonLinkActive,
    }"
    tag="li"
  >
    <a>
      <span 
        class="label" 
        v-html="type.labelDisplay || type.label" 
      />
    </a>
  </n-link>
</template>

<style lang="scss" scoped>
  .child {
    margin-right: var(--outline);

    .label {
      grid-area: label;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;

      ::v-deep .highlight {
        background: var(--diff-ins-bg);
        color: var(--body-text);
        padding: 2px;
      }

      ::v-deep .icon {
        position: relative;
        top: -1px;
        color: var(--muted);
      }
    }

    A {
      display: grid;
      grid-template-areas: "label count";
      grid-template-columns: auto auto;
      grid-column-gap: 5px;
      font-size: 16px;
      line-height: 24px;
      padding: 16px 7px 16px 10px;
      margin: 0 2px 0 -3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        background: var(--dropdown-hover-bg);
        text-decoration: none;

        ::v-deep .icon {
          color: var(--body-text);
        }
      }
    }
  }
</style>