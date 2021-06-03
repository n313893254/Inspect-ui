<script>
import { get } from '@/utils/object'

export default {
  props: {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    opts: {
      type:    Object,
      default: null,
    },
    canCopy: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    return { copied: false }
  },

  computed: {
    to() {
      if ( this.row && this.opts?.reference ) {
        return get(this.row, this.opts.reference)
      }

      return this.row?.detailLocation
    },

    href() {
      return this.row?.externalLocation
    },
  },

  methods: {
    clicked($event) {
      $event.stopPropagation()
      $event.preventDefault()

      this.$copyText(this.value).then(() => {
        this.copied = true

        setTimeout(() => {
          this.copied = false
        }, 2000)
      })
    },
  }
}
</script>

<template>
  <span>
    <a v-if="href" :href="href" target="_blank" rel="noopener nofollow">
      {{ value }}
    </a>
    <n-link v-else :to="to">
      {{ value }}
    </n-link>

    <a 
      v-if="canCopy" 
      v-tooltip="{'content': copied ? 'Copied!' : 'Click to Copy', hideOnTargetClick: false}" 
      class="copy-to-cliboard-text plain"
      @click="clicked"
    >
      <i class="icon icon-copy" />
    </a>
  </span>
</template>

<style lang="scss" scoped>
  .copy-to-cliboard-text {
    &:hover {
      cursor: pointer;
    }

    &.plain {
      color: var(--body-text);

      &:hover {
        text-decoration: none;
      }
    }
  }
</style>