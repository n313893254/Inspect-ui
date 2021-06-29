import { directiveSsr as t } from './plugins/i18n'
import { trimWhitespaceSsr as trimWhitespace } from './plugins/trim-whitespace'

const version = process.env.VERSION ||
  process.env.DRONE_TAG ||
  process.env.DRONE_VERSION ||
  require('./package.json').version

const dev = (process.env.NODE_ENV !== 'production')
const commit = process.env.COMMIT || 'head'

let api = process.env.API || 'https://0.0.0.0:8443'

if ( !api.startsWith('http') ) {
  api = `https://${ api }`
}

let routerBasePath = '/'
let resourceBase = ''
let outputDir = 'dist'

if ( typeof process.env.ROUTER_BASE !== 'undefined' ) {
  routerBasePath = process.env.ROUTER_BASE
}

if ( typeof process.env.RESOURCE_BASE !== 'undefined' ) {
  resourceBase = process.env.RESOURCE_BASE
}

if ( typeof process.env.OUTPUT_DIR !== 'undefined' ) {
  outputDir = process.env.OUTPUT_DIR
}

if ( resourceBase && !resourceBase.endsWith('/') ) {
  resourceBase += '/'
}

console.log(`Build: ${ dev ? 'Development' : 'Production' }`) // eslint-disable-line no-console

if ( !dev ) {
  console.log(`Version: ${ version } (${ commit })`) // eslint-disable-line no-console
}

if ( resourceBase ) {
  console.log(`Resource Base URL: ${ resourceBase }`) // eslint-disable-line no-console
}

if ( routerBasePath !== '/' ) {
  console.log(`Router Base Path: ${ routerBasePath }`) // eslint-disable-line no-console
}

console.log(`API: ${ api }`) // eslint-disable-line no-console

module.exports = {
  dev,
  // ssr:            false,
  // modern:         true,
  buildModules: [
    '@nuxtjs/style-resources',
    '@nuxtjs/moment',
    'nuxt-resolve-url-loader',
  ],
  styleResources: {
    // only import functions, mixins, or variables, NEVER import full styles https://github.com/nuxt-community/style-resources-module#warning
    scss: [
      '~assets/styles/base/_variables.scss',
      '~assets/styles/base/_functions.scss',
      '~assets/styles/base/_mixins.scss',
    ],
  },

  // mode: 'spa',

  // Axios: https://axios.nuxtjs.org/options
  axios: {
    https:          false,
    proxy:          true,
    retry:          { retries: 0 },
    // debug:   true
  },

  generate: { dir: outputDir },

  // Global CSS
  css: [
    '@/assets/styles/app.scss'
  ],

  head: {
    title: process.env.npm_package_name || '',
    meta:  [
      { 
        charset: 'utf-8',
      },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid:     'description',
        name:    'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{
      rel:  'icon',
      type: 'image/x-icon',
      href: `${ resourceBase || '/' }favicon.png`
    }],
    script: [
      { src: `${ resourceBase || '/' }minio-browser.js` },
      { src: `${ resourceBase || '/' }aws-sdk-2.831.0.min.js` },
    ],
  },

  router: {
    base:       routerBasePath,
    mode:       'hash',
    middleware: ['i18n'],
  },

  build: {
    publicPath: resourceBase,
    transpile:  ['vue-echarts', 'resize-detector'],
    // parallel:   true,
    // cache:      true,
    // hardSource: true,
    // target:     'static',
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: "pre",
          test:    /\.(js|vue)$/,
          loader:  "eslint-loader",
          exclude: /(node_modules)/
        })
      }

      if (resourceBase) {
        config.output.publicPath = resourceBase
      }

      config.module.rules.unshift({
        test:    /\.ya?ml$/i,
        loader:  'js-yaml-loader',
        options: { name: '[path][name].[ext]' },
      })
    }
  },

  babel:        {
    presets({ isServer }) {
      return [
        [
          require.resolve('@nuxt/babel-preset-app'),
          {
            // buildTarget: isServer ? 'server' : 'client',
            corejs:      { version: 3 },
            targets:     isServer ? { node: 'current' } : { browsers: ['last 2 versions'] },
            modern:      !isServer
          }
        ]
      ]
    },
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  },

  render: {
    bundleRenderer: {
      directives: {
        trimWhitespace,
        t,
      }
    }
  },

  // Nuxt modules
  modules: [
    '@nuxtjs/axios',
    'cookie-universal-nuxt',
    '~/plugins/steve/rehydrate-all',
  ],

  plugins: [
    // Third-party
    '~/plugins/axios',
    '~/plugins/v-select',
    '~/plugins/tooltip',
    '~/plugins/echart',
    '~/plugins/vue-clipboard2',
    { src: '~/plugins/shortkey', ssr: false },
    { src: '~plugins/vue-js-modal' },
    { src: '~/plugins/resize', ssr: false },
    { src: '~/plugins/js-yaml', ssr: false },

    // First-party
    '~/plugins/i18n',
    '~/plugins/global-formatters',
    { src: '~/plugins/extend-router' },
    { src: '~/plugins/nuxt-client-init', ssr: false },
    '~/plugins/trim-whitespace',
  ],

  serverMiddleware: [
    '~/server/no-ssr'
  ],

  // Proxy: https://github.com/nuxt-community/proxy-module#options
  proxy: {
    // '/k8s':       proxyWsOpts(api), // Straight to a remote cluster (/k8s/clusters/<id>/)
    // '/v3':        proxyOpts(api), // Rancher API
    // '/v3-public': proxyOpts(api), // Rancher Unauthed API
    '/v1': proxyWsOpts(api),
  },
}

function proxyOpts(target) {
  return {
    target,
    secure: !dev,
    onProxyReq,
    onProxyReqWs,
    onError
  }
}

function proxyWsOpts(target) {
  return {
    ...proxyOpts(target),
    ws:           true,
    changeOrigin: true,
  }
}

function onProxyReq(proxyReq, req) {
  proxyReq.setHeader('x-api-host', req.headers['host'])
  proxyReq.setHeader('x-forwarded-proto', 'http')
  // console.log(proxyReq.getHeaders())
}

function onProxyReqWs(proxyReq, req, socket, options) {
  req.headers.origin = options.target.href
  proxyReq.setHeader('origin', options.target.href)
  proxyReq.setHeader('x-api-host', req.headers['host'])
  proxyReq.setHeader('x-forwarded-proto', 'http')
  // console.log(proxyReq.getHeaders());

  socket.on('error', (err) => {
    console.error('Proxy WS Error:', err) // eslint-disable-line no-console
  })
}

function onError(err, req, res) {
  res.statusCode = 500
  console.error('Proxy Error:', err) // eslint-disable-line no-console
  res.write(JSON.stringify(err))
}