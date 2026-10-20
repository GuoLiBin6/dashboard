<template>
  <div>
    <div class="d-flex" v-for="(item) in rows" :key="item._id">
      <a-form-model-item>
        <a-input-group compact v-if="keyBaseSelectProps">
          <div class="d-flex">
            <a-input class="oc-addonBefore ant-input-group-addon" style="width: 80px;" :defaultValue="keyLabel" readonly />
            <base-select v-model:value="item.key" v-bind="keyBaseSelectProps" @change="emitChange" />
          </div>
        </a-input-group>
        <a-input v-else :addonBefore="keyLabel" v-model:value="item.key" :placeholder="keyPlaceholder" @change="emitChange" />
      </a-form-model-item>
      <div class="mx-3"> = </div>
      <a-form-model-item>
        <a-input :addonBefore="valueLabel" v-model:value="item.value" :placeholder="valuePlaceholder" @change="emitChange" />
      </a-form-model-item>
      <a-button v-if="firstCanDelete || rows.length > 1" type="danger" shape="circle" icon="delete" @click="del(item)" class="mt-1 ml-3" />
    </div>
    <a-button type="primary" icon="plus" @click="add">{{$t('k8s.text_81', [ title ])}}</a-button>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import i18n from '@/locales'

export default {
  name: 'K8SLablesModel',
  props: {
    title: {
      type: String,
      default: i18n.t('k8s.text_82'),
    },
    keyLabel: {
      type: String,
      default: i18n.t('k8s.text_83'),
    },
    valueLabel: {
      type: String,
      default: i18n.t('k8s.text_84'),
    },
    keyPlaceholder: {
      type: String,
      default: i18n.t('k8s.text_85'),
    },
    valuePlaceholder: {
      type: String,
      default: i18n.t('k8s.text_85'),
    },
    keyBaseSelectProps: {
      type: Object,
    },
    firstCanDelete: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      rows: [],
    }
  },
  computed: {
    labelList () {
      return this.rows.map(r => ({ key: r._id }))
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
    getPairs () {
      return this.rows
        .map(({ key, value }) => ({ key: (key || '').trim(), value }))
        .filter(row => row.key)
    },
    getLabelMap () {
      const obj = {}
      this.getPairs().forEach(({ key, value }) => {
        obj[key] = value
      })
      return obj
    },
    emitChange () {
      this.$emit('change', this.getPairs())
    },
  },
}
</script>
