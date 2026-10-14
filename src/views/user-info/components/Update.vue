<template>
  <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
    <a-form-model-item :label="$t('scope.text_244')">
      {{ userInfo.name }}
    </a-form-model-item>
    <a-form-model-item :label="$t('scope.text_226')" prop="international_mobile">
      <mobile-input :value="form.international_mobile" @change="val => form.international_mobile = val" />
    </a-form-model-item>
    <a-form-model-item :label="$t('scope.text_204')" prop="email">
      <a-input v-model:value="form.email" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common_599')" prop="enabled_contact_types">
      <a-checkbox-group
        v-model:value="form.enabled_contact_types"
        :options="contactArrOpts" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { mapGetters } from 'vuex'
import { contactMap } from '@/constants'
import MobileInput from '@/sections/MobileInput'

export default {
  name: 'UserInfoUpdate',
  components: { MobileInput },
  props: {
    contacts: {
      required: true,
      type: Object,
    },
  },
  data () {
    return {
      contactArrOpts: [],
      form: {
        international_mobile: this.contacts.international_mobile || {},
        email: this.contacts.email || '',
        enabled_contact_types: this.contacts.enabled_contact_types || ['webconsole'],
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
          { required: true, message: this.$t('scope.text_228') },
          { validator: this.$validate('email') },
        ],
      },
      formItemLayout: {
        labelCol: {
          sm: { span: 5 },
        },
        wrapperCol: {
          sm: { span: 19 },
        },
      },
    }
  },
  computed: mapGetters(['userInfo']),
  created () {
    this.fetchConfig()
  },
  methods: {
    async getValues () {
      try {
        await this.$refs.formRef.validate()
        return { ...this.form }
      } catch (error) {
        throw error
      }
    },
    async fetchConfig () {
      try {
        const { data: { types } } = await new this.$Manager('receivers', 'v1').performClassAction({ action: 'get-types' })
        this.contactArrOpts = types.filter((item) => {
          return !item.includes('robot')
        }).map((item) => {
          return {
            label: contactMap[item].label,
            value: item,
            disabled: item === 'webconsole',
          }
        })
      } catch (error) {
        throw error
      }
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
