<script>
import { mapGetters } from 'vuex'
import { NAME as PRODUCT_NAME } from '@/config/product/inspect'

export default {
  computed: {
    ...mapGetters(['clusterReady', 'isMultiCluster', 'currentCluster',
      'currentProduct', 'backToRancherLink', 'backToRancherGlobalLink']),

    name() {
      return this.$store.getters['i18n/t'](`product.${PRODUCT_NAME}`) || PRODUCT_NAME
    },
  },

  methods: {
    showMenu(show) {
      if (this.$refs.popover) {
        if (show) {
          this.$refs.popover.show()
        } else {
          this.$refs.popover.hide()
        }
      }
    },
  },
}
</script>

<template>
  <header class="explorer">
    <div class="product">
      <div alt="Logo" class="logo">
        <img src="~/assets/images/pl/half-logo.svg">
      </div>
      <div class="product-name">
        {{ name }}
      </div>
    </div>

    <div class="cluster" />

    <div class="kubectl" />

    <div class="back" />

    <div class="user user-menu" tabindex="0" @blur="showMenu(false)" @click="showMenu(true)" @focus.capture="showMenu(true)" />
  </header>
</template>

<style lang="scss" scoped>
  HEADER {
    display: grid;
    height: 100vh;

    .labeled-select,
    .unlabeled-select {
      min-height: 0;
      height: $input-height;
    }

    ::v-deep > div > .btn.role-tertiary {
      border: 1px solid var(--header-btn-bg);
      background: rgba(0,0,0,.05);
      color: var(--header-btn-text);

      &[disabled=disabled] {
        background-color: var(--header-btn-bg) !important;
        color: var(--header-btn-text) !important;
        opacity: 0.7;
      }
    }

    grid-template-areas:  "product cluster back kubectl user";
    grid-template-columns: var(--nav-width) min-content min-content min-content var(--header-height);
    grid-template-rows:    var(--header-height);

    &.explorer {
      grid-template-columns: var(--nav-width) auto min-content min-content var(--header-height);
    }

    > .product {
      grid-area: product;
      background-color: var(--header-btn-bg);
      position: relative;

      .logo {
        height: 30px;
        position: absolute;
        top: 9px;
        left: 0;
        z-index: 2;
        padding-left: 20px;

        img {
          height: 30px;
        }
      }

      .product-name {
        max-width: 100%;
        height: 100%;
        color: white;
        line-height: calc(var(--header-height) - 14px);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
    }

    > .top {
      grid-area: top;
      background-color: var(--header-bg);
    }

    > .back {
      grid-area: back;
      background-color: var(--header-bg);
      padding-top: 8px;
      padding-right: 10px;
    }

    > .kubectl {
      grid-area: kubectl;
      background-color: var(--header-bg);
      padding-top: 8px;
      padding-right: 10px;

      .btn {
        padding: 0 $input-padding-sm;
      }
    }

    > .back,
    > .import,
    > .kubectl {
      text-align: right;

      .btn {
        text-align: center;
      }
    }

    > .cluster {
      grid-area: cluster;
      background-color: var(--header-bg);
      position: relative;
      padding-left: 10px;
      display: flex;
      align-items: center;
      padding: 0 5px;
    }

    > .user {
      outline: none;

      padding-top: 8px;

      &:focus {
        .v-popover {
          ::v-deep .trigger {
            line-height: 0;
            .user-image {
              max-height: 40px;
            }
            .user-image > * {
              @include form-focus
            }
          }
        }
      }

      grid-area: user;
      background-color: var(--header-bg);

      IMG {
        border: 1px solid var(--header-btn-bg);
      }

      .avatar-round {
        border: 0;
        border-radius: 50%;
      }
    }
  }

  .list-unstyled {
    li {
      a {
        display: flex;
        justify-content: space-between;
        padding: 10px;
      }

      &.user-info {
        display: block;
        margin-bottom: 10px;
        padding: 10px 20px;
        border-bottom: solid 1px var(--border);
        min-width: 200px;
      }
    }
  }

  .popover .popover-inner {
    padding: 0;
    border-radius: 0;
  }

  .user-name {
    color: var(--secondary);
  }

  .user-menu {
    // Remove the default padding on the popup so that the hover on menu items goes full width of the menu
    ::v-deep .popover-inner {
      padding: 10px 0;
    }
  }

  .user-menu-item {
    a {
      cursor: hand;
      padding: 0px 10px;

      &:hover {
        background-color: var(--dropdown-hover-bg);
        color: var(--dropdown-hover-text);
        text-decoration: none;
      }

      // When the menu item is focused, pop the margin and compensate the padding, so that
      // the focus border appears within the menu
      &:focus {
        margin: 0 2px;
        padding: 10px 8px;
      }
    }
  }
</style>