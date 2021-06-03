<script>
/* eslint-disable vue/no-mutating-props */
import Tab from '@/components/Tabbed/Tab'
import ResourceTabs from '@/components/form/ResourceTabs'
import ServiceList from '@/components/ServiceList'
import ShardList from '@/components/ShardList'
import NodeList from '@/components/NodeList'

import { allHash } from '@/utils/promise'
import { findBy } from '@/utils/array'
import { STATE } from '@/config/table-headers'

export default {
  components: {
    ResourceTabs,
    Tab,
    ServiceList,
    ShardList,
    NodeList,
  },

  props: {
    mode: {
      default: 'create',
      type:    String,
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  data() {
    const headers = [
      STATE,
      {
        label:  "备份文件夹",
        name:   'folder',
      },
      {
        label:  "备份文件",
        name:   'file',
      },
    ]

    return {
      headers,
      backupFiles: [],
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch

    const hash = await allHash({
      versionConfigmap: dispatch('cluster/find', {
        type: 'configmap',
        id:   'cattle-redis/redis-version-options',
      }),
      secrets: dispatch('cluster/findAll', {
        type: 'secret',
      }),
      storageclasses: dispatch('cluster/findAll', {
        type: 'storage.k8s.io.storageclass',
      }),
      clusteredRedis: dispatch('cluster/findAll', {
        type: 'redis.cattle.io.clusteredredis'
      }),
    })

    this.versionsMap = JSON.parse(hash.versionConfigmap.data.options)
    this.secrets = hash.secrets
    this.storageclasses = hash.storageclasses

    const namespaces = this.$store.getters[`cluster/all`]('namespace')

    if (!this.value.metadata.namespace) {
      this.value.metadata.namespace = (namespaces[0] || {}).id
    }
  },

  computed: {
    model() {
      const { namespace, id } = this.$router.currentRoute.params
      const clusteredRedis = this.$store.getters[`cluster/all`]('redis.cattle.io.clusteredredis')
      const model = findBy(clusteredRedis, 'id', `${namespace}/${id}`)

      return model || {}
    },

    shards() {
      return this.model.status?.nodes || []
    },
  },
}
</script>

<template>
  <ResourceTabs v-model="value" :mode="mode">
    <Tab
      name="service"
      label="服务发现"
      :weight="99"
    >
      <ServiceList 
        :model="model"
      />
    </Tab>
    <Tab
      name="shard"
      label="分片"
      :weight="98"
    >
      <ShardList 
        :rows="shards"
        :model="model" 
      />
    </Tab>
    <Tab
      name="node"
      label="节点"
      :weight="97"
    >
      <NodeList 
        :rows="shards"
        :model="model" 
      />
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
</style>
