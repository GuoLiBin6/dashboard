<template>
  <div id="dashboard-header" class="d-flex align-items-center">
    <!-- 不用 vuedraggable：@vue/compat 下 #item 插槽偶发无参数导致整段不渲染；排序改用 Sortable 绑定本容器 -->
    <ul ref="tabsSortableRoot" class="d-flex flex-fill flex-wrap list-unstyled m-0">
      <li
        v-for="item in options"
        :key="item.id"
        class="item"
        :class="{ active: current.id === item.id, single: isSingle }"
        @click.stop.prevent="$emit('select', item)">
        <span class="item-inner">
          <icon
            v-if="!isSingle"
            type="move"
            class="drag-icon" />
          <span>{{ item.name }}</span>
        </span>
      </li>
    </ul>
    <data-range v-if="(isAdminMode || isDomainMode) && $appConfig.isPrivate && !$store.getters.isSysCE" :dataRangeParams="dataRangeParams" @updateDataRange="updateDataRange" />
    <a-button @click="handleRefresh" type="link" class="action-btn">
      <icon type="refresh" />
    </a-button>
    <a-dropdown v-if="showActions.length" :trigger="['click']" placement="bottomRight">
      <a class="ant-dropdown-link font-weight-bold pl-2 pr-2 h-100 d-block action-btn" @click="e => e.preventDefault()">
        <icon type="more" style="font-size: 18px;" />
      </a>
      <template #overlay>
        <a-menu @click="handleActionClick">
          <a-menu-item key="handleCreate" v-if="showActions.includes('create')"><icon type="icon_add" class="mr-2" />{{$t('dashboard.text_103')}}</a-menu-item>
          <a-menu-item key="handleEdit" v-if="showActions.includes('edit')"><icon type="edit" class="mr-2" />{{$t('dashboard.text_104')}}</a-menu-item>
          <a-menu-item key="handleDownload" v-if="showActions.includes('export')"><icon type="download" class="mr-2" />{{$t('dashboard.text_105')}}</a-menu-item>
          <a-menu-item key="handleImport" v-if="showActions.includes('import')"><icon type="file" class="mr-2" />{{$t('dashboard.text_106')}}</a-menu-item>
          <a-menu-item key="handleCopy" v-if="showActions.includes('clone')"><icon type="copy" class="mr-2" />{{$t('dashboard.text_107')}}</a-menu-item>
          <a-menu-item key="handleShare" v-if="isAdminRole && isDefaultOption && showActions.includes('share')"><icon type="share-alt" class="mr-2" />{{$t('common_104', [''])}}</a-menu-item>
          <a-menu-item key="handleDelete" v-if="showActions.includes('reset')"><icon type="delete" class="mr-2" />{{deleteText}}</a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script>
import { h } from 'vue'
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import { Base64 } from 'js-base64'
import Sortable from 'sortablejs'
import { download, uuid } from '@/utils/utils'
import WindowsMixin from '@/mixins/windows'
import DataRange from './DataRange.vue'

