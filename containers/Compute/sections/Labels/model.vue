<template>
  <div>
    <div class="d-flex" v-for="(item) in rows" :key="item._id">
      <a-form-model-item :wrapperCol="{ span: 24 }">
        <a-input :addonBefore="keyLabel" v-model:value="item.key" :placeholder="keyPlaceholder" :disabled="isLocked(item)" @change="emitChange" />
      </a-form-model-item>
      <div class="mx-3"> = </div>
      <a-form-model-item :wrapperCol="{ span: 24 }">
        <a-input :addonBefore="valueLabel" v-model:value="item.value" :placeholder="valuePlaceholder" :disabled="isLocked(item)" @change="emitChange" />
      </a-form-model-item>
      <a-button v-if="(firstCanDelete || rows.length > 1) && !isLocked(item)" shape="circle" icon="minus" size="small" @click="del(item)" class="mt-2 ml-2" />
    </div>
    <div class="d-flex align-items-center">
      <a-tooltip :title="disableConf?.tooltip">
        <a-button type="primary" :disabled="disableConf?.disabled" shape="circle" icon="plus" size="small" @click="add" />
        <a-button type="link" :disabled="disableConf?.disabled" @click="add">{{$t('compute.repo.add', [ title ])}}</a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import i18n from '@/locales'

export default {
  name: 'ContainerLables',
  props: {
    title: {
      type: String,
      default: i18n.t('compute.repo.label'),
    },
    keyLabel: {
      type: String,
      default: i18n.t('compute.repo.key'),
    },
    valueLabel: {
      type: String,
      default: i18n.t('compute.repo.value'),
    },
    keyPlaceholder: {
      type: String,
      default: '',
    },
    valuePlaceholder: {
      type: String,
      default: '',
    },
    firstCanDelete: {
      type: Boolean,
      default: true,
    },
    disableConf: {
      type: Object,
      default: () => ({}),
    },
    value: {
      type: Array,
      default: () => [],
    },
    readonlyKeys: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      rows: [],
    }
  },
  // 兼容旧 Labels 的 labelList 读取
  computed: {
    labelList () {
      return this.rows.map(r => ({ key: r._id }))
    },
  },
  watch: {
    value: {
      immediate: true,
      handler (val) {
        if (!Array.isArray(val)) return
        // 外部重置为空时同步
        if (!val.length && this.rows.length) {
          this.rows = []
          return
        }
        // 避免与内部编辑互相覆盖：仅在行数/内容明显不一致时从 value 回填
        if (!this.rows.length && val.length) {
          this.initData(val)
        }
      },
    },
  },
  methods: {
    add () {
      this.rows.push({ _id: uuid(), key: '', value: '' })
      this.emitChange()
    },
    del (item) {
      const index = this.rows.findIndex(val => val._id === item._id)
      if (index >= 0) this.rows.splice(index, 1)
      this.emitChange()
    },
    reset () {
      this.rows = []
      this.emitChange()
    },
    normalizePairs (pairs = []) {
      return (pairs || []).map((pair) => {
        if (!pair || typeof pair !== 'object') return null
        const key = pair.key != null ? pair.key : pair.port
        const value = pair.value != null ? pair.value : pair.host_port
        if (key == null || key === '') return null
        return { key, value }
      }).filter(Boolean)
    },
    initData (pairs = []) {
      const normalized = this.normalizePairs(pairs)
      this.rows = normalized.map(pair => ({
        _id: uuid(),
        key: pair.key,
        value: pair.value != null ? pair.value : '',
      }))
      this.emitChange()
    },
    isLocked (item) {
      if (item?.key == null || item.key === '') return false
      return (this.readonlyKeys || []).includes(item.key)
    },
    getPairs () {
      return this.rows
        .map(({ key, value }) => ({ key: (key || '').trim(), value }))
        .filter(row => row.key)
    },
    emitChange () {
      this.$emit('update:value', this.getPairs())
      this.$emit('change', this.getPairs())
    },
  },
}
</script>
