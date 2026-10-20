<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('system.text_130', [$t('system.text_317')]) }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item v-if="isAdminMode" :label="$t('dictionary.domain')" prop="domain">
          <base-select
            style="width: 300px;"
            v-model:value="form.domain"
            resource="domains"
            version="v1"
            remote
            :isDefaultSelect="true"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ placeholder: $t('rules.domain'), allowClear: true }"
            @change="handleDomainChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.user')" prop="user">
          <base-select
            style="width: 300px;"
            v-model:value="form.user"
            resource="users"
            version="v1"
            remote
            :isDefaultSelect="true"
            :needParams="true"
            :params="userParams"
            :mapper="mapperUserData"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ placeholder: $t('rules.user'), allowClear: true }" />
        </a-form-model-item>
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
import { mapGetters } from 'vuex'
import { contactMap } from '@/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import MobileInput from '@/sections/MobileInput'
import { findAndUnshift } from '@/utils/utils'

export default {
  name: 'ContactCreateDialog',
  components: { MobileInput },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      userParams: {
        limit: 20,
        is_system_account: false,
        have_contacts: false,
        scope: this.$store.getters.scope,
      },
      form: {
        domain: undefined,
        user: undefined,
        international_mobile: { mobile: '', area_code: '86' },
        email: '',
        enabled_contact_types: ['webconsole'],
      },
      rules: {
        user: [
          {
            required: true,
            message: this.$t('rules.user'),
            whitespace: true,
          },
        ],
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
      userOptions: [],
      receiverUserIds: [],
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'scope', 'userInfo']),
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('receivers', 'v1')
    this.generateContactArrOpts()
    this.fetchReceivers()
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { user: uid, domain, email, international_mobile, enabled_contact_types } = this.form
        const data = {
          uid,
          email,
          international_mobile,
          domain,
          enabled_contact_types,
          force_verified: true,
        }
        await this.manager.create({
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
    handleDomainChange (val) {
      this.form.user = ''
      this.userParams = {
        limit: 20,
        is_system_account: false,
        have_contacts: false,
        scope: this.$store.getters.scope,
        domain_id: val,
      }
      this.generateContactArrOpts({ domain_ids: [val] })
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
    async fetchReceivers () {
      const receiverManager = new this.$Manager('receivers', 'v1')
      try {
        const params = { scope: this.scope, force_no_paging: true }
        const receiverRes = await receiverManager.list({ params })
        const receivers = receiverRes.data.data
        const receiverUserIds = receivers.map((item) => { return item.id })
        this.receiverUserIds = receiverUserIds
      } catch (error) {
        throw error
      }
    },
    mapperUserData (list) {
      return list.map(item => {
        if (this.receiverUserIds.includes(item.id)) {
          item.__disabled = true
        }
        return item
      }).sort((a, b) => a.__disabled ? 1 : -1)
    },
  },
}
</script>
