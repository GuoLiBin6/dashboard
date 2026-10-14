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
            <a-icon v-if="showRemove(item)" class="ml-1 remove-tag flex-grow-0 flex-shrink-0" type="close" @click="removeTag(item)" />
          </div>
        </span>
      </template>
    </div>
    <a-form-item :extra="$t('compute.text_1146')" class="mt-2">
      <div class="d-flex">
        <div style="line-height: 40px;">
          <tag-select
            global
            v-model="checked"
            :params="params"
            :button-text="$t('compute.text_1147')"
            :defaultChecked="defaultChecked" />
          <pre-defined-tag-select
            v-if="showPreDefinedTagSelect"
            global
            v-model="checked"
            :params="params"
            :defaultChecked="defaultChecked"
            :allowNoValue="false" />
          <a-button class="ml-2" v-if="!showForm" @click="() => showForm = true">{{$t('compute.text_1382')}}</a-button>
        </div>
        <div class="ml-2 d-flex align-items-center" v-if="showForm">
          <a-input v-model:value="customTag.key" :placeholder="$t('compute.text_1148')" />
          <a-input class="ml-2" v-model:value="customTag.value" :placeholder="$t('compute.text_1149')" />
          <a-button class="ml-2" @click="addTag">{{$t('compute.text_822')}}</a-button>
          <a-button @click="() => showForm = false" class="ml-2">{{$t('compute.text_135')}}</a-button>
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

export default {
  name: 'Tag',
  components: {
    TagSelect,
    PreDefinedTagSelect,
  },
  props: {
    defaultChecked: {
      type: Object,
    },
  },
  data () {
    return {
      checked: this.defaultChecked || {},
      showForm: false,
      customTag: {
        key: '',
        value: '',
      },
    }
  },
  computed: {
    showPreDefinedTagSelect () {
      return !isCE() && !this.$store.getters.isSysCE && hasPermission('tags_list')
    },
    params () {
      return {
        resources: 'server',
      }
    },
    tags () {
      const ret = []
      R.forEachObjIndexed((value, key) => {
        if (value.length > 0) {
          for (let i = 0, len = value.length; i < len; i++) {
            ret.push(this.genTag(key, value[i]))
          }
        } else {
          ret.push(this.genTag(key, null))
        }
      }, this.checked)
      return ret
    },
  },
  watch: {
    tags (val) {
      let ret
      if (val && val.length > 0) {
        ret = {}
        for (let i = 0, len = val.length; i < len; i++) {
          ret[val[i].key] = val[i].value || ''
        }
      }
      this.$emit('change', ret)
    },
    defaultChecked (val) {
      this.checked = Object.assign({}, this.checked, this.defaultChecked || {})
    },
  },
  methods: {
    async addTag () {
      try {
        const keyRaw = (this.customTag.key || '').trim()
        const valueRaw = (this.customTag.value || '').trim()
        if (!keyRaw) {
          this.$message.error(this.$t('compute.text_1150'))
          return
        }
        if (!valueRaw) {
          this.$message.error(this.$t('common.tips.input', [this.$t('common_113')]))
          return
        }
        const values = { key: keyRaw, value: valueRaw }
        const key = `user:${values.key}`
        const newValue = { ...this.checked }
        if (newValue[key]) {
          if (values.value) {
            if (!newValue[key].includes(values.value)) {
              newValue[key] = [values.value]
            }
          }
        } else {
          if (values.value) {
            newValue[key] = [values.value]
          } else {
            newValue[key] = []
          }
        }
        this.checked = newValue
        this.customTag = { key: '', value: '' }
      } catch (error) {
        throw error
      }
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
      delete newValue[item.key]
      this.checked = newValue
    },
    showRemove (item) {
      if (this.defaultChecked && this.defaultChecked[item.key]) {
        return false
      }
      return true
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
