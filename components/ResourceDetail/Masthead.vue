<script>
import ButtonGroup from '@/components/ButtonGroup'
import {
  AS, _DETAIL, _CONFIG, _YAML, MODE, _CREATE, _VIEW, _UNFLAG
} from '@/config/query-params'
import BadgeState from '@/components/BadgeState'
import { get } from '@/utils/object'

export default {
  components: {
    ButtonGroup,
    BadgeState,
  },

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {}
      }
    },
    header: {
      type:    String,
      default: '',
    },
    mode: {
      type:    String,
      default: 'view',
    },

    hasDetail: {
      type:    Boolean,
      default: false
    },

    as: {
      type:    String,
      default: _YAML,
    },

    hasMonitoring: {
      type:    Boolean,
      default: false,
    },

    parent: {
      type:    Object,
      default: () => ({}),
    },

    realMode: {
      type:    String,
      default: 'create'
    },

    resourceSubtype: {
      type:    String,
      default: null,
    }
  },
  
  computed: {
    isView() {
      return this.mode === _VIEW
    },

    isCreate() {
      return this.mode === _CREATE
    },

    namespace() {
      if (this.value?.metadata?.namespace) {
        return this.value?.metadata?.namespace
      }

      return null
    },

    viewOptions() {
      const out = []

      if ( this.hasDetail ) {
        out.push({
          labelKey: 'resourceDetail.masthead.detail',
          value:    'detail',
        })
      }

      if ( this.hasEdit ) {
        out.push({
          labelKey: 'resourceDetail.masthead.config',
          value:    'config',
        })
      }

      if (this.hasMonitoring) {
        out.push({
          label: '监控',
          value: 'monitoring',
        })        
      }

      if ( !out.length ) {
        // If there's only YAML, return nothing and the button group will be hidden entirely
        return null
      }

      out.push({
        labelKey: 'resourceDetail.masthead.yaml',
        value:    'yaml',
      })

      return out
    },

    currentView: {
      get() {
        return this.as
      },

      set(val) {
        switch ( val ) {
        case _DETAIL:
          this.$router.push({
            name:   (this.$router.currentRoute.name || '').replace('-yaml', '').replace('-monitoring', ''),
            params: this.$router.currentRoute.params,
          })
          break
        case _CONFIG:
          this.$router.applyQuery({
            [MODE]: _UNFLAG,
            [AS]:   _CONFIG,
          })
          break
        case 'yaml':
          this.$router.push({
            name:   `${this.$router.currentRoute.name.replace('-monitoring', '')}-yaml`,
            params: this.$router.currentRoute.params,
          })
          break
        case 'monitoring':
          this.$router.push({
            name:   `${(this.$router.currentRoute.name || '').replace('-yaml', '')}-monitoring`,
            params: this.$router.currentRoute.params,
          })
          break
        }
      },
    },
  },

  methods: {
    get,
    
    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.value,
        elem:      this.$refs.actions,
      })
    },
  },
}
</script>

<template>
  <div class="masthead">
    <header>
      <div class="title">
        <div class="primaryheader">
          <h1 v-if="header">
            {{ header }}
          </h1>
          <h1 v-else>
            <nuxt-link v-if="parent.location" :to="{name: parent.location}">
              {{ parent.displayName }}:
            </nuxt-link>
            <span v-else>{{ parent.displayName }}:</span>
            <t :k="'resourceDetail.header.' + realMode" :subtype="resourceSubtype" :name="value.nameDisplay" />
            <BadgeState v-if="!isCreate && parent.showState" class="masthead-state" :value="value" />
          </h1>
        </div>
        <div v-if="!isCreate" class="subheader">
          <span v-if="namespace">{{ t("resourceDetail.masthead.namespace") }}: {{ namespace }}</span>
          <span v-if="parent.showAge">{{ t("resourceDetail.masthead.age") }}: <LiveDate class="live-date" :value="get(value, 'metadata.creationTimestamp')" /></span>
        </div>
      </div>
      <slot name="right">
        <div class="actions-container">
          <div class="actions">
            <ButtonGroup
              v-if="showSensitiveToggle"
              :value="!!hideSensitiveData"
              icon-size="lg"
              :options="sensitiveOptions"
              @input="toggleSensitiveData"
            />

            <ButtonGroup
              v-if="viewOptions && isView"
              v-model="currentView"
              :options="viewOptions"
            />

            <button
              v-if="isView"
              ref="actions"
              aria-haspopup="true"
              type="button"
              class="btn btn-sm role-multi-action actions"
              @click="showActions"
            >
              <i class="icon icon-actions" />
            </button>
          </div>
        </div>
      </slot>
    </header>
  </div>
</template>

<style lang='scss'>
  .masthead {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;

    HEADER {
      margin: 0;
      margin-bottom: 0 !important;
    }
  }

  .primaryheader {
    display: flex;
    flex-direction: row;
    align-items: center;

    h1 {
      margin: 0;
    }
  }

  .subheader{
    display: flex;
    flex-direction: row;
    color: var(--input-label);
    & > * {
      margin: 5px 20px 5px 0px;
    }

    .live-date {
      color: var(--body-text)
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    align-items:center;
    & .btn-group {
      margin-right: 10px;
    }
  }

  .state-banner {
    margin: 3px 0 0 0;
  }

  .masthead-state {
    font-size: initial;
    display: inline-block;
    position: relative;
    top: -2px;
  }
</style>