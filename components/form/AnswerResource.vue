<script>
import RadioGroup from '@/components/form/RadioGroup'
import LabeledSelect from '@/components/form/LabeledSelect'
import RedisResourceLimit from '@/components/RedisResourceLimit'
import { cleanUp } from '@/utils/object'

export default {
  props: {
    value: {
      type:    Object,
      default: () => {},
    },
    registerBeforeHook: {
      type:    Function,
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
  },

  components: {
    RadioGroup,
    LabeledSelect,
    RedisResourceLimit,
  },

  data() {
    let customResource = false
    let packageSelect = 'small'

    if (this.mode !== 'create') {
      if (!this.value['resources.requests.cpu'] && !this.value['resources.requests.memory']) {
        if (this.value['resources.limits.cpu'] === '1' && this.value['resources.limits.memory'] === '4Gi') {
          packageSelect = 'small'
        } else if (this.value['resources.limits.cpu'] === '2' && this.value['resources.limits.memory'] === '8Gi') {
          packageSelect = 'medium'
        } else if (this.value['resources.limits.cpu'] === '4' && this.value['resources.limits.memory'] === '8Gi') {
          packageSelect = 'large'
        } else {
          customResource = true
        }
      } else {
        customResource = true
      }
    }

    const answers = this.value || {}
    
    const requestsCpu = answers['resources.requests.cpu']
    const requestsMemory = answers['resources.requests.memory']
    const limitsCpu = answers['resources.limits.cpu']
    const limitsMemory = answers['resources.limits.memory']

    return {
      customResource,
      packageSelect,
      resources:      {
        limits: {
          cpu:    limitsCpu || '100m',
          memory: limitsMemory || '200Mi',
        },
        requests: {
          cpu:    requestsCpu || '50m',
          memory: requestsMemory || '50Mi',
        }
      },
    }
  },

  computed: {
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
      const { customResource, packageSelect, flatResources } = this

      let resources = {}
      if (!customResource) {
        if (packageSelect === 'small') {
          resources = {
            'resources.limits.cpu':    '1',
            'resources.limits.memory': '4Gi',
          }
        } else if (packageSelect === 'medium') {
          resources = {
            'resources.limits.cpu':    '2',
            'resources.limits.memory': '8Gi',
          }          
        } else if (packageSelect === 'large') {
          resources = {
            'resources.limits.cpu':    '4',
            'resources.limits.memory': '8Gi',
          }      
        }

        delete this.value['resources.requests.memory']
        delete this.value['resources.requests.cpu']
      } else {
        resources = {
          'resources.limits.cpu':      flatResources.limitsCpu,
          'resources.limits.memory':   flatResources.limitsMemory,
          'resources.requests.cpu':    flatResources.requestsCpu,
          'resources.requests.memory': flatResources.requestsMemory,
        }
      }

      const out = {
        ...(this.value || {}),
        ...resources,
      }

      this.$emit('input', out)
    }
  }
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
      />
    </div>
  </section>
</template>