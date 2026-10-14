<template>
  <div>
    <component :is="itemTag" :label="$t('network.text_368')" prop="redirect">
      <a-switch v-model:checked="redirectChecked" @change="onRedirectChange" />
    </component>
    <template v-if="redirectChecked">
      <component :is="itemTag" :label="$t('network.text_369')" prop="redirect_code">
        <a-radio-group v-model:value="fd.redirect_code">
          <a-radio-button v-for="(item, k) in $t('redirect_code')" :value="parseInt(k)" :key="k">
            {{item.name}}
            <a-tooltip placement="right" :title="item.description">
              <icon type="question" />
            </a-tooltip>
          </a-radio-button>
        </a-radio-group>
      </component>
      <component :is="itemTag" :label="$t('network.text_370')" prop="check" :rules="checkRules">
        <a-input-group compact>
          <a-row class="w-100">
            <a-col :span="4">
              <component :is="itemTag" class="mb-0" prop="redirect_scheme" :wrapperCol="{ span: 24 }">
                <a-select class="w-100" v-model:value="fd.redirect_scheme">
                  <a-select-option value="http">HTTP</a-select-option>
                  <a-select-option value="https">HTTPS</a-select-option>
                </a-select>
              </component>
            </a-col>
            <a-col :span="10">
              <component :is="itemTag" class="mb-0" prop="redirect_host" :wrapperCol="{ span: 24 }">
                <a-input v-model:value="fd.redirect_host" :placeholder="$t('network.text_371')" />
              </component>
            </a-col>
            <a-col :span="10">
              <component :is="itemTag" class="mb-0" prop="redirect_path" :rules="pathRules" :wrapperCol="{ span: 24 }">
                <a-input v-model:value="fd.redirect_path" :placeholder="$t('network.text_372')" />
              </component>
            </a-col>
          </a-row>
        </a-input-group>
      </component>
    </template>
  </div>
</template>

<script>
export default {
  name: 'LbRedirect',
  props: {
    form: {
      type: Object,
      required: true,
    },
    /** a-form-model：直接读写 form 对象字段（无 fc） */
    modelMode: {
      type: Boolean,
      default: false,
    },
    listenerType: {
      type: String,
    },
  },
  data () {
    return {
      fieldMap: {
        redirect: { name: 'redirect', valuePropName: 'checked' },
        redirect_code: { name: 'redirect_code', initialValue: 301 },
        redirect_scheme: { name: 'redirect_scheme', initialValue: 'http' },
        redirect_host: { name: 'redirect_host' },
        redirect_path: { name: 'redirect_path' },
        check: { name: 'check' },
      },
    }
  },
  computed: {
    itemTag () {
      return 'a-form-model-item'
    },
    fd () {
      return this.form.fd || this.form
    },
    redirectChecked: {
      get () {
        return !!this.fd.redirect
      },
      set (v) {
        this.fd.redirect = v
      },
    },
    pathRules () {
      return [
        {
          validator: (rule, value, callback) => {
            if (value && !/^\/(\w+\/?)+$/.test(value)) {
              callback(new Error(this.$t('network.text_373')))
            } else {
              callback()
            }
          },
          trigger: ['blur', 'change'],
        },
      ]
    },
    checkRules () {
      return [
        {
          validator: (rule, value, callback) => {
            const listenerType = this.listenerType || this.fd.listener_type
            const { redirect_scheme, redirect_host, redirect_path } = this.fd
            if (!listenerType) return callback()
            if (listenerType === redirect_scheme && !redirect_host && !redirect_path) {
              return callback(new Error(this.$t('network.text_374')))
            }
            return callback()
          },
        },
      ]
    },
  },
  created () {
    if (this.fd.redirect_code === undefined) this.fd.redirect_code = 301
    if (this.fd.redirect_scheme === undefined) this.fd.redirect_scheme = 'http'
    if (this.form.registered) {
      ;['redirect', 'redirect_code', 'redirect_scheme', 'redirect_host', 'redirect_path'].forEach((key) => {
        this.form.registered.add(key)
      })
      this.form.registered.add('check')
      if (!this.form.fieldOpts) this.form.fieldOpts = {}
      this.form.fieldOpts.check = {
        rules: [
          {
            validator: (rule, value, callback) => {
              const listenerType = this.listenerType || this.fd.listener_type
              const { redirect_scheme, redirect_host, redirect_path } = this.fd
              if (!this.fd.redirect) return callback()
              if (!listenerType) return callback()
              if (listenerType === redirect_scheme && !redirect_host && !redirect_path) {
                return callback(new Error(this.$t('network.text_374')))
              }
              return callback()
            },
          },
        ],
      }
      this.form.fieldOpts.redirect_path = { rules: this.pathRules }
    }
  },
  methods: {
    setFormField (key, value) {
      this.fd[key] = value
    },
    onRedirectChange (bool) {
      this.redirectChecked = bool
      this.$emit('redirectChange', bool)
      const redirectChange = this.$attrs && this.$attrs.onRedirectChange
      if (typeof redirectChange === 'function') {
        return redirectChange(bool)
      }
      this.$store.dispatch('common/updateObject', {
        name: 'lbRedirected',
        data: {
          isLbRedirected: bool,
        },
      })
    },
  },
}
</script>
