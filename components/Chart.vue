<script>
import { roundValue, formatMib, formatPercent } from '@/utils/units'
import { escapeHtml } from '@/utils/string'

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
    formatter: {
      type:    String,
      default: null,
    },
    seriesName: {
      type:    String,
      default: null,
    },
    namespaced: {
      type:    Boolean,
      default: false,
    },
  },

  computed: {
    showTitle() {
      if (this.datas.length === 0) {
        return true
      } else {
        return false
      }
    },

    options() {
      const formatter = this.getFormatter(this.formatter, true)
      return {
        title: this.showTitle && {
          text:      '无可用数据',
          x:         'center',
          y:         'center',
          textStyle: {
            color: '#ccc',
          },
        },
        tooltip: {
          trigger: 'axis',
          position(pos, params, dom, rect, size) {
            const obj = { top: 60 }

            obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5

            return obj
          },
          formatter(params) {
            let html = ''

            params.forEach((p, i) => {
              if ( i === 0 ) {
                html = `<div class="text-left">${ p.axisValueLabel }`
              }

              const value = escapeHtml(formatter(p.data[1]))
              let label = escapeHtml(p.seriesName)

              html += `<br><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${ p.color };"></span> ${ label } : ${ value }`
            })

            html += '</div>'

            return html
          }
        },
        xAxis: {
          type:        'time',
          boundaryGap: false,
        },
        yAxis: {
          type:      'value',
          splitArea: { show: true },
          axisLabel: {
            formatter: this.getFormatter(this.formatter),
          },
        },
        grid:    {
          top:          '10px',
          left:         '30px',
          right:        '30px',
          bottom:       '3%',
          containLabel: true
        },
        series: this.datas.map(d => {
          const data = (d.values || []).map(d => {
            let value = d[1]

            return [d[0], value]
          })

          let name = d.metric[this.seriesName || 'redis_name'] || 'value'
          if (this.namespaced) {
            name = `${d.metric['namespace']}/` + name
          }

          return {
            type:       'line',
            showSymbol: false,
            animation:  false,
            data,
            name,
          }
        })
      }
    }
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

    getFormatter(unit) {
      switch(unit) {
      case 'percent':
        return formatPercent
      case 'byte':
        return formatMib
      default:
        return roundValue
      }
    }
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