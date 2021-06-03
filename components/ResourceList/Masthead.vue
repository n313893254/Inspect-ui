<script>
import ButtonDropdown from '@/components/ButtonDropdown'
import Banner from '@/components/Banner'

export default {
  components: {
    ButtonDropdown,
    Banner,
  },

  props: {
    typeDisplay: {
      type:    String,
      default: ''
    },
    createLocation: {
      type:    Object,
      default: null
    },
    banner: {
      type:    Object,
      default: null,
    },
    createLable: {
      type:    String,
      default: null,
    },
    isCreatable: {
      type:    Boolean,
      default: false
    },
    isYamlCreatable: {
      type:    Boolean,
      default: false,
    },

    yamlCreateLocation: {
      type:    Object,
      default: null,
    },
  },
}
</script>

<template>
  <header>
    <Banner
      v-if="banner"
      :color="banner.color" 
      :label="banner.label" 
      class="type-banner"
    />
    <h1>
      {{ typeDisplay }}
    </h1>
    <div class="actions">
      <ButtonDropdown v-if="isCreatable || isYamlCreatable">
        <template #button-content="slotProps">
          <nuxt-link
            :to="createLocation"
            class="btn bg-transparent"
            :class="slotProps.buttonSize"
          >
            {{ createLable ? createLable : t("resourceList.head.create") }}
          </nuxt-link>
        </template>
        <template
          slot="popover-content"
        >
          <ul class="list-unstyled menu pt-10 pb-10" style="margin: -1px;">
            <li class="hand">
              <nuxt-link
                v-if="isCreatable"
                :to="createLocation"
              >
                {{ createLable ? createLable : t("resourceList.head.create") }}
              </nuxt-link>
            </li>
            <li class="divider">
              <div class="divider-inner" />
            </li>
            <li class="hand">
              <nuxt-link
                v-if="isYamlCreatable"
                :to="yamlCreateLocation"
              >
                {{ t("resourceList.head.createFromYaml") }}
              </nuxt-link>
            </li>
          </ul>
        </template>
      </ButtonDropdown>
    </div>
  </header>
</template>

<style lang="scss" scoped>
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
  }
</style>