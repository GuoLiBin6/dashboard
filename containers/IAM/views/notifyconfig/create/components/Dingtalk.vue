<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    hideRequiredMark>
    <a-form-model-item label="AgentId" prop="agent_id">
      <template v-slot:extra>
        <div>{{$t('system.text_257')}}
          ，{{ $t('iam.help') }} <help-link :href="docUrl">{{ $t('common_386') }}</help-link>
        </div>
        <div class="mb-0">{{$t('system.text_568')}}</div>
      </template>
      <a-input v-model:value="form.agent_id" />
    </a-form-model-item>
    <a-form-model-item label="AppKey" prop="app_key">
      <template v-slot:extra>
        <div>{{$t('system.text_259')}}</div>
        <div class="mb-0">{{$t('system.text_569')}}</div>
      </template>
      <a-input v-model:value="form.app_key" />
    </a-form-model-item>
    <a-form-model-item label="AppSecret" prop="app_secret">
      <template v-slot:extra>
        <div>{{$t('system.text_260')}}</div>
        <div class="mb-0">{{$t('system.text_569')}}</div>
      </template>
      <a-input-password v-model:value="form.app_secret" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { DOCS_MAP } from '@/constants/docs'
export default {
  name: 'DingtalkConfig',
  props: {
    loading: Boolean,
    docUrl: String,
  },
  data () {
    return {
      submiting: false,
      form: {
        agent_id: undefined,
        app_key: undefined,
        app_secret: undefined,
      },
      rules: {
        agent_id: [
          { required: true, message: this.$t('system.text_261') },
        ],
        app_key: [
          { required: true, message: this.$t('system.text_262') },
        ],
        app_secret: [
          { required: true, message: this.$t('system.text_263') },
        ],
      },
      contactData: null,
      href: DOCS_MAP.mailConfig('dingtalk'),
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
