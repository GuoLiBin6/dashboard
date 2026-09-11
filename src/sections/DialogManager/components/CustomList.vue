<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ params.title }}</template>
    <template #body>
      <a-form :form="form.fc" hideRequiredMark>
        <a-form-item>
          <a-divider orientation="left">{{$t('common.text00084')}}</a-divider>
          <a-checkbox
            :indeterminate="columnsIndeterminate"
            @change="handleColumnsCheckAllChange"
            :checked="columnsCheckAll">{{$t('common.checkAll')}}</a-checkbox>
          <a-checkbox-group :value="columnsSelected" @update:value="onColumnsSelectedUpdate" class="w-100">
            <!-- 不用 vuedraggable：@vue/compat 下 #item 插槽偶发无参数导致整段不渲染；排序改用 Sortable 绑定本容器 -->
            <div ref="columnsSortableRoot" class="customlist-grid">
              <div
                v-for="item in columnFields"
                :key="item.property"
                v-show="item && (item.title || item.property)"
                class="customlist-cell mb-2 checkbox-item checkbox-item--columns">
                <div class="checkbox-item__main">
                  <a-checkbox :value="item.property" :disabled="item.disabled" class="text-truncate checkbox-property">
                    <span class="checkbox-item__drag-handle checkbox-item__title" :title="item.title || item.property">{{ item.title || item.property }}</span>
                  </a-checkbox>
                  <div class="checkbox-item__drag-handle checkbox-item__gap" aria-hidden="true" />
                </div>
                <div class="checkbox-item__handle checkbox-item__drag-handle" @click.stop="iconClick">
                  <icon type="dragable" class="drag-icon" />
                </div>
              </div>
            </div>
          </a-checkbox-group>
        </a-form-item>
        <!-- 标签 -->
        <template v-if="showTags">
          <a-form-item>
            <a-divider orientation="left">{{$t('common.text00086')}}</a-divider>
            <a-checkbox-group :value="tagsSelected" @update:value="onTagsSelectedUpdate" class="w-100">
              <div class="tag-fields-wrap">
                <a-row>
                  <a-col
                    v-for="item of tagFields"
                    :span="6"
                    :key="item.property"
                    class="mb-2 checkbox-item">
                    <a-checkbox :value="item.property"><span :title="item.title">{{ item.title }}</span></a-checkbox>
                  </a-col>
                </a-row>
              </div>
            </a-checkbox-group>
          </a-form-item>
        </template>
        <!-- 项目标签 -->
        <template v-if="showProjectTags">
          <a-form-item>
            <a-divider orientation="left">{{$t('common.project_tag_key')}}</a-divider>
            <a-checkbox-group :value="projectTagsSelected" @update:value="onProjectTagsSelectedUpdate" class="w-100">
              <div class="tag-fields-wrap">
                <a-row>
                  <a-col
                    v-for="item of projectTagFields"
                    :span="6"
                    :key="item.property"
                    class="mb-2 checkbox-item">
                    <a-checkbox :value="item.property"><span :title="item.title">{{ item.title }}</span></a-checkbox>
                  </a-col>
                </a-row>
              </div>
            </a-checkbox-group>
          </a-form-item>
        </template>
      </a-form>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import Sortable from 'sortablejs'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { getTagTitle, isUserTag, isExtTag } from '@/utils/common/tag'
import { arrToObjByKey } from '@/utils/utils'

