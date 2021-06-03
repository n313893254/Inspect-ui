<script>
import LabeledSelect from '@/components/form/LabeledSelect'
import RadioGroup from '@/components/form/RadioGroup'
import { MACVLAN } from '@/config/types'
import ArrayList from '@/components/form/ArrayList'

export default {
  props: {
    value: {
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
    RadioGroup,
    ArrayList,
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave)
    }
  },

  data() {
    let enabled = this.value.macvlanSubnetName ? true : false
    const ipList = this.value?.ipList || ''

    return {
      enabled,
      macvlanSubnetName: this.value.macvlanSubnetName,
      ips:               ipList.split(','),
      ipRule:            ipList ? 'custom' : 'auto',
    }
  },

  computed: {
    options() {
      const macvlanSubnets = this.$store.getters[`cluster/all`](MACVLAN.SUBNET)

      return macvlanSubnets.map(s => {
        const name = s?.metadata?.name
        return {
          label: `${name} (${s.spec.cidr})`,
          value: name,
        }
      })
    },
  },

  methods: {
    update() {
      const { macvlanSubnetName, enabled, ips=[], ipRule, } = this

      let out = {}

      if (enabled) {
        out = {
          ...this.value,
          macvlanSubnetName,
          ipList: ips.join(',')
        }

        if (ipRule === 'auto') {
          delete out.ipList
        }
      } else {
        out = {}
      }

      this.$emit('input', out)
    },

    willSave() {
      if (this.enabled && this.ipRule === 'custom') {
        const errors = []

        const { ips=[] } = this

        const type = this.model?.type
        let length

        if (type === 'redis.cattle.io.clusteredredis') {
          length = this.model?.spec?.clusteredRedis?.shards * (1 + this.model?.spec?.clusteredRedis?.replicasPerShard)
        } else if (type === 'redis.cattle.io.redis') {
          length = this.model?.spec?.redis?.replicas + this.model?.spec?.sentinel?.replicas
        }

        if (length !== ips.length) {
          errors.push(`扁平网络需要设置${length}个IP`)
        }

        if (errors.length > 0) {
          return Promise.reject(errors)
        }
      }

      return Promise.resolve()
    }
  },

  watch: {
    enabled(val) {
      if (!this.macvlanSubnetName && val) {
        this.$set(this, 'macvlanSubnetName', this.options[0]?.value) 
        this.update()
      }
    },
  },
}
</script>

<template>
  <div @input="update">
    <div class="row">
      <span class="col span-6">
        <RadioGroup
          v-model="enabled"
          name="enabled"
          label="扁平网络"
          :labels="['禁用', '启用']"
          :options="[false, true]"
          :mode="mode"
          @input="update"
        />
      </span>
    </div>
    <div v-if="enabled">
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledSelect 
            v-model="macvlanSubnetName"
            label="Macvlan子网名称"
            :options="options"
            @input="update"
          />
        </div>
      </div>
      <div class="row mt-20">
        <span class="col span-6">
          <RadioGroup
            v-model="ipRule"
            name="ipRule"
            label="IP分配规则"
            :labels="['自动', '指定IP']"
            :options="['auto', 'custom']"
            :mode="mode"
            @input="update"
          />
        </span>
      </div>
      <div 
        v-if="ipRule === 'custom'" 
        class="row mt-20"
      >
        <div class="col span-6">
          <ArrayList
            key="ip"
            v-model="ips"
            :title="t('redis.network.ip.label')"
            :value-placeholder="t('redis.network.ip.placeholder')"
            :add-label="t('redis.network.ip.add')"
            :mode="mode"
            :protip="false"
            @input="update"
          />
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