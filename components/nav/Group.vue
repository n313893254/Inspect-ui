<script>
import Type from '@/components/nav/Type'

export default {
  name: 'Group',
  
  components: { 
    Type 
  },

  props: {
    group: {
      type:     Object,
      required: true,
    },
    childrenKey: {
      type:    String,
      default: 'children',
    },
  },
}
</script>

<template>
  <div class="accordion">
    <ul 
      class="list-unstyled body" 
      v-bind="$attrs"
    >
      <template v-for="(child, id) in group[childrenKey]">
        <Type
          :key="id+'_' + child.name + '_type'"
          :type="child"
          :is-root="true"
        />
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  .accordion {
    &.depth-0 {
      > .header {
        padding: 5px 0;

        > H6 {
          font-size: 14px;
          text-transform: none;
          padding-left: 10px;
        }

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 7px 8px 11px 0;
        }
      }

      > .body {
        margin-left: 0;
      }
    }

    &:not(.depth-0) {
      > .header {
        > SPAN {
          // Child groups that aren't linked themselves
          display: inline-block;
          padding: 5px 0 5px 5px;
        }

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 6px 8px 6px 0;
        }
      }
    }
  }

  .body ::v-deep > .child.nuxt-link-active,
  .body ::v-deep > .child.addon-link-active,
  .header ::v-deep > .child.nuxt-link-exact-active {
    background-color: var(--nav-active);
    padding: 0;
    border-left: solid 5px var(--primary);

    A {
      padding-left: 5px;
    }

    A, A I {
      color: var(--body-text);
    }
  }

  .body ::v-deep > .child {
    A {
      border-left: solid 5px transparent;
      transition: ease-in-out all .25s;
    }

    A:focus {
      outline: none;
      box-shadow: 0 0 0 var(--outline-width) var(--outline);
    }
  }
</style>