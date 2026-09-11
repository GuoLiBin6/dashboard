<template>
  <div class="search-box-tag-wrap" @click="handleWrapClick">
    <a-popover
      v-model:open="visible"
      trigger="click"
      destroyTooltipOnHide
      placement="bottomLeft"
      overlayClassName="search-box-tag-popover-wrap"
      :getPopupContainer="getPopupContainer"
      :align="{ offset: [0, 14] }">
      <template #content>
        <div class="auto-completer-wrap" :style="{ width: isDate || isMonth ? '300px' : '200px' }">
          <template v-if="isDropdown && isDate">
            <date-select
              :value="newValue"
              @change="handleDateChange"
              @date-editing-change="editing => $emit('date-editing-change', editing)" />
          </template>
          <template v-else-if="isDropdown && isMonth">
            <month-select
              :value="newValue"
              @change="handleMonthChange"
              @date-editing-change="editing => $emit('date-editing-change', editing)" />
          </template>
          <ul v-else class="auto-completer-items">
            <template v-if="isDropdown">
              <div class="pt-2 pb-2 pl-2" v-if="config.supportNegation && config.items">
                <a-radio-group v-model:value="condition">
                  <a-radio value="equals">{{ $t('common.contains') }}</a-radio>
                  <a-radio value="not_equals">{{ $t('common.not_contains') }}</a-radio>
                </a-radio-group>
              </div>
              <!-- 如果有配置项则渲染 -->
              <template v-if="config.items">
                <div class="dropdown-search-input-wrap">
                  <a-input
                    id="dropdownSearchInput"
                    class="dropdown-search-input"
                    :bordered="false"
                    :placeholder="$t('common.search')"
                    @change="onSearch">
                    <template #suffix>
                      <icon type="search" class="dropdown-search-suffix-icon" />
                    </template>
                  </a-input>
                </div>
                <li
                  v-for="item of filteredItems"
                  :key="item.key">
                  <span>
                    <a-checkbox
                      class="w-100"
                      :checked="newValue && newValue.includes(item.key)"
                      :value="item.key"
                      @change="handleValueChange"><span class="text-wrap text-break" :title="item.label">{{ item.label }}</span></a-checkbox>
                  </span>
                </li>
              </template>
            </template>
            <template v-else>
              <a-input :value="newValue.join(newValueSeparator)" ref="input" @keydown.13="handleConfirm" @change="handleInputChange" />
            </template>
          </ul>
          <div class="actions">
            <span @click="handleConfirm($event)" class="primary-color" :class="{ disabled: confirmDisable }">{{$t('common.ok')}}</span>
            <span @click="handleCancel($event)">{{$t('common.cancel')}}</span>
          </div>
        </div>
      </template>
      <a-tag class="tag" closable :bordered="false" @close="handleClose">
        <template #closeIcon>
          <icon type="close-outlined" class="search-box-tag-close" />
        </template>
        <span class="tag-prefix primary-color">{{ fieldLabel }}</span>
        <span class="tag-key-sep primary-color">{{ displayKeySep }}</span>
        <template v-if="labelValues.length">
          <template v-for="(item, index) in labelValues" :key="index">
            <span v-if="index > 0" class="tag-value-sep">{{ newValueSeparator }}</span>
            <span>{{ item }}</span>
          </template>
        </template>
        <template v-else>{{ displayValueText }}</template>
      </a-tag>
    </a-popover>
  </div>
</template>

<script>
import * as R from 'ramda'
import DateSelect from './DateSelect'
import MonthSelect from './MonthSelect'

