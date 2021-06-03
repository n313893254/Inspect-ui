<script>
import LabeledInput from '@/components/form/LabeledInput'
import LabeledSelect from '@/components/form/LabeledSelect'
import AuditNameNsDescription from '@/components/form/AuditNameNsDescription'
import MacvlanInput from '@/components/form/MacvlanInput'
import Tabbed from '@/components/Tabbed'
import Tab from '@/components/Tabbed/Tab'
import Loading from '@/components/Loading'
import { allHash } from '@/utils/promise'
import { get, clone, set } from '@/utils/object'
import NodeScheduling from '@/components/form/NodeScheduling'
import KeyValue from '@/components/form/KeyValue'
import ImageInput from '@/components/form/ImageInput'
import SecretInput from '@/components/form/SecretInput'
import Storage from '@/components/form/Storage'
import Backup from '@/components/form/Backup'
import Monitoring from '@/components/form/Monitoring'
import { REDIS_TYPES, MACVLAN, REDIS_AUDIT_TYPES } from '@/config/types'
import { findBy } from '@/utils/array'
import Resource from '@/components/form/Resource'
import { mapGetters } from 'vuex'

export default {
  props: {
    model: {
      type:    Object,
      default: () => {}
    },
    value: {
      type:    Object,
      default: () => {}
    },
    mode: {
      type:    String,
      default: 'create',
    },
    registerBeforeHook: {
      type:    Function,
      default: null,
    },
    nameInputFocus: {
      type:    Boolean,
      default: true,
    },
    namespaced: {
      type:    Boolean,
      default: true,
    },
    redisOptions: {
      type:    Array,
      default: () => [],
    },
  },

  components: {
    LabeledSelect,
    AuditNameNsDescription,
    Tabbed,
    Tab,
    LabeledInput,
    NodeScheduling,
    KeyValue,
    ImageInput,
    SecretInput,
    Loading,
    Storage,
    Backup,
    Monitoring,
    Resource,
    MacvlanInput,
  },

  data() {
    return {
      type:            'redis',
      backupTime:      'noLimit',
      maintenanceTime: 'noLimit',
      backup:          {
        enabled: false,
      },
      versionsMap:    {},
      accessControl:  false,
      secret:         {},
      createSecret:   {
        name:     '',
        password: '',
      },
      scope:      'cluster',
      doneRoute:   'c-cluster-product-resource',
      doneParams: {
        product:  'redis',
        resource: 'redis',
      },
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch

    const req = {
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
      persistentVolumeClaims: dispatch('cluster/findAll', {
        type: 'persistentvolumeclaim',
      }),
      nodes: dispatch('cluster/findAll', {
        type: 'node',
      }),
    }

    if (this.isMacvlan) {
      req.macvlanSubnets = dispatch('cluster/findAll', {
        type: MACVLAN.SUBNET,
      })
    }

    if (this.canRecover) {
      req.backups = dispatch('cluster/findAll', {
        type: 'redis.cattle.io.backup',
      })
    }

    const hash = await allHash(req)
    
    this.versionsMap = JSON.parse(hash.versionConfigmap.data.options)
    this.secrets = hash.secrets
    this.storageclasses = hash.storageclasses

    const { backup } = this.$router.currentRoute.query

    if (backup) {
      this.value.spec.restore.backupSource.name = backup
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave')
  },

  computed: {
    ...mapGetters(['currentUser']),
    header() {
      return `${get(this, 'model.displayType')}: ${get(this, 'model.metadata.name')}`
    },

    redisVersions() {
      return (this.versionsMap?.redis || []).map(v => {

        return {
          label: v,
          value: v,
        }
      })
    },

    exporterVersions() {
      return (this.versionsMap?.exporter || []).map(v => {

        return {
          label: v,
          value: v,
        }
      })
    },

    secretOptions() {
      const namespace = this.value.metadata.namespace

      const out = (this.secrets || []).filter(s => s.metadata.namespace === namespace && s?.data?.password).map(s => {
        return {
          label: s.metadata.name,
          value: s.metadata.name,
        }
      })

      return out
    },

    packageOptions() {
      return [{
        label: 'Small 1C4G',
        value: 'small',
      }, {
        label: 'Medium 2C8G',
        value: 'medium',
      }, {
        label: 'Large 2C16G',
        value: 'large',
      }]
    },

    storageTypeOptions() {
      const out = this.storageclasses.map(s => {
        return {
          label: s.metadata.name,
          value: s.id,
        }
      })

      return out
    },

    storageEnabled() {
      if (this.value.type === REDIS_TYPES.CLUSTERED_REDIS || this.model.type === REDIS_AUDIT_TYPES.CLUSTERED_REDIS) {
        return this.value.spec.clusteredRedis.storage.type === 'persistent-claim'
      } else {
        return this.value.spec.redis.storage.type === 'persistent-claim'
      }
    },

    backupOptions() {
      const backups = this.$store.getters[`cluster/all`]('redis.cattle.io.backup')

      return backups.map(b => {
        return {
          label: b.metadata.name,
          value: b.metadata.name,
        }
      })
    },

    nodes() {
      return this.$store.getters[`cluster/all`]('node')
    },

    isMacvlan() {
      return !!this.$store.getters[`cluster/byId`]('schema', MACVLAN.SUBNET)
    },

    canRecover() {
      return !!this.$store.getters[`cluster/byId`]('schema', 'redis.cattle.io.backup')
    },

    deleteOperationSelected() {
      return this.model.spec.operation === 'DELETE'
    },
  },

  watch: {
    redisVersions(nVal) {
      if (this.value?.spec?.clusteredRedis && !this.value?.spec?.clusteredRedis?.image) {
        this.$nextTick(() => {
          this.$set(this.value?.spec?.clusteredRedis, 'image', nVal[0].value)
        })
      }
    },

    namespaces(val) {
      if (!this.value?.metadata?.namespace) {
        this.$set(this.value?.metadata, 'namespace', (val[0] || {}).value)
      }
    },
  },

  methods: {
    async willSave() {
      
      const { storageEnabled } = this
      
      const errors = []
      
      const type = (this.value.type === REDIS_TYPES.CLUSTERED_REDIS) ? 'ClusteredRedis' : 'redis'
      
      if (storageEnabled) {
        if (!get(this, `value.spec.${type}.storage.size`)) {
          errors.push('存储大小是必填项')
        }
      }

      if (errors.length > 0) {
        return Promise.reject(errors)
      }

      if (storageEnabled) {
        const size = get(this, `value.spec.${type}.storage.size`) || ''

        if (typeof size === 'string' && size.endsWith('Gi')) {
          set(this, `value.spec.${type}.storage.size`, size + 'Gi')
        }
      }

      if (this.value.type === REDIS_TYPES.REDIS) {
        this.value.spec.redis = {
          ...this.value.spec.redis,
          ...clone(this.value.spec.clusteredRedis),
          type: 'redis.cattle.io.redis',
        }
      }

      this.value = await this.$store.dispatch('cluster/create', this.value)

      if (this.value.spec.restore.backupSource.name) {
        const backups = this.$store.getters[`cluster/all`]('redis.cattle.io.backup')
        const backup = findBy(backups, 'metadata.name', this.value.spec.restore.backupSource.name)
        this.value.spec.restore.backupSource.namespace = backup.metadata.namespace
      }

      const annotations = {
        ...(this.value?.metadata?.annotations || {}),
        'cattle.io/creator':            this.currentUser?.id,
        'cattle.io/creatorDisplayName': this.currentUser?.name || this.currentUser?.username || this.currentUser?.id,
      }

      set(this, 'value.metadata.annotations', annotations)

      return Promise.resolve()
    }
  }
}
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <section v-else>
      <AuditNameNsDescription  
        v-model="value" 
        :mode="mode"
        :name-input-focus="nameInputFocus"
        :namespaced="namespaced"
        :model="model"
        :options="redisOptions"
        :description-hidden="deleteOperationSelected"
      />


      <div v-if="!deleteOperationSelected">
        <h3>
          Redis
        </h3>
        <hr class="mb-20">

        <Tabbed 
          :side-tabs="true"
          class="mt-20"
        >
          <Tab 
            label="Redis" 
            name="Redis"
            :weight="100"
          >
            <div class="row mb-10">
              <span class="col span-6">
                <ImageInput 
                  v-model="value.spec.clusteredRedis.image"
                  :options="redisVersions"
                  :mode="mode"
                />
              </span>
            </div>

            <hr>

            <div v-if="value.type === 'redis.cattle.io.clusteredredis'" class="row">
              <span class="col span-6">
                <LabeledInput 
                  v-model.number="value.spec.clusteredRedis.shards"
                  label="分片数量"
                  :mode="mode"
                  required
                />
              </span>
              <span class="col span-6">
                <LabeledInput 
                  v-model.number="value.spec.clusteredRedis.replicasPerShard"
                  label="每个分片的副本数量"
                  :mode="mode"
                  required
                />
              </span>
            </div>
            <div v-else-if="value.type === 'redis.cattle.io.redis'" class="row">
              <span class="col span-6">
                <LabeledInput 
                  v-model.number="value.spec.redis.replicas"
                  label="副本数量"
                  :mode="mode"
                  required
                />
              </span>
            </div>
            <SecretInput
              v-model="value.spec.clusteredRedis.passwordSecret.name"
              label="密文"
              :options="secretOptions"
              :create="createSecret"
              :mode="mode"
              :register-before-hook="registerBeforeHook"
              :model="value"
              tooltip="Secret需包含键password，将密码填入password键对应的值"
              :audit-model="model"
            />
          </Tab>
          <Tab 
            label="资源使用" 
            name="resource"
            :weight="99"
          >
            <Resource 
              v-model="value.spec.clusteredRedis"
              :mode="mode"
              type="redis"
              :model="model"
            />
          </Tab>
          <Tab 
            v-if="isMacvlan" 
            label="网络"
            name="network"
            :weight="98"
          >
            <MacvlanInput 
              v-model="value.spec.network"
              :mode="mode"
              :register-before-hook="registerBeforeHook"
              :model="value"
            />
          </Tab>
          <Tab 
            label="主机调度" 
            name="host"
            :weight="97"
          >
            <NodeScheduling 
              :value="value.spec.clusteredRedis"
              :mode="mode"
              :nodes="nodes"
            />
          </Tab>
          <Tab 
            label="存储" 
            name="pv"
            :weight="96"
          >
            <Storage 
              v-model="value.spec.clusteredRedis"
              :register-before-hook="registerBeforeHook"
              :model="value"
              :mode="mode"
            />
          </Tab>
          <Tab 
            label="监控" 
            name="monitoring"
            :weight="95"
          >
            <Monitoring 
              v-model="value.spec.exporter"
              :versions-map="versionsMap"
              :mode="mode"
            />
          </Tab>
          <Tab 
            label="备份" 
            name="backup"
            :weight="94"
          >
            <Backup 
              v-model="value.spec.periodicBackup"
              :mode="mode"
              :model="value"
              :register-before-hook="registerBeforeHook"
            />
          </Tab>
          <Tab 
            v-if="canRecover" 
            label="恢复"
            name="recover"
            :weight="93"
          >
            <div vclass="row">
              <div class="col span-6">
                <LabeledSelect 
                  v-model="value.spec.restore.backupSource.name"
                  label="备份"
                  :options="backupOptions"
                  :mode="mode"
                />
              </div>
            </div>
          </Tab>
          <Tab 
            label="自定义配置" 
            name="custom"
            :weight="92"
          >
            <KeyValue
              key="answer"
              v-model="value.spec.clusteredRedis.config"
              add-label="添加配置"
              key-label="键"
              value-label="值"
              title="自定义配置"
              :mode="mode"
              :read-allowed="false"
            />
          </Tab>
        </Tabbed>

        <div v-if="value.type === 'redis.cattle.io.redis'">
          <h3 class="mt-20">
            Redis哨兵
          </h3>
          <hr class="mb-20">
      
          <Tabbed 
        
            :side-tabs="true"
            class="mt-20"
          >
            <Tab 
              label="哨兵" 
              name="sentinel"
              :weight="100"
            >
              <div class="row">
                <span class="col span-6">
                  <LabeledInput 
                    v-model.number="value.spec.sentinel.replicas"
                    label="哨兵数量"
                    :mode="mode"
                    required
                  />
                </span>
              </div>
            </Tab>
            <Tab 
              label="资源使用" 
              name="resource"
              :weight="99"
            >
              <Resource 
                v-model="value.spec.sentinel"
                :mode="mode"
                type="sentinel"
                :model="model"
              />
            </Tab>
            <Tab 
              label="主机调度" 
              name="host"
              :weight="98"
            >
              <NodeScheduling 
                :value="value.spec.sentinel"
                :mode="mode"
                :nodes="nodes"
              />
            </Tab>
            <Tab 
              label="自定义配置" 
              name="custom"
              :weight="93"
            >
              <KeyValue
                key="answer"
                v-model="value.spec.sentinel.config"
                add-label="添加配置"
                key-label="键"
                value-label="值"
                title="自定义配置"
                :mode="mode"
                :read-allowed="false"
              />
            </Tab>
          </Tabbed>
        </div>
      </div>
    </section>
  </div>
</template>