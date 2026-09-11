<template>
  <div
    class="list-select"
    :class="{ 'is-multiple': multiple }"
    @click="handleOpenSelect">
    <div class="list-select__selector">
      <template v-if="!showDetails">
        <span class="list-select__placeholder">{{ placeholder || $t('common.select') }}</span>
      </template>
      <template v-else-if="multiple">
        <div class="list-select__tags">
          <span
            v-for="item of details"
            :key="item[idKey]"
            class="list-select__tag">
            <span class="list-select__tag-text">{{ formatterLabel(item) }}</span>
            <span class="list-select__tag-remove" @click.stop="handleRemove(item)">
              <icon type="close-outlined" />
            </span>
          </span>
        </div>
      </template>
      <template v-else>
        <span class="list-select__value" :title="formatterLabel(details[0])">{{ formatterLabel(details[0]) }}</span>
      </template>
    </div>
    <span v-if="!multiple" class="list-select__arrow" aria-hidden="true">
      <icon type="pull-down" />
    </span>
  </div>
</template>

<script>
import * as R from 'ramda'
import { getRequestT } from '@/utils/utils'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ListSelect',
  mixins: [WindowsMixin],
  props: {
    listProps: {
      type: Object,
      required: true,
    },
    // 已选择的数据ID
    value: [Array, String],
    // 是否为多选
    multiple: {
      type: Boolean,
      default: true,
    },
    // 自定义格式化label
    formatter: Function,
    placeholder: String,
    dialogParams: {
      type: Object,
      default: () => ({}),
    },
    tabProps: {
      type: Object,
      default: () => ({}),
    },
  },
  provide: {
    inListSelect: true,
  },
  data () {
    return {
      // 传的value如果为空或字符串最终都转换为数组
      selected: R.isEmpty(this.value) || R.isNil(this.value) ? [] : R.is(String, this.value) ? [this.value] : this.value,
      details: [],
    }
  },
  computed: {
    idKey () {
      return this.listProps.list.idKey
    },
    showDetails () {
      return !R.isEmpty(this.details) && !R.isNil(this.details)
    },
  },
  watch: {
    details (newVal, oldVal) {
      if (!R.equals(newVal, oldVal)) this.$emit('update:items', newVal)
    },
    value () {
      this.selected = R.isEmpty(this.value) || R.isNil(this.value) ? [] : R.is(String, this.value) ? [this.value] : this.value
      this.getDetails()
    },
  },
  created () {
    this.listProps.list.disableStorageLimit = true
    this.listProps.list.limit = 10
    if (!R.isNil(this.selected)) {
      this.getDetails()
    }
  },
  methods: {
    async getDetails () {
      if (R.isEmpty(this.selected)) {
        this.details = []
        return
      }
      try {
        const data = await this.listProps.list.fetchSelectedDetails(this.selected, {
          $t: getRequestT(),
        })
        this.details = data
      } catch (error) {
        throw error
      }
    },
    handleOpenSelect () {
      this.createDialog('ListSelectDialog', {
        listProps: this.listProps,
        selected: [...this.selected],
        details: [...this.details],
        ok: this.handleSelected,
        idKey: this.idKey,
        formatterLabel: this.formatterLabel,
        multiple: this.multiple,
        dialogParams: this.dialogParams,
        tabProps: this.tabProps,
      })
    },
    handleSelected (selected, details) {
      this.selected = selected
      this.details = details
      const val = this.multiple ? selected : selected[0]
      this.$emit('change', val)
      this.$emit('input', val)
      this.$emit('update:value', val)
    },
    handleRemove (item) {
      const id = item[this.idKey]
      const index = this.selected.indexOf(id)
      if (index !== -1) {
        this.details.splice(index, 1)
        this.selected.splice(index, 1)
      }
      this.$emit('change', this.selected)
      this.$emit('input', this.selected)
      this.$emit('update:value', this.selected)
    },
    formatterLabel (row) {
      if (this.formatter) {
        return this.formatter(row, this.idKey)
      }
      return `${row.name} / ${row[this.idKey]}`
    },
  },
}
</script>

<style lang="scss" scoped>
.list-select {
  position: relative;
  display: inline-block;
  width: 100%;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;

  &__selector {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 32px;
    padding: 0 30px 0 11px;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      border-color: #4096ff;
    }
  }

  &:focus-within &__selector,
  &:hover &__selector {
    border-color: #4096ff;
  }

  &__placeholder {
    flex: 1;
    overflow: hidden;
    color: rgba(0, 0, 0, 0.25);
    line-height: 30px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__value {
    flex: 1;
    overflow: hidden;
    line-height: 30px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__arrow {
    position: absolute;
    top: 50%;
    right: 11px;
    display: flex;
    align-items: center;
    color: rgba(0, 0, 0, 0.25);
    font-size: 12px;
    pointer-events: none;
    transform: translateY(-50%);
  }

  &__tags {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    max-width: 100%;
    padding: 3px 0;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    height: 24px;
    margin: 0;
    padding: 0 4px 0 8px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    line-height: 22px;
  }

  &__tag-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__tag-remove {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 10px;
    cursor: pointer;

    &:hover {
      color: rgba(0, 0, 0, 0.88);
    }
  }

  &.is-multiple &__selector {
    padding-right: 11px;
  }
}
</style>
