<script>
import RadioGroup from '@/components/form/RadioGroup'
import LabeledInput from '@/components/form/LabeledInput'
import ImageInput from '@/components/form/ImageInput'
import Resource from '@/components/form/Resource'
import { cleanUp } from '@/utils/object'

export default {
  props: {
    value: {
      type:     Object,
      default: () => {
        return {}
      }
    },
    versionsMap: {
      type:    Object,
      default: () => {
        return {}
      }
    },
    mode: {
      type:    String,
      default: 'create',
    },
  },

  components: {
    RadioGroup,
    LabeledInput,
    ImageInput,
    Resource,
  },

  data() {
    const { 
      image,
      port,
    } = this.value
    
    let enabled = false

    if (image) {
      enabled = true
    }
    
    return {
      enabled,
      image,
      port,
      resources: {}
    }
  },

  computed: {
    exporterVersions() {
      return (this.versionsMap?.exporter || []).map(v => {

        return {
          label: v,
          value: v,
        }
      })
    },

    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.resources || {}
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

        this.$set(this, 'resources', cleanUp(out))
      }
    },
  },

  methods: {
    update() {
      const { image, port, resources } = this
      const out = {
        ...this.value,
        image,
        port,
        resources,
      }

      this.$emit('input', out)
    },

    disable() {
      this.$emit('input', {})
    }
  },

  watch: {
    enabled(nVal) {
      if (nVal) {
        if (!this.image) {
          this.$nextTick(() => {
            this.$set(this, 'image', (this.exporterVersions || [])[0].value)

            const resources = {
              limitsCpu:      '150m',
              limitsMemory:   '200Mi',
              requestsCpu:    '150m',
              requestsMemory: '200Mi',
            }
            
            this.$set(this, 'flatResources', resources)

            this.update()
          })
        }
      } else {
        this.$nextTick(() => {
          this.disable()
        })
      }
    },
  }
}
</script>

<template>
  <div @input="update">
    <div class="row mb-10">
      <span class="col span-6">
        <RadioGroup
          v-model="enabled"
          label="监控"
          :labels="['启用', '禁用']"
          :options="[true, false]"
          :mode="mode"
          name="monitoringEnable"
        />
      </span>
    </div>
    <div v-if="enabled">
      <div class="row mb-10">
        <span class="col span-6">
          <ImageInput 
            v-model="image"
            :options="exporterVersions"
            :mode="mode"
            @input="update"
          />
        </span>
      </div>

      <hr>

      <div class="row">
        <span class="col span-6">
          <LabeledInput 
            v-model.number="port"
            label="Exprter端口"
            :mode="mode"
          />
        </span>
      </div>
      <hr class="mt-20 mb-20">
      <Resource 
        v-model="resources"
        :mode="mode"
        type="exporter"
      />
    </div>
  </div>
</template>