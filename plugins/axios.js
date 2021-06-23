import https from 'https'
import { TIMED_OUT } from '@/config/query-params'
import pkg from '../package.json'

export default function({
  $axios, isDev, route, redirect, req
}) {
  $axios.defaults.headers.common['Accept'] = 'application/json'
  $axios.defaults.xsrfCookieName = 'CSRF'
  $axios.defaults.xsrfHeaderName = 'X-Api-Csrf'
  $axios.defaults.withCredentials = true

  if ( process.server ) {
    $axios.defaults.headers.common['user-agent'] = `Dashboard v${ pkg.version }`
  }

  if ( isDev ) {
    $axios.onError((error) => {
      const code = parseInt(error.response && error.response.status, 10)

      if (code === 401) {
        if ( route.name === 'index' ) {
          redirect('/auth/login')
        } else {
          redirect(`/auth/login?${ TIMED_OUT }`)
        }
      }
    })
  } else if ( process.server ) {
    // For requests from the server, set the base URL to the URL that the request came in on
    $axios.onRequest((config) => {
      if ( process.server && config.url.startsWith('/') ) {
        config.baseURL = `${ req.protocol }://${ req.headers.host }`
      }
    })
  }
}
