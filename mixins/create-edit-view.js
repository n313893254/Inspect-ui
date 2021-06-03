import { _CREATE, _EDIT, _VIEW } from '@/config/query-params'
import ChildHook, { BEFORE_SAVE_HOOKS } from './child-hook'
import { exceptionToErrorsArray } from '@/utils/error'

export default {
  mixins: [ChildHook],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    originalValue: {
      type:     Object,
      default: null,
    },

    moreDetails: {
      type:    Array,
      default: null
    }
  },

  data() {
    return {
      errors: [],
    }
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE
    },

    isEdit() {
      return this.mode === _EDIT
    },

    isView() {
      return this.mode === _VIEW
    },

    schema() {
      return this.$store.getters[`${this.scope}/schemaFor`](this.value.type)
    },
  },

  methods: {
    done() {
      if ( !this.doneRoute ) {
        return
      }

      this.$router.replace({
        name:   this.doneRoute,
        params: this.doneParams || { resource: this.value.type }
      })
    },

    async save(buttonDone, url) {
      this.errors = null
      try {
        await this.applyHooks(BEFORE_SAVE_HOOKS)

        // Remove the labels map if it's empty
        if ( this.value?.metadata?.labels && Object.keys(this.value.metadata.labels || {}).length === 0 ) {
          delete this.value.metadata.labels
        }

        // Remove the annotations map if it's empty
        if ( this.value?.metadata?.annotations && Object.keys(this.value.metadata.annotations || {}).length === 0 ) {
          delete this.value.metadata.annotations
        }

        await this.actuallySave(url)
        buttonDone(true)
        this.done()
      } catch (err) {
        this.errors = exceptionToErrorsArray(err)
        buttonDone(false)
      }
    },

    async actuallySave(url) {
      if ( this.isCreate ) {
        url = url || this.schema.linkFor('collection')

        const res = await this.value.save({ url })

        if (res) {
          Object.assign(this.value, res)
        }
      } else {
        await this.value.save()
      }
    }
  },
}