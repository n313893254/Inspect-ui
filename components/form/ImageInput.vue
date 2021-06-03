<script>
import LabeledSelect from '@/components/form/LabeledSelect'
import LabeledInput from '@/components/form/LabeledInput'

export default {
  props: {
    options: {
      type:    Array,
      default: () => []
    },
    value: {
      type:    [String],
      default: null,
    },
    mode: {
      type:    String,
      default: 'create',
    },
  },

  components: {
    LabeledSelect,
    LabeledInput,
  },

  data() {
    return {
      reuse: true,
    }
  }
}
</script>

<template>
  <div>
    <div v-if="mode !== 'view'">
      <div class="clearfix">
        <div class="pull-right text-small">
          <a role="button" class="btn bg-toggle p-0" @click="() => reuse = !reuse">
            {{ reuse ? '自定义' : '选择已有' }}
          </a>
        </div>
      </div>
      <div v-if="reuse === true">
        <LabeledSelect
          :value="value"
          :options="options"
          label="镜像"
          @input="(e) => $emit('input', e)"
        />
      </div>
      <div v-else>
        <LabeledInput
          :value="value"
          label="镜像"
          @input="(e) => $emit('input', e)"
        />
      </div>
    </div>
    <div v-else>
      <LabeledInput
        :value="value"
        label="镜像"
        :mode="mode"
        @input="(e) => $emit('input', e)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .bg-toggle {
    color: var(--link-text);
  }
</style>