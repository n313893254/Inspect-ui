import { isFunction, isEmpty, isString, get, compact, uniq, omitBy } from 'lodash'
import Vue from 'vue'
import jsyaml from 'js-yaml'
import { downloadFile, generateZip } from '@/utils/download'
import { eachLimit } from '@/utils/promise'

import CustomValidators from '@/utils/custom-validators'
import { normalizeType, cleanForNew } from './normalize'
import {
  coerceStringTypeToScalarType,
  ucFirst,
  matchesSomeRegex,
} from '@/utils/string'
import { removeAt, findBy } from '@/utils/array'
import {
  displayKeyFor,
  validateChars,
  validateDnsLikeTypes,
  validateLength,
} from '@/utils/validators'
import { DESCRIPTION } from '@/config/labels-annotations'
import {
  AS, _YAML, MODE, _EDIT, _VIEW, _CLONE, _UNFLAG
} from '@/config/query-params'

const STRING_LIKE_TYPES = [
  'string',
  'date',
  'blob',
  'enum',
  'multiline',
  'masked',
  'password',
  'dnsLabel',
  'hostname',
]
const DNS_LIKE_TYPES = ['dnsLabel', 'dnsLabelRestricted', 'hostname']

const REMAP_STATE = {
  disabled:      'inactive',
  notapplied:    'Not Applied',
  notready:      'Not Ready',
  waitapplied:   'Wait Applied',
  outofsync:     'Out of Sync',
  'in-progress':   'In Progress',
  gitupdating:   'Git Updating',
  errapplied:    'Err Applied'
}

const DEFAULT_COLOR = 'warning'

const DEFAULT_WAIT_INTERVAL = 1000
const DEFAULT_WAIT_TMIMEOUT = 30000

const STATES = {
  'in-progress':      { color: 'info', icon: 'tag' },
  'pending-rollback': { color: 'info', icon: 'dot-half' },
  'pending-upgrade':  { color: 'info', icon: 'dot-half' },
  aborted:            { color: 'warning', icon: 'error' },
  activating:         { color: 'info', icon: 'tag' },
  active:             { color: 'success', icon: 'dot-open' },
  available:          { color: 'success', icon: 'dot-open' },
  backedup:           { color: 'success', icon: 'backup' },
  bound:              { color: 'success', icon: 'dot' },
  building:           { color: 'success', icon: 'dot-open' },
  completed:          { color: 'success', icon: 'dot' },
  cordoned:           { color: 'info', icon: 'tag' },
  created:            { color: 'info', icon: 'tag' },
  creating:           { color: 'info', icon: 'tag' },
  deactivating:       { color: 'info', icon: 'adjust' },
  degraded:           { color: 'warning', icon: 'error' },
  denied:             { color: 'error', icon: 'adjust' },
  deployed:           { color: 'success', icon: 'dot-open' },
  disabled:           { color: 'warning', icon: 'error' },
  disconnected:       { color: 'warning', icon: 'error' },
  error:              { color: 'error', icon: 'error' },
  errapplied:         { color: 'error', icon: 'error' },
  erroring:           { color: 'error', icon: 'error' },
  expired:            { color: 'warning', icon: 'error' },
  failed:             { color: 'error', icon: 'error' },
  fail:               { color: 'error', icon: 'error' },
  healthy:            { color: 'success', icon: 'dot-open' },
  inactive:           { color: 'error', icon: 'dot' },
  initializing:       { color: 'warning', icon: 'error' },
  inprogress:         { color: 'info', icon: 'spinner' },
  locked:             { color: 'warning', icon: 'adjust' },
  migrating:          { color: 'info', icon: 'info' },
  modified:           { color: 'warning', icon: 'edit' },
  notapplied:         { color: 'warning', icon: 'tag' },
  notApplicable:         { color: 'warning', icon: 'tag' },
  passed:             { color: 'success', icon: 'dot-dotfill' },
  pass:               { color: 'success', icon: 'dot-dotfill' },
  paused:             { color: 'info', icon: 'info' },
  pending:            { color: 'info', icon: 'tag' },
  provisioning:       { color: 'info', icon: 'dot' },
  purged:             { color: 'error', icon: 'purged' },
  purging:            { color: 'info', icon: 'purged' },
  ready:              { color: 'success', icon: 'dot-open' },
  reconnecting:       { color: 'error', icon: 'error' },
  registering:        { color: 'info', icon: 'tag' },
  reinitializing:     { color: 'warning', icon: 'error' },
  released:           { color: 'warning', icon: 'error' },
  removed:            { color: 'error', icon: 'trash' },
  removing:           { color: 'info', icon: 'trash' },
  requested:          { color: 'info', icon: 'tag' },
  restarting:         { color: 'info', icon: 'adjust' },
  restoring:          { color: 'info', icon: 'medicalcross' },
  running:            { color: 'success', icon: 'dot-open' },
  skipped:            { color: 'info', icon: 'dot-open' },
  skip:               { color: 'info', icon: 'dot-open' },
  starting:           { color: 'info', icon: 'adjust' },
  stopped:            { color: 'error', icon: 'dot' },
  stopping:           { color: 'info', icon: 'adjust' },
  succeeded:          { color: 'success', icon: 'dot-dotfill' },
  success:            { color: 'success', icon: 'dot-open' },
  superseded:         { color: 'info', icon: 'dot-open' },
  suspended:          { color: 'info', icon: 'pause' },
  unavailable:        { color: 'error', icon: 'error' },
  unhealthy:          { color: 'error', icon: 'error' },
  uninstalled:        { color: 'info', icon: 'trash' },
  uninstalling:       { color: 'info', icon: 'trash' },
  unknown:            { color: 'warning', icon: 'x' },
  untriggered:        { color: 'success', icon: 'tag' },
  updating:           { color: 'warning', icon: 'tag' },
  waiting:            { color: 'info', icon: 'tag' },
  waitapplied:        { color: 'info', icon: 'tag' },
  notready:           { color: 'warning', icon: 'tag' },
  approved:           { color: 'success', icon: 'tag' },
  rejected:           { color: 'error', icon: 'tag' },
}

