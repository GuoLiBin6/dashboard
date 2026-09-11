<template>
  <div :class="`d-flex tag-filter-wrap ml-2 ${flexFill ? 'flex-fill' : ''}`">
    <tag-select
      multiple
      :params="params"
      :value="tagFilter"
      :managerInstance="tagManagerInstance"
      :ignoreWithUserMetaParam="ignoreWithUserMetaParam"
      :show-ext-tags="showExtTags"
      :show-no-value="showNoValue"
      :filter-with-user-meta="filterWithUserMeta"
      :filter-without-user-meta="filterWithoutUserMeta"
      :withTagKey="withTagKey"
      :withoutTagKey="withoutTagKey"
      @change="handleTagFilterChange">
      <template v-slot:trigger>
        <a-button class="flex-shrink-0"><icon type="res-tag" class="mr-1" />{{buttonText || $t('common.text00012')}}</a-button>
      </template>
    </tag-select>
    <div class="tag-wrap ml-2" v-if="tags && tags.length > 0">
      <div class="tag-list">
        <template v-for="item of tags" :key="`${item.key}${item.value}`">
          <div
            class="tag-item"
            :title="item.title"
            :style="{ backgroundColor: item.backgroundColor, color: item.color, borderColor: item.color }">
            <span class="tag-item-text">{{ item.title }}</span>
            <icon type="close" class="tag-item-close" @click="removeTag(item)" />
          </div>
        </template>
      </div>
      <a-tooltip :title="$t('common.clear_tags')" placement="top">
        <span class="remove-all-btn-wrap">
          <a-button class="remove-all-btn" @click="handleTagFilterChange({})">
            <icon type="delete" />
          </a-button>
        </span>
      </a-tooltip>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import TagSelect from '@/sections/TagSelect'
import { getTagColor, getTagTitle } from '@/utils/common/tag'

export default {
  name: 'PageListTagFilter',
  components: {
    TagSelect,
  },
  props: {
    tagManagerInstance: Object,
    ignoreWithUserMetaParam: Boolean,
    tagFilter: Object,
    resource: [String, Object],
    extTagParams: {
      type: Object,
      default () {
        return {}
      },
    },
    showExtTags: Boolean,
    showNoValue: Boolean,
    buttonText: String,
    flexFill: {
      type: Boolean,
      default: true,
    },
    filterWithUserMeta: {
      type: Boolean,
      default: true,
    },
    filterWithoutUserMeta: {
      type: Boolean,
      default: true,
    },
    withTagKey: {
      type: String,
      default: 'with_user_meta',
    },
    withoutTagKey: {
      type: String,
      default: 'without_user_meta',
    },
  },
  computed: {
    params () {
      const ret = {
        with_cloud_meta: this.showExtTags,
        ...this.extTagParams,
      }
      if (R.is(String, this.resource)) {
        ret.resources = this.resource.substr(0, this.resource.length - 1)
      } else {
        ret.resources = this.resource.resource.substr(0, this.resource.resource.length - 1)
      }
      return ret
    },
    tags () {
      const ret = []
      R.forEachObjIndexed((value, key) => {
        if (value && value.length > 0) {
          if (value.length > 1) {
            const vals = []
            for (let i = 0, len = value.length; i < len; i++) {
              vals.push(value[i])
            }
            ret.push(this.genTag(key, vals.join(' or ')))
          } else {
            ret.push(this.genTag(key, value[0]))
          }
        } else {
          ret.push(this.genTag(key))
        }
      }, this.tagFilter)
      return ret
    },
  },
  methods: {
    handleTagFilterChange (tagFilter) {
      this.$emit('tag-filter-change', tagFilter)
    },
    genTag (key, value) {
      const rgb = getTagColor(key, value, 'rgb')
      const strRgb = rgb.join(',')
      let title = getTagTitle(key, value)
      if (key === this.withoutTagKey) title = this.$t('common.text00013')
      if (key === this.withTagKey) title = this.$t('common.with_user_meta')
      return {
        key,
        value,
        title,
        color: `rgb(${strRgb})`,
        backgroundColor: `rgba(${strRgb},.1)`,
      }
    },
    removeTag (item) {
      const newValue = { ...this.tagFilter }
      delete newValue[item.key]
      this.handleTagFilterChange(newValue)
    },
  },
}
</script>

<style lang="less" scoped>
.tag-filter-wrap {
  min-width: 0;
  align-items: center;
  // antdv4 default 按钮 hover 用 colorPrimaryHover（偏浅），细线 SVG 会比文字更淡
  // 统一为主色，保证 icon / 文字 / 边框一致
  :deep(.ant-btn:not(:disabled):hover),
  :deep(.ant-btn:not(:disabled):focus) {
    color: var(--ant-color-primary, #1890ff) !important;
    border-color: var(--ant-color-primary, #1890ff) !important;
    .oc-icon,
    .oc-icon path {
      color: var(--ant-color-primary, #1890ff) !important;
      fill: var(--ant-color-primary, #1890ff) !important;
    }
  }
  :deep(.ant-btn .oc-icon) {
    color: inherit;
    fill: currentColor;
  }
}
.tag-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  height: 32px;
}
.tag-list {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
  overflow-x: auto;
  overflow-y: hidden;
  border: none;
  background: transparent;
  padding: 0;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 32px;
  line-height: 30px;
  font-size: 12px;
  white-space: nowrap;
  max-width: 200px;
  padding: 0 8px;
  border-style: solid;
  border-width: 1px;
  border-radius: 6px;
  box-sizing: border-box;
  .tag-item-text {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }
  .tag-item-close {
    flex-shrink: 0;
    cursor: pointer;
    margin-left: 6px;
    width: 10px;
    height: 10px;
    font-size: 10px;
    opacity: 0.75;
    &:hover {
      opacity: 1;
    }
  }
}
.remove-all-btn-wrap {
  display: inline-flex;
  flex-shrink: 0;
}
.remove-all-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  .oc-icon {
    font-size: 14px;
  }
}
</style>
