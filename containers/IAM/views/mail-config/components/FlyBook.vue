<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules"
    v-bind="formItemLayout">
    <contact-tips
      :before="$t('system.feishu.before')"
      :after="$t('system.feishu.after')"
      :href="href"
      :hrefText="$t('system.detail')" />
    <a-form-model-item label="AppId" prop="app_id">
      <template v-slot:extra>
        <div>{{$t('system.text_279')}}</div>
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
  name: 'FlyBookConfig',
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
    this.fetchData()
  },
  methods: {
    async fetchData () {
      this.$emit('update:loading', true)
      try {
        const response = await this.manager.list({
          params: {
            type: 'feishu',
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
              type: 'feishu',
            },
          })
        } else {
          await this.manager.create({
            data: {
              content: values,
              type: 'feishu',
            },
          })
        }
        await this.fetchData()
        this.$message.success(this.$t('system.text_124', [this.$t('system.text_133')]))
      } catch (error) {
        this.$message.error(this.$t('common_622', [this.$t('system.text_133')]))
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
            type: 'feishu',
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