const SORT_ORDER = {
  error:   1,
  warning: 2,
  info:    3,
  success: 4,
  other:   5,
}

export default {  
  customValidationRules() {
    return [
      /**
       * Essentially a fake schema object with additonal params to extend validation
       *
       * @param {nullable} Value is nullabel
       * @param {path} Path on the resource to the value to validate
       * @param {required} Value required
       * @param {requiredIf} Value required if value at path not empty
       * @param {translationKey} Human readable display key for param in path e.g. metadata.name === Name
       * @param {type} Type of field to validate
       * @param {validators} array of strings where item is name of exported validator function in custom-validtors, args can be passed by prepending args seperated by colon. e.g maxLength:63
       */
      /* {
        nullable:       false,
        path:           'spec.ports',
        required:       true,
        type:           'array',
        validators:     ['servicePort'],
      } */
    ]
  },

  nameDisplay() {
    return this.spec?.displayName || this.metadata?.name || this.name || this.id
  },

  toString() {
    return () => {
      return `[${ this.type }: ${ this.id }]`
    }
  },

  stateBackground() {
    return this.stateColor.replace('text-', 'bg-')
  },

  stateColor() {
    return colorForState.call(
      this,
      this.state,
      this.metadata?.state?.error,
      this.metadata?.state?.transitioning
    )
  },

  availableActions() {
    const all = this._availableActions

    // Remove disabled items and consecutive dividers
    let last = null
    const out = all.filter((item) => {
      if ( item.enabled === false ) {
        return false
      }

      const cur = item.divider
      const ok = !cur || (cur && !last)

      last = cur

      return ok
    })

    // Remove dividers at the beginning
    while ( out.length && out[0].divider ) {
      out.shift()
    }

    // Remove dividers at the end
    while ( out.length && out[out.length - 1].divider ) {
      out.pop()
    }

    // Remove consecutive dividers in the middle
    for ( let i = 1 ; i < out.length ; i++ ) {
      if ( out[i].divider && out[i - 1].divider ) {
        removeAt(out, i, 1)
        i--
      }
    }

    return out
  },

  _availableActions() {
    return this._standardActions
  },

  _standardActions() {
    const all = [
      {
        action:  'goToEdit',
        label:   this.t('action.edit'),
        icon:    'icon icon-edit',
        enabled:  this.canUpdate && this.canCustomEdit,
      },
      {
        action:  'goToClone',
        label:   this.t('action.goToClone'),
        icon:    'icon icon-copy',
        enabled:  this.canCreate && this.canCustomEdit,
      },
      { divider: true },
      {
        action:  'goToEditYaml',
        label:   this.t('action.editYaml'),
        icon:    'icon icon-file',
        enabled: this.canUpdate && this.canYaml,
      },
      {
        action:  'goToViewYaml',
        label:   this.t('action.viewYaml'),
        icon:    'icon icon-file',
        enabled: !this.canUpdate && this.canYaml
      },
      {
        action:  'cloneYaml',
        label:   this.t('action.cloneYaml'),
        icon:    'icon icon-copy',
        enabled:  this.canCreate && this.canYaml,
      },
      {
        action:     'download',
        label:      this.t('action.download'),
        icon:       'icon icon-download',
        bulkable:   true,
        bulkAction: 'downloadBulk',
        enabled:    this.canYaml
      },
      { divider: true },
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    this.canDelete,
        bulkAction: 'promptRemove',
      },
      { divider: true },
      {
        action:  'viewInApi',
        label:   this.t('action.viewInApi'),
        icon:    'icon icon-external-link',
        enabled:  this.canViewInApi,
      }
    ]

    return all
  },

  _key() {
    const m = this.metadata

    if ( m ) {
      if ( m.uid ) {
        return m.uid
      }

      if ( m.namespace ) {
        return `${ this.type }/${ m.namespace }/${ m.name }`
      }
    }

    if ( this.id ) {
      return `${ this.type }/${ this.id }`
    }

    return `${ this.type }/${ Math.random() }`
  },

  actionLinkFor() {
    return (actionName) => {
      return (this.actions || {})[actionName]
    }
  },

  setAnnotation() {
    return (key, val) => {
      if ( val ) {
        if ( !this.metadata ) {
          this.metadata = {}
        }

        if ( !this.metadata.annotations ) {
          this.metadata.annotations = {}
        }

        Vue.set(this.metadata.annotations, key, val)
      } else if ( this.metadata?.annotations ) {
        Vue.set(this.metadata.annotations, key, undefined)
        delete this.metadata.annotations[key]
      }
    }
  },

  doAction() {
    return (actionName, body, opt = {}) => {
      if ( !opt.url ) {
        opt.url = this.actionLinkFor(actionName)
      }

      opt.method = 'post'
      opt.data = body

      return this.$dispatch('request', opt)
    }
  },

  linkFor() {
    return (linkName) => {
      return (this.links || {})[linkName]
    }
  },

  save() {
    return this._save
  },

  _save() {
    return async(opt = {}) => {
      delete this.__rehydrate
      const forNew = !this.id

      const errors = await this.validationErrors(this)

      if (!isEmpty(errors)) {
        return Promise.reject(errors)
      }

      if ( this.metadata?.resourceVersion ) {
        this.metadata.resourceVersion = `${ this.metadata.resourceVersion }`
      }

      if ( !opt.url ) {
        if ( forNew ) {
          const schema = this.$getters['schemaFor'](this.type)
          let url = schema.linkFor('collection')

          if ( schema.attributes && schema.attributes.namespaced ) {
            url += `/${ this.metadata.namespace }`
          }

          opt.url = url
        } else {
          opt.url = this.linkFor('update') || this.linkFor('self')
        }
      }

      if ( !opt.method ) {
        opt.method = ( forNew ? 'post' : 'put' )
      }

      if ( !opt.headers ) {
        opt.headers = {}
      }

      if ( !opt.headers['content-type'] ) {
        opt.headers['content-type'] = 'application/json'
      }

      if ( !opt.headers['accept'] ) {
        opt.headers['accept'] = 'application/json'
      }

      // @TODO remove this once the API maps steve _type <-> k8s type in both directions
      if (!opt.data) {
        opt.data = { ...this }
      }

      if (opt?.data._type) {
        opt.data.type = opt.data._type
      }

      try {
        const res = await this.$dispatch('request', opt)

        // console.log('### Resource Save', this.type, this.id);

        // Steve sometimes returns Table responses instead of the resource you just saved.. ignore
        if ( res && res.kind !== 'Table') {
          await this.$dispatch('load', { data: res, existing: (forNew ? this : undefined ) })
        }
      } catch (e) {
        if ( this.type && this.id && e?._status === 409) {
          // If there's a conflict, try to load the new version
          await this.$dispatch('find', {
            type: this.type,
            id:   this.id,
            opt:  { force: true }
          })
        }

        return Promise.reject(e)
      }

      return this
    }
  },

  saveStatus() {
    return async(opt = {}) => {
      let data = {
        ...(opt.data || {}),
        metadata: this.metadata,
      }

      if (!data.apiVersion) {
        data.apiVersion = 'redis.cattle.io/v1alpha1'
      }

      if (!data.kind) {
        data.kind = this.kind
      }

      if ( !opt.url ) {
        let url = this.linkFor('view')

        url += `/status`

        opt.url = url
      }

      if ( !opt.method ) {
        opt.method = 'put'
      }

      if ( !opt.headers ) {
        opt.headers = {}
      }

      if ( !opt.headers['content-type'] ) {
        opt.headers['content-type'] = 'application/json'
      }

      if ( !opt.headers['accept'] ) {
        opt.headers['accept'] = 'application/json'
      }

      opt.data = data

      try {
        await this.$dispatch('request', opt)
      } catch (e) {
        return Promise.reject(e)
      }

      return this
    }
  },

  remove() {
    return async(opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})['self']
      }

      opt.method = 'delete'

      const res = await this.$dispatch('request', opt)

      if ( res?._status === 204 ) {
        // If there's no body, assume the resource was immediately deleted
        // and drop it from the store as if a remove event happened.
        this.$dispatch('ws.resource.remove', { data: this })
      }
    }
  },

  schema() {
    return this.$getters['schemaFor'](this.type)
  },

  t() {
    return this.$rootGetters['i18n/t']
  },

  validationErrors() {
    return (data, ignoreFields) => {
      const errors = []
      const {
        type: originalType,
        schema
      } = data
      const type = normalizeType(originalType)

      if ( !originalType ) {
        // eslint-disable-next-line
        console.warn(this.t('validation.noType'), data);

        return errors
      }

      if ( !schema ) {
        // eslint-disable-next-line
        console.warn(this.t('validation.noSchema'), originalType, data);

        return errors
      }

      const fields = schema.resourceFields || {}
      const keys = Object.keys(fields)
      let field, key, val, displayKey

      for ( let i = 0 ; i < keys.length ; i++ ) {
        key = keys[i]
        field = fields[key]
        val = get(data, key)
        displayKey = displayKeyFor(type, key, this.$rootGetters)

        const fieldType = field?.type ? normalizeType(field.type) : null
        const valIsString = isString(val)

        if ( ignoreFields && ignoreFields.includes(key) ) {
          continue
        }

        if ( val === undefined ) {
          val = null
        }

        if (valIsString) {
          if (fieldType) {
            Vue.set(data, key, coerceStringTypeToScalarType(val, fieldType))
          }

          // Empty strings on nullable string fields -> null
          if ( field.nullable && val.length === 0 && STRING_LIKE_TYPES.includes(fieldType)) {
            val = null

            Vue.set(data, key, val)
          }
        }

        validateLength(val, field, displayKey, this.$rootGetters, errors)
        validateChars(val, field, displayKey, this.$rootGetters, errors)

        if (errors.length > 0) {
          errors.push(this.t('validation.required', { key: displayKey }))

          continue
        }

        // IDs claim to be these but are lies...
        if ( key !== 'id' && !isEmpty(val) && DNS_LIKE_TYPES.includes(fieldType) ) {
          // DNS types should be lowercase
          const tolower = (val || '').toLowerCase()

          if ( tolower !== val ) {
            val = tolower

            Vue.set(data, key, val)
          }

          errors.push(...validateDnsLikeTypes(val, fieldType, displayKey, this.$rootGetters, errors))
        }
      }

      let { customValidationRules } = this

      if (!isEmpty(customValidationRules)) {
        if (isFunction(customValidationRules)) {
          customValidationRules = customValidationRules()
        }

        customValidationRules.forEach((rule) => {
          const {
            path,
            requiredIf: requiredIfPath,
            validators = [],
            type: fieldType,
          } = rule
          let pathValue = get(data, path) || null

          const parsedRules = compact((validators || []))
          let displayKey = path

          if (rule.translationKey && this.$rootGetters['i18n/exists'](rule.translationKey)) {
            displayKey = this.t(rule.translationKey)
          }

          if (isString(pathValue)) {
            pathValue = pathValue.trim()
          }

          if (requiredIfPath) {
            const reqIfVal = get(data, requiredIfPath)

            if (!isEmpty(reqIfVal) && isEmpty(pathValue)) {
              errors.push(this.t('validation.required', { key: displayKey }))
            }
          }

          validateLength(pathValue, rule, displayKey, this.$rootGetters, errors)
          validateChars(pathValue, rule, displayKey, this.$rootGetters, errors)

          if ( !isEmpty(pathValue) && DNS_LIKE_TYPES.includes(fieldType) ) {
            // DNS types should be lowercase
            const tolower = (pathValue || '').toLowerCase()

            if ( tolower !== pathValue ) {
              pathValue = tolower

              Vue.set(data, path, pathValue)
            }

            errors.push(...validateDnsLikeTypes(pathValue, fieldType, displayKey, this.$rootGetters, errors))
          }

          parsedRules.forEach((validator) => {
            const validatorAndArgs = validator.split(':')
            const validatorName = validatorAndArgs.slice(0, 1)
            const validatorArgs = validatorAndArgs.slice(1) || null
            const validatorExists = Object.prototype.hasOwnProperty.call(CustomValidators, validatorName)

            if (!isEmpty(validatorName) && validatorExists) {
              CustomValidators[validatorName](pathValue, this.$rootGetters, errors, validatorArgs, displayKey)
            } else if (!isEmpty(validatorName) && !validatorExists) {
              // eslint-disable-next-line
              console.warn(this.t('validation.custom.missing', { validatorName }));
            }
          })
        })
      }

      return uniq(errors)
    }
  },

  waitForTestFn() {
    return (fn, msg, timeoutMs, intervalMs) => {
      console.log('Starting wait for', msg) // eslint-disable-line no-console

      if ( !timeoutMs ) {
        timeoutMs = DEFAULT_WAIT_TMIMEOUT
      }

      if ( !intervalMs ) {
        intervalMs = DEFAULT_WAIT_INTERVAL
      }

      return new Promise((resolve, reject) => {
        // Do a first check immediately
        if ( fn.apply(this) ) {
          console.log('Wait for', msg, 'done immediately') // eslint-disable-line no-console
          resolve(this)
        }

        const timeout = setTimeout(() => {
          console.log('Wait for', msg, 'timed out') // eslint-disable-line no-console
          clearInterval(interval)
          clearTimeout(timeout)
          reject(new Error(`Failed while: ${ msg }`))
        }, timeoutMs)

        const interval = setInterval(() => {
          if ( fn.apply(this) ) {
            console.log('Wait for', msg, 'done') // eslint-disable-line no-console
            clearInterval(interval)
            clearTimeout(timeout)
            resolve(this)
          } else {
            console.log('Wait for', msg, 'not done yet') // eslint-disable-line no-console
          }
        }, intervalMs)
      })
    }
  },

  waitForState() {
    return (state, timeout, interval) => {
      return this.waitForTestFn(() => {
        return (this.state || '').toLowerCase() === state.toLowerCase()
      }, `state=${ state }`, timeout, interval)
    }
  },

  viewInApi() {
    return () => {
      window.open(this.links.self, '_blank')
    }
  },

  promptRemove() {
    return (resources = this) => {
      this.$dispatch('promptRemove', resources)
    }
  },

  currentRoute() {
    return () => {
      if ( process.server ) {
        return this.$rootState.$route
      } else {
        return window.$nuxt.$route
      }
    }
  },

  currentRouter() {
    return () => {
      if ( process.server ) {
        return this.$rootState.$router
      } else {
        return window.$nuxt.$router
      }
    }
  },

  yamlForSave() {
    return (yaml) => {
      try {
        const obj = jsyaml.safeLoad(yaml)

        if (obj) {
          if (this._type) {
            obj._type = obj.type
          }

          return jsyaml.safeDump(obj)
        }
      } catch (e) {
        return null
      }
    }
  },

  followLink() {
    return (linkName, opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})[linkName]
      }

      if ( opt.urlSuffix ) {
        opt.url += opt.urlSuffix
      }

      if ( !opt.url ) {
        throw new Error(`Unknown link ${ linkName } on ${ this.type } ${ this.id }`)
      }

      return this.$dispatch('request', opt)
    }
  },

  goToEditYaml() {
    return () => {
      const location = this.detailLocation

      location.query = {
        ...location.query,
        [MODE]: _EDIT,
        [AS]:   _YAML
      }

      this.currentRouter().push(location)
    }
  },

  cloneYaml() {
    return (moreQuery = {}) => {
      const location = this.detailLocation

      location.query = {
        ...location.query,
        [MODE]: _CLONE,
        [AS]:   _YAML,
        ...moreQuery
      }

      this.currentRouter().push(location)
    }
  },

  goToViewYaml() {
    return () => {
      const location = this.detailLocation

      location.query = {
        ...location.query,
        [MODE]: _VIEW,
        [AS]:   _YAML
      }

      this.currentRouter().push(location)
    }
  },

  hasCondition() {
    return (condition, withStatus = 'True') => {
      if ( !this.status || !this.status.conditions ) {
        return false
      }

      const entry = findBy((this.status.conditions || []), 'type', condition)

      if ( !entry ) {
        return false
      }

      if ( !withStatus ) {
        return true
      }

      return (entry.status || '').toLowerCase() === `${ withStatus }`.toLowerCase()
    }
  },

  canDelete() {
    return this.hasLink('remove') && this.$rootGetters['type-map/optionsFor'](this.type).isRemovable
  },

  hasLink() {
    return (linkName) => {
      return !!this.linkFor(linkName)
    }
  },

  state() {
    return this.metadata?.state?.name || 'unknown'
  },

  stateDisplay() {
    return stateDisplay(this.state)
  },

  stateSort() {
    return stateSort(this.stateColor, this.stateDisplay)
  },

  download() {
    return async() => {
      const link = this.hasLink('rioview') ? 'rioview' : 'view'
      const value = await this.followLink(link, { headers: { accept: 'application/yaml' } })

      downloadFile(`${ this.nameDisplay }.yaml`, value.data, 'application/yaml')
    }
  },

  downloadBulk() {
    return async(items) => {
      const files = {}
      const names = []

      for ( const item of items ) {
        let name = `${ item.nameDisplay }.yaml`
        let i = 2

        while ( names.includes(name) ) {
          name = `${ item.nameDisplay }_${ i++ }.yaml`
        }

        names.push(name)
      }

      await eachLimit(items, 10, (item, idx) => {
        const link = item.hasLink('rioview') ? 'rioview' : 'view'

        return item.followLink(link, { headers: { accept: 'application/yaml' } } ).then((data) => {
          files[`resources/${ names[idx] }`] = data?.data || ''
        })
      })

      const zip = await generateZip(files)

      downloadFile('resources.zip', zip, 'application/zip')
    }
  },

  canYaml() {
    return this.hasLink('rioview') || this.hasLink('view')
  },

  _detailLocation() {
    const id = this.id?.replace(/.*\//, '')
    
    return {
      name:   `product-resource-id`,
      params: {
        product:   this.$rootGetters['productId'],
        resource:  this.type,
        id,
      }
    }
  },

  detailLocation() {
    return this._detailLocation
  },

  labels() {
    const all = this.metadata?.labels || {}

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, this.labelsToIgnoreRegexes)
    })
  },

  annotations() {
    const all = this.metadata?.annotations || {}

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, this.annotationsToIgnoreRegexes)
    })
  },

  description() {
    return this.metadata?.annotations?.[DESCRIPTION]
  },

  applyDefaults() {
    return () => {
    }
  },

  cleanForNew() {
    return () => {
      cleanForNew(this)
    }
  },

  // convert yaml to object, clean for new if creating/cloning
  // map _type to type
  cleanYaml() {
    return (yaml, mode = 'edit') => {
      try {
        const obj = jsyaml.safeLoad(yaml)

        if (mode !== 'edit') {
          cleanForNew(obj)
        }

        if (obj._type) {
          obj.type = obj._type
          delete obj._type
        }
        const out = jsyaml.safeDump(obj, { skipInvalid: true })

        return out
      } catch (e) {
        return null
      }
    }
  },

  goToEdit() {
    return (moreQuery = {}) => {
      const location = this.detailLocation

      location.query = {
        ...location.query,
        [MODE]: _EDIT,
        [AS]:   _UNFLAG,
        ...moreQuery
      }

      this.currentRouter().push(location)
    }
  },

  goToClone() {
    return (moreQuery = {}) => {
      const location = this.detailLocation

      location.query = {
        ...location.query,
        [MODE]: _CLONE,
        [AS]:   _UNFLAG,
        ...moreQuery
      }

      this.currentRouter().push(location)
    }
  },

  saveYaml() {
    return async(yaml) => {
      const parsed = jsyaml.safeLoad(yaml) // will throw on invalid yaml

      if ( this.schema?.attributes?.namespaced && !parsed.metadata.namespace ) {
        const err = this.$rootGetters['i18n/t']('resourceYaml.errors.namespaceRequired')

        throw err
      }

      let res
      const isCreate = !this.id
      const headers = {
        'content-type': 'application/yaml',
        accept:         'application/json',
      }

      if ( isCreate ) {
        res = await this.schema.followLink('collection', {
          method:  'POST',
          headers,
          data:   yaml
        })
      } else {
        const link = this.hasLink('rioupdate') ? 'rioupdate' : 'update'

        res = await this.followLink(link, {
          method:  'PUT',
          headers,
          data:   yaml
        })
      }

      // Steve used to return tables and still might, maybe?
      if ( res && res.kind !== 'Table') {
        await this.$dispatch(`load`, {
          data:     res,
          existing: (isCreate ? this : undefined)
        })
      }
    }
  },
}

export function stateSort(color, display) {
  color = color.replace(/^(text|bg)-/, '')

  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ display }`
}

export function colorForState(state, isError, isTransitioning) {
  if ( isError ) {
    return 'text-error'
  }

  if ( isTransitioning ) {
    return 'text-info'
  }

  const key = (state || 'active').toLowerCase()
  let color

  if ( STATES[key] && STATES[key].color ) {
    color = maybeFn.call(this, STATES[key].color)
  }

  if ( !color ) {
    color = DEFAULT_COLOR
  }

  return `text-${ color }`
}

export function stateDisplay(state) {
  // @TODO use translations
  const key = (state || 'active').toLowerCase()

  if ( REMAP_STATE[key] ) {
    return REMAP_STATE[key]
  }

  return key.split(/-/).map(ucFirst).join('-')
}

function maybeFn(val) {
  if ( isFunction(val) ) {
    return val(this)
  }

  return val
}
