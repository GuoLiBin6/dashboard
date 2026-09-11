<template>
  <div
    class="d-flex align-items-center list-body-cell-wrap"
    :class="{ 'is-cell-active': editVisible || alwaysShowCopyBtn || alwaysShowEditBtn }"
    :title="message || row[field] || '-'">
    <span
      v-if="!hideField"
      :class="{ 'text-weak': field.includes('description'), [titleClass]: titleClass, 'text-truncate': overflow ==='ellipsis' }">{{ l.get(row, field) || '-' }}</span>
    <div class="text-truncate slot-wrap" v-if="$slots.default"><slot /></div>
    <template v-if="showDeleteLock">
      <icon class="ml-1 cell-meta-icon" type="lock" :title="$t('common.text00008')" />
    </template>
    <template v-if="showEncryptionLock">
      <icon class="ml-1 cell-meta-icon" type="safety-certificate" :title="$t('common.text.encrption_enable')" />
    </template>
    <template v-if="addBackup && row.backup_host_id">
      <icon type="gaokeyong" class="ml-1 cell-meta-icon" :title="$t('common.text00009')" />
    </template>
    <template v-if="addAutoReset">
      <icon class="ml-1 cell-meta-icon" type="auto-set" :title="$t('compute.shutdown_auto_reset')" />
    </template>
    <slot name="append" />
    <span v-if="!inBaseDialog && inList" class="cell-hover-action d-inline-flex align-items-center">
      <slot name="appendActions" />
    </span>
    <edit
      class="ml-1 cell-hover-action"
      v-if="showEdit && isOwner.validate"
      @update="update"
      :label="labelCn"
      :inputType="inputType"
      :formRules="formRulesComputer"
      v-model:visible="editVisible"
      :defaultValue="defaultValue"
      :numberMin="numberMin"
      :showSuccessMessage="showSuccessMessage"
      :customEdit="customEdit"
      :customEditCallback="customEditCallback" />
    <copy
      class="ml-1 cell-hover-action"
      v-if="showCopy"
      :message="copyMessage" />
  </div>
</template>

<script>
import _ from 'lodash'
import * as R from 'ramda'

export default {
  name: 'ListBodyCellWrap',
  props: {
    resource: {
      type: String,
      default: '',
      required: false,
    },
    alwaysShowCopyBtn: {
      type: Boolean,
      default: false,
    },
    alwaysShowEditBtn: {
      type: Boolean,
      default: false,
    },
    row: { // 当前行数据
      type: Object,
    },
    message: String,
    field: {
      type: String,
      default: 'name',
    },
    label: {
      type: String,
    },
    steadyStatus: {
      type: [Array, Object, String],
    },
    onManager: {
      type: Function,
    },
    copy: {
      type: Boolean,
      default: false,
    },
    edit: {
      type: Boolean,
      default: false,
    },
    hideField: {
      type: Boolean,
      default: false,
    },
    formRules: {
      type: [Array, Function],
    },
    titleClass: String,
    addLock: Boolean,
    addEncrypt: Boolean,
    addBackup: Boolean,
    addAutoReset: Boolean,
    // 自定义确定事件，如果传递了此事件，则不会执行默认的确定事件
    ok: Function,
    // 是否需要显示成功信息
    showSuccessMessage: {
      type: Boolean,
      default: true,
    },
    overflow: {
      type: String,
      default: 'ellipsis',
    },
    customEdit: {
      type: Boolean,
      default: false,
    },
    customEditCallback: {
      type: Function,
    },
    inputType: {
      type: String,
      default: 'input',
    },
    numberMin: {
      type: Number,
      default: 0,
    },
  },
  inject: {
    // 是否处于BaseDialog中
    inBaseDialog: {
      default: false,
    },
    // 是否处于PageList中
    inList: {
      default: false,
    },
  },
  data () {
    return {
      editVisible: false, // edit form 的显隐
      l: _,
    }
  },
  computed: {
    defaultValue () {
      return _.get(this.row, this.field) || ''
    },
    copyMessage () {
      if (this.message != null && this.message !== '') {
        return String(this.message)
      }
      const val = _.get(this.row, this.field)
      return val != null && val !== '' ? String(val) : '-'
    },
    labelCn () {
      if (this.label) return this.label
      const fieldMap = {
        name: this.$t('common.name'),
        description: this.$t('common.description'),
      }
      const field = this.field === '_i18n.description' ? 'description' : this.field
      if (fieldMap[field]) {
        return fieldMap[field]
      }
      return ''
    },
    // 用 CSS :hover 显隐，避免每个单元格 mouseenter 触发 Vue 更新（表格页顿挫主因）
    showCopy () {
      if (this.alwaysShowCopyBtn) return true
      return !!this.copy
    },
    showEdit () {
      if (this.inBaseDialog) return false
      if (this.alwaysShowEditBtn) return true
      if (this.editVisible) return true
      return !!(this.edit || this.customEdit)
    },
    formRulesComputer () {
      if (R.is(Function, this.formRules)) {
        return this.formRules(this.row)
      }
      if (this.formRules && this.formRules.length) {
        return this.formRules
      }
      if (this.field === 'description') return []
      return null
    },
    showDeleteLock () {
      if (this.addLock) {
        if (R.is(Boolean, this.row.disable_delete)) {
          return this.row.disable_delete
        }
        if (R.is(String, this.row.disable_delete)) {
          return this.row.disable_delete === 'true'
        }
        if (R.is(Boolean, this.row.can_delete)) {
          return this.row.can_delete
        }
        if (R.is(String, this.row.can_delete)) {
          return this.row.can_delete === 'true'
        }
      }
      return false
    },
    showEncryptionLock () {
      if (this.addEncrypt) {
        if (R.is(String, this.row.encrypt_key_id) && this.row.encrypt_key_id) {
          return true
        }
      }
      return false
    },
    isOwner () {
      return this.$isOwner(this.row, this.resource)
    },
  },
  methods: {
    update (formData) {
      if (this.ok) {
        this.ok(formData.input)
      } else {
        if (this.onManager) {
          const field = this.field === '_i18n.description' ? 'description' : this.field
          this.onManager('update', {
            id: this.row.id,
            steadyStatus: this.steadyStatus,
            managerArgs: {
              id: this.row.id,
              data: {
                [field]: formData.input,
              },
            },
          })
        } else {
          console.warn('no manager')
        }
      }
    },
  },
}
</script>

<style lang="less" scoped>
.list-body-cell-wrap {
  min-width: 0;
  max-width: 100%;
  /* 名称 / 备注等多行堆叠时留出间隙 */
  & + .list-body-cell-wrap {
    margin-top: 6px;
  }
  .cell-meta-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    color: rgba(0, 0, 0, 0.45);
    line-height: 1;
    :deep(svg),
    :deep(.oc-icon) {
      width: 10px;
      height: 10px;
      font-size: 10px;
    }
  }
  .cell-hover-action {
    flex-shrink: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: scale(0.92);
    transition-property: opacity, visibility, transform;
    transition-duration: 0.12s;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  /* 只悬停当前这一行（名称或备注），才显示该行的 copy/edit */
  &:hover .cell-hover-action,
  &.is-cell-active .cell-hover-action {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: scale(1);
  }
}
</style>
