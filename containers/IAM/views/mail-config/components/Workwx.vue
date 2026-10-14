<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    v-bind="formItemLayout">
    <contact-tips
      :before="$t('system.workwx.before')"
      :after="$t('system.workwx.after')"
      :href="href"
      :hrefText="$t('system.detail')" />
    <a-form-model-item :label="$t('system.wecom.corp_id')" prop="corp_id">
      <template v-slot:extra>
        <div>{{ $t('system.for_example') }}: ww2c41e47d2d3b13cb</div>
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
    <a-form-model-item :wrapper-col="offsetWrapperCol">
      <a-button type="primary" @click="handleSubmit" :loading="submiting">{{ $t('common.ok') }}</a-button>
      <test-button v-if="false" class="ml-3" :post="testPost" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import TestButton from '@/sections/TestButton'
import { DOCS_MAP } from '@/constants/docs'
export default {
  name: 'EnterpriseWeChat',
  components: {
    TestButton,
  },
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
          { required: true, message: '请输入企业ID' },
        ],
        agent_id: [
          { required: true, message: '请输入 AgentId' },
        ],
        secret: [
          { required: true, message: '请输入 Secret' },
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
    this.fetchData()
  },
  methods: {
    async fetchData () {
      this.$emit('update:loading', true)
      try {
        const response = await this.manager.list({
          params: {
            type: 'workwx',
          },
        })
        const data = response.data.data[0] || {}
        this.contactData = data
        this.$nextTick(() => {
          Object.assign(this.form, data.content || {})
        })
      } catch (error) {
        throw error
      } finally {
        this.$emit('update:loading', false)
      }
    },
    async handleSubmit () {
      await this.$refs.formRef.validate()
      const values = { ...this.form }
      try {
        this.submiting = true
        if (this.contactData && this.contactData.id) {
          await this.manager.update({
            id: this.contactData.id,
            data: {
              content: values,
              type: 'workwx',
            },
          })
        } else {
          await this.manager.create({
            data: {
              content: values,
              type: 'workwx',
            },
          })
        }
        await this.fetchData()
        this.$message.success(this.$t('system.text_124', [this.$t('system.wecom.1')]))
      } catch (error) {
        this.$message.error(this.$t('common_622', [this.$t('system.wecom.1')]))
        throw error
      } finally {
        this.submiting = false
      }
    },
    async testPost () {
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        await new this.$Manager('notifyconfigs', 'v1').performClassAction({
          action: 'validate',
          data: {
            content: values,
            type: 'workwx',
          },
        })
      } catch (error) {
        this.$message.error(this.$t('common_623', [this.$t('common_269')]))
        throw error
      }
    },
  },
}
</script>
