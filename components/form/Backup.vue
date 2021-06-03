<script>
import Checkbox from '@/components/form/Checkbox'
import LabeledInput from '@/components/form/LabeledInput'
import RadioGroup from '@/components/form/RadioGroup'
import BackupSecretInput from '@/components/form/BackupSecretInput'

export default {
  props: {
    value: {
      type:    Object,
      default: () => {}
    },
    mode: {
      type:    String,
      default: 'create',
    },
    model: {
      type:    Object,
      default: () => {}
    },
    registerBeforeHook: {
      type:    Function,
      default: null,
    },
  },

  components: {
    Checkbox,
    LabeledInput,
    RadioGroup,
    BackupSecretInput,
  },

  data() {
    let enabled = false

    if (this.value?.s3?.endpoint) {
      enabled = true
    }

    return {
      enabled,
      storageType:       'local',
      s3:                this.value?.s3 || {},
      reuse:             true,
      secretName:        '',
      accessKey:         '',
      secretKey:         '',
      storageSecretName: this.value?.storageSecretName || '',
      schedule:          this.value?.schedule || '',
      cleanRemoteBackup: this.value?.cleanRemoteBackup || false,
      backupLimit:       this.value?.backupLimit || 5,
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave)
    }
  },

  computed: {
    secretOptions() {
      const namespace = this.model.metadata.namespace
      const secrets = this.$store.getters[`cluster/all`]('secret')

      const out = secrets.filter(s => s.metadata.namespace === namespace && (s?.data || {})['AWS_ACCESS_KEY_ID'] && (s?.data || {})['AWS_SECRET_ACCESS_KEY']).map(s => {
        return {
          label: s.metadata.name,
          value: s.metadata.name,
        }
      })

      return out
    },
  },

  methods: {
    update() {
      const { schedule, storageSecretName, s3, enabled, cleanRemoteBackup, backupLimit } = this

      let out

      if (enabled) {
        out = {
          ...this.value,
          schedule,
          storageSecretName,
          s3,
          cleanRemoteBackup,
          backupLimit,
        }
      } else {
        out = {}
      }

      this.$emit('input', out)
    },

    async willSave() {
      const errors = []

      const { schedule, s3={}, enabled } = this
      if (enabled) {
        if (!schedule) {
          errors.push(`"${this.t('workload.cronSchedule')}"是必填项`)
        }
        if (!s3.endpoint) {
          errors.push('"S3 访问地址"是必填项')
        }
        if (!s3.bucket) {
          errors.push('"S3 Bucket"是必填项')
        }
      }

      if (errors.length > 0) {
        return Promise.reject(errors)
      }

      return Promise.resolve()
    },
  },
}
</script>

<template>
  <div @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <Checkbox 
          v-model="enabled" 
          label="定期备份"
          :labels="['启用', '禁用']"
          :mode="mode"
          @input="update"
        />
      </div>
    </div>
    <section v-if="enabled">
      <div class="row mb-20">
        <span class="col span-6">
          <LabeledInput
            v-model="schedule"
            type="cron"
            required
            :mode="mode"
            :label="t('workload.cronSchedule')"
            placeholder="0 * * * *"
          />
        </span>
      </div>
      <div class="row mb-10">
        <span class="col span-6">
          <LabeledInput 
            v-model="s3.endpoint"
            label="S3 访问地址"
            :mode="mode"
            required
          />
        </span>
        <span class="col span-6">
          <LabeledInput 
            v-model="s3.region"
            label="S3 Region"
            :mode="mode"
          />
        </span>
      </div>
      <div class="row mb-10">
        <span class="col span-6">
          <LabeledInput 
            v-model="s3.bucket"
            label="S3 Bucket"
            :mode="mode"
            required
          />
        </span>
        <span class="col span-6">
          <LabeledInput 
            v-model="s3.prefix"
            label="S3 文件夹"
            :mode="mode"
          />
        </span>
      </div>
      <BackupSecretInput
        v-model="storageSecretName"
        label="密文"
        :options="secretOptions"
        :mode="mode"
        :register-before-hook="registerBeforeHook"
        :have-access-control="false"
        :model="model"
        @input="update"
      />

      <div class="row mt-15">
        <div class="col span-6">
          <RadioGroup
            v-model="cleanRemoteBackup"
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
            @input="update"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model.number="backupLimit"
            label="最大备份数限制"
            type="number"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
  .bg-toggle {
    color: var(--link-text);
  }
</style>