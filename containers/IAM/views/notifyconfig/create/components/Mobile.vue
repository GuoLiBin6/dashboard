<template>
  <a-form-model
    ref="formRef"
    :model="form.fd"
    :rules="rules"
    hideRequiredMark>
    <a-form-model-item :label="$t('notify.configs.sms_driver')" prop="sms_driver">
      <a-radio-group v-model:value="form.fd.sms_driver">
        <a-radio-button
          v-for="item in driverOpts"
          :value="item.key"
          :key="item.key">
          {{ item.label }}
        </a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <component
      ref="typeRef"
      :is="form.fd.sms_driver"
      :doc-url="docUrl" />
  </a-form-model>
</template>

<script>
import smsaliyun from './smsaliyun'
import smshuawei from './smshuawei'

export default {
  name: 'MobileConfig',
  components: {
    smsaliyun,
    smshuawei,
  },
  props: {
    offsetWrapperCol: {
      required: true,
      type: Object,
    },
    loading: Boolean,
    docUrl: String,
  },
  data () {
    return {
      submiting: false,
      testLoding: false,
      form: {
        fd: {
          sms_driver: 'smsaliyun',
        },
      },
      rules: {
        sms_driver: [
          { required: true, message: this.$t('common.select') },
        ],
      },
      driverOpts: [
        { label: this.$t('providers.aliyun'), key: 'smsaliyun' },
        { label: this.$t('providers.huawei'), key: 'smshuawei' },
      ],
    }
  },
  computed: {
    is_aliyun () {
      return this.form.fd.sms_driver === 'smsaliyun'
    },
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      const { typeRef } = this.$refs
      const driverValues = await typeRef.validateForm()
      return {
        sms_driver: this.form.fd.sms_driver,
        ...driverValues,
      }
    },
  },
}
</script>