export default {
  name: 'Tag',
  components: {
    DateSelect,
    MonthSelect,
  },
  props: {
    value: {
      type: Array,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    focus: {
      type: Boolean,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
    keySeparator: {
      type: String,
      required: true,
    },
    valueSeparator: {
      type: String,
      required: true,
    },
    fetchDistinctField: Function,
    allValue: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      visible: false,
      newValue: [...this.value],
      dropdownSearch: '',
      condition: this.allValue['__condition_' + this.id] || 'equals',
    }
  },
  computed: {
    newValueSeparator () {
      return this.condition === 'equals' ? this.valueSeparator : '&'
    },
    // 为当前选项创建 Map 索引（key -> label），优化查找性能
    itemKeyMap () {
      const config = this.options[this.id]
      if (config && config.items && Array.isArray(config.items)) {
        const map = new Map()
        config.items.forEach(item => {
          map.set(item.key, item.label)
        })
        return map
      }
      return null
    },
    fieldLabel () {
      return this.options[this.id].label
    },
    displayKeySep () {
      return this.condition === 'equals' ? ':' : '!='
    },
    labelValues () {
      if (this.isDate || this.isMonth) return []
      return this.value.map(value => {
        if (this.itemKeyMap) {
          const label = this.itemKeyMap.get(value)
          if (label) return label
        } else if (this.options[this.id].items && this.options[this.id].items.length) {
          const target = this.options[this.id].items.find(item => item.key === value)
          if (target) return target.label
        }
        return value
      }).filter(item => !!item)
    },
    displayValueText () {
      if (this.isDate || this.isMonth) {
        if (this.value[0] && this.value[1]) return this.value.join(' ~ ')
        if (this.value[0]) return `<${this.value[0]}`
        if (this.value[1]) return `>${this.value[1]}`
        return ''
      }
      return ''
    },
    config () {
      return this.options[this.id]
    },
    // 配置项是否使用了dropdown模式
    isDropdown () {
      return this.config && this.config.dropdown
    },
    // 是否为时间选择模式
    isDate () {
      return this.config && this.config.date
    },
    // 是否为月份选择模式
    isMonth () {
      return this.config && this.config.month
    },
    confirmDisable () {
      if (this.isDropdown) {
        return R.isEmpty(this.newValue) || R.isNil(this.newValue)
      }
      return R.isEmpty(R.trim(this.newValue[0]))
    },
    // 过滤后的下拉选项（优化：使用计算属性替代方法调用）
    filteredItems () {
      const items = (this.config && this.config.items) || []
      if (!items.length) return []
      if (!this.dropdownSearch) return items
      const searchLower = this.dropdownSearch.toLowerCase()
      return items.filter(v => {
        if (!v.label) return true
        const label = v.label.toLowerCase()
        return label.includes(searchLower)
      })
    },
  },
  watch: {
    visible (val) {
      if (!val) {
        this.newValue = [...this.value]
      }
    },
  },
  created () {
    const conf = this.options[this.id]
    if (conf && conf.distinctField && !conf.items && this.fetchDistinctField) {
      try {
        this.fetchDistinctField(conf).then((values) => {
          this.$nextTick(() => {
            conf.items = values
          })
        })
      } catch (error) {
        throw error
      }
    }
  },
  methods: {
    onSearch (e) {
      this.dropdownSearch = e.target.value
    },
    handleClose (e) {
      // 阻止 Tag 内部先把自己隐藏，等父级从 filter 中移除后再卸载（与 ant-design-vue 4 的 close 流程一致）
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault()
      }
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation()
      }
      this.$emit('remove', this.id)
    },
    async handleWrapClick (e) {
      e.stopPropagation()
      this.$emit('update-show', false)
      if (!this.isDropdown) {
        this.$nextTick(() => {
          if (this.$refs.input) this.$refs.input.focus()
        })
      }
    },
    handleConfirm (e) {
      e.stopPropagation()
      if (this.confirmDisable) return
      this.visible = false
      this.$emit('update-focus', false)
      this.$emit('confirm', {
        ...this.allValue,
        [`__condition_${this.id}`]: this.condition,
        [this.id]: this.newValue,
      })
      this.dropdownSearch = ''
    },
    handleCancel (e) {
      e.stopPropagation()
      this.newValue = this.value
      this.visible = false
      this.$emit('update-focus', false)
      this.dropdownSearch = ''
    },
    handleValueChange (e) {
      e.stopPropagation()
      const value = e.target.value
      const index = this.newValue.indexOf(value)
      const hasValue = index !== -1
      const multiple = this.config.multiple
      const mutexKey = this.config.mutexKey
      if (hasValue) {
        if (multiple) {
          this.newValue.splice(index, 1)
        }
      } else {
        if (multiple) {
          if (mutexKey && value === mutexKey) {
            this.newValue = [value]
          } else {
            if (mutexKey) {
              this.newValue = this.newValue.filter(item => item !== mutexKey)
            }
            this.newValue.push(value)
          }
        } else {
          this.newValue = [value]
        }
      }
    },
    handleDateChange (val) {
      const values = val[0]
      let labelArr
      if (values[0] && values[1]) {
        labelArr = values.map(item => item.local().format('YYYY-MM-DD HH:mm:ss'))
      } else if (values[0]) {
        labelArr = [values[0].local().format('YYYY-MM-DD HH:mm:ss'), null]
      } else if (values[1]) {
        labelArr = [null, values[1].local().format('YYYY-MM-DD HH:mm:ss')]
      }
      this.newValue = labelArr
    },
    handleMonthChange (val) {
      const values = val[0]
      let labelArr
      if (values[0] && values[1]) {
        labelArr = values.map(item => item.local().format('YYYY-MM'))
      } else if (values[0]) {
        labelArr = [values[0].local().format('YYYY-MM'), null]
      } else if (values[1]) {
        labelArr = [null, values[1].local().format('YYYY-MM')]
      }
      this.newValue = labelArr
    },
    handleInputChange (e) {
      let val = e.target.value
      val = val.split(this.newValueSeparator)
      this.newValue = val
    },
    getPopupContainer () {
      return document.body
    },
    getDateSelectPopupContainer () {
      return document.body
    },
    getMonthSelectPopupContainer () {
      return document.body
    },
  },
}
</script>

