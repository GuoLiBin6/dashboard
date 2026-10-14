<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    v-bind="formItemLayout"
    hideRequiredMark>
    <a-form-model-item label="AppID" prop="app_id">
      <template v-slot:extra>
        <div>{{$t('system.text_279')}}
          ，{{ $t('iam.help') }} <help-link :href="docUrl">{{ $t('common_386') }}</help-link>
        </div>
        <div class="mb-0">{{ $t('system.text_571') }}</div>
      </template>
      <a-input v-model:value="form.app_id" />
    </a-form-model-item>
    <a-form-model-item label="AppSecret" prop="app_secret">
      <template v-slot:extra>
        <div>{{$t('system.text_280')}}</div>
        <div class="mb-0">{{ $t('system.text_571') }}</div>
      </template>
      <a-input-password v-model:value="form.app_secret" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { DOCS_MAP } from '@/constants/docs'
export default {
  name: 'FeishuConfig',
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
      submiting: false,
      form: {
        app_id: undefined,
        app_secret: undefined,
      },
      rules: {
        app_id: [
          { required: true, message: this.$t('system.text_281') },
        ],
        app_secret: [
          { required: true, message: this.$t('system.text_263') },
        ],
      },
      contactData: null,
      href: DOCS_MAP.mailConfig('feishu'),
    }
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('notifyconfigs', 'v1')
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
  },
}
</script>
