<template>
  <div ref="anchor" class="cursor-text">
    <autosize-input
      ref="input"
      v-show="focus"
      :value="search"
      :input-style="{ border: 'none', outline: 0, padding: '0 0 0 2px', margin: 0, height: '22px', fontSize: '12px' }"
      @keydown.13="handleInputEnter"
      @keydown.delete="handleInputDelete"
      @input="handleInput" />
    <teleport to="body">
      <div
        v-show="show"
        ref="dropdown"
        class="auto-completer-portal"
        :class="{ 'is-placement-top': completerPlacement === 'top' }"
        :style="completerWrapStyle">
        <span class="auto-completer-arrow" :style="completerArrowStyle" />
        <div class="auto-completer-wrap" :class="{ 'is-picker-panel': isDate || isMonth }">
        <div class="pt-2 pb-2 pl-2" v-if="isDropdown && config.supportNegation && config.items">
          <a-radio-group v-model:value="condition">
            <a-radio value="equals">{{ $t('common.contains') }}</a-radio>
            <a-radio value="not_equals">{{ $t('common.not_contains') }}</a-radio>
          </a-radio-group>
        </div>
        <div
          v-if="showDropdownSearch"
          class="dropdown-search-input-wrap">
          <a-input
            id="dropdownSearchInput"
            class="dropdown-search-input"
            :bordered="false"
            :placeholder="dropdownSearchPlaceholder"
            :value="isDropdown ? dropdownSearch : keySearch"
            @change="onSearch">
            <template #suffix>
              <icon type="search" class="dropdown-search-suffix-icon" />
            </template>
          </a-input>
        </div>
        <div v-if="showKeyListTip" class="completer-tip">{{ $t('common.text00014') }}</div>
        <template v-if="isDate">
          <date-select
            @change="handleDateChange"
            @date-editing-change="editing => $emit('date-editing-change', editing)" />
        </template>
        <template v-else-if="isMonth">
          <month-select
            @change="handleMonthChange"
            @date-editing-change="editing => $emit('date-editing-change', editing)" />
        </template>
        <ul v-else class="auto-completer-items" :class="{ 'is-key-list': !isDropdown }">
          <template v-if="isDropdown">
            <!-- 如果有配置项则渲染 -->
            <template v-if="config.items">
              <li
                v-for="item of filteredItems"
                :key="item.key">
                <span>
                  <a-checkbox
                    class="w-100"
                    :checked="selectValue && selectValue.includes(item.key)"
                    :value="item.key"
                    @change="handleValueChange"><span class="text-wrap text-break" :title="item.label">{{ item.label }}</span></a-checkbox>
                </span>
              </li>
            </template>
            <template v-else>
              <!-- 如果需要获取 distinct field -->
              <template v-if="config.distinctField">
                <li class="loading"><loader loading /></li>
              </template>
              <template v-else>
                <li class="no-data"><loader /></li>
              </template>
            </template>
          </template>
          <template v-else>
            <li
              v-for="item in filteredKeyOptions"
              :key="item.key">
              <span @click="handleKeyClick($event, item.key, item.config)" class="text-truncate">{{ item.label }}</span>
            </li>
            <li v-if="!filteredKeyOptions.length">
              <span class="empty text-weak">{{ $t('common.notData') }}</span>
            </li>
          </template>
        </ul>
        <div class="actions" v-if="isDropdown">
          <span @click="handleConfirm($event)" class="primary-color" :class="{ disabled: !selectValue || (selectValue && selectValue.length <= 0) }">{{$t('common.ok')}}</span>
          <span @click="handleCancel($event)">{{$t('common.cancel')}}</span>
        </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import * as R from 'ramda'
import regexp from '@/utils/regexp'
import DateSelect from './DateSelect'
import MonthSelect from './MonthSelect'

