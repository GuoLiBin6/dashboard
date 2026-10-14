<template>
  <a-form-model-item :label="label" :prop="fieldName">
    <base-select
      v-model:value="model[fieldName]"
      class="w-100"
      :filterable="true"
      resource="robots"
      version="v1"
      :params="getParams"
      :select-props="{ placeholder: placeholder, allowClear: true, mode: 'multiple' }" />
  </a-form-model-item>
</template>

<script>
import i18n from '@/locales'

export default {
  name: 'NotifyTypes',
  props: {
    /** a-form-model：与 field 字段名对齐的受控对象（必传） */
    model: {
      type: Object,
      required: true,
    },
    field: {
      type: String,
      default: 'robot_ids',
    },
    initialValue: {
      default: undefined,
    },
    getParams: {
      type: Object,
      default: () => ({
        robot: 'only',
      }),
    },
    placeholder: {
      type: String,
      default: i18n.t('common.budget_alert_user_placeholder'),
    },
    label: {
      type: String,
      default: i18n.t('monitor.channel'),
    },
  },
  computed: {
    fieldName () {
      return this.field
    },
  },
  created () {
    if (this.model[this.fieldName] === undefined && this.initialValue !== undefined) {
      this.$set(this.model, this.fieldName, this.initialValue)
    }
  },
}
</script>
