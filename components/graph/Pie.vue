<script>
import SimpleBox from '@/components/SimpleBox'

const STATES = {
  'in-progress':      { color: '#3D98D3', icon: 'tag' },
  'pending-rollback': { color: '#3D98D3', icon: 'dot-half' },
  'pending-upgrade':  { color: '#3D98D3', icon: 'dot-half' },
  aborted:            { color: '#DAC342', icon: 'error' },
  activating:         { color: '#bae7ff', icon: 'tag' },
  active:             { color: '#5D995D', icon: 'dot-open' },
  available:          { color: '#5D995D', icon: 'dot-open' },
  backedup:           { color: '#5D995D', icon: 'backup' },
  bound:              { color: '#5D995D', icon: 'dot' },
  building:           { color: '#5D995D', icon: 'dot-open' },
  completed:          { color: '#5D995D', icon: 'dot' },
  cordoned:           { color: '#3D98D3', icon: 'tag' },
  created:            { color: '#3D98D3', icon: 'tag' },
  creating:           { color: '#d9f7be', icon: 'tag' },
  deactivating:       { color: '#3D98D3', icon: 'adjust' },
  degraded:           { color: '#DAC342', icon: 'error' },
  denied:             { color: '#F64747', icon: 'adjust' },
  deployed:           { color: '#5D995D', icon: 'dot-open' },
  disabled:           { color: '#DAC342', icon: 'error' },
  disconnected:       { color: '#DAC342', icon: 'error' },
  error:              { color: '#F64747', icon: 'error' },
  errapplied:         { color: '#F64747', icon: 'error' },
  erroring:           { color: '#F64747', icon: 'error' },
  expired:            { color: '#DAC342', icon: 'error' },
  failed:             { color: '#F64747', icon: 'error' },
  fail:               { color: '#F64747', icon: 'error' },
  healthy:            { color: '#5D995D', icon: 'dot-open' },
  inactive:           { color: '#F64747', icon: 'dot' },
  initializing:       { color: '#DAC342', icon: 'error' },
  inprogress:         { color: '#3D98D3', icon: 'spinner' },
  locked:             { color: '#DAC342', icon: 'adjust' },
  migrating:          { color: '#3D98D3', icon: 'info' },
  modified:           { color: '#DAC342', icon: 'edit' },
  notapplied:         { color: '#DAC342', icon: 'tag' },
  notApplicable:         { color: '#DAC342', icon: 'tag' },
  passed:             { color: '#5D995D', icon: 'dot-dotfill' },
  pass:               { color: '#5D995D', icon: 'dot-dotfill' },
  paused:             { color: '#3D98D3', icon: 'info' },
  pending:            { color: '#3D98D3', icon: 'tag' },
  provisioning:       { color: '#3D98D3', icon: 'dot' },
  purged:             { color: '#F64747', icon: 'purged' },
  purging:            { color: '#3D98D3', icon: 'purged' },
  ready:              { color: '#5D995D', icon: 'dot-open' },
  reconnecting:       { color: '#F64747', icon: 'error' },
  registering:        { color: '#3D98D3', icon: 'tag' },
  reinitializing:     { color: '#DAC342', icon: 'error' },
  released:           { color: '#DAC342', icon: 'error' },
  removed:            { color: '#F64747', icon: 'trash' },
  removing:           { color: '#3D98D3', icon: 'trash' },
  requested:          { color: '#3D98D3', icon: 'tag' },
  restarting:         { color: '#3D98D3', icon: 'adjust' },
  restoring:          { color: '#3D98D3', icon: 'medicalcross' },
  running:            { color: '#5D995D', icon: 'dot-open' },
  skipped:            { color: '#3D98D3', icon: 'dot-open' },
  skip:               { color: '#3D98D3', icon: 'dot-open' },
  starting:           { color: '#3D98D3', icon: 'adjust' },
  stopped:            { color: '#F64747', icon: 'dot' },
  stopping:           { color: '#3D98D3', icon: 'adjust' },
  succeeded:          { color: '#5D995D', icon: 'dot-dotfill' },
  success:            { color: '#5D995D', icon: 'dot-open' },
  superseded:         { color: '#3D98D3', icon: 'dot-open' },
  suspended:          { color: '#3D98D3', icon: 'pause' },
  unavailable:        { color: '#F64747', icon: 'error' },
  unhealthy:          { color: '#F64747', icon: 'error' },
  uninstalled:        { color: '#3D98D3', icon: 'trash' },
  uninstalling:       { color: '#3D98D3', icon: 'trash' },
  unknown:            { color: '#DAC342', icon: 'x' },
  untriggered:        { color: '#5D995D', icon: 'tag' },
  updating:           { color: '#DAC342', icon: 'tag' },
  waiting:            { color: '#3D98D3', icon: 'tag' },
  waitapplied:        { color: '#3D98D3', icon: 'tag' },
  waitcheckin:        { color: '#DAC342', icon: 'tag' },
  notready:           { color: '#DAC342', icon: 'tag' },
  none:               { color: 'grey', icon: 'tag' },
}

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
  },

  components: {
    SimpleBox,
  },

  computed: {
    options() {
      return {
        legend: {
          orient: 'vertical',
          right:  10,
          data:   this.datas.map(d => d.name),
        },
        series: [
          {
              name:              '访问来源',
              type:              'pie',
              radius:            ['50%', '70%'],
              itemStyle: {
                color: ({ name }) => {
                  return STATES[name]?.color
                }
              },
              avoidLabelOverlap: false,
              label:             {
                  show:     false,
                  position: 'center'
              },
              emphasis: {
                  label: {
                    show:       true,
                    fontSize:   '14',
                    fontWeight: 'bold',
                    formatter:  ({ value }) => `${value}`,
                  }
              },
              labelLine: {
                  show: false
              },
              data: this.datas.length > 0 ? this.datas : [{
                name:  'none',
                value: 0,
              }],
          }
        ]
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
  <SimpleBox class="hardware-resource-gauge" :title="title">
    <div class="chart">
      <div>
        <VChart 
          ref="chart" 
          :options="options" 
          theme="walden"
          :autoresize="true"
        />
      </div>
    </div>
  </SimpleBox>
</template>

<style lang="scss" scoped>
/**
 * The default size is 600px×400px, for responsive charts
 * you may need to set percentage values as follows (also
 * don't forget to provide a size for the container).
 */
.echarts {
  width: 100%;
  height: 200px;
}

  .hardware-resource-gauge {
    $spacing: 10px;
    $large-spacing: $spacing * 1.5;

    position: relative;
    display: flex;
    flex-direction: column;

    .values {
      font-size: 12px;
      padding-left: 10px;
    }
  }
</style>