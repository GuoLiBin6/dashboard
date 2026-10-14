<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ params.title }}</template>
    <template #body>
      <a-form hideRequiredMark>
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
                class="customlist-cell mb-2 checkbox-item checkbox-item--columns"
                :data-property="item.property"
                :class="{
                  'checkbox-item--sortable': !isOrderLockedColumn(item),
                  'checkbox-item--primary': isPrimaryColumn(item),
                  'checkbox-item--action': isActionColumn(item),
                }">
                <div class="checkbox-item__main">
                  <a-checkbox :value="item.property" :disabled="item.disabled || isOrderLockedColumn(item)" class="text-truncate checkbox-property">
                    <span
                      class="checkbox-item__title"
                      :class="{ 'checkbox-item__drag-handle': !isOrderLockedColumn(item) }"
                      :title="item.title || item.property">{{ item.title || item.property }}</span>
                  </a-checkbox>
                  <div
                    class="checkbox-item__gap"
                    :class="{ 'checkbox-item__drag-handle': !isOrderLockedColumn(item) }"
                    aria-hidden="true" />
                </div>
                <a-select
                  size="small"
                  class="checkbox-item__fixed"
                  :value="columnFixedMap[item.property] || ''"
                  :disabled="!columnsSelected.includes(item.property)"
                  :options="isActionColumn(item) ? actionFixedSelectOptions : fixedSelectOptions"
                  @click.stop
                  @mousedown.stop
                  @update:value="(v) => onColumnFixedChange(item.property, v)" />
                <div
                  v-if="!isOrderLockedColumn(item)"
                  class="checkbox-item__handle checkbox-item__drag-handle"
                  @click.stop="iconClick">
                  <icon type="dragable" class="drag-icon" />
                </div>
                <div v-else class="checkbox-item__handle checkbox-item__handle--placeholder" aria-hidden="true" />
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
    // lockedColumns：首列等锁定列（可固定、不可取消勾选、不可拖排序）
    // hidenColumns：兼容旧入参，语义改为锁定而非隐藏
    const lockedColumns = [
      ...(Array.isArray(this.params?.lockedColumns) ? this.params.lockedColumns : []),
      ...(Array.isArray(this.params?.hidenColumns) ? this.params.hidenColumns : []),
    ].filter(Boolean)
    const lockedColumnSet = new Set(lockedColumns)
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

    // 普通的列（不含操作列）；首列等锁定列一并展示
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
          !isExtTag(key)
      })
      .map((item) => {
        if (!lockedColumnSet.has(item.property)) return item
        return {
          ...item,
          visible: true,
          disabled: true,
          isPrimary: true,
        }
      })
    // 锁定首列始终排在最前
    columnFields.sort((a, b) => {
      const ap = a.isPrimary ? 0 : 1
      const bp = b.isPrimary ? 0 : 1
      return ap - bp
    })
    // 当前列表有操作列时追加到末尾：可配置固定，不可拖排序、不可取消勾选
    const actionColRaw = customs.map(normalizeColumn).find(item => item.property === '_action')
    if (actionColRaw) {
      columnFields.push({
        ...actionColRaw,
        property: '_action',
        title: actionColRaw.title || this.$t('table.title._action'),
        visible: true,
        disabled: true,
        isAction: true,
      })
    }
    const initialColumnsSelected = columnFields
      .filter(item => item.visible || item.isPrimary || item.isAction)
      .map(item => item.property)
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
    const initialProjectTagsSelected = projectTagFields.filter(item => {
      return this.params.config.showProjectTagKeys.includes(item.property)
    }).map(item => item.property)
    const fixedFromConfig = this.params?.config?.fixedColumns || {}
    const columnFixedMap = {}
    ;(fixedFromConfig.left || []).forEach((key) => {
      // 操作列不支持左固定
      if (key && key !== '_action') columnFixedMap[key] = 'left'
    })
    ;(fixedFromConfig.right || []).forEach((key) => {
      if (key) columnFixedMap[key] = 'right'
    })
    return {
      loading: false,
      columnFields,
      tagFields,
      instanceTagFields,
      projectTagFields,
      /** 列/标签勾选与表单 model 共用一份选中态 */
      columnsSelected: [...initialColumnsSelected],
      tagsSelected: [...initialTagsSelected],
      projectTagsSelected: [...initialProjectTagsSelected],
      columnsIndeterminate: initialColumnsSelected.length !== 0 && columnFields.length !== initialColumnsSelected.length,
      columnsCheckAll: columnFields.length === initialColumnsSelected.length,
      /** property -> '' | 'left' | 'right' */
      columnFixedMap,
      maxFixedPerSide: 5,
    }
  },
  computed: {
    ...mapGetters(['scope']),
    fixedSelectOptions () {
      return [
        { value: '', label: this.$t('common.column_fixed_none') },
        { value: 'left', label: this.$t('common.column_fixed_left') },
        { value: 'right', label: this.$t('common.column_fixed_right') },
      ]
    },
    /** 操作列仅支持不固定 / 右固定 */
    actionFixedSelectOptions () {
      return [
        { value: '', label: this.$t('common.column_fixed_none') },
        { value: 'right', label: this.$t('common.column_fixed_right') },
      ]
    },
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
          draggable: '.checkbox-item--sortable',
          animation: 150,
          ghostClass: 'ghost',
          onMove: (evt) => {
            // 首列/操作列不可拖；不可拖到首列之前、操作列之后
            if (evt.dragged && (
              evt.dragged.classList.contains('checkbox-item--action') ||
              evt.dragged.classList.contains('checkbox-item--primary')
            )) return false
            if (evt.related && evt.related.classList.contains('checkbox-item--action')) {
              return !evt.willInsertAfter
            }
            if (evt.related && evt.related.classList.contains('checkbox-item--primary')) {
              return !!evt.willInsertAfter
            }
            return true
          },
          onEnd: () => {
            const root = this.$refs.columnsSortableRoot
            if (!root) return
            const orderKeys = [...root.children]
              .filter(node => node.classList && node.classList.contains('checkbox-item--columns'))
              .map(node => node.getAttribute('data-property'))
              .filter(Boolean)
            const byKey = {}
            this.columnFields.forEach((item) => {
              if (item && item.property) byKey[item.property] = item
            })
            const next = []
            orderKeys.forEach((key) => {
              if (byKey[key]) next.push(byKey[key])
            })
            this.columnFields.forEach((item) => {
              if (item && item.property && !next.includes(byKey[item.property])) {
                next.push(item)
              }
            })
            this.columnFields.splice(0, this.columnFields.length, ...next)
            this.ensureLockedColumnsOrder()
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
    isPrimaryColumn (item) {
      return !!(item && item.isPrimary)
    },
    isActionColumn (item) {
      return !!(item && (item.isAction || item.property === '_action'))
    },
    isOrderLockedColumn (item) {
      return this.isPrimaryColumn(item) || this.isActionColumn(item)
    },
    ensurePrimaryColumnFirst () {
      const list = this.columnFields
      if (!Array.isArray(list) || !list.length) return
      const primaries = list.filter(item => this.isPrimaryColumn(item))
      if (!primaries.length) return
      const rest = list.filter(item => !this.isPrimaryColumn(item))
      list.splice(0, list.length, ...primaries, ...rest)
    },
    ensureActionColumnLast () {
      const list = this.columnFields
      if (!Array.isArray(list) || !list.length) return
      const actionIdx = list.findIndex(item => this.isActionColumn(item))
      if (actionIdx < 0 || actionIdx === list.length - 1) return
      const [action] = list.splice(actionIdx, 1)
      list.push(action)
    },
    ensureLockedColumnsOrder () {
      this.ensurePrimaryColumnFirst()
      this.ensureActionColumnLast()
    },
    ensureLockedColumnsSelected (selected = []) {
      const next = Array.isArray(selected) ? [...selected] : []
      this.columnFields.forEach((item) => {
        if (!this.isOrderLockedColumn(item)) return
        if (item.property && !next.includes(item.property)) next.push(item.property)
      })
      return next
    },
    ensureActionColumnSelected (selected = []) {
      return this.ensureLockedColumnsSelected(selected)
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
    async handleConfirm () {
      try {
        const columnsSelected = this.columnsSelected || []
        const tagsSelected = this.tagsSelected || []
        const projectTagsSelected = this.projectTagsSelected || []
        this.loading = true
        this.ensureLockedColumnsOrder()
        const sortColumnsMap = arrToObjByKey(this.columnFields, 'property', (item, i) => i)
        // 首列/操作列始终展示，不进 hiddenColumns
        const unSelect = this.columnFields
          .filter(item => !this.isOrderLockedColumn(item) && !columnsSelected.includes(item.property))
          .map(item => item.property)
        const showTagKeys = this.tagFields.filter(item => tagsSelected.includes(item.property)).map(item => item.property)
        const showProjectTagKeys = this.projectTagFields.filter(item => projectTagsSelected.includes(item.property)).map(item => item.property)
        const fixedLeft = []
        const fixedRight = []
        this.columnFields.forEach((item) => {
          if (!this.isOrderLockedColumn(item) && !columnsSelected.includes(item.property)) return
          const side = this.columnFixedMap[item.property]
          if (side === 'left') fixedLeft.push(item.property)
          if (side === 'right') fixedRight.push(item.property)
        })
        await this.params.update({
          ...this.params.config,
          hiddenColumns: unSelect,
          showTagKeys,
          showProjectTagKeys,
          sortColumnsMap,
          fixedColumns: {
            left: fixedLeft,
            right: fixedRight,
          },
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
      this.columnsSelected = this.ensureLockedColumnsSelected(val)
      // 取消勾选时清除固定（锁定列除外，仍可保留固定配置）
      Object.keys(this.columnFixedMap).forEach((key) => {
        const locked = this.columnFields.some(item => item.property === key && this.isOrderLockedColumn(item))
        if (locked) return
        if (!this.columnsSelected.includes(key) && this.columnFixedMap[key]) {
          this.columnFixedMap[key] = ''
        }
      })
      this.handleColumnsSelectedChange(this.columnsSelected)
    },
    onColumnFixedChange (property, value) {
      let next = value || ''
      // 操作列不允许左固定
      if (property === '_action' && next === 'left') next = ''
      if (next === 'left' || next === 'right') {
        const count = this.columnFields.filter((item) => {
          if (item.property === property) return false
          if (!this.columnsSelected.includes(item.property)) return false
          return this.columnFixedMap[item.property] === next
        }).length
        if (count >= this.maxFixedPerSide) {
          this.$message.warning(this.$t('common.column_fixed_limit', [this.maxFixedPerSide]))
          return
        }
        if (!this.columnsSelected.includes(property)) {
          return
        }
      }
      this.columnFixedMap = {
        ...this.columnFixedMap,
        [property]: next,
      }
    },
    onTagsSelectedUpdate (val) {
      this.tagsSelected = val
    },
    onProjectTagsSelectedUpdate (val) {
      this.projectTagsSelected = val
    },
    handleColumnsCheckAllChange (e) {
      const next = e.target.checked
        ? this.columnFields.map(item => item.property)
        : this.ensureLockedColumnsSelected([])
      this.columnsSelected = next
      if (!e.target.checked) {
        const lockedKeys = new Set(
          this.columnFields.filter(item => this.isOrderLockedColumn(item)).map(item => item.property),
        )
        const cleared = { ...this.columnFixedMap }
        Object.keys(cleared).forEach((key) => {
          if (lockedKeys.has(key)) return
          cleared[key] = ''
        })
        this.columnFixedMap = cleared
      }
      this.columnsCheckAll = e.target.checked
      this.columnsIndeterminate = !e.target.checked && next.length > 0
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
  flex: 0 0 50%;
  max-width: 50%;
  min-width: 0;
}
/* 标签区仍用下方通用 .checkbox-item 文案省略；列自定义区单独布局（拖拽柄不占 label 宽度、hover 可靠） */
.checkbox-item--columns {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 4px;
  padding-right: 8px;
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
.checkbox-item__fixed {
  flex: 0 0 96px;
  width: 96px;
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
.checkbox-item__handle--placeholder {
  visibility: hidden;
  pointer-events: none;
}
.checkbox-item--action,
.checkbox-item--primary {
  cursor: default;
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
