<script>
import LabeledSelect from '@/components/form/LabeledSelect'
import LabeledInput from '@/components/form/LabeledInput'
import { base64Encode } from '@/utils/crypto'
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow'

export default {
  props: {
    options: {
      type:    Array,
      default: () => []
    },

    value: {
      type:    String,
      default: '',
    },

    registerBeforeHook: {
      type:    Function,
      default: null,
    },

    model: {
      type:    Object,
      default: () => {},
    },

    mode: {
      type:    String,
      default: 'create',
    },

    tooltip: {
      type:    String,
      default: '',
    },
  },

  components: {
    LabeledSelect,
    LabeledInput,
    TextAreaAutoGrow,
  },

  data() {
    const storageSecretName = this.value || ''

    return {
      reuse:             true,
      ca:                '',
      accessKey:         '',
      secretKey:         '',
      secretName:        '',
      storageSecretName,
    }
  },

  methods: {
    update() {
      this.$emit('input', this.storageSecretName)
    },

    async save() {
      await this.willSave()
      const { secretName, accessKey, reuse, secretKey, ca } = this

      if (reuse) {
        return Promise.resolve()
      } else {
        const secret = await this.$store.dispatch('cluster/create', {
          type:     'secret',
          metadata: {
            name:      secretName,
            namespace: this.model?.metadata?.namespace,
          },
          data: {
            'AWS_ACCESS_KEY_ID':     base64Encode(accessKey),
            'AWS_SECRET_ACCESS_KEY': base64Encode(secretKey),
            'CA_CERT_DATA':          base64Encode(ca),
          },
        })
        const res = await secret.save()
        this.$set(this, 'storageSecretName', res?.metadata?.name) 
        this.reuse = true

        this.update()

        return Promise.resolve()
      }
    },

    willSave() {
      const errors = []

      const { accessKey, reuse, secretKey, secretName, storageSecretName } = this
      if (!reuse) {
        if (!secretName) {
          errors.push(`"密文名称"是必填项`)
        }
        if (!accessKey) {
          errors.push('"Access Key"是必填项')
        }
        if (!secretKey) {
          errors.push('"Secret Key"是必填项')
        }
      } else {
        if (!storageSecretName) {
          errors.push('"密文"是必填项')
        }
      }

      if (errors.length > 0) {
        return Promise.reject(errors)
      }
    }
  },

  watch: {
    options(val) {
      if (!this.value) {
        this.$set(this, 'storageSecretName', val[0]?.value) 
        this.update()
      }
    },

    'model.metadata.namespace': {
      handler: function () {
        if (this.mode === 'create') {
          this.$nextTick(() => {
            this.$set(this, 'storageSecretName', this.options[0]?.value) 
            this.update()
          })
        }
      },
      immediate: true,
    },

    value(nVal) {
      this.storageSecretName = nVal
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.save)
    }
  },
}
</script>

<template>
  <div v-if="reuse === true" class="row mt-10">
    <div class="col span-6">
      <div v-if="mode !== 'view'" class="clearfix">
        <div class="pull-right text-small">
          <a role="button" class="btn bg-toggle p-0" @click="() => reuse = !reuse">
            {{ reuse ? '自定义' : '选择已有' }}
          </a>
        </div>
      </div>
      <div>
        <LabeledSelect 
          v-model="storageSecretName"
          label="密文"
          :options="options"
          :mode="mode"
          tooltip="需要包含键AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, 如有证书置于键CA_CERT_DATA"
          :hover-tooltip="true"
          required
          @input="update"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <div class="row mt-10">
      <div class="col span-6">
        <div v-if="mode !== 'view'" class="clearfix">
          <div class="pull-right text-small">
            <a role="button" class="btn bg-toggle p-0" @click="() => reuse = !reuse">
              {{ reuse ? '自定义' : '选择已有' }}
            </a>
          </div>
        </div>
        <LabeledInput
          v-model="secretName"
          label="密文名称"
          required
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="accessKey"
          label="Access Key"
          required
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="secretKey"
          label="Secret Key"
          required
          type="password"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-12">
        <label class="text-label mb-10">
          证书
        </label>
        <TextAreaAutoGrow
          v-model="ca"
          label="证书"
          :mode="mode"
          :min-height="54"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .bg-toggle {
    color: var(--link-text);
  }
</style>