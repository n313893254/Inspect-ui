<script>
import LabeledSelect from '@/components/form/LabeledSelect'
import LabeledInput from '@/components/form/LabeledInput'
import RadioGroup from '@/components/form/RadioGroup'
import { base64Encode } from '@/utils/crypto'

export default {
  props: {
    options: {
      type:    Array,
      default: () => []
    },

    value: {
      type:    Object,
      default: () => {},
    },

    createSecret: {
      type:    Object,
      default: () => {},
    },

    registerBeforeHook: {
      type:    Function,
      default: null,
    },

    model: {
      type:    Object,
      default: () => {},
    },

    auditModel: {
      type:    Object,
      default: () => {},
    },

    mode: {
      type:    String,
      default: 'create',
    },

    haveAccessControl: {
      type:    Boolean,
      default: true,
    },

    tooltip: {
      type:    String,
      default: '',
    },
  },

  components: {
    LabeledSelect,
    LabeledInput,
    RadioGroup,
  },

  data() {
    const { name, password } = this.createSecret || {}

    return {
      reuse:         true,
      name,
      password,
      accessControl: this.value ? true : false,
    }
  },

  methods: {
    async save() {
      const { password, reuse } = this

      if (reuse) {
        return Promise.resolve()
      } else {
        const secret = await this.$store.dispatch('cluster/create', {
          type:     'secret',
          metadata: {
            name:      this.model.metadata.name,
            namespace: this.model?.metadata?.namespace,
          },
          data: {
            password: base64Encode(password),
          },
        })
        const res = await secret.save()

        this.$set(this, 'value', res?.metadata?.name) 
        this.$emit('input', this.value)
        
        return Promise.resolve()
      }
    }
  },

  watch: {
    options(val) {
      if (!this.value && this.accessControl) {
        this.$set(this, 'value', val[0]?.value) 
        this.$emit('input', val[0]?.value)
      }
    },
    'model.metadata.namespace'() {
      if (this.accessControl) {
        this.$set(this, 'value', this.options[0]?.value) 
        this.$emit('input', this.options[0]?.value)
      }
    },
    accessControl(val) {
      if (val && !this.value) {
        this.$set(this, 'value', this.options[0]?.value) 
        this.$emit('input', this.options[0]?.value)
      } else {
        this.$set(this, 'value', '') 
        this.$emit('input', '')
      }
    },
    value(nVal) {
      if (nVal) {
        this.accessControl = true
      } else {
        this.accessControl = false
      }
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.save)
    }
  },

  async fetch() {
    
  },
}
</script>

<template>
  <div>
    <div v-if="haveAccessControl" class="row mt-20">
      <span class="col span-6">
        <RadioGroup
          v-model="accessControl"
          name="accessControl"
          label="访问控制"
          :labels="['启用', '禁用']"
          :options="[true, false]"
          :mode="mode"
        />
      </span>
    </div>
    <div v-if="accessControl || !haveAccessControl" class="row mt-10">
      <div class="col span-6">
        <div v-if="mode !== 'view'" class="clearfix">
          <div class="pull-right text-small">
            <a role="button" class="btn bg-toggle p-0" @click="() => reuse = !reuse">
              {{ reuse ? '自定义' : '选择已有' }}
            </a>
          </div>
        </div>
        <div v-if="reuse === true">
          <LabeledSelect 
            :value="value"
            label="密文"
            :options="options"
            :mode="mode"
            :tooltip="tooltip"
            :hover-tooltip="true"
            @input="(e) => $emit('input', e)"
          />
        </div>
        <div v-else class="row">
          <div class="col span-12">
            <LabeledInput
              v-model="password"
              label="密码值"
              type="password"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .bg-toggle {
    color: var(--link-text);
  }
</style>