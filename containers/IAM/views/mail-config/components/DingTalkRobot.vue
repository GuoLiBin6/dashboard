<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules">
    <a-form-model-item label="webhook" prop="webhook">
      <template v-slot:extra>
        <div>{{$t('system.text_265')}}</div>
        <div class="mb-0">{{$t('system.dingdingrobot.help')}}</div>
      </template>
      <a-input v-model:value="form.webhook" />
    </a-form-model-item>
    <a-form-model-item :wrapper-col="offsetWrapperCol">
      <a-button type="primary" @click="handleSubmit" :loading="submiting">{{ $t('common.ok') }}</a-button>
      <test-button v-if="false" class="ml-3" :post="testPost" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import TestButton from '@/sections/TestButton'
export default {
  name: 'DingTalkRobotConfig',
  components: {
    TestButton,
  },
  props: {
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
        webhook: undefined,
      },
      rules: {
        webhook: [
          { required: true, message: this.$t('system.text_267') },
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
    this.fetchData()
  },
  methods: {
    async fetchData () {
      this.$emit('update:loading', true)
      try {
        const response = await this.manager.list({
          params: {
            type: 'dingtalk-robot',
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
              type: 'dingtalk-robot',
            },
          })
        } else {
          await this.manager.create({
            data: {
              content: values,
              type: 'dingtalk-robot',
            },
          })
        }
        await this.fetchData()
        this.$message.success(this.$t('system.text_124', [this.$t('system.text_137')]))
      } catch (error) {
        this.$message.error(this.$t('common_622', [this.$t('system.text_137')]))
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
            type: 'dingtalk-robot',
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
