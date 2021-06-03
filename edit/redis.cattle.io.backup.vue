<script>
/* eslint-disable vue/no-mutating-props */
import CruBackup from '@/components/CruBackup'
import CreateEditView from '@/mixins/origin-create-edit-view'
import CruResource from '@/components/CruResource'
import { REDIS_TYPES } from '@/config/types'

import { allHash } from '@/utils/promise'
import { STATE } from '@/config/table-headers'

export default {
  components: {
    CruBackup,
    CruResource,
  },

  mixins: [CreateEditView],

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
    if (!this.value?.spec?.cleanRemoteBackup) {
      this.value.spec.cleanRemoteBackup = false
    }

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

    const promise = {
      clusteredRedis: dispatch('cluster/findAll', {
        type: REDIS_TYPES.CLUSTERED_REDIS,
      }),
      redis: dispatch('cluster/findAll', {
        type: REDIS_TYPES.REDIS,
      }),
      secrets: dispatch('cluster/findAll', {
        type: 'secret',
      }),
      versionConfigmap: dispatch('cluster/find', {
        type: 'configmap',
        id:   'cattle-redis/redis-version-options',
      }),
    }

    const hash = await allHash(promise)

    this.versionsMap = JSON.parse(hash.versionConfigmap.data.options)
  },
}
</script>

<template>
  <CruResource 
    :done-route="doneRoute"
    :done-params="doneParams"
    :resource="value" 
    :mode="mode" 
    :errors="errors"
    @finish="save"
  >
    <CruBackup 
      :mode="mode"
      :model="value"
      :value="value"
      :register-before-hook="registerBeforeHook"
    />
  </CruResource>
</template>

<style lang="scss" scoped>
</style>
