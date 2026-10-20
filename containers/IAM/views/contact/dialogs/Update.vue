<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('system.text_141', [$t('system.text_317')])}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :action="$t('system.text_142')" :name="$t('system.text_317')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 5)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('system.text_131')" prop="international_mobile">
          <mobile-input :value="form.international_mobile" @change="v => { form.international_mobile = v }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.text_132')" prop="email">
          <a-input v-model:value="form.email" />
        </a-form-model-item>
        <a-form-model-item prop="enabled_contact_types">
          <template #label>
            {{ $t('common_599') }}
            <a-tooltip placement="top">
              <template #title>{{ $t('system.contact') }}</template>
              <icon type="info-circle" />
            </a-tooltip>
          </template>
          <a-checkbox-group
            v-model:value="form.enabled_contact_types"
            :options="contactArrOpts" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { contactMap } from '@/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import MobileInput from '@/sections/MobileInput'
import { findAndUnshift } from '@/utils/utils'

export default {
  name: 'ContactUpdateDialog',
  components: { MobileInput },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const row = this.params.data[0] || {}
    return {
      loading: false,
      form: {
        international_mobile: row.international_mobile || { mobile: '', area_code: '86' },
        email: row.email || '',
        enabled_contact_types: row.enabled_contact_types || [],
      },
      rules: {
        international_mobile: [
          {
            type: 'object',
            required: true,
          },
          { validator: this.checkInternationalMobile },
        ],
        email: [
          {
            required: true,
            message: this.$t('system.text_139'),
            whitespace: true,
          },
          {
            validator: this.$validate('email'),
            message: this.$t('system.text_140'),
            whitespace: true,
          },
        ],
      },
      contactArrOpts: [],
    }
  },
  unmounted () {
    this.manager = null
  },
  created () {
    const domain_id = this.params.data[0]?.domain_id
    this.manager = new this.$Manager('receivers', 'v1')
    this.generateContactArrOpts({ domain_ids: [domain_id] })
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { email, international_mobile, enabled_contact_types } = this.form
        const data = {
          email,
          international_mobile,
          enabled_contact_types,
          force_verified: true,
        }
        await this.manager.update({
          id: this.params.data[0].id,
          data,
        })
        this.loading = false
        this.params.success()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    async generateContactArrOpts (params) {
      let config_contact_types = []
      try {
        config_contact_types = await this.fetchConfig(params)
      } catch (error) {
        throw error
      }
      const contactArrOpts = config_contact_types.filter((item) => {
        return !item.includes('robot')
      }).map((item) => {
        return {
          label: contactMap[item].label || item,
          value: item,
          disabled: item === 'webconsole',
        }
      })
      this.contactArrOpts = contactArrOpts
    },
    fetchConfig (params) {
      return new Promise((resolve, reject) => {
        new this.$Manager('receivers', 'v1').performClassAction({ action: 'get-types', data: params }).then((res) => {
          const { types } = res.data
          const sortData = findAndUnshift(types, item => item === 'webconsole')
          resolve(sortData)
        }).catch((err) => {
          reject(err)
        })
      })
    },
    checkInternationalMobile (rule, value, callback) {
      if (!value.mobile) {
        callback(this.$t('system.text_138'))
      }
      if (!/^[0-9-]{6,14}$/.test(value.mobile)) {
        callback(this.$t('validator.phone'))
      }
      if (!value.area_code) {
        callback(this.$t('system.country_code'))
      }
      callback()
    },
  },
}
</script>
