<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    v-bind="formItemLayout"
    hideRequiredMark>
    <a-form-model-item label="Access Key ID" prop="access_key_id">
      <template v-slot:extra>
        <div>
          {{$t('system.text_286')}}
          {{ $t('iam.help') }} <help-link :href="docUrl">{{ $t('common_386') }}</help-link>
        </div>
        <div class="mb-0">{{ $t('system.text_573') }}</div>
      </template>
      <a-input v-model:value="form.access_key_id" />
    </a-form-model-item>
    <a-form-model-item label="Access Key Secret" prop="access_key_secret">
      <template v-slot:extra>
        <div>{{$t('system.text_287')}}</div>
        <div class="mb-0">{{ $t('system.text_573') }}</div>
      </template>
      <a-input-password v-model:value="form.access_key_secret" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_288')" prop="signature">
      <template v-slot:extra>
        <div>{{$t('system.text_289')}}</div>
        <div class="mb-0">{{$t('system.text_574')}}</div>
      </template>
      <a-input v-model:value="form.signature" />
    </a-form-model-item>
    <a-collapse :border="false" v-model:activeKey="activeKey">
      <a-collapse-panel key="1" :header="$t('system.mobile_cn_tpl')">
        <a-form-model-item :label="$t('system.text_295')" prop="verifiyCode">
          <template v-slot:extra>
            <div>{{ $t('system.verify_code_tpl_extra_1') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_2') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_3') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_4') }}</div>
          </template>
          <a-input v-model:value="form.verifiyCode" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.alert_tpl')" prop="alertsCode">
          <template v-slot:extra>
            <div>{{ $t('system.alert_tpl_extra_1') }}</div>
            <div>{{ $t('system.alert_tpl_extra_2') }}</div>
            <div>{{ $t('system.alert_tpl_extra_3') }}</div>
            <div>{{ $t('system.alert_tpl_extra_4') }}</div>
          </template>
          <a-input v-model:value="form.alertsCode" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.error_login_tpl')" prop="errorCode">
          <template v-slot:extra>
            <div>{{ $t('system.error_login_tpl_extra_1') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_2') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_3') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_4') }}</div>
          </template>
          <a-input v-model:value="form.errorCode" />
        </a-form-model-item>
      </a-collapse-panel>
    </a-collapse>
    <a-collapse :border="false">
      <a-collapse-panel key="1" :header="$t('system.mobile_en_tpl')">
        <a-form-model-item :label="$t('system.text_295')" prop="verifiyCodeEn">
          <template v-slot:extra>
            <div>{{ $t('system.verify_code_tpl_extra_1') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_2') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_3') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_4') }}</div>
          </template>
          <a-input v-model:value="form.verifiyCodeEn" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.alert_tpl')" prop="alertsCodeEn">
          <template v-slot:extra>
            <div>{{ $t('system.alert_tpl_extra_1') }}</div>
            <div>{{ $t('system.alert_tpl_extra_2') }}</div>
            <div>{{ $t('system.alert_tpl_extra_3') }}</div>
            <div>{{ $t('system.alert_tpl_extra_4') }}</div>
          </template>
          <a-input v-model:value="form.alertsCodeEn" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.error_login_tpl')" prop="errorCodeEn">
          <template v-slot:extra>
            <div>{{ $t('system.error_login_tpl_extra_1') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_2') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_3') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_4') }}</div>
          </template>
          <a-input v-model:value="form.errorCodeEn" />
        </a-form-model-item>
      </a-collapse-panel>
    </a-collapse>
  </a-form-model>
</template>

<script>
import { showDocsLink } from '@/constants/docs'
export default {
  name: 'smsaliyun',
  props: {
    formItemLayout: {
      required: true,
      type: Object,
    },
    offsetWrapperCol: {
      required: true,
      type: Object,
    },
    loading: Boolean,
    docUrl: String,
  },
  data () {
    return {
      showDocsLink,
      submiting: false,
      testLoding: false,
      activeKey: ['1'],
      form: {
        access_key_id: undefined,
        access_key_secret: undefined,
        signature: undefined,
        verifiyCode: undefined,
        alertsCode: undefined,
        errorCode: undefined,
        verifiyCodeEn: undefined,
        alertsCodeEn: undefined,
        errorCodeEn: undefined,
      },
      rules: {
        access_key_id: [
          { required: true, message: this.$t('system.text_291') },
        ],
        access_key_secret: [
          { required: true, message: this.$t('system.text_292') },
        ],
        signature: [
          { required: true, message: this.$t('system.text_293') },
        ],
        verifiyCode: [
          { required: true, message: this.$t('notify.smshuawei.verify_code_channel.prompt') },
        ],
      },
    }
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
  },
}
</script>
