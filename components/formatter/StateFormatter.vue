<script>
import BadgeState from '@/components/BadgeState'
import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance'
export default {
  components: { BadgeState },
  props:      {
    value: {
      type:     String,
      default: ''
    },
  },

  data() {
    const out = {}

    const color = colorForState(this.value)

    out.stateDisplay = stateDisplay(this.value)
    out.stateBackground = color.replace('text-', 'bg-')

    return out
  }
}
</script>

<template>
  <div>
    <BadgeState :color="stateBackground" :label="stateDisplay" />
  </div>
</template>
