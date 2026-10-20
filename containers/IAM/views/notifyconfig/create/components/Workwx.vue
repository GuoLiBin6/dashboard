<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    hideRequiredMark>
    <a-form-model-item :label="$t('system.wecom.corp_id')" prop="corp_id">
      <template v-slot:extra>
        <div>{{ $t('system.for_example') }}: ww2c41e47d2d3b13cb
          ，{{ $t('iam.help') }} <help-link :href="docUrl">{{ $t('common_386') }}</help-link>
        </div>
        <div class="mb-0">{{ $t('system.wecom.where_to_find_corp_id') }}</div>
      </template>
      <a-input v-model:value="form.corp_id" />
    </a-form-model-item>
    <a-form-model-item label="AgentId" prop="agent_id">
      <template v-slot:extra>
        <div>{{ $t('system.for_example') }}: 1000002</div>
        <div class="mb-0">{{ $t('system.wecom.where_to_find_agent_id') }}</div>
      </template>
      <a-input v-model:value="form.agent_id" />
    </a-form-model-item>
    <a-form-model-item label="Secret" prop="secret">
      <template v-slot:extra>
        <div>{{ $t('system.for_example') }}: ZgyVyfr2Mvd0zzy6bE5prfKX25k4Wrgn4-1DSVDYXVo</div>
        <div class="mb-0">{{ $t('system.wecom.where_to_find_secret') }}</div>
      </template>
      <a-input-password v-model:value="form.secret" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { DOCS_MAP } from '@/constants/docs'
export default {
  name: 'EnterpriseWeChat',
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
        corp_id: undefined,
        agent_id: undefined,
        secret: undefined,
      },
      rules: {
        corp_id: [
          { required: true, message: this.$t('system.corp_id_require_msg') },
        ],
        agent_id: [
          { required: true, message: this.$t('system.agent_id_require_msg') },
        ],
        secret: [
          { required: true, message: this.$t('system.secret_require_msg') },
        ],
      },
      contactData: null,
      href: DOCS_MAP.mailConfig('workwx'),
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
