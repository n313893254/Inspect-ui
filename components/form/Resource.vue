<script>
import RadioGroup from '@/components/form/RadioGroup'
import LabeledSelect from '@/components/form/LabeledSelect'
import RedisResourceLimit from '@/components/RedisResourceLimit'
import { cleanUp } from '@/utils/object'
import { findBy } from '@/utils/array'

export default {
  props: {
    value: {
      type:    Object,
      default: () => {},
    },

    model: {
      type:    Object,
      default: () => {},
    },

    mode: {
      type:    String,
      default: 'create',
    },

    type: {
      type:    String,
      default: 'operator'
    },
  },

  components: {
    RadioGroup,
    LabeledSelect,
    RedisResourceLimit,
  },

  data() {
    let customResource = false
    let packageSelect

    const configmaps = this.$store.getters[`cluster/all`]('configmap')
    const configMap = findBy(configmaps, 'id', 'cattle-redis/resource-options')
    const resourcesMap = JSON.parse(configMap?.data[this.type] || '{}')
    const resourceOptions = Object.keys(resourcesMap)

    if (this.mode !== 'create') {
      if (!this.value?.resources?.requests?.cpu && !this.value?.resources?.requests?.memory) {
        resourceOptions.map(key => {
          if (this.value?.resources?.limits?.cpu === resourcesMap[key]?.limits?.cpu && this.value?.resources?.limits?.memory === resourcesMap[key]?.limits?.memory) {
            packageSelect = key
          }
        })
      } else {
        customResource = true
      }
    } else {
      packageSelect = resourceOptions[0]
    }

    return {
      customResource,
      packageSelect,
      resources:      {
        limits: {
          cpu:    this.value?.resources?.limits?.cpu || '100m',
          memory: this.value?.resources?.limits?.memory || '200Mi',
        },
        requests: {
          cpu:    this.value?.resources?.requests?.cpu || '50m',
          memory: this.value?.resources?.requests?.memory || '50Mi',
        }
      },
    }
  },

  created() {
    this.update()
  },

  computed: {
    resourcesMap() {
      const configmaps = this.$store.getters[`cluster/all`]('configmap')
      const configMap = findBy(configmaps, 'id', 'cattle-redis/resource-options')
      return JSON.parse(configMap?.data[this.type] || '{}')
    },

    packageOptions() {
      const option = this.resourcesMap

      return Object.keys(option)
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
      const { customResource, packageSelect, resourcesMap } = this

      let resources = this.resources
      if (!customResource) {
        resources = resourcesMap[packageSelect]
      }

      const out = {
        ...this.value,
        resources,
      }

      this.$emit('input', out)
    }
  },

  watch: {
    'value.resources'(resources) {
      if (this.model?.spec?.operation !== 'UPDATE') {
        return
      }
      
      let customResource = false
      let packageSelect

      const configmaps = this.$store.getters[`cluster/all`]('configmap')
      const configMap = findBy(configmaps, 'id', 'cattle-redis/resource-options')
      const resourcesMap = JSON.parse(configMap?.data[this.type] || '{}')
      const resourceOptions = Object.keys(resourcesMap)

      if (this.model?.spec?.operation === 'UPDATE') {
        if (!resources?.requests?.cpu && !resources?.requests?.memory) {
          resourceOptions.map(key => {
            if (resources?.limits?.cpu === resourcesMap[key]?.limits?.cpu && resources?.limits?.memory === resourcesMap[key]?.limits?.memory) {
              packageSelect = key
            }
          })
        } else {
          customResource = true
        }
      } else {
        packageSelect = resourceOptions[0]
      }

      this.customResource = customResource
      this.packageSelect = packageSelect
      this.resources = {
        limits: {
          cpu:    this.value?.resources?.limits?.cpu || '100m',
          memory: this.value?.resources?.limits?.memory || '200Mi',
        },
        requests: {
          cpu:    this.value?.resources?.requests?.cpu || '50m',
          memory: this.value?.resources?.requests?.memory || '50Mi',
        }
      }
    }
  },
}
</script>

<template>
  <section @input="update">
    <div class="row mb-10">
      <span class="col span-6">
        <RadioGroup
          v-model="customResource"
          name="accessControl"
          label="资源选项"
          :labels="['自定义', '套餐']"
          :options="[true, false]"
          :mode="mode"
          @input="update"
        />
      </span>
    </div>
    <div v-if="customResource === false" class="row">
      <div class="col span-6">
        <LabeledSelect 
          v-model="packageSelect"
          label="套餐"
          :options="packageOptions"
          :mode="mode"
          @input="update"
        />
      </div>
    </div>
    <div v-else>
      <RedisResourceLimit 
        v-model="flatResources"
        :show-tip="false"
        :mode="mode"
      />
    </div>
  </section>
</template>