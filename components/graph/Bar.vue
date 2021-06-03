<script>
export default {
  props: {
    title: {
      type:    String,
      default: '',
    },
    datas: {
      type:    Array,
      default: () => []
    },
    loading: {
      type:    Boolean,
      default: false,
    },
    namespaced: {
      type:    Boolean,
      default: false,
    },
  },

  computed: {
    options() {
      const datas = this.datas.filter(a => !isNaN(a?.value[1]))
      return {
        title: datas.length === 0 && {
          text:      '无可用数据',
          x:         'center',
          y:         'center',
          textStyle: {
            color: '#ccc',
          }
        },
        grid:    {
          top:          '0px',
          left:         '30px',
          right:        '0px',
          bottom:       '3%',
          containLabel: true
        },
        tooltip: {
          formatter: ({ name, value }) => `${name}: ${value}`,
          position(pos, params, dom, rect, size) {
            const obj = { top: 60 }

            obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5

            return obj
          },
        },
        xAxis: [
          {
            type:     'value',
            axisTick: {
              show:        true,
              lineStyle: { color: '#ccc' }
            },
            axisLabel: {
              show: true,
            },
            axisLine: {
              show: false
            },
            splitLine: {
              lineStyle: {
                type: 'dashed'
              }
            },
          }
        ],
        yAxis: [
          {
            type:     'category',
            axisTick: {
              show: false,
            },
            triggerEvent: true,
            max:          4,
            inverse:      true,
            splitLine:    {
              show: false,
            },
          },
          {
            type:     'category',
            position: 'right',
            data:         this.datas.filter(a => !isNaN(a?.value[1])).map(a => {
              return {
                value: a?.value[1],
              }
            }),
            max:          4,
            inverse:      true,
            triggerEvent: true,
            splitLine:    {
              show: false,
            },
            axisLine: {
              show: false,
            },
          },
        ],
        series: [{
          type:     'bar',
          barWidth: 12,
          data:     this.datas.filter(a => !isNaN(a?.value[1])).map(a => {
            let name = a?.metric?.redis_name

            if (this.namespaced) {
              const namespace = a?.metric?.namespace
              name = `${namespace}/` + name
            }

            return {
              name,
              value: a?.value[1],
            }
          }),
          label: {
            show:      true,
            position:  [5, '100%'],
            formatter: ({ name }) => name,
          },
          markPoint: {
            label: {
              show: true,
            }
          }
        }]
      }
    },
  },

  methods: {
    showLoading() {
      this.$refs.chart.showLoading('default', {
        text:      '',
        color:     '#3d3d3d',
        textColor: '#3d3d3d',
        maskColor: 'rgba(255, 255, 255, 0.8)',
        zlevel:    0,
        
        // 字体大小。从 `v4.8.0` 开始支持。
        fontSize:      12,
        // 是否显示旋转动画（spinner）。从 `v4.8.0` 开始支持。
        showSpinner:   true,
        // 旋转动画（spinner）的半径。从 `v4.8.0` 开始支持。
        spinnerRadius: 30,
        // 旋转动画（spinner）的线宽。从 `v4.8.0` 开始支持。
        lineWidth:     5
      })
    },
    hideLoading() {
      this.$refs.chart.hideLoading()
    },
  },

  watch: {
    loading(nVal) {
      if (nVal) {
        this.showLoading()
      } else {
        this.hideLoading()
      }
    }
  },
}
</script>


<template>
  <div>
    <h3 class="mt-40">
      {{ title }}
    </h3>
    <VChart 
      ref="chart" 
      :options="options" 
      theme="walden"
      :autoresize="true"
    />
  </div>
</template>

<style>
/**
 * The default size is 600px×400px, for responsive charts
 * you may need to set percentage values as follows (also
 * don't forget to provide a size for the container).
 */
.echarts {
  width: 100%;
  height: 200px;
}
</style>