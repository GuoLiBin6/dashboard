<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    hideRequiredMark>
    <a-form-model-item label="Application Key" prop="access_key_id">
      <template v-slot:extra>
        <div>
          {{$t('notify.smshuawei.application_key.example')}}
          {{ $t('iam.help') }} <help-link :href="docUrl">{{ $t('common_386') }}</help-link>
        </div>
        <div class="mb-0">{{ $t('notify.smshuawei.application_key.guid') }}</div>
      </template>
      <a-input v-model:value="form.access_key_id" />
    </a-form-model-item>
    <a-form-model-item label="Application Secret" prop="access_key_secret">
      <template v-slot:extra>
        <div>{{$t('notify.smshuawei.application_secret.example')}}</div>
        <div class="mb-0">{{ $t('notify.smshuawei.application_secret.guid') }}</div>
      </template>
      <a-input-password v-model:value="form.access_key_secret" />
    </a-form-model-item>
    <a-form-model-item :label="$t('notify.smshuawei.app_access_url')" prop="service_url">
      <template v-slot:extra>
        <div>{{$t('notify.smshuawei.service_url.example')}}</div>
        <div class="mb-0">{{$t('notify.smshuawei.service_url.guid')}}</div>
      </template>
      <a-input v-model:value="form.service_url" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_288')" prop="signature">
      <template v-slot:extra>
        <div>{{$t('notify.smshuawei.signature.example')}}</div>
        <div class="mb-0">{{$t('notify.smshuawei.signature.guid')}}</div>
      </template>
      <a-input v-model:value="form.signature" />
    </a-form-model-item>
    <a-collapse :border="false" v-model:activeKey="activeKey">
      <a-collapse-panel key="1" :header="$t('system.mobile_cn_tpl')">
        <a-form-model-item :label="$t('system.text_295')">
          <template v-slot:extra>
            <div>{{ $t('notify.smshuawei.template.verify_code.example') }}</div>
            <div>{{ $t('notify.smshuawei.template.verify_code.guid') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_3') }}</div>
            <div>{{ $t('notify.smshuawei.template.verify_code.template') }}</div>
          </template>
          <a-input-group>
            <a-row :gutter="8">
              <a-col :span="12">
                <a-form-model-item prop="verifiyCode" class="mb-0">
                  <a-input v-model:value="form.verifiyCode" :placeholder="$t('notify.smshuawei.template_id.placeholder')" />
                </a-form-model-item>
              </a-col>
              <a-col :span="12">
                <a-form-model-item prop="verifiyCodeChannel" class="mb-0">
                  <a-input v-model:value="form.verifiyCodeChannel" :placeholder="$t('notify.smshuawei.channel_no.placeholder')" />
                </a-form-model-item>
              </a-col>
            </a-row>
          </a-input-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('system.alert_tpl')">
          <template v-slot:extra>
            <div>{{ $t('notify.smshuawei.template.alarm_message.example') }}</div>
            <div>{{ $t('notify.smshuawei.template.alarm_message.guid') }}</div>
            <div>{{ $t('system.alert_tpl_extra_3') }}</div>
            <div>{{ $t('notify.smshuawei.template.alarm_message.template') }}</div>
          </template>
          <a-input-group>
            <a-row :gutter="8">
              <a-col :span="12">
                <a-form-model-item prop="alertsCode" class="mb-0">
                  <a-input v-model:value="form.alertsCode" :placeholder="$t('notify.smshuawei.template_id.placeholder')" />
                </a-form-model-item>
              </a-col>
              <a-col :span="12">
                <a-form-model-item prop="alertsCodeChannel" class="mb-0">
                  <a-input v-model:value="form.alertsCodeChannel" :placeholder="$t('notify.smshuawei.channel_no.placeholder')" />
                </a-form-model-item>
              </a-col>
            </a-row>
          </a-input-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('system.error_login_tpl')">
          <template v-slot:extra>
            <div>{{ $t('notify.smshuawei.template.abnormal_login.example') }}</div>
            <div>{{ $t('notify.smshuawei.template.abnormal_login.guid') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_3') }}</div>
            <div>{{ $t('notify.smshuawei.template.abnormal_login.template') }}</div>
          </template>
          <a-input-group>
            <a-row :gutter="8">
              <a-col :span="12">
                <a-form-model-item prop="errorCode" class="mb-0">
                  <a-input v-model:value="form.errorCode" :placeholder="$t('notify.smshuawei.template_id.placeholder')" />
                </a-form-model-item>
              </a-col>
              <a-col :span="12">
                <a-form-model-item prop="errorCodeChannel" class="mb-0">
                  <a-input v-model:value="form.errorCodeChannel" :placeholder="$t('notify.smshuawei.channel_no.placeholder')" />
                </a-form-model-item>
              </a-col>
            </a-row>
          </a-input-group>
        </a-form-model-item>
      </a-collapse-panel>
    </a-collapse>
    <a-collapse :border="false">
      <a-collapse-panel key="1" :header="$t('system.mobile_en_tpl')">
        <a-form-model-item :label="$t('system.text_295')">
          <template v-slot:extra>
            <div>{{ $t('notify.smshuawei.template.verify_code.en.example') }}</div>
            <div>{{ $t('notify.smshuawei.template.verify_code.en.guid') }}</div>
            <div>{{ $t('system.verify_code_tpl_extra_3') }}</div>
            <div>{{ $t('notify.smshuawei.template.verify_code.en.template') }}</div>
          </template>
          <a-input-group>
            <a-row :gutter="8">
              <a-col :span="12">
                <a-form-model-item prop="verifiyCodeEn" class="mb-0">
                  <a-input v-model:value="form.verifiyCodeEn" :placeholder="$t('notify.smshuawei.template_id.placeholder')" />
                </a-form-model-item>
              </a-col>
              <a-col :span="12">
                <a-form-model-item prop="verifiyCodeEnChannel" class="mb-0">
                  <a-input v-model:value="form.verifiyCodeEnChannel" :placeholder="$t('notify.smshuawei.channel_no.placeholder')" />
                </a-form-model-item>
              </a-col>
            </a-row>
          </a-input-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('system.alert_tpl')">
          <template v-slot:extra>
            <div>{{ $t('notify.smshuawei.template.alarm_message.en.example') }}</div>
            <div>{{ $t('notify.smshuawei.template.alarm_message.en.guid') }}</div>
            <div>{{ $t('system.alert_tpl_extra_3') }}</div>
            <div>{{ $t('notify.smshuawei.template.alarm_message.en.template') }}</div>
          </template>
          <a-input-group>
            <a-row :gutter="8">
              <a-col :span="12">
                <a-form-model-item prop="alertsCodeEn" class="mb-0">
                  <a-input v-model:value="form.alertsCodeEn" :placeholder="$t('notify.smshuawei.template_id.placeholder')" />
                </a-form-model-item>
              </a-col>
              <a-col :span="12">
                <a-form-model-item prop="alertsCodeEnChannel" class="mb-0">
                  <a-input v-model:value="form.alertsCodeEnChannel" :placeholder="$t('notify.smshuawei.channel_no.placeholder')" />
                </a-form-model-item>
              </a-col>
            </a-row>
          </a-input-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('system.error_login_tpl')">
          <template v-slot:extra>
            <div>{{ $t('notify.smshuawei.template.abnormal_login.en.example') }}</div>
            <div>{{ $t('notify.smshuawei.template.abnormal_login.en.guid') }}</div>
            <div>{{ $t('system.error_login_tpl_extra_3') }}</div>
            <div>{{ $t('notify.smshuawei.template.abnormal_login.en.template') }}</div>
          </template>
          <a-input-group>
            <a-row :gutter="8">
              <a-col :span="12">
                <a-form-model-item prop="errorCodeEn" class="mb-0">
                  <a-input v-model:value="form.errorCodeEn" :placeholder="$t('notify.smshuawei.template_id.placeholder')" />
                </a-form-model-item>
              </a-col>
              <a-col :span="12">
                <a-form-model-item prop="errorCodeEnChannel" class="mb-0">
                  <a-input v-model:value="form.errorCodeEnChannel" :placeholder="$t('notify.smshuawei.channel_no.placeholder')" />
                </a-form-model-item>
              </a-col>
            </a-row>
          </a-input-group>
        </a-form-model-item>
      </a-collapse-panel>
    </a-collapse>
  </a-form-model>
</template>

<script>
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
export default {
  name: 'smshuawei',
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
      DOCS_MAP,
      showDocsLink,
      submiting: false,
      testLoding: false,
      activeKey: ['1'],
      form: {
        access_key_id: undefined,
        access_key_secret: undefined,
        service_url: undefined,
        signature: undefined,
        verifiyCode: undefined,
        verifiyCodeChannel: undefined,
        alertsCode: undefined,
        alertsCodeChannel: undefined,
        errorCode: undefined,
        errorCodeChannel: undefined,
        verifiyCodeEn: undefined,
        verifiyCodeEnChannel: undefined,
        alertsCodeEn: undefined,
        alertsCodeEnChannel: undefined,
        errorCodeEn: undefined,
        errorCodeEnChannel: undefined,
      },
      rules: {
        access_key_id: [
          { required: true, message: this.$t('notify.smshuawei.application_key.prompt') },
        ],
        access_key_secret: [
          { required: true, message: this.$t('notify.smshuawei.application_secret.prompt') },
        ],
        service_url: [
          { required: true, message: this.$t('notify.smshuawei.service_url.prompt') },
        ],
        signature: [
          { required: true, message: this.$t('system.text_293') },
        ],
        verifiyCode: [
          { required: true, message: this.$t('notify.smshuawei.verify_code_channel.prompt') },
        ],
        verifiyCodeChannel: [
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
