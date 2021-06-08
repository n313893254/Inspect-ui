<script>
import ProgressBarMulti from '@/components/ProgressBarMulti'
import { ucFirst } from '@/utils/string'
import { colorForState, stateSort } from '@/plugins/steve/resource-instance'
import { sortBy } from '@/utils/sort'

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    summary() {
      const map = this.messages.reduce((sum, item) => {
        const { success, severity } = item
        
        if (success) {
          return {
            ...sum,
            success: (sum['success'] || 0) + 1
          }
        } else {
          return {
            ...sum,
            [severity]: (sum[severity] || 0) + 1
          }
        }
      }, {}) || {}

      return map
    },

    messages() {
      const workloadMessages = this.row?.messageResult || []
      const podMessages = this.row?.podResult?.messageResult || []
      const container = this.row?.podResult?.containerResult[0] || {}
      const containerMessage = container?.messageResult || []

      return [
        ...workloadMessages, 
        ...podMessages,
        ...containerMessage,
      ]
    },

    show() {
      return this.stateParts.length > 0
    },

    stateParts() {
      const keys = Object.keys(this.summary)

      const out = keys.map((key) => {
        const textColor = colorForState(key)

        return {
          label:     ucFirst(key),
          color:     textColor.replace(/text-/, 'bg-'),
          textColor,
          value:     this.summary[key],
          sort:      stateSort(textColor, key),
        }
      }).filter(x => x.value > 0)

      return sortBy(out, 'sort:desc')
    },

  },
}
</script>

<template>
  <v-popover
    v-if="show"
    class="text-center hand"
    placement="top"
    :open-group="row.id"
    :trigger="show ? 'click' : 'manual'"
    offset="1"
  >
    <ProgressBarMulti :values="stateParts" class="mb-5" />
    <span v-if="summary.desiredReady === summary.ready">{{ summary.ready }}</span>
    <span v-else>{{ summary.ready }} of {{ summary.desiredReady }}</span>

    <template #popover>
      <table v-if="show" class="fixed">
        <tbody>
          <tr v-for="obj in stateParts" :key="obj.label">
            <td class="text-left pr-20" :class="{[obj.textColor]: true}">
              {{ obj.label }}
            </td>
            <td class="text-right">
              {{ obj.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </v-popover>
  <div v-else class="text-center text-muted">
    &mdash;
  </div>
</template>

<style lang="scss">
  .col-scale {
    position: relative;

    .trigger {
      width: 100%;
    }
  }

  .scale {
    margin: 0;
    padding: 0;
    line-height: initial;
  }
</style>
