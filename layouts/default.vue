<script>
import debounce from 'lodash/debounce'

import Header from '@/components/nav/Header'
import Group from '@/components/nav/Group'
import { replaceWith } from '@/utils/array'
import ActionMenu from '@/components/ActionMenu'
import PromptRemove from '@/components/PromptRemove'
import WindowManager from '@/components/nav/WindowManager'
import { findBy } from '@/utils/array'

export default {
  components: {
    Header,
    Group,
    ActionMenu,
    PromptRemove,
    WindowManager,
  },

  data() {
    return { 
      groups: [],
    }
  },

  middleware: ['authenticated'],

  created() {
    this.queueUpdate = debounce(this.getGroups, 500)

    this.getGroups()
  },

  computed: {
    clusterReady() {
      return this.$store.getters[`clusterReady`]
    },

    projectReady() {
      return this.$store.getters[`projectReady`]
    },

    auditEnabled() {
      const apps = this.$store.getters[`project/all`]('app')
      const redisOperator = findBy(apps, 'name', 'redis-operator')

      if (!redisOperator) {
        return false
      }

      const answers = redisOperator.answers || {}
      return answers['global.enableAudit'] === 'true'
    },
  },

  methods: {
    getGroups() {
      const out = [{
        children: [{
          label:        '概览',
          labelDisplay: `<i class="icon icon-fw icon-preview mr-5"></i>概览`,
          name:         'preview',
          weight:       100,
          route:        {
            name: 'c-cluster-inspect-preview',
          },
          enabled: true,
        }].filter(m => m.enabled)
      }]

      replaceWith(this.groups, ...out)
    },
  },

  watch: {
    clusterReady(clusterReady) {
      if (clusterReady) {
        this.getGroups()
      }
    },
    projectReady(projectReady) {
      if (projectReady) {
        this.getGroups()
      }
    },
  },

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

    <nav>
      <template v-for="(g, idx) in groups">
        <Group
          :key="idx"
          :group="g"
        />
      </template>
    </nav>

    <main>
      <nuxt class="outlet" />

      <ActionMenu />
      <PromptRemove />
    </main>

    <div class="wm">
      <WindowManager />
    </div>
  </div>
</template>

<style lang="scss">
  .dashboard-root {
    display: grid;
    height: 100vh;

    grid-template-areas:
      "header  header"
      "nav      main"
      "wm       wm";

    grid-template-columns: var(--nav-width)     auto;
    grid-template-rows:    var(--header-height) auto var(--wm-height, 0px);

    > HEADER {
      grid-area: header;
    }

    NAV {
      grid-area: nav;
      position: relative;
      background-color: var(--nav-bg);
      overflow-y: auto;

      .package.depth-0 {
        &.expanded > .body {
          margin-bottom: 5px;
        }
      }

      .header {
        background: transparent;
        padding-left: 10px;
      }

      H6, .root.child .label {
        margin: 0;
        letter-spacing: 0.1em;
        line-height: initial;

        A { padding-left: 0; }
      }
    }
  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      display: flex;
      flex-direction: column;
      padding: 20px 20px 70px 20px;
      min-height: 100%;
      margin-bottom: calc(-1 * var(--footer-height) - 1px);
    }

    FOOTER {
      background-color: var(--nav-bg);
      height: var(--footer-height);
    }

    HEADER {
      display: grid;
      grid-template-areas:  "type-banner type-banner"
                            "title actions"
                            "state-banner state-banner";
      grid-template-columns: auto min-content;
      margin-bottom: 20px;
      align-items: center;

      H1 {
        grid-area: title;
        margin: 0;
      }

      .type-banner {
        grid-area: type-banner;
      }

      .state-banner {
        grid-area: state-banner;
      }

      .title {
        grid-area: title;
      }

      .actions {
        grid-area: actions;
        text-align: right;
      }

      .actions-container {
        grid-area: actions;
        height: 100%;
        margin-left: 8px;
      }
    }
  }

  .wm {
    grid-area: wm;
    overflow-y: hidden;
  }
</style>