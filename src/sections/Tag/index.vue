<template>
  <div>
    <div class="tag-list">
      <template v-for="item of tags" :key="`${item.key}${item.value}`">
        <span
          class="tag mb-1 d-inline-block"
          :title="item.title"
          :style="{ backgroundColor: item.backgroundColor, color: item.color, borderColor: item.color }">
          <div class="d-flex align-items-center">
            <span class="flex-fill text-truncate">{{ item.title }}</span>
            <icon class="ml-1 remove-tag flex-grow-0 flex-shrink-0" type="close" @click="removeTag(item)" />
          </div>
        </span>
      </template>
    </div>
    <a-form-item :extra="extra" class="mt-2">
      <div class="d-flex">
        <div style="line-height: 40px;">
          <tag-select
            :global="global"
            v-model="checked"
            :params="params"
            :managerInstance="managerInstance"
            :multiple="multiple"
            :button-text="$t('common_110')"
            :allowNoValue="allowNoValue" />
          <pre-defined-tag-select
            v-if="showPreDefinedTagSelect"
            :global="global"
            v-model="checked"
            :params="params"
            :managerInstance="managerInstance"
            :multiple="multiple"
            :allowNoValue="allowNoValue" />
          <a-button class="ml-2" v-if="!showForm && canCreate" @click="() => showForm = true">{{$t('common_258')}}</a-button>
        </div>
        <div class="ml-2 d-inline-flex align-items-center" v-if="showForm">
          <a-input v-model:value="tagKey" :placeholder="$t('common_112')" />
          <a-input class="ml-2" v-model:value="tagValue" :placeholder="$t('common_113')" />
          <a-button class="ml-2" @click="addTag">{{$t('common_114')}}</a-button>
          <a-button @click="resetTagForm" class="ml-2">{{$t('common_115')}}</a-button>
        </div>
      </div>
    </a-form-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import { getTagColor, getTagTitle } from '@/utils/common/tag'
import TagSelect from '@/sections/TagSelect'
import PreDefinedTagSelect from '@/sections/TagSelectPreDefined'
import { isCE } from '@/utils/utils'
import { hasPermission } from '@/utils/auth'
import i18n from '@/locales'

export default {
  name: 'Tag',
  components: {
    TagSelect,
    PreDefinedTagSelect,
  },
  props: {
    extra: {
      type: String,
      default: i18n.t('common_259'),
    },
    value: {
      type: Object,
      default () {
        return {}
      },
    },
    defaultChecked: {
      type: Object,
    },
    canCreate: {
      type: Boolean,
      default: true,
    },
    multiple: Boolean,
    params: {
      type: Object,
      default () {
        return {
          resources: 'server',
        }
      },
    },
    global: {
      type: Boolean,
      default: true,
    },
    managerInstance: Object,
    allowNoValue: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      checked: this.defaultChecked || this.value || {},
      showForm: false,
      tagKey: '',
      tagValue: '',
    }
  },
  computed: {
    showPreDefinedTagSelect () {
      return !isCE() && !this.$store.getters.isSysCE && hasPermission('tags_list')
    },
    tags () {
      const ret = []
      R.forEachObjIndexed((value, key) => {
        if (value.length > 0) {
          if (Array.isArray(value)) {
            for (let i = 0, len = value.length; i < len; i++) {
              ret.push(this.genTag(key, value[i]))
            }
          } else {
            ret.push(this.genTag(key, value))
          }
        } else {
          ret.push(this.genTag(key, null))
        }
      }, this.checked)
      return ret
    },
  },
  watch: {
    // 草稿/工单回填；空对象表示清空（切 IDC/私有/公有时必须清，否则三端标签会串）
    defaultChecked (val) {
      if (!val || R.isEmpty(val)) {
        if (!R.isEmpty(this.checked || {})) {
          this.checked = {}
        }
        return
      }
      if (R.equals(val, this.checked)) return
      this.checked = { ...val }
    },
    // 受控 :value 与 defaultChecked 同等同步 UI
    value (val) {
      if (!val || R.isEmpty(val)) {
        if (!R.isEmpty(this.checked || {})) {
          this.checked = {}
        }
        return
      }
      if (R.equals(val, this.checked)) return
      this.checked = { ...val }
    },
    tags (val) {
      let ret
      if (val && val.length > 0) {
        ret = {}
        for (let i = 0, len = val.length; i < len; i++) {
          if (ret.hasOwnProperty(val[i].key)) {
            if (R.is(Array, ret[val[i].key])) {
              ret[val[i].key].push(val[i].value || '')
            } else {
              ret[val[i].key] = [ret[val[i].key], val[i].value || '']
            }
          } else {
            ret[val[i].key] = val[i].value || ''
          }
        }
      }
      this.$emit('change', ret)
      this.$emit('update:value', ret)
      this.$emit('tagsChange', this.tags)
    },
  },
  methods: {
    resetTagForm () {
      this.tagKey = ''
      this.tagValue = ''
      this.showForm = false
    },
    addTag () {
      const keyRaw = (this.tagKey || '').trim()
      const valueRaw = (this.tagValue || '').trim()
      if (!keyRaw) {
        this.$message.error(this.$t('common_116'))
        return
      }
      if (!valueRaw) {
        this.$message.error(this.$t('common.tips.input', [this.$t('common_113')]))
        return
      }
      const key = `user:${keyRaw}`
      const newValue = { ...this.checked }
      if (newValue[key]) {
        if (!newValue[key].includes(valueRaw)) {
          newValue[key] = this.multiple ? [...newValue[key], valueRaw] : [valueRaw]
        }
      } else {
        newValue[key] = [valueRaw]
      }
      this.checked = newValue
      this.tagKey = ''
      this.tagValue = ''
    },
    genTag (key, value) {
      const rgb = getTagColor(key, value, 'rgb')
      const strRgb = rgb.join(',')
      return {
        title: getTagTitle(key, value),
        color: `rgb(${strRgb})`,
        backgroundColor: `rgba(${strRgb},.1)`,
        key,
        value,
      }
    },
    removeTag (item) {
      const newValue = { ...this.checked }
      if (R.is(Array, newValue[item.key])) {
        const value = newValue[item.key].filter(value => value !== item.value)
        if (value.length) {
          newValue[item.key] = value
        } else {
          delete newValue[item.key]
        }
      } else {
        delete newValue[item.key]
      }
      this.checked = newValue
    },
  },
}
</script>

<style lang="less" scoped>
.tag-list {
  min-height: 65px;
  border: 2px dashed #ddd;
  padding: 8px;
}
.tag {
  max-width: 100%;
  line-height: 20px;
  margin-right: 10px;
  padding: 0 6px 0 4px;
  font-size: 12px;
  border-style: solid;
  border-width: 1px;
  border-radius: 5px;
}
</style>
