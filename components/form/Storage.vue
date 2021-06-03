<script>
import LabeledSelect from '@/components/form/LabeledSelect'
import RadioGroup from '@/components/form/RadioGroup'
import UnitInput from '@/components/form/UnitInput'
import LabeledInput from '@/components/form/LabeledInput'
import { removeObject, addObject } from '@/utils/array'
import Checkbox from '@/components/form/Checkbox'
import { isEmpty } from '@/utils/object'

export default {
  props: {
    value: {
      type:     Object,
      default: () => {
        return {}
      }
    },

    model: {
      type:     Object,
      default: () => {
        return {}
      }
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  components: {
    LabeledSelect,
    UnitInput,
    RadioGroup,
    LabeledInput,
    Checkbox,
  },

  data() {
    const { 
      size = 1,
      storage,
      emptyDir,
      persistentVolumeClaim = {},
      existedPersistentVolumeClaims = [],
    } = this.value?.storage || {}

    let type = 'none'

    if (!isEmpty(persistentVolumeClaim)) {
      type = 'createPVC'

      if (!persistentVolumeClaim?.spec?.accessModes) {
        this.$set(persistentVolumeClaim.spec, 'accessModes', [])
      }
    } else if (emptyDir) {
      type = 'emptyDir'
    }

    if (existedPersistentVolumeClaims?.length > 0) {
      type = 'usePVC'
    } 
    
    return {
      type,
      storageClass: storage,
      size,
      emptyDir:     type === 'emptyDir' ? emptyDir : {
        medium: 'none',
      },
      persistentVolumeClaim: type === 'createPVC' ? persistentVolumeClaim : {
        metadata: {
          name: 'redis-data',
        },
        spec: {
          storageClassName: '',
          resources:        {
            requests: {
              storage: '1Gi',
            }
          },
          accessModes: [],
        }
      },
      existedPersistentVolumeClaims: type === 'usePVC' ? existedPersistentVolumeClaims : [],
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave)
    }
  },

  computed: {
    storageClasses() {
      return this.$store.getters[`cluster/all`]('storage.k8s.io.storageclass')
    },

    storageTypeOptions() {
      const out = this.storageClasses.map(s => {
        return {
          label: s.metadata.name,
          value: s.id,
        }
      })

      return out || []
    },

    typeOptions() {
      return [{
        label:   'None',
        value:   'none',
        enabled: true,
      }, {
        label:   'EmptyDir',
        value:   'emptyDir',
        enabled: true,
      }, {
        label:   '新增PVC',
        value:   'createPVC',
        enabled: this.storageTypeOptions.length > 0,
        // enabled: false,
      }, {
        label:   '已存在PVC',
        value:   'usePVC',
        enabled: true,
      }].filter(o => o.enabled)
    },

    persistentVolumeClaims() {
      return this.$store.getters[`cluster/all`]('persistentvolumeclaim')
    },

    persistentVolumeClaimOptions() {
      const out = this.persistentVolumeClaims.filter(p => p.metadata?.namespace === this.model?.metadata?.namespace).map(s => {
        return {
          label: s.metadata.name,
          value: s.metadata.name,
        }
      })

      return out || []      
    }
  },

  watch: {
    storageTypeOptions: {	
      handler(nVal) {	
        if (!this.persistentVolumeClaim?.spec?.storageClassName) {	
          this.$nextTick(() => {	
            this.$set(this.persistentVolumeClaim.spec, 'storageClassName', (nVal[0] || {}).value)	
          })	
        }	
      },	
      immediate: true,	
    },	
  },

  methods: {
    update() {
      if (this.type === 'none') {
        const out = {
          ...this.value,
          storage: {},
        }

        this.$emit('input', out)
        
        return
      }

      const out = {
        ...this.value,
        storage: {
          emptyDir: this.type === 'emptyDir' ? {
            medium:    this.emptyDir.medium === 'none' ? '' : this.emptyDir.medium,
            sizeLimit: this.emptyDir.sizeLimit,
          } : {},
          persistentVolumeClaim:         this.type === 'createPVC' ? this.persistentVolumeClaim : {},
          existedPersistentVolumeClaims: this.type === 'usePVC' ? this.existedPersistentVolumeClaims : [],
        }
      }

      this.$emit('input', out)
    },

    updateMode(mode, enabled) {
      if (enabled) {
        addObject(this.persistentVolumeClaim.spec.accessModes, mode)
      } else {
        removeObject(this.persistentVolumeClaim.spec.accessModes, mode)
      }
    },

    async willSave() {
      if (this.type === 'usePVC') {
        const length = this.model?.spec?.clusteredRedis?.shards 
        if (this.model.type === 'redis.cattle.io.clusteredredis' && length !== this.model?.spec?.clusteredRedis?.storage?.existedPersistentVolumeClaims?.length) {
          return Promise.reject(`当前Redis副本数为${length}，需要为其配置相同数量的PVC`)
        }

        if (this.model.type === 'redis.cattle.io.redis' && this.model?.spec?.clusteredRedis?.storage?.existedPersistentVolumeClaims?.length === 0) {
          return Promise.reject(`PVC为必填项`)
        }
        
        if (this.model?.spec?.clusteredRedis?.storage?.emptyDir) {
          delete this.model.spec.clusteredRedis.storage.emptyDir
        }
        if (this.model?.spec?.clusteredRedis?.storage?.persistentVolumeClaim) {
          delete this.model.spec.clusteredRedis.storage.persistentVolumeClaim
        }
      } else if (this.type === 'emptyDir') {
        if (this.model?.spec?.clusteredRedis?.storage?.persistentVolumeClaim) {
          delete this.model.spec.clusteredRedis.storage.persistentVolumeClaim
        }
        if (this.model?.spec?.clusteredRedis?.storage?.existedPersistentVolumeClaims) {
          delete this.model.spec.clusteredRedis.storage.existedPersistentVolumeClaims
        }
      } else if (this.type === 'createPVC') {
        if (this.model?.spec?.clusteredRedis?.storage?.emptyDir) {
          delete this.model.spec.clusteredRedis.storage.emptyDir
        }
        if (this.model?.spec?.clusteredRedis?.storage?.existedPersistentVolumeClaims) {
          delete this.model.spec.clusteredRedis.storage.existedPersistentVolumeClaims
        }
      } else {
        return Promise.resolve()
      }
    }
  },
}
</script>

<template>
  <div @input="update">
    <div class="row mb-10">
      <span class="col span-6">
        <LabeledSelect
          v-model="type"
          label="存储"
          :options="typeOptions"
          :mode="mode"
          @input="update"
        />
      </span>
    </div>
    <div v-if="type === 'emptyDir'" class="row mt-10">
      <div class="col span-6">
        <RadioGroup
          v-model="emptyDir.medium"
          label="存储介质"
          :options="[{
            label: '主机的默认存储',
            value: 'none',
          }, {
            label: '内存',
            value: 'Memory',
          }]"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput 
          v-model="emptyDir.sizeLimit"
          label="大小限制"
          :mode="mode"
          placeholder="例如: 300Mi"
        />
      </div>
    </div>
    <div v-else-if="type === 'createPVC'" class="mt-10">
      <div class="row">
        <span class="col span-6">
          <LabeledSelect
            v-model="persistentVolumeClaim.spec.storageClassName"
            label="存储类型"
            :options="storageTypeOptions"
            :mode="mode"
            @input="update"
          />
        </span>
        <span class="col span-6">
          <UnitInput
            v-model="persistentVolumeClaim.spec.resources.requests.storage"
            suffix="GiB"
            label="存储大小"
            :required="true"
            :mode="mode"
          />
        </span>
      </div>
      <div class="row mt-10">
        <div class="col span-6">
          <t class="text-label" k="persistentVolumeClaim.accessModes" />
          <div class="access-modes">
            <Checkbox 
              :mode="mode" 
              :value="persistentVolumeClaim.spec.accessModes.includes('ReadWriteOnce')" 
              label="单主机读写" 
              @input="e=>updateMode('ReadWriteOnce', e)" 
            />
            <Checkbox 
              :mode="mode" 
              :value="persistentVolumeClaim.spec.accessModes.includes('ReadOnlyMany')" 
              label="多主机只读" 
              @input="e=>updateMode('ReadOnlyMany', e)" 
            />
            <Checkbox 
              :mode="mode" 
              :value="persistentVolumeClaim.spec.accessModes.includes('ReadWriteMany')" 
              label="多主机读写" 
              @input="e=>updateMode('ReadWriteMany', e)" 
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="type === 'usePVC'" class="mt-10">
      <div class="row">
        <span class="col span-6">
          <LabeledSelect
            v-model="existedPersistentVolumeClaims"
            label="PVC"
            :options="persistentVolumeClaimOptions"
            :mode="mode"
            :multiple="true"
            @input="update"
          />
        </span>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
  .access-modes {
    display: flex;
    flex-direction: row;
  }
</style>