export default {
  name: 'DashboardHeader',
  components: {
    DataRange,
  },
  mixins: [WindowsMixin],
  props: {
    tabs: {
      type: Array,
      required: true,
    },
    current: {
      type: Object,
      required: true,
    },
    // 当前卡片配置
    data: {
      type: [Array, Object],
      required: true,
    },
    // 检查options配置是否创建过
    checkOptionsCreated: {
      type: Function,
      required: true,
    },
    // 创建初始化配置
    initOptions: {
      type: Function,
      required: true,
    },
    // 是否为默认面板
    isDefaultOption: Boolean,
    dataRangeParams: {
      type: Object,
    },
  },
  data () {
    return {
      isPrivate: process.env.VUE_APP_IS_PRIVATE,
    }
  },
  computed: {
    ...mapGetters(['scope', 'userInfo', 'isAdminMode', 'isDomainMode']),
    options: {
      get () {
        return this.tabs
      },
      set (value) {
        this.$emit('update-options', value)
      },
    },
    // 是否只有一个标签
    isSingle () {
      return this.tabs.length === 1
    },
    deleteText () {
      if (this.isDefaultOption) {
        return this.$t('common.reset')
      } else {
        return this.$t('dashboard.text_108')
      }
    },
    showActions () {
      return (['create', 'edit', 'export', 'import', 'share', 'reset', 'clone']).filter(key => {
        return !this.$isScopedPolicyMenuHidden(`dashboard_hidden_actions.${key}`)
      })
    },
    isAdminRole () {
      const { projects = [] } = this.userInfo
      const systemProj = projects.find(o => o.name === 'system')
      return !!systemProj
    },
  },
  watch: {
    'tabs.length' () {
      this.initTabsSortable()
    },
  },
  mounted () {
    this.initTabsSortable()
  },
  beforeUnmount () {
    this.destroyTabsSortable()
    this.pm = null
  },
  created () {
    this.pm = new this.$Manager('parameters', 'v1')
  },
  methods: {
    initTabsSortable () {
      this.destroyTabsSortable()
      this.$nextTick(() => {
        const el = this.$refs.tabsSortableRoot
        if (!el || !Array.isArray(this.options) || !this.options.length) return
        this._tabsSortable = Sortable.create(el, {
          animation: 150,
          // 整项可拖；点击仍选中（Sortable 仅在发生位移后才进入拖拽）
          onEnd: (evt) => {
            const { oldIndex, newIndex } = evt
            if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
            const list = [...this.options]
            if (oldIndex < 0 || newIndex < 0 || oldIndex >= list.length || newIndex >= list.length) return
            const [moved] = list.splice(oldIndex, 1)
            list.splice(newIndex, 0, moved)
            this.$emit('update-options', list)
          },
        })
      })
    },
    destroyTabsSortable () {
      if (this._tabsSortable) {
        this._tabsSortable.destroy()
        this._tabsSortable = null
      }
    },
    updateDataRange (params) {
      this.$emit('updateDataRange', params)
    },
    handleActionClick ({ key }) {
      if (this[key]) this[key]()
    },
    handleCreate () {
      this.$router.push({ name: 'DashboardEdit' })
    },
    handleEdit () {
      this.$router.push({ name: 'DashboardEdit', query: { id: this.current.id } })
    },
    handleDownload () {
      const name = `${this.$t(`policyScopeLabel.${this.scope}`)}_${this.current.name}.ocdb`
      const data = this.genExportData()
      download(data, name)
    },
    handleImport () {
      this.createDialog('DashboardImport', {
        title: this.$t('dashboard.text_106'),
        options: this.options,
        genName: name => this.genName(name),
        checkOptionsCreated: () => this.checkOptionsCreated(),
        initOptions: () => this.initOptions(),
        updateOptions: options => this.$emit('update-options', options),
        selectOption: item => {
          this.$emit('select', item)
        },
      })
    },
    handleDelete () {
      this.createDialog('CommonDialog', {
        header: this.deleteText,
        body: () => {
          let number
          if (R.is(Array, this.data)) {
            number = this.data.length
          } else {
            number = Object.keys(this.data).length
          }
          const data = [{
            ...this.current,
            number,
          }]
          return [
            h('dialog-selected-tips', {
              props: {
                count: 1,
                action: this.deleteText,
                name: this.$t('dashboard.text_109'),
              },
            }),
            h('dialog-table', {
              props: {
                vxeGridProps: { showOverflow: 'title' },
                data: data,
                columns: [
                  {
                    field: 'name',
                    title: this.$t('dashboard.text_110'),
                  },
                  {
                    field: 'number',
                    title: this.$t('dashboard.text_111'),
                  },
                ],
              },
            }),
          ]
        },
        ok: async () => {
          try {
            const newOptions = [...this.options]
            const index = R.findIndex(R.propEq('id', this.current.id))(newOptions)
            if (index !== -1) {
              newOptions.splice(index, 1)
            }
            if (newOptions.length) {
              await this.$emit('update-options', newOptions)
            }
            await this.pm.delete({
              id: this.current.id,
            })
            // 使用删除后的列表首项，避免 update-options 尚未反映到 tabs 时仍用旧的 options[0]
            const next = newOptions.length ? newOptions[0] : this.options[0]
            this.$emit('select', next)
          } catch (error) {
            throw error
          }
        },
      })
    },
    async handleCopy () {
      try {
        // 检查是否已经创建了dashboard配置
        const optionsCreated = await this.checkOptionsCreated()
        if (!optionsCreated) {
          await this.initOptions()
        }
        // 更新options
        const newOptions = [...this.options]
        const id = `dashboard-${this.scope}-panel-${uuid(16)}`
        const item = {
          name: this.genName(this.current.name),
          id,
        }
        newOptions.push(item)
        await this.$emit('update-options', newOptions)
        // 创建panel数据配置
        const panelData = {}
        if (R.is(Array, this.data)) {
          for (let i = 0, len = this.data.length; i < len; i++) {
            panelData[`dashboard-item-${uuid(32)}`] = this.data[i]
          }
        } else {
          for (const key in this.data) {
            panelData[`dashboard-item-${uuid(32)}`] = this.data[key]
          }
        }
        await this.pm.create({
          data: {
            name: id,
            value: panelData,
          },
        })
        this.$emit('select', item)
      } catch (error) {
        throw error
      }
    },
    // 生成面板名称，如果已存在默认+1
    genName (name) {
      const existNames = this.options.map(item => item.name)
      let num = 1
      let newName = name
      while (existNames.includes(newName)) {
        newName = `${newName}-${num++}`
      }
      return newName
    },
    // 生成导出及克隆的数据
    genExportData () {
      const ret = {
        scope: this.scope,
        name: this.current.name,
        items: [],
      }
      R.forEachObjIndexed((value, key) => {
        ret.items.push(value)
      }, this.data)
      const data = Base64.encode(JSON.stringify(ret))
      return data
    },
    handleRefresh () {
      this.$emit('refresh')
    },
    handleShare () {
      this.createDialog('CommonDialog', {
        header: this.$t('common_104', ['']),
        body: () => {
          return [
            h('a-alert', {
              class: 'mb-2',
              props: {
                type: 'warning',
              },
            }, [
              h('div', {
                slot: 'message',
              }, this.$t('dashbaord.panel_shared_tip')),
            ]),
            h('dialog-selected-tips', {
              props: {
                count: 1,
                action: this.$t('common_104', ['']),
                name: this.$t('dashboard.text_109'),
              },
            }),
          ]
        },
        ok: async () => {
          await this.$store.dispatch('widgetSetting/putFetchWidgetSettingValue', {
            [`dashboard-${this.scope}`]: this.data,
          })
          this.$message.success(this.$t('compute.text_423'))
        },
      })
    },
  },
}
</script>

<style lang="less" scoped>
@import '@/styles/less/theme';

.item {
  padding: 12px;
  margin: 0 32px 0 0;
  cursor: grab;
  position: relative;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  &:last-child {
    margin-right: 0;
  }
  &.active {
    border-bottom: 1px solid var(--ant-color-primary, #1890ff);
    color: var(--ant-color-primary, #1890ff);
    font-weight: bold;
  }
  &:hover {
    color: var(--ant-color-primary, #1890ff);
    .drag-icon {
      opacity: 1;
    }
  }
  &:active {
    cursor: grabbing;
  }
  &.single {
    cursor: pointer;
    &:active {
      cursor: pointer;
    }
  }
  .item-inner {
    position: relative;
    display: inline-block;
  }
  .drag-icon {
    position: absolute;
    right: 100%;
    top: 50%;
    z-index: 1;
    width: 1em;
    height: 1em;
    margin-right: 5px;
    margin-top: -0.5em;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.55);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s cubic-bezier(0.2, 0, 0, 1);
  }
}
.action-btn {
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  &:hover {
    color: var(--ant-color-primary, #1890ff);
  }
}
</style>
