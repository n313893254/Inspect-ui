<script>
import Message from '@/components/Polaris/Message'
import { sortBy } from '@/utils/sort'
export default {
  props: {
    row: {
      type:     Object,
      required: true,
    },
    fullColspan: {
      type:     Number,
      required: true,
    },
  },

  components: {
    Message,
  },

  computed: {
    workloadMessage() {
      const out = this.row?.messageResult || []
      return sortBy(out, ['success', 'severity'])
    },

    podMessage() {
      const out = this.row?.podResult?.messageResult || []
      return sortBy(out, ['success', 'severity'])
    },

    containerMessage() {
      const containerAuditData = this.row?.podResult?.containerResult || []
      const out = (containerAuditData[0] || {})?.messageResult || []

      return sortBy(out, ['success', 'severity'])
    },
  },

  methods: {
    iconClass() {
      return (m) => {
        return {
          [`icon-${m.severity}`]: true,
        }
      }
    }
  },
}
</script>

<template>
  <tr>
    <td class="row-expand" align="middle" />
    <td :colspan="fullColspan" class="result-messages">
      <h4>
        Spec: 
        <i v-if="workloadMessage.length === 0">
          no checks applied
        </i>
        <ul v-else class="message-list">
          <li v-for="m in workloadMessage" :key="m.id"> 
            <Message 
              :row="m"
            />
          </li>
        </ul>
      </h4>
      <h4>
        Pod Spec: 
        <i v-if="podMessage.length === 0">
          no checks applied
        </i>
        <ul v-else class="message-list">
          <li v-for="m in podMessage" :key="m.id"> 
            <Message 
              :row="m"
            />
          </li>
        </ul>
      </h4>
      <h4>
        Container agent: 
        <i v-if="containerMessage.length === 0">
          no checks applied
        </i>
        <ul v-else class="message-list">
          <li v-for="m in containerMessage" :key="m.id"> 
            <Message 
              :row="m"
            />
          </li>
        </ul>
      </h4>
    </td>
  </tr>
</template>

<style lang="scss" scoped>
.result-messages {
  color: #6a6a6a;

  h4 {
    color: #6a6a6a;
  }
}

.message-list {
  list-style-type: none;
  font-size: 13px;
  line-height: 20px;
  margin: 5px 10px;
  padding: 0;
  color: #6a6a6a;
}
</style>

