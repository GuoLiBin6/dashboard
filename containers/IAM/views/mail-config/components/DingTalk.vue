<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    v-bind="formItemLayout">
    <contact-tips
      :before="$t('system.dingding.before')"
      :after="$t('system.dingding.after')"
      :href="href"
      :hrefText="$t('system.detail')" />
    <a-form-model-item label="AgentId" prop="agent_id">
      <template v-slot:extra>
        <div>{{$t('system.text_257')}}</div>
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
  name: 'DingTalkConfig',
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
    this.fetchData()
  },
  methods: {
    async fetchData () {
      this.$emit('update:loading', true)
      try {
        const response = await this.manager.list({
          params: {
            type: 'dingtalk',
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
      this.submiting = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (this.contactData && this.contactData.id) {
          await this.manager.update({
            id: this.contactData.id,
            data: {
              content: values,
              type: 'dingtalk',
            },
          })
        } else {
          await this.manager.create({
            data: {
              content: values,
              type: 'dingtalk',
            },
          })
        }
        await this.fetchData()
        this.$message.success(this.$t('system.text_264'))
      } catch (error) {
        this.$message.error(this.$t('common_622', [this.$t('system.text_136')]))
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
            type: 'dingtalk',
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
