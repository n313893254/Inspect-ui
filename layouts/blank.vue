<script>
import Header from '@/components/nav/Header'

export default {
  components: {
    Header,
  },

  middleware: ['authenticated'],

  head() {
    return {
      title: this.title,
      meta:  [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        {
          hid:     'description',
          name:    'description',
          content: 'My custom description'
        }
      ]
    }
  },
}
</script>

<template>
  <div class="dashboard-root">
    <Header />

    <main>
      <nuxt class="outlet" />
    </main>
  </div>
</template>

<style lang="scss" scoped>
  .dashboard-root {
    display: grid;
    height: 100vh;

    grid-template-areas:
      "header"
      "main";

    grid-template-columns: auto;
    grid-template-rows:    var(--header-height) auto;

    > HEADER {
      grid-area: header;
    }
  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      padding: 20px 20px 70px 20px;
      min-height: 100%;
      margin-bottom: calc(-1 * var(--footer-height) - 1px);
    }

    FOOTER {
      background-color: var(--nav-bg);
      height: var(--footer-height);
    }
  }
</style>