export default {
  name: 'AutoCompleter',
  components: {
    DateSelect,
    MonthSelect,
  },
  props: {
    focus: {
      type: Boolean,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
    value: {
      type: Object,
      required: true,
    },
    show: {
      type: Boolean,
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
    defaultSearchKey: {
      type: [String, Function],
    },
    fetchDistinctField: Function,
    // 属性 key 列表项少时可不展示顶部搜索框（如全局搜索）
    hideKeyListSearch: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      // 当前选中的筛选key
      selectKey: null,
      // 选中的筛选值
      selectValue: [],
      // input 输入的值
      search: '',
      completerWrapStyle: {},
      completerArrowStyle: {},
      completerPlacement: 'bottom',
      completerWidth: 220,
      dropdownSearch: '',
      keySearch: '',
      condition: 'equals',
    }
  },
  computed: {
    showDropdownSearch () {
      if (this.isDropdown) return !!(this.config && this.config.items)
      // 属性 key 列表：可按需隐藏顶部搜索，仅保留提示与选项
      if (this.hideKeyListSearch) return false
      return !this.isDate && !this.isMonth
    },
    showKeyListTip () {
      return !this.isDropdown && !this.isDate && !this.isMonth
    },
    dropdownSearchPlaceholder () {
      return this.isDropdown
        ? this.$t('common.search')
        : this.$t('common.search_resource_attr')
    },
    filteredKeyOptions () {
      const list = []
      for (const key in this.options) {
        if (this.value.hasOwnProperty(key)) continue
        if (!this.clickableKeys.has(key)) continue
        const config = this.options[key]
        const label = config && config.label
        if (!label) continue
        if (this.keySearch) {
          const q = this.keySearch.toLowerCase()
          if (!String(label).toLowerCase().includes(q) && !String(key).toLowerCase().includes(q)) {
            continue
          }
        }
        list.push({ key, label, config })
      }
      return list
    },
    newValueSeparator () {
      return this.condition === 'equals' ? this.valueSeparator : '&'
    },
    newKeySeparator () {
      return this.condition === 'equals' ? this.keySeparator : ' != '
    },
    // 获取当前选择的key的配置
    config () {
      return this.selectKey && this.options[this.selectKey]
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
    // 可点击的选项 keys（优化：缓存计算结果，避免 O(n²) 复杂度）
    clickableKeys () {
      const keys = new Set()
      const search = this.search

      // 如果搜索为空，所有未选中的项都可点击
      if (!search) {
        for (const key in this.options) {
          if (!this.value.hasOwnProperty(key)) {
            keys.add(key)
          }
        }
        return keys
      }

      // 查找当前搜索匹配的选项
      let matchedKey = null
      for (const key in this.options) {
        const item = this.options[key]
        const prefix = `${item.label}${this.newKeySeparator}`
        if (search.startsWith(prefix)) {
          matchedKey = key
          break
        }
      }

      // 如果找到了匹配的选项，只显示该选项
      if (matchedKey) {
        if (!this.value.hasOwnProperty(matchedKey)) {
          keys.add(matchedKey)
        }
      } else {
        // 如果没有匹配，显示所有未选中的选项
        for (const key in this.options) {
          if (!this.value.hasOwnProperty(key)) {
            keys.add(key)
          }
        }
      }

      return keys
    },
  },
  watch: {
    search (val) {
      this.$emit('update:search', val)
    },
    condition (val) {
      this.search = val === 'equals' ? this.search.replace(' != ', this.keySeparator) : this.search.replace(this.keySeparator, ' != ')
    },
    show (val) {
      if (val) {
        this.$nextTick(() => {
          this.syncCompleterPosition()
          this.bindPositionListeners()
          // 供 SearchBox 的 clickoutside 排除下拉区域
          if (this.$parent) this.$parent.popperElm = this.$refs.dropdown
        })
      } else {
        this.unbindPositionListeners()
        if (this.$parent && this.$parent.popperElm === this.$refs.dropdown) {
          this.$parent.popperElm = null
        }
      }
    },
  },
  beforeUnmount () {
    this.unbindPositionListeners()
    if (this.$parent && this.$parent.popperElm === this.$refs.dropdown) {
      this.$parent.popperElm = null
    }
  },
  methods: {
    bindPositionListeners () {
      this.unbindPositionListeners()
      this._onReposition = () => this.syncCompleterPosition()
      window.addEventListener('resize', this._onReposition, { passive: true })
      window.addEventListener('scroll', this._onReposition, { passive: true, capture: true })
    },
    unbindPositionListeners () {
      if (!this._onReposition) return
      window.removeEventListener('resize', this._onReposition)
      window.removeEventListener('scroll', this._onReposition, { capture: true })
      this._onReposition = null
    },
    syncCompleterPosition () {
      if (!this.show) return
      const anchor = this.$refs.anchor
      if (!anchor || !anchor.getBoundingClientRect) return
      // 垂直对齐搜索框底边，与 Tag 编辑弹层观感一致
      const wrap = this.$parent && this.$parent.$refs && this.$parent.$refs['search-box-wrap']
      const wrapRect = wrap && wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : null
      const anchorRect = anchor.getBoundingClientRect()
      const width = this.completerWidth || 220
      const gap = 14
      let left = anchorRect.left
      left = Math.min(left, window.innerWidth - width - 8)
      left = Math.max(8, left)

      const refBottom = wrapRect ? wrapRect.bottom : anchorRect.bottom
      const refTop = wrapRect ? wrapRect.top : anchorRect.top

      let placement = 'bottom'
      let top = refBottom + gap
      const spaceBelow = window.innerHeight - top - 8
      let maxHeight = Math.min(440, spaceBelow)

      // 下方空间不足时翻转到上方
      if (maxHeight < 160 && refTop > spaceBelow) {
        placement = 'top'
        maxHeight = Math.min(440, refTop - gap - 8)
        top = Math.max(8, refTop - maxHeight - gap)
      }

      // 箭头对准输入触发点
      const anchorX = anchorRect.left + Math.min(Math.max(anchorRect.width, 12), 20)
      let arrowLeft = anchorX - left - 5
      arrowLeft = Math.min(Math.max(14, arrowLeft), width - 22)

      this.completerPlacement = placement
      this.completerArrowStyle = { left: `${arrowLeft}px` }
      this.completerWrapStyle = {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        maxHeight: `${Math.max(120, maxHeight)}px`,
        zIndex: 1050,
        right: 'auto',
      }
    },
    clear () {
      this.$emit('update-show', false)
      this.completerWrapStyle = {}
      this.completerArrowStyle = {}
      this.completerPlacement = 'bottom'
      this.completerWidth = 220
      this.search = ''
      this.selectKey = null
      this.selectValue = []
      this.condition = 'equals'
      this.keySearch = ''
      this.dropdownSearch = ''
    },
    /**
     * @description key选中事件
     * @param {Object} event
     * @param {String} key
     * @param {Object} config
     */
    async handleKeyClick (e, key, item) {
      e.stopPropagation()
      if (item.date) {
        this.completerWidth = 360
      } else if (item.month) {
        this.completerWidth = 260
      } else {
        this.completerWidth = 220
      }
      this.selectKey = key
      const prefix = `${item.label}${this.newKeySeparator}`
      if (!this.search.startsWith(prefix) && !prefix.startsWith(this.search)) {
        this.search = prefix + this.search
      } else if (prefix.startsWith(this.search)) {
        this.search = prefix
      }
      if (!this.isDropdown) {
        this.$emit('update-show', false)
        this.completerWrapStyle = {}
        this.completerWidth = 220
      } else {
        this.dropdownSearch = ''
        this.keySearch = ''
        if (this.config.distinctField) {
          try {
            const values = await this.fetchDistinctField(item)
            const items = values.map(v => {
              const label = (v.label.includes('@:dictionary') && v.t) ? this.$t(v.t) : v.label
              return {
                key: v.key,
                label: label,
              }
            })
            item.items = items
          } catch (error) {
            throw error
          }
        }
        this.$nextTick(() => this.syncCompleterPosition())
      }
      this.$emit('focus-input')
    },
    /**
     * @description 判断item所否可以点击，只有完成了输入之后才能点击
     * @deprecated 已优化为使用计算属性 clickableKeys，保留此方法以保持兼容性
     */
    isKeyClickable (curItem) {
      // 使用计算属性 clickableKeys 的结果
      for (const key in this.options) {
        const item = this.options[key]
        if (item.label === curItem.label) {
          return this.clickableKeys.has(key)
        }
      }
      return true
    },
    /**
     * @description value选中事件
     * @param {Object} event
     */
    handleValueChange (e) {
      e.stopPropagation()
      const value = e.target.value
      const index = this.selectValue.indexOf(value)
      const hasValue = index !== -1
      const multiple = this.config.multiple
      const mutexKey = this.config.mutexKey
      if (hasValue) {
        if (multiple) {
          this.selectValue.splice(index, 1)
        }
      } else {
        if (multiple) {
          if (mutexKey && value === mutexKey) {
            this.selectValue = [value]
          } else {
            if (mutexKey) {
              this.selectValue = this.selectValue.filter(item => item !== mutexKey)
            }
            this.selectValue.push(value)
          }
        } else {
          this.selectValue = [value]
        }
      }
      let labels = this.selectValue
      if (this.isDropdown) {
        labels = labels.map(item => {
          const op = R.find(R.propEq('key', item))(this.config.items)
          if (op) return op.label
          return item
        })
      }
      this.search = `${this.config.label}${this.newKeySeparator}${labels.join(this.newValueSeparator)}`
    },
    /**
     * @description date类型的修改
     */
    handleDateChange (val) {
      this.selectValue = val
      const values = val[0]
      let labelStr
      if (values[0] && values[1]) {
        labelStr = values.map(item => item.local().format('YYYY-MM-DD HH:mm:ss')).join(' ~ ')
      } else if (values[0]) {
        labelStr = `<${values[0].local().format('YYYY-MM-DD HH:mm:ss')}`
      } else if (values[1]) {
        labelStr = `>${values[1].local().format('YYYY-MM-DD HH:mm:ss')}`
      }
      this.search = `${this.config.label}${this.newKeySeparator}${labelStr}`
    },
    /**
     * @description month类型的修改
     */
    handleMonthChange (val) {
      this.selectValue = val
      const values = val[0]
      let labelStr
      if (values[0] && values[1]) {
        labelStr = values.map(item => item.local().format('YYYY-MM')).join(' ~ ')
      } else if (values[0]) {
        labelStr = `<${values[0].local().format('YYYY-MM')}`
      } else if (values[1]) {
        labelStr = `>${values[1].local().format('YYYY-MM')}`
      }
      this.search = `${this.config.label}${this.newKeySeparator}${labelStr}`
    },
    /**
     * @description 拼装参数，调用搜索
     */
    handleOk () {
      const selectKeyEmpty = R.isNil(this.selectKey) || R.isEmpty(this.selectKey)
      if (selectKeyEmpty) {
        if (this.search) {
          var key = ''
          if (!R.isNil(this.defaultSearchKey)) {
            if (R.is(String, this.defaultSearchKey)) {
              key = this.defaultSearchKey
            } else if (R.is(Function, this.defaultSearchKey)) {
              key = this.defaultSearchKey(this.search)
            }
          }
          if (!key) {
            const searchValues = this.search.split('|')
            const isUUID = searchValues.some(item => regexp.isUUID(item))
            const idKey = Object.keys(this.options).find(v => v.endsWith('id'))
            if (isUUID && idKey) {
              key = idKey
            } else {
              key = 'name'
            }
          }
          if (this.options[key]) {
            this.selectValue = [this.search]
            this.selectKey = key
            this.search = `${this.options[key].label}${this.newKeySeparator}${this.search}`
          } else {
            console.log('key', key, 'not exist in options', this.options)
            return
          }
        } else {
          const newValue = {
            ...this.value,
          }
          this.$emit('confirm', newValue)
          return
        }
      }
      const selectValueEmpty = R.isNil(this.selectValue) || R.isEmpty(this.selectValue)
      if (selectValueEmpty) {
        return
      }
      let value = this.search.split(this.newKeySeparator)[1]
      if (this.isDate || this.isMonth) {
        if (value.startsWith('<')) {
          value = value.split('<')
          value = [value[1], null]
        } else if (value.startsWith('>')) {
          value = value.split('>')
          value = [null, value[1]]
        } else if (value.includes('~')) {
          value = value.split('~')
          value = [R.trim(value[0] || ''), R.trim(value[1] || '')]
        }
      } else {
        value = value.split(this.newValueSeparator)
        /* ======================TASK4351 列表查询多个IP、多个UUID start=========================== */
        if (this.search && this.search.indexOf('|') !== -1) {
          if (this.selectKey?.endsWith('id')) {
            if (Array.isArray(value)) {
              value = (value.map(item => { return item.split('|') })).flat()
            } else {
              value = value.split('|')
            }
          } else if (this.selectKey?.startsWith('ip') || this.selectKey?.endsWith('ip')) {
            if (Array.isArray(value)) {
              value = (value.map(item => { return item.split('|') })).flat()
            } else {
              value = value.split('|')
            }
          }
        }
        /* ======================TASK4351 列表查询多个IP、多个UUID end=========================== */
      }
      if (R.isNil(value) || R.isEmpty(value)) {
        return
      }
      const newValue = {
        ...this.value,
      }
      newValue[this.selectKey] = value
      newValue['__condition_' + this.selectKey] = this.condition
      this.$emit('confirm', newValue)
      this.clear()
    },
    /**
     * @description 确定事件
     * @param {Object} event
     */
    handleConfirm (e) {
      e.stopPropagation()
      this.handleOk()
    },
    /**
     * @description 取消事件：从二级（属性值）退回一级（属性选择）
     * @param {Object} event
     */
    handleCancel (e) {
      e.stopPropagation()
      this.selectKey = null
      this.selectValue = []
      this.condition = 'equals'
      this.dropdownSearch = ''
      this.keySearch = ''
      this.search = ''
      this.completerWidth = 220
      this.$emit('focus-input')
      this.$emit('update-show', true)
      this.$nextTick(() => this.syncCompleterPosition())
    },
    /**
     * @description 输入框回车按键事件
     */
    handleInputEnter (e) {
      e.stopPropagation()
      this.handleOk()
    },
    /**
     * @description 输入删除按键事件
     */
    handleInputDelete (e) {
      e.stopPropagation()
      if (this.search.length === 0) {
        const keys = Object.keys(this.value)
        if (keys.length === 0) return
        const lastKey = keys[keys.length - 1]
        this.$emit('remove-tag', lastKey)
      }
    },
    /**
     * @description 输入事件
     */
    handleInput (e) {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation()
      }
      // Vue 3：若仅走 $emit('input', value)，首参为字符串；走原生监听时为 InputEvent
      const raw = typeof e === 'string' ? e : (e && e.target ? e.target.value : '')
      this.search = raw
      let value = (raw && raw.split(this.newKeySeparator)) || []
      value = (value[1] && value[1].split(this.newValueSeparator)) || value[0]
      /* ======================TASK4351 列表查询多个IP、多个UUID start=========================== */
      const val = raw
      if (val && val.indexOf('|') !== -1) {
        if (this.selectKey?.endsWith('id')) {
          if (Array.isArray(value)) {
            value = (value.map(item => { return item.split('|') })).flat()
          } else {
            value = value.split('|')
          }
        } else if (this.selectKey?.startsWith('ip') || this.selectKey?.endsWith('ip')) {
          if (Array.isArray(value)) {
            value = (value.map(item => { return item.split('|') })).flat()
          } else {
            value = value.split('|')
          }
        }
      }
      /* ======================TASK4351 列表查询多个IP、多个UUID end=========================== */
      if (this.isDropdown && !this.isDate && !this.isMonth) {
        const searchValue = ((raw && raw.split(this.newKeySeparator)) || [])[1] || ''
        if (!value) {
          this.selectKey = null
          return
        }
        this.dropdownSearch = searchValue
        this.selectValue = value.map(item => {
          const op = R.find(R.propEq('label', item))(this.config.items)
          if (op) return op.key
        }).filter(item => !!item)
        if (!this.config.multiple && this.selectValue.length) this.selectValue = this.selectValue[0]
      } else {
        this.selectValue = value || []
      }
    },
    getDateSelectPopupContainer () {
      return this.$refs.dropdown || document.body
    },
    getMonthSelectPopupContainer () {
      return this.$refs.dropdown || document.body
    },
    onSearch (e) {
      const val = e.target.value
      if (this.isDropdown) {
        this.dropdownSearch = val
      } else {
        this.keySearch = val
      }
    },
  },
}
</script>

<style lang="less" scoped>
.auto-completer-portal {
  position: fixed;
  z-index: 1050;
}
.auto-completer-arrow {
  position: absolute;
  top: -5px;
  z-index: 1;
  width: 10px;
  height: 10px;
  background: #fff;
  border-left: 1px solid rgba(5, 5, 5, 0.06);
  border-top: 1px solid rgba(5, 5, 5, 0.06);
  transform: rotate(45deg);
  pointer-events: none;
}
.auto-completer-portal.is-placement-top .auto-completer-arrow {
  top: auto;
  bottom: -5px;
  border: none;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
}
.auto-completer-wrap {
  display: flex;
  flex-direction: column;
  text-align: left;
  width: 100%;
  max-height: inherit;
  border-radius: 10px;
  border: 1px solid rgba(5, 5, 5, 0.06);
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12);
  &.is-picker-panel {
    overflow: visible;
  }
}
.search-input {
  border: none;
  outline: 0;
  padding: 0 0 0 2px;
  margin: 0;
  height: 22px;
  font-size: 12px;
}
.completer-tip {
  flex-shrink: 0;
  padding: 8px 12px 4px;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.45);
}
.auto-completer-items {
  font-size: 13px;
  overflow: hidden;
  overflow-y: auto;
  background-color: #fff;
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  > li {
    > span {
      display: block;
      padding: 7px 12px;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.88);
      &.empty {
        cursor: default;
        color: rgba(0, 0, 0, 0.45);
      }
    }
    &:hover {
      background-color: #f5f5f5;
      > span {
        &.empty {
          background-color: transparent;
        }
      }
    }
    &.actions {
      &:hover {
        background-color: #fff;
      }
    }
  }
  &.is-key-list {
    padding: 4px 0 8px;
    > li > span:not(.empty):hover {
      color: var(--ant-color-primary, #1677ff);
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
.cursor-text {
  cursor: text;
}

.actions {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  > span {
    cursor: pointer;
    height: 36px;
    line-height: 36px;
    text-align: center;
    font-size: 13px;
    display: inline-block;
    box-sizing: border-box;
    width: 50%;
    &:first-child {
      border-right: 1px solid #f0f0f0;
    }
    &:hover {
      background-color: #f5f5f5;
    }
    &.disabled {
      cursor: not-allowed;
      background-color: #fafafa;
      color: rgba(0, 0, 0, 0.25);
    }
  }
}

/* 底边线在父级 wrap 上，避免 scoped 无法命中 a-input 根节点 */
.dropdown-search-input-wrap {
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
  padding: 4px 4px 4px 8px;
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
