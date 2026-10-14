<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    v-bind="formItemLayout"
    hideRequiredMark>
    <a-form-model-item :label="$t('system.text_269')" prop="hostname">
      <a-input v-model:value="form.hostname" />
    </a-form-model-item>
    <a-form-model-item label="SSL" prop="ssl_global">
      <a-switch :checkedChildren="$t('system.text_134')" :unCheckedChildren="$t('system.text_135')" v-model:checked="form.ssl_global" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_270')" prop="hostport">
      <a-input-number v-model:value="form.hostport" :min="1" :max="65535" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_126')" prop="username">
      <a-input v-model:value="form.username" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_221')" prop="password">
      <a-input-password v-model:value="form.password" />
    </a-form-model-item>
    <a-form-model-item :label="$t('iam.sender_address')" prop="sender_address">
      <div slot="extra">
        {{ $t('iam.notifyconfig.sender_address_extra') }}
      </div>
      <a-input v-model:value="form.sender_address" />
    </a-form-model-item>
    <a-form-model-item v-if="false">
      <a-button type="primary" @click="handleSubmit" :loading="submiting">{{ $t('common.ok') }}</a-button>
      <test-button v-if="false" class="ml-3" :post="testPost" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import TestButton from '@/sections/TestButton'
export default {
  name: 'EmailConfig',
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
        hostname: undefined,
        ssl_global: false,
        hostport: '465',
        username: undefined,
        password: undefined,
        sender_address: undefined,
      },
      rules: {
        hostname: [
          { required: true, message: this.$t('system.text_271') },
        ],
        hostport: [
          { required: true, message: this.$t('system.text_272') },
        ],
        username: [
          { required: true, message: this.$t('system.text_238') },
        ],
        password: [
          { required: true, message: this.$t('system.text_239') },
        ],
        sender_address: [
          { required: true, message: this.$t('common.field_required_placeholder', [this.$t('iam.sender_address')]) },
          { validator: this.$validate('email') },
        ],
      },
      contactData: null,
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
    async handleSubmit () {
      const values = await this.validateForm()
      try {
        this.submiting = true
        await this.manager.create({
          data: {
            content: values,
            type: 'email',
          },
        })
        this.$message.success(this.$t('system.text_124', [this.$t('system.text_302')]))
      } catch (error) {
        this.$message.error(this.$t('common_622', [this.$t('system.text_302')]))
        throw error
      } finally {
        this.submiting = false
      }
    },
    async testPost () {
      try {
        const values = await this.validateForm()
        await new this.$Manager('notifyconfigs', 'v1').performClassAction({
          action: 'validate',
          data: {
            content: values,
            type: 'email',
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
