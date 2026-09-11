<template>
  <div class="edit-icon">
    <span
      v-if="customEdit && customEditCallback"
      class="edit-trigger"
      role="button"
      :title="title"
      @click="customEditCallback">
      <icon type="edit" class="edit-trigger__icon" />
    </span>
    <a-popover
      v-else
      v-model:open="open"
      :title="title"
      trigger="click"
      destroy-tooltip-on-hide>
      <template #content>
        <slot>
          <edit-form
            v-bind="$attrs"
            :label="label"
            :input-type="inputType"
            :form-rules="formRules"
            :number-min="numberMin"
            @submit="submit"
            @cancel="hideForm" />
        </slot>
      </template>
      <span class="edit-trigger" role="button" :title="title">
        <icon type="edit" class="edit-trigger__icon" />
      </span>
    </a-popover>
  </div>
</template>

<script>
import './index.scss'
import i18n from '@/locales'
import Form from './Form.vue'

export default {
  name: 'Edit',
  components: {
    EditForm: Form,
  },
  inheritAttrs: false,
  props: {
    inputType: String,
    label: {
      type: String,
      default: i18n.t('common.name'),
    },
    formRules: {
      type: Array,
    },
    showSuccessMessage: {
      type: Boolean,
      default: true,
    },
    customEdit: {
      type: Boolean,
      default: false,
    },
    customEditCallback: {
      type: Function,
    },
    numberMin: Number,
    // ListBodyCellWrap: v-model:visible
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update', 'update:visible'],
  data () {
    return {
      open: false,
    }
  },
  computed: {
    title () {
      return `${i18n.t('common.edit')}${this.label}`
    },
  },
  watch: {
    visible (v) {
      if (v !== this.open) this.open = v
    },
    open (v) {
      this.$emit('update:visible', v)
    },
  },
  methods: {
    submit (values) {
      this.hideForm()
      if (!this.$slots.default) {
        this.$emit('update', values)
        if (this.showSuccessMessage) {
          this.$message.success(this.$t('common.success'))
        }
      }
    },
    hideForm () {
      this.open = false
    },
  },
}
</script>