<style lang="less">
.search-box-tag-popover-wrap {
  .ant-popover-inner {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  }
  .ant-popover-inner-content {
    padding: 0;
  }
  .ant-popover-arrow {
    &::before {
      background: #fff;
    }
  }
  .auto-completer-wrap {
    border-radius: 10px;
    overflow: hidden;
    border: none;
  }
}
</style>

<style lang="less" scoped>
.search-box-tag-wrap {
  cursor: pointer;
}
.tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  /* 勿用 overflow:hidden，否则会裁掉右侧关闭图标（与 AD4 Tag 结构有关） */
  overflow: visible;
  word-break: break-all;
  background: #f5f5f5;
  margin: 0 6px 0 0;
  padding: 1px 8px;
  line-height: 18px;
  height: 22px;
  cursor: pointer;
  :deep(.ant-tag-close-icon) {
    flex-shrink: 0;
    margin-inline-start: 10px;
    display: inline-flex;
    align-items: center;
    line-height: 1;
    cursor: pointer;
  }
}
.tag-key-sep {
  margin-right: 4px;
}
.tag-value-sep {
  color: rgba(0, 0, 0, 0.25);
  margin: 0 4px;
  font-weight: 400;
}
.search-box-tag-close {
  width: 9px;
  height: 9px;
  font-size: 9px;
  vertical-align: middle;
  color: rgba(0, 0, 0, 0.35);
  :deep(svg) {
    width: 9px;
    height: 9px;
  }
  &:hover {
    color: rgba(0, 0, 0, 0.65);
  }
}
.auto-completer-wrap {
  width: 200px;
}
.auto-completer-items {
  font-size: 12px;
  overflow: hidden;
  overflow-y: auto;
  background-color: #fff;
  max-height: 400px;
  list-style: none;
  margin: 0;
  padding: 0;
  > li {
    > span {
      display: block;
      padding: 6px 10px;
      cursor: pointer;
      &.empty {
        cursor: default;
      }
    }
    &:hover {
      background-color: #f2f2f2;
      > span {
        &.empty {
          background-color: #fff;
        }
      }
    }
    &.actions {
      &:hover {
        background-color: #fff;
      }
    }
  }
  .loading {
    &:hover {
      background-color: #fff;
    }
  }
  .no-data {
    &:hover {
      background-color: #fff;
    }
  }
}
.actions {
  border-top: 1px solid #ddd;
  > span {
    cursor: pointer;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 12px;
    display: inline-block;
    box-sizing: border-box;
    width: 50%;
    &:first-child {
      border-right: 1px solid #ddd;
    }
    &:hover {
      background-color: #f2f2f2;
    }
    &.disabled {
      cursor: not-allowed;
      background-color: #f5f5f5;
      color: rgba(0, 0, 0, 0.25);
    }
  }
}

.dropdown-search-input-wrap {
  border-bottom: 1px solid #d9d9d9;
}
:deep(.dropdown-search-input) {
  border: none !important;
  box-shadow: none !important;
  background: transparent;
}
:deep(.dropdown-search-input.ant-input-affix-wrapper-focused),
:deep(.dropdown-search-input:focus-within) {
  border-radius: 0 !important;
  box-shadow: none !important;
}
:deep(.dropdown-search-input .ant-input) {
  border: none !important;
  box-shadow: none !important;
  background: transparent;
}
.dropdown-search-suffix-icon {
  width: 14px;
  height: 14px;
  color: rgba(0, 0, 0, 0.45);
  vertical-align: middle;
}
</style>