export default {
  name: 'CustomListDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const customsRaw = Array.isArray(this.params?.customs) ? this.params.customs : []
    const hidenColumns = Array.isArray(this.params?.hidenColumns) ? this.params.hidenColumns : []
    const hiddenColumnsFromConfig = Array.isArray(this.params?.config?.hiddenColumns) ? this.params.config.hiddenColumns : []

    // vxe-table 可能存在分组列（children/columns），自定义列只展示叶子列
    const flattenCustoms = (list = []) => {
      const out = []
      const walk = (arr) => {
        ;(arr || []).forEach((it) => {
          const children = it && (it.children || it.columns)
          if (Array.isArray(children) && children.length) {
            walk(children)
          } else {
            out.push(it)
          }
        })
      }
      walk(list)
      return out
    }
    const customs = flattenCustoms(customsRaw)

    const resolveColumnKey = (item) => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return undefined
      return item.property || item.field || item.key
    }
    const resolveColumnTitle = (item) => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return ''
      const t = item.title ?? item.label
      if (typeof t === 'string') return t
      return String(resolveColumnKey(item) || '')
    }
    const normalizeColumn = (item) => {
      if (typeof item === 'string') {
        const property = resolveColumnKey(item)
        return { property, title: property, visible: property ? !hiddenColumnsFromConfig.includes(property) : true }
      }
      const safeItem = (item && typeof item === 'object') ? item : {}
      const property = resolveColumnKey(safeItem)
      const title = resolveColumnTitle(safeItem)
      const visible = typeof safeItem.visible === 'boolean'
        ? safeItem.visible
        : (property ? !hiddenColumnsFromConfig.includes(property) : true)
      return {
        ...safeItem,
        property,
        title,
        visible,
      }
    }

    // 普通的列
    const columnFields = customs
      .map(normalizeColumn)
      .filter(item => {
        const key = item.property
        if (!key) return false
        return item.type !== 'checkbox' &&
          item.type !== 'radio' &&
          key !== '_action' &&
          key !== '_action_placeholder' &&
          !isUserTag(key) &&
          !isExtTag(key) &&
          !hidenColumns.includes(key)
      })
    const initialColumnsSelected = columnFields.filter(item => item.visible).map(item => item.property)
    // 标签列
    const tagFields = customs.map(normalizeColumn).filter(item => {
      const key = item.property
      return item.type !== 'checkbox' &&
        item.type !== 'radio' &&
        key !== '_action' &&
        key !== '_action_placeholder' &&
        (isUserTag(key) || isExtTag(key)) &&
        (item.slots && item.slots.tag_type && item.slots.tag_type({}) === 'resource')
    })
    const instanceTagFields = customs.map(normalizeColumn).filter(item => {
      const key = item.property
      return item.type !== 'checkbox' &&
        item.type !== 'radio' &&
        key !== '_action' &&
        key !== '_action_placeholder' &&
        (isUserTag(key) || isExtTag(key)) &&
        (item.slots && item.slots.tag_type && item.slots.tag_type({}) === 'instance')
    })
    const projectTagFields = customs.map(normalizeColumn).filter(item => {
      const key = item.property
      return item.type !== 'checkbox' &&
        item.type !== 'radio' &&
        key !== '_action' &&
        key !== '_action_placeholder' &&
        (item.slots && item.slots.tag_type && item.slots.tag_type({}) === 'project')
    })
    const initialTagsSelected = tagFields.filter(item => {
      return this.params.config.showTagKeys.includes(item.property)
    }).map(item => item.property)
    const initialInstanceTagsSelected = instanceTagFields.filter(item => {
      return this.params.config.showInstanceTagKeys.includes(item.property)
    }).map(item => item.property)
    const initialProjectTagsSelected = projectTagFields.filter(item => {
      return this.params.config.showProjectTagKeys.includes(item.property)
    }).map(item => item.property)
    return {
      loading: false,
      form: {
        fc: this.$form.createForm(this),
      },
      decorators: {
        columnsSelected: [
          'columnsSelected',
          {
            initialValue: initialColumnsSelected,
            // rules: [
            //   { required: true, message: this.$t('common.text00087') },
            // ],
          },
        ],
        tagsSelected: [
          'tagsSelected',
          {
            initialValue: initialTagsSelected,
          },
        ],
        instanceTagsSelected: [
          'instanceTagsSelected',
          {
            initialValue: initialInstanceTagsSelected,
          },
        ],
        projectTagsSelected: [
          'projectTagsSelected',
          {
            initialValue: initialProjectTagsSelected,
          },
        ],
      },
      columnFields,
      tagFields,
      instanceTagFields,
      projectTagFields,
      /** ant-design-vue v4 无 v-decorator 联动；与 legacy setFieldsValue 共用一份选中态 */
      columnsSelected: [...initialColumnsSelected],
      tagsSelected: [...initialTagsSelected],
      projectTagsSelected: [...initialProjectTagsSelected],
      columnsIndeterminate: initialColumnsSelected.length !== 0 && columnFields.length !== initialColumnsSelected.length,
      columnsCheckAll: columnFields.length === initialColumnsSelected.length,
    }
  },
  computed: {
    ...mapGetters(['scope']),
    tagParams () {
      let ret = {
        with_user_meta: true,
        // with_cloud_meta: true,
        limit: 0,
        scope: this.scope,
      }
      if (R.is(String, this.params.resource)) {
        ret.resources = this.params.resource.substr(0, this.params.resource.length - 1)
      } else {
        ret.resources = this.params.resource.resource.substr(0, this.params.resource.resource.length - 1)
      }
      if (this.params.tagColumnParamsFormatter) {
        ret = this.params.tagColumnParamsFormatter(ret)
      }
      return ret
    },
    instanceTagParams () {
      const ret = {
        with_user_meta: true,
        // with_cloud_meta: true,
        limit: 0,
        scope: this.scope,
        resources: 'instance',
        $t: new Date().getTime(),
      }
      return ret
    },
    projectTagParams () {
      let ret = {
        with_user_meta: true,
        // with_cloud_meta: true,
        limit: 0,
        scope: this.scope,
        resources: 'project',
        $t: new Date().getTime(),
      }
      if (this.params.tagColumn2ParamsFormatter) {
        ret = this.params.tagColumn2ParamsFormatter(ret)
      }
      return ret
    },
    showTags () {
      return this.params.showTagColumns && this.tagFields.length > 0
    },
    showInstanceTags () {
      return this.params.showTagColumns3 && this.instanceTagFields.length > 0
    },
    showProjectTags () {
      return this.params.showTagColumns2 && this.projectTagFields.length > 0
    },
  },
  created () {
    if (this.params.showTagColumns) {
      this.fetchTags()
    }
    if (this.params.showTagColumns3) {
      this.fetchInstanceTags()
    }
    if (this.params.showTagColumns2) {
      this.fetchProjectTags()
    }
    this.syncFormFieldValues()
  },
  mounted () {
    this.initColumnsSortable()
  },
  beforeUnmount () {
    this.destroyColumnsSortable()
  },
  methods: {
    initColumnsSortable () {
      this.destroyColumnsSortable()
      this.$nextTick(() => {
        const el = this.$refs.columnsSortableRoot
        if (!el || !Array.isArray(this.columnFields) || !this.columnFields.length) return
        this._columnsSortable = Sortable.create(el, {
          handle: '.checkbox-item__drag-handle',
          animation: 150,
          ghostClass: 'ghost',
          onEnd: (evt) => {
            const { oldIndex, newIndex } = evt
            if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
            const list = this.columnFields
            if (oldIndex < 0 || newIndex < 0 || oldIndex >= list.length || newIndex >= list.length) return
            const [moved] = list.splice(oldIndex, 1)
            list.splice(newIndex, 0, moved)
          },
        })
      })
    },
    destroyColumnsSortable () {
      if (this._columnsSortable) {
        this._columnsSortable.destroy()
        this._columnsSortable = null
      }
    },
    async fetchTags () {
      let manager = new this.$Manager('metadatas')
      try {
        const response = await (this.params.tagColumnManager ? this.params.tagColumnManager({ params: this.tagParams }) : manager.get({
          id: 'tag-value-pairs',
          params: this.tagParams,
        }))
        const data = response.data.data || []
        // 将已显示的标签列进行合并
        let tags = data.map(item => item.key)
        R.forEach(item => {
          tags.push(item.property)
        }, this.tagFields)
        tags = R.uniq(tags)
        // 拼装数据
        tags = tags.map(item => {
          return {
            property: item,
            title: getTagTitle(item),
          }
        })
        this.tagFields = tags
      } catch (error) {
        throw error
      } finally {
        manager = null
      }
    },
    async fetchInstanceTags () {
      let manager = new this.$Manager('metadatas')
      try {
        const response = await manager.get({
          id: 'tag-value-pairs',
          params: this.instanceTagParams,
        })
        const data = response.data.data || []
        // 将已显示的标签列进行合并
        let tags = data.map(item => item.key)
        R.forEach(item => {
          tags.push(item.property)
        }, this.instanceTagFields)
        tags = R.uniq(tags)
        // 拼装数据
        tags = tags.map(item => {
          return {
            property: item,
            title: getTagTitle(item),
          }
        })
        this.instanceTagFields = tags
      } catch (error) {
        throw error
      } finally {
        manager = null
      }
    },
    async fetchProjectTags () {
      let manager = new this.$Manager(this.params.tagColumn2Resource || 'metadatas')
      try {
        const response = await manager.get({
          id: 'tag-value-pairs',
          params: this.projectTagParams,
        })
        const data = response.data.data || []
        // 将已显示的标签列进行合并
        let tags = data.map(item => item.key)
        R.forEach(item => {
          tags.push(item.property)
        }, this.projectTagFields)
        tags = R.uniq(tags)
        // 拼装数据
        tags = tags.map(item => {
          return {
            property: item,
            title: getTagTitle(item),
          }
        })
        this.projectTagFields = tags
      } catch (error) {
        throw error
      } finally {
        manager = null
      }
    },
    syncFormFieldValues () {
      this.form.fc.setFieldsValue({
        columnsSelected: this.columnsSelected,
        tagsSelected: this.tagsSelected,
        projectTagsSelected: this.projectTagsSelected,
      })
    },
    validateForm () {
      this.syncFormFieldValues()
      return Promise.resolve(this.form.fc.getFieldsValue())
    },
    async handleConfirm () {
      try {
        const { columnsSelected = [], tagsSelected = [], projectTagsSelected = [] } = await this.validateForm()
        this.loading = true
        const sortColumnsMap = arrToObjByKey(this.columnFields, 'property', (item, i) => i)
        const unSelect = this.columnFields.filter(item => !columnsSelected.includes(item.property)).map(item => item.property)
        const showTagKeys = this.tagFields.filter(item => tagsSelected.includes(item.property)).map(item => item.property)
        const showProjectTagKeys = this.projectTagFields.filter(item => projectTagsSelected.includes(item.property)).map(item => item.property)
        await this.params.update({
          ...this.params.config,
          hiddenColumns: unSelect,
          showTagKeys,
          showProjectTagKeys,
          sortColumnsMap,
        })
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    handleColumnsSelectedChange (val) {
      this.columnsIndeterminate = !!val.length && val.length < this.columnFields.length
      this.columnsCheckAll = val.length === this.columnFields.length
    },
    onColumnsSelectedUpdate (val) {
      this.columnsSelected = val
      this.syncFormFieldValues()
      this.handleColumnsSelectedChange(val)
    },
    onTagsSelectedUpdate (val) {
      this.tagsSelected = val
      this.syncFormFieldValues()
    },
    onProjectTagsSelectedUpdate (val) {
      this.projectTagsSelected = val
      this.syncFormFieldValues()
    },
    handleColumnsCheckAllChange (e) {
      const next = e.target.checked ? this.columnFields.map(item => item.property) : []
      this.columnsSelected = next
      this.syncFormFieldValues()
      this.columnsCheckAll = e.target.checked
      this.columnsIndeterminate = false
    },
    iconClick (e) {
      e.preventDefault()
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../styles/less/theme.less';

.tag-fields-wrap {
  max-height: 100px;
  overflow: auto;
}
.customlist-grid {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}
.customlist-cell {
  flex: 0 0 25%;
  max-width: 25%;
  min-width: 0;
}
/* 标签区仍用下方通用 .checkbox-item 文案省略；列自定义区单独布局（拖拽柄不占 label 宽度、hover 可靠） */
.checkbox-item--columns {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 4px;
}
.checkbox-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}
.checkbox-item__gap {
  flex: 1 1 0;
  min-width: 6px;
  min-height: 22px;
  align-self: stretch;
}
.checkbox-item__drag-handle {
  cursor: move;
  user-select: none;
}
.checkbox-item__title {
  display: inline-block;
  max-width: 100%;
}
.checkbox-item__handle {
  flex: 0 0 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  color: rgba(0, 0, 0, 0.45);
}
.checkbox-item--columns .checkbox-item__handle :deep(.drag-icon) {
  cursor: move;
  opacity: 0;
  transition: opacity 0.12s ease;
  flex-shrink: 0;
}
/* 悬停行（文案区、右侧柄区）显示；仅悬停原生 input 时隐藏 */
.checkbox-item--columns:hover .checkbox-item__handle :deep(.drag-icon) {
  opacity: 1;
}
.checkbox-item--columns:has(.ant-checkbox-input:hover) .checkbox-item__handle :deep(.drag-icon) {
  opacity: 0;
}
.checkbox-item:not(.checkbox-item--columns) {
  :deep(.ant-checkbox-wrapper) {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
  }
}
.checkbox-item--columns.checkbox-item {
  :deep(.ant-checkbox-wrapper) {
    display: flex;
    align-items: center;
    width: auto;
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
  }
}
.checkbox-item {
  :deep(.ant-checkbox-wrapper) {
    display: flex;
    align-items: center;
    min-width: 0;
  }
  :deep(.ant-checkbox-wrapper > span:last-child) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :deep(.ant-checkbox) {
    margin-top: 0;
  }
}
.flip-list-move {
  transition: transform 0.5s;
}
.ghost {
  opacity: 0.7;
  background: @primary-color;
  :deep(label span) {
    color: #fff;
  }
}
</style>
