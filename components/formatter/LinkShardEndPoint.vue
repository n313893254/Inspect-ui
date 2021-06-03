<script>
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
    }
  },

  data() {
    return { copied: false }
  },

  computed: {
    href() {
      if (this.row.ip && this.row.port) {
        return `https://${this.row.ip}:${this.row.port}`
      } else {
        return null
      }
    },

    url() {
      return `${this.row.ip}:${this.row.port}`
    },
  },

  methods: {
    clicked($event) {
      $event.stopPropagation()
      $event.preventDefault()

      this.$copyText(this.url).then(() => {
        this.copied = true

        setTimeout(() => {
          this.copied = false
        }, 2000)
      })
    },
  },
}
</script>

<template>
  <span>
    <a v-if="href" :href="href" target="_blank" rel="noopener nofollow">
      {{ url }}
    </a>
    <span v-else>
      -
    </span>

    <a 
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
