<script>
import Masthead from './Masthead'
import ResourceTable from '@/components/ResourceTable'
import { AS_YAML, _FLAGGED } from '@/config/query-params'

export default {
  components: {
    Masthead,
    ResourceTable,
  },
  
  props: {
    typeDisplay: {
      type:    String,
      default: '',
    },
    banner: {
      type:    Object,
      default: null,
    },
    createLable: {
      type:    String,
      default: null,
    },
    rows: {
      type:     Array,
      required: true
    },
    headers: {
      type:    Array,
      default: null,
    },
    isCreatable: {
      type:    Boolean,
      default: false,
    },
    rowActions: {
      type:    Boolean,
      default: true,
    },
    showGroups: {
      type:    Boolean,
      default: true,
    },
    isYamlCreatable: {
      type:    Boolean,
      default: true,
    },
    subRows: {
      // If there are sub-rows, your main row must have <tr class="main-row"> to identify it
      type:    Boolean,
      default: false,
    },
    schema: {
      type:    Boolean,
      default: () => {}
    },
    tableActions: {
      // Show bulk table actions
      type:    Boolean,
      default: true
    },

    search: {
      // Show search input to filter rows
      type:    Boolean,
      default: true
    },
  },

  data() {
    const params = { ...this.$route.params }
    const formRoute = { name: `${ this.$route.name }-create`, params }

    const query = { [AS_YAML]: _FLAGGED }

    const yamlRoute = {
      name: `${ this.$route.name }-create-yaml`,
      params,
      query
    }

    return {
      formRoute,
      yamlRoute,
    }
  },

  computed: {
    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema)
    },
  },
}
</script>

<template>
  <div>
    <Masthead 
      :type-display="typeDisplay"
      :create-location="formRoute"
      :banner="banner"
      :create-lable="createLable"
      :is-creatable="isCreatable"
      :is-yaml-creatable="isYamlCreatable"
      :yaml-create-location="yamlRoute"
    />
    <ResourceTable 
      :rows="rows"
      :headers="headers"
      :row-actions="rowActions"
      :show-groups="showGroups"
      :sub-rows="subRows"
      :groupable="showGroups"
      :group-by="groupBy"
      :table-actions="tableActions"
      :search="search"
    />
  </div>
</template>

<style lang="scss" scoped>
  .header {
    position: relative;
  }
  H2 {
    position: relative;
    margin: 0 0 20px 0;
  }
  .right-action {
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>