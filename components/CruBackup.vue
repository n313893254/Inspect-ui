<script>
import AuditNameNsDescription from '@/components/form/AuditNameNsDescription'
import LabeledSelect from '@/components/form/LabeledSelect'
import LabeledInput from '@/components/form/LabeledInput'
import RadioGroup from '@/components/form/RadioGroup'
import Loading from '@/components/Loading'
import { REDIS_TYPES } from '@/config/types'
import { allHash } from '@/utils/promise'
import Tabbed from '@/components/Tabbed'
import Tab from '@/components/Tabbed/Tab'
import BackupSecretInput from '@/components/form/BackupSecretInput'
import ImageInput from '@/components/form/ImageInput'
import NodeScheduling from '@/components/form/NodeScheduling'
import Resource from '@/components/form/Resource'
import { cleanUp } from '@/utils/object'

export default {
  components: {
    AuditNameNsDescription,
    Loading,
    LabeledSelect,
    RadioGroup,
    Tabbed,
    Tab,
    LabeledInput,
    BackupSecretInput,
    ImageInput,
    NodeScheduling,
    Resource,
  },

  props: {
    model: {
      type:    Object,
      default: () => {}
    },

    mode: {
      type:    String,
      default: 'create',
    },

    value: {
      type:    Object,
      default: () => {}
    },

    registerBeforeHook: {
      type:    Function,
      default: () => {},
    },

    nameInputFocus: {
      type:    Boolean,
      default: true,
    },

    namespaced: {
      type:    Boolean,
      default: true,
    },

    backupOptions: {
      type:    Array,
      default: () => [],
    },
  },

  data() {
    return {
      scope:       'cluster',
      versionsMap: {},
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
      nodes: dispatch('cluster/findAll', {
        type: 'node',
      }),
    }

    const hash = await allHash(promise)

    this.versionsMap = JSON.parse(hash.versionConfigmap.data.options)
  },

  computed: {
    redisOptions() {
      const clusteredRedis = this.$store.getters[`cluster/all`](REDIS_TYPES.CLUSTERED_REDIS)
      const redis = this.$store.getters[`cluster/all`](REDIS_TYPES.REDIS)

      const out = this.value?.spec?.redisKind === 'ClusteredRedis' ? clusteredRedis : redis
      return out.filter(o => o?.metadata?.namespace === this.value?.metadata?.namespace).map(o => ({
        label: o.metadata.name,
        value: o.metadata.name,
      }))
    },

    secretOptions() {
      const namespace = this.value.metadata.namespace
      const secrets = this.$store.getters[`cluster/all`]('secret') || []

      const out = secrets.filter(s => {
        const data = namespace && s?.data || {}
        return s.metadata.namespace === this.value.metadata.namespace && data['AWS_ACCESS_KEY_ID'] && data['AWS_SECRET_ACCESS_KEY']
      }).map(s => {
        return {
          label: s.metadata.name,
          value: s.metadata.name,
        }
      })

      return out
    },

    versions() {
      return (this.versionsMap?.backup || []).map(v => {

        return {
          label: v,
          value: v,
        }
      })
    },

    nodes() {
      return this.$store.getters[`cluster/all`]('node')
    },

    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.value.spec.clusteredRedis.resources || {}
        const { cpu:limitsCpu, memory:limitsMemory } = limits
        const { cpu:requestsCpu, memory:requestsMemory } = requests

        return {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory
        }
      },
      set(neu) {
        const {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory
        } = neu

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory
          },
          limits: {
            cpu:    limitsCpu,
            memory: limitsMemory
          }
        }

        this.$set(this.value.spec.clusteredRedis, 'resources', cleanUp(out))
      }
    },

    deleteOperationSelected() {
      return this.model.spec.operation === 'DELETE'
    },
  },

  watch: {
    'value.spec.redisKind': {
      handler: function () {
        if (this.mode === 'create') {
          this.$nextTick(() => {
            this.$set(this.value?.spec, 'redisName', this.redisOptions[0]?.value)
          })
        }
      },
      immediate: true,
    },

    versions(nVal) {
      if (!this.value?.spec?.backupJob?.image && this.value?.spec?.backupJob) {
        this.$nextTick(() => {
          this.$set(this.value?.spec?.backupJob, 'image', nVal[0].value)
        })
      }
    },

    'value.metadata.namespace'() {
      if (this.mode === 'create') {
        this.$nextTick(() => {
          this.$set(this.value?.spec, 'redisName', (this.redisOptions || [])[0]?.value)
        })
      }
    },
  },
}
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else>
    <AuditNameNsDescription  
      v-model="value" 
      :mode="mode"
      :name-input-focus="nameInputFocus"
      :namespaced="namespaced"
      :model="model"
      :options="backupOptions"
      :description-hidden="deleteOperationSelected"
    />

    <hr class="mb-20">

    <div v-if="!deleteOperationSelected">
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            v-model="value.spec.redisKind"
            name="type"
            label="类型"
            :options="[{
              label: '哨兵Redis',
              value: 'Redis',
            }, {
              label: '集群Redis',
              value: 'ClusteredRedis',
            }]"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect 
            v-model="value.spec.redisName"
            label="Redis"
            :options="redisOptions"
            :mode="mode"
            required
          />
        </div>
      </div>

      <h3 class="mt-20">
        Backup Job
      </h3>
      <hr class="mb-20">

      <Tabbed 
        :side-tabs="true"
        class="mt-20"
      >
        <Tab 
          label="存储" 
          name="sentinel"
          :weight="100"
        >
          <div class="row mb-10">
            <span class="col span-6">
              <LabeledInput 
                v-model="value.spec.s3.endpoint"
                label="S3 访问地址"
                :mode="mode"
                :required="true"
              />
            </span>
            <span class="col span-6">
              <LabeledInput 
                v-model="value.spec.s3.region"
                label="S3 Region"
                :mode="mode"
              />
            </span>
          </div>
          <div class="row mb-10">
            <span class="col span-6">
              <LabeledInput 
                v-model="value.spec.s3.bucket"
                label="S3 Bucket"
                :mode="mode"
                :required="true"
              />
            </span>
            <span class="col span-6">
              <LabeledInput 
                v-model="value.spec.s3.prefix"
                label="S3 文件夹"
                :mode="mode"
              />
            </span>
          </div>
          <BackupSecretInput
            v-model="value.spec.storageSecretName"
            label="密文"
            :options="secretOptions"
            :mode="mode"
            :register-before-hook="registerBeforeHook"
            :have-access-control="false"
            :model="value"
          />

          <div class="row mt-10">
            <div class="col span-6">
              <RadioGroup
                v-model="value.spec.cleanRemoteBackup"
                name="type"
                label="删除备份的同时删除远端备份文件"
                :options="[{
                  label: '否',
                  value: false,
                }, {
                  label: '是',
                  value: true,
                }]"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>
        <Tab 
          label="Job" 
          name="job"
          :weight="99"
        >
          <div class="row mb-10">
            <span class="col span-6">
              <ImageInput 
                v-model="value.spec.backupJob.image"
                :options="versions"
                :mode="mode"
              />
            </span>
          </div>
        </Tab>
        <Tab 
          label="资源使用" 
          name="resource"
          :weight="98"
        >
          <Resource 
            v-model="value.spec.backupJob"
            :mode="mode"
            type="backup"
          />
        </Tab>
        <Tab 
          label="主机调度" 
          name="host"
          :weight="97"
        >
          <NodeScheduling 
            :value="value.spec.backupJob"
            :mode="mode"
            :nodes="nodes"
          />
        </Tab>
      </Tabbed>
    </div>
  </section>
</template>