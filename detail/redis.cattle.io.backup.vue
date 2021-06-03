<script>
/* eslint-disable vue/no-mutating-props */
import Tab from '@/components/Tabbed/Tab'
import ResourceTabs from '@/components/form/ResourceTabs'
import ResourceList from '@/components/ResourceList'

import { allHash } from '@/utils/promise'
import { findBy } from '@/utils/array'
import { STATE } from '@/config/table-headers'

export default {
  components: {
    ResourceTabs,
    Tab,
    ResourceList,
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

    await allHash({
      backups: dispatch('cluster/findAll', {
        type: 'redis.cattle.io.backup'
      }),
      secrets: dispatch('cluster/findAll', {
        type: 'secret',
      }),
    })
  },

  computed: {
    model() {
      const { namespace, id } = this.$router.currentRoute.params
      const backups = this.$store.getters[`cluster/all`]('redis.cattle.io.backup')
      const model = findBy(backups, 'id', `${namespace}/${id}`)

      return model || {}
    },
  },

  watch: {
    model: async function (nVal=[]) {
      const dispatch = this.$store.dispatch

      const secrets = this.$store.getters[`cluster/all`]('secret') || []
      const { namespace } = this.$router.currentRoute.params
      const storageSecretName = nVal?.spec?.storageSecretName
      const secret = findBy(secrets, 'id', `${namespace}/${storageSecretName}`)

      const backupFiles = nVal?.status?.backupFiles

      const out = backupFiles.map(b => {
        return dispatch('cluster/create', {
          ...b,
          type:         'backupFile',
          metadata: {
            state: {
              name: 'active',
            }
          },
          id:     b.filePath,
          backup: nVal,
          secret,
        })
      })

      const res = await Promise.all(out)

      this.backupFiles = res
    }
  }
}
</script>

<template>
  <ResourceTabs v-model="value" :mode="mode">
    <Tab
      name="backup"
      label="备份文件"
      :weight="2"
    >
      <ResourceList 
        :rows="backupFiles"
        :is-creatable="false"
        :show-groups="false"
        :is-yaml-creatable="false"
        :headers="headers"
        :table-actions="false"
        :search="false"
      />
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
</style>
