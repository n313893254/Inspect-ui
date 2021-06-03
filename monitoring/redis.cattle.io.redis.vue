<script>
import { allHash } from '@/utils/promise'
import LabeledSelect from '@/components/form/LabeledSelect'
import Chart from '@/components/Chart'
import Loading from '@/components/Loading'
import { REDIS_TYPES } from '@/config/types'
import { uniq } from 'lodash'
import { findBy } from '@/utils/array'
import DatePicker from 'vue2-datepicker'
import 'vue2-datepicker/locale/zh-cn'

const PERIODS = [
  {
    label:    '5分钟',
    value:    '5m',
    step:     10,
  },
  {
    label:    '1小时',
    value:    '1h',
    step:     60,
  },
  {
    label:    '6小时',
    value:    '6h',
    step:     60,
  },
  {
    label:    '1天',
    value:    '24h',
    step:     300,
  },
  {
    label: '自定义',
    value: 'custom',
  },
]

export default {
  components: {
    LabeledSelect,
    Loading,
    Chart,
    DatePicker,
  },

  data() {
    return {
      selectNamespace:         '',
      type:                    'ClusteredRedis',
      redisName:               '',
      podName:                 '',
      range:                   '5m',
      redisNetInputBytesTotal: [],
      queryLoading:            false,
      redisUp:                 [],
      timer:                   null,
      datetime:                [this.$moment().subtract(5, 'm').unix() * 1000, this.$moment().unix() * 1000],
    }
  },

  async fetch() {
    const dispatch = this.$store.dispatch
    const { cluster: clusterId } = this.$router.currentRoute.params
    const grafanaUrl = `/k8s/clusters/${clusterId}/api/v1/namespaces/cattle-prometheus/services/http:access-grafana:80/proxy/api/datasources/proxy/1/api/v1/query`

    const hash = await allHash({
      redis: dispatch('cluster/findAll', {
        type: REDIS_TYPES.REDIS,
      }),
      redisUp: this.$axios({
        url:    grafanaUrl,
        params: {
          query: `count(redis_up{redis_name!=""}) by (namespace, redis_name, pod, redis_kind)`,
        },
      }),
    })

    this.redisUp = hash?.redisUp?.data?.data?.result || []

    const { namespace, id } = this.$router.currentRoute.params

    const redis = findBy(hash.redis || [], 'id', `${namespace}/${id}`)
    
    this.model = redis
  },

  computed: {
    namespaces() {
      const namespaces = uniq(this.redisUp.map(r => r?.metric?.namespace))

      return namespaces.map(n => {
        return {
          label: n,
          value: n,
        }
      })
    },

    types() {
      const redisKinds = uniq(this.redisUp.filter(r => r.metric.namespace === this.selectNamespace).map(r => r?.metric?.redis_kind))

      return redisKinds.map(n => {
        return {
          label: n,
          value: n,
        }
      })
    },

    redisOptions() {
      const out = uniq(this.redisUp.filter(r => r.metric.namespace === this.selectNamespace && r.metric.redis_kind === this.type).map(r => r?.metric?.redis_name))

      return out.map(n => {
        return {
          label: n,
          value: n,
        }
      })
    },

    selectedRedis() {
      return (this.redisOptions || []).find(r => r.value === this.redisName) || {}
    },

    podOptions() {
      const out = uniq(this.redisUp.filter(r => r.metric?.redis_name === this.model?.metadata?.name).map(r => r?.metric?.pod))

      return [{
        label: '全部',
        value: '.*',
      }, ...out.map(n => {
        return {
          label: n,
          value: n,
        }
      })]
    },

    rangeOptions() {
      return PERIODS
    },

    clusteredRedisCount() {
      return this.$store.getters[`cluster/all`](REDIS_TYPES.CLUSTERED_REDIS)?.length || 0
    },

    sentinelRedisCount() {
      return this.$store.getters[`cluster/all`](REDIS_TYPES.REDIS)?.length || 0
    },

    redisCount() {
      return this.clusteredRedisCount + this.sentinelRedisCount
    },

    redis() {
      const clusteredRedis = this.$store.getters[`cluster/all`](REDIS_TYPES.CLUSTERED_REDIS) || []
      const sentinelRedis = this.$store.getters[`cluster/all`](REDIS_TYPES.REDIS) || []
      return [...clusteredRedis, ...sentinelRedis]
    },

    redisStateData() {
      const map = this.redis.reduce((sum, item) => {
        const state = item?.metadata?.state?.name

        return {
          ...sum,
          [state]: (sum[state] || 0) + 1
        }
      }, {}) || {}

      return Object.keys(map).map(key => {
        return {
          name:  key,
          value: map[key],
        }
      })
    },

    clusteredRedisStateData() {
      const clusteredRedis = this.$store.getters[`cluster/all`](REDIS_TYPES.CLUSTERED_REDIS) || []

      const map = clusteredRedis.reduce((sum, item) => {
        const state = item?.metadata?.state?.name

        return {
          ...sum,
          [state]: (sum[state] || 0) + 1
        }
      }, {}) || {}

      return Object.keys(map).map(key => {
        return {
          name:  key,
          value: map[key],
        }
      })
    },

    sentinelRedisStateData() {
      const sentinelRedis = this.$store.getters[`cluster/all`](REDIS_TYPES.REDIS) || []

      const map = sentinelRedis.reduce((sum, item) => {
        const state = item?.metadata?.state?.name

        return {
          ...sum,
          [state]: (sum[state] || 0) + 1
        }
      }, {}) || {}

      return Object.keys(map).map(key => {
        return {
          name:  key,
          value: map[key],
        }
      })
    },
  },

  watch: {
    types(nVal) {
      this.$nextTick(() => {
        this.$set(this, 'type', nVal[0]?.value)
      })
    },
    redisOptions(nVal) {
      this.$nextTick(() => {
        this.$set(this, 'redisName', nVal[0]?.value)
      })
    },
    podOptions(nVal) {
      this.$nextTick(() => {
        this.$set(this, 'podName', nVal[0]?.value)
      })
    },
    podName() {
      this.$nextTick(() => {
        this.query()
      })
    },
    range() {
      this.$nextTick(() => {
        this.query()
      })
    },
    datetime() {
      this.$nextTick(() => {
        this.query()
      })
    },
    namespaces(nVal) {
      this.$nextTick(() => {
        this.$set(this, 'selectNamespace', nVal[0]?.value)
      })
    },
  },

  methods: {
    async query(canLoading = true) {
      if (this.range === 'custom' && !this.datetime) {
        return
      }

      const { cluster: clusterId } = this.$router.currentRoute.params
      const grafanaUrl = `/k8s/clusters/${clusterId}/api/v1/namespaces/cattle-prometheus/services/http:access-grafana:80/proxy/api/datasources/proxy/1/api/v1/query_range`

      if (canLoading) {
        this.queryLoading = true
      }

      let start = this.$moment().subtract(parseInt(this.range), (this.range || '').slice(-1)).unix()
      let end = this.$moment().unix()
      const step = findBy(PERIODS, 'value', this.range)?.step || 10
      const namespace = this.model.metadata.namespace
      const redisName = this.model.metadata.name
      const podName = this.podName
      const redisKind = this.model.kind

      let regexpPodName = podName 
      if (podName === '.*') {
        if (redisKind === 'ClusteredRedis') {
          regexpPodName = `${redisName}-[0-9]-[0-9]`
        } else {
          regexpPodName = `${redisName}-[0-9]`
        }
      }
      
      let range = '5m'

      if (this.range === 'custom' && this.datetime) {
        start = this.datetime[0] / 1000
        end = this.datetime[1] / 1000
      } else {
        range = this.range
      }

      const hash = await allHash({
        redisNetInputBytesTotal: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `rate(redis_net_input_bytes_total{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${this.podName}"}[${range}])`,
            start,
            end,
            step,
          }
        }),
        redisNetOutputBytesTotal: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `rate(redis_net_output_bytes_total{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${this.podName}"}[${range}])`,
            start,
            end,
            step,
          }
        }),
        redisConnectedClient: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `sum(redis_connected_clients{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${this.podName}"})`,
            start,
            end,
            step,
          }
        }),
        redisDbKeys: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `max (redis_db_keys{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${this.podName}"}) by (bd)`,
            start,
            end,
            step,
          }
        }),
        redisMemoryUsedPercent: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `100 * (sum(redis_memory_used_bytes{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${podName}"}) / on(pod) sum(kube_pod_container_resource_limits_memory_bytes{namespace=~"${namespace}",pod=~"${regexpPodName}"} ) )`,
            start,
            end,
            step,
          }
        }),
        cpuUsagePercentage: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `100 * (sum(redis_cpu_user_seconds_total{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${podName}"}) / on(pod) (sum(kube_pod_container_resource_limits_cpu_cores{namespace=~"${namespace}",pod=~"${regexpPodName}"} ) * 1000) )`,
            start,
            end,
            step,
          }
        }),
        hitPercentage: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `100 * (sum(redis_keyspace_hits_total{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${podName}"}) / (sum(redis_keyspace_hits_total{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${podName}"} )  + sum(redis_keyspace_misses_total{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${podName}"} ) ) ) > 0`,
            start,
            end,
            step,
          }
        }),
        missHitCount: this.$axios({
          url:    grafanaUrl,
          params: {
            query: `irate(redis_keyspace_misses_total{namespace="${namespace}",redis_kind="${redisKind}",redis_name="${redisName}", pod=~"${podName}"}[${range}])`,
            start,
            end,
            step,
          }
        }),
      })
      this.queryLoading = false
      this.redisNetInputBytesTotal = hash.redisNetInputBytesTotal.data.data.result   
      this.redisNetOutputBytesTotal = hash.redisNetOutputBytesTotal.data.data.result   
      this.redisConnectedClient = hash.redisConnectedClient.data.data.result   
      this.redisMemoryUsedPercent = hash.redisMemoryUsedPercent.data.data.result   
      this.cpuUsagePercentage = hash.cpuUsagePercentage.data.data.result   
      this.hitPercentage = hash.hitPercentage.data.data.result   
      this.missHitCount = hash.missHitCount.data.data.result   
      this.redisDbKeys = hash.redisDbKeys.data.data.result   

      if (this.timer) {
        clearInterval(this.timer)
      }
      this.timer = setInterval(this.query, 1000 * 30, [false])
    }
  },

  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
}
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <section v-else>
      <div class="row mb-20">
        <div 
          class="col"
          :class="{
            'span-6': range !== 'custom',
            'span-4': range === 'custom',
          }"
        >
          <LabeledSelect 
            v-model="podName"
            label="Pod"
            :options="podOptions"
          />
        </div>
        <div 
          class="col"
          :class="{
            'span-6': range !== 'custom',
            'span-4': range === 'custom',
          }"
        >
          <LabeledSelect 
            v-model="range"
            label="时间范围"
            :options="rangeOptions"
          />
        </div>
        <div v-if="range === 'custom'" class="col span-4">
          <DatePicker
            v-model="datetime"
            type="datetime"
            value-type="timestamp"
            range
          />
        </div>
      </div>
      <div class="row">
        <div class="span-6 col">
          <Chart
            title="CPU利用率(百分比)" 
            formatter="percent"
            :datas="cpuUsagePercentage"
            :loading="queryLoading"
            series-name="pod"
          />
        </div>
        <div class="span-6 col">
          <Chart 
            title="数据库内存使用率(百分比)" 
            :datas="redisMemoryUsedPercent"
            :loading="queryLoading"
            formatter="percent"
            series-name="pod"
          />
        </div>
      </div>
      <div class="row">
        <div class="span-6 col">
          <Chart
            title="缓存命中率(百分比)" 
            formatter="percent"
            :datas="hitPercentage"
            :loading="queryLoading"
            series-name="pod"
          />
        </div>
        <div class="span-6 col">
          <Chart 
            title="缓存未命中数(数量/每秒)" 
            :datas="missHitCount"
            :loading="queryLoading"
            series-name="pod"
          />
        </div>
      </div>
      <div class="row">
        <div class="span-6 col">
          <Chart
            title="网络输入字节数(字节)" 
            :datas="redisNetInputBytesTotal"
            :loading="queryLoading"
            formatter="byte"
            series-name="pod"
          />
        </div>
        <div class="span-6 col">
          <Chart 
            title="网络输出字节数(字节)" 
            formatter="byte"
            :datas="redisNetOutputBytesTotal"
            :loading="queryLoading"
            series-name="pod"
          />
        </div>
      </div>
      <div class="row">
        <div class="span-6 col">
          <Chart
            title="当前连接数(数量)" 
            :datas="redisConnectedClient"
            :loading="queryLoading"
            series-name="pod"
          />
        </div>
        <div class="span-6 col">
          <Chart 
            title="当前项目数(数量)" 
            :datas="redisDbKeys"
            :loading="queryLoading"
            series-name="pod"
          />
        </div>
      </div>
    </section>
  </div>
</template>