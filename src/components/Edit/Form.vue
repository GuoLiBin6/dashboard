<template>
  <a-form
    ref="form"
    :model="form"
    :rules="rules"
    :style="{ width: `${width}px` }"
    v-bind="formLayout">
    <a-form-item v-if="inputType === 'input'" :label="label" name="input">
      <a-input class="w-100" v-model:value="form.input" :placeholder="placeholder" allow-clear />
    </a-form-item>
    <a-form-item v-else-if="inputType === 'inputNumber'" :label="label" name="input">
      <a-input-number class="w-100" v-model:value="form.input" :min="numberMin" :placeholder="placeholder" />
    </a-form-item>
    <div class="text-right">
      <a-button type="primary" @click.prevent="handleSubmit">{{ okText }}</a-button>
      <a-button class="ml-3" @click.prevent="cancel">{{ cancelText }}</a-button>
    </div>
  </a-form>
</template>

<script>
import * as R from 'ramda'
import { validateModelForm } from '@/utils/validate'
import i18n from '@/locales'

export default {
  name: 'EditForm',
  props: {
    width: {
      type: Number,
      default: 400,
    },
    formLayout: {
      type: Object,
      default: () => ({
        wrapperCol: { span: 19 },
        labelCol: { span: 5 },
      }),
    },
    label: {
      type: String,
      default: i18n.t('common.name'),
    },
    defaultValue: {
      type: String,
    },
    formRules: {
      type: Array,
    },
    okText: {
      type: String,
      default: i18n.t('common.ok'),
    },
    cancelText: {
      type: String,
      default: i18n.t('common.cancel'),
    },
    inputType: {
      type: String,
      default: 'input',
    },
    numberMin: Number,
  },
  data () {
    return {
      form: {
        input: this.defaultValue,
      },
      rules: {
        input: this.formRules || [
          { required: true, message: `${this.$t('common.placeholder')} ${this.label.toLowerCase()}` },
          { validator: this.$validate('resourceName') },
        ],
      },
    }
  },
  computed: {
    placeholder () {
      if (this.label) return `${this.$t('common.placeholder')} ${this.label.toLowerCase()}`
      return this.$t('common.placeholder')
    },
  },
  methods: {
    cancel () {
      this.$emit('cancel')
    },
    async handleSubmit (e) {
      try {
        await validateModelForm(this.$refs.form)
        const trimValue = R.map(value => {
          if (R.is(String, value)) {
            return value.trim()
          }
          return value
        }, this.form)
        this.$emit('submit', trimValue)
      } catch (err) {
        console.error('err', err)
      }
    },
  },
}
</script>
