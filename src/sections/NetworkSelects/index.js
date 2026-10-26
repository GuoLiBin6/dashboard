import * as R from 'ramda'
import i18n from '@/locales'
import legacyH from '@/utils/legacyCreateElement'

export default {
  name: 'NetworkSelects',
  inject: {
    form: { default: undefined },
  },
  props: {
    /**
     * a-form-model：父级 form 对象，读写 vpc / network（必传）。
     * 用法：<network-selects :model="form.fd" />
     * 或 import NetworkSelects from '@/sections/NetworkSelects/model'
     */
    model: {
      type: Object,
      required: true,
    },
    disabled: {
      type: [Boolean, Array],
      default: false,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    placeholders: {
      type: Object,
      default: () => {
        return {
          vpc: i18n.t('common_226'),
          network: i18n.t('common_227'),
        }
      },
    },
    label: {
      type: String,
      default: i18n.t('common_228'),
    },
    types: {
      type: Array,
      default: () => {
        return ['vpc', 'network']
      },
    },
    form: {
      type: Object,
    },
    vpcParams: {
      type: [Object, Function],
    },
    vpcFetchChange: {
      type: Function,
    },
    vpcFormat: {
      type: Function,
    },
    networkParams: {
      type: [Object, Function],
    },
    networkFetchChange: {
      type: Function,
    },
    networkFormat: {
      type: Function,
    },
    labelCol: {
      type: Object,
      default: undefined,
    },
    wrapperCol: {
      type: Object,
      default: undefined,
    },
    defaultActiveFirstOption: {
      type: Boolean,
      default: true,
    },
    isDefaultFetch: {
      type: Boolean,
      default: true,
    },
  },
  created () {
    this.types.forEach((name) => {
      if (this.model[name] === undefined) {
        this.$set(this.model, name, undefined)
      }
    })
    if (this.isDefaultFetch) {
      this.fetchs()
    }
  },
  data () {
    return {
      vpcList: [],
      vpcLoading: false,
      networkList: [],
      networkLoading: false,
    }
  },
  computed: {

    colSpan () {
      return 24 / this.types.length
    },
  },
  watch: {
    vpcParams (val, oldVal) {
      if (R.equals(val, oldVal)) return
      this.fetchs()
    },
    networkParams (val, oldVal) {
      if (R.equals(val, oldVal)) return
      this.fetchNetwork()
    },
  },
  methods: {

    getModelField (name) {
      return this.model[name]
    },
    getModelFields (names) {
      if (Array.isArray(names) && names.length) {
        const picked = {}
        names.forEach((name) => { picked[name] = this.model[name] })
        return picked
      }
      return { ...this.model }
    },
    setModelFields (vals, callback) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach((key) => {
        this.$set(this.model, key, vals[key])
      })
      if (typeof callback === 'function') {
        this.$nextTick(callback)
      }
    },

    validateModelFields () {
      return Promise.resolve({ ...this.model })
    },
    firstName (name) {
      return name.replace(/^\S/, s => s.toUpperCase())
    },
    filterOption (input, option) {
      const subChild = option.componentOptions && option.componentOptions.children && option.componentOptions.children[0]
      if (subChild && subChild.text) {
        return (
          subChild.text.toLowerCase().indexOf(input.toLowerCase()) >= 0
        )
      }
      if (subChild && subChild.children && subChild.children[0]) {
        return subChild.children[0].data.attrs.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
      // antdv4 option shape
      const label = option && (option.label != null ? option.label : option.value)
      if (label != null) {
        return String(label).toLowerCase().indexOf(String(input || '').toLowerCase()) >= 0
      }
      return true
    },
    async fetchs (callback) {
      // 内部不再把 callback 传给子请求，避免 vpc/network 各触发一次且 payload 不完整
      if (this.types.indexOf('vpc') > -1) {
        await this.fetchVpc()
      }
      if (this.types.indexOf('network') > -1) {
        await this.fetchNetwork()
      }
      if (callback && R.type(callback) === 'Function') {
        // eslint-disable-next-line standard/no-callback-literal
        callback({
          vpcList: this.vpcList || [],
          networkList: this.networkList || [],
        })
      }
    },
    getSelectedValue (key, id) {
      const list = (this[`${key}List`] && this[`${key}List`].length > 0) ? this[`${key}List`] : []
      return list.find(item => {
        return item.id === id || item.name === id
      })
    },
    async getVpcParams () {
      const _default = {
        limit: 0,
        usable: true,
      }
      if (this.vpcParams) {
        if (R.type(this.vpcParams) === 'Object') {
          return Object.assign({}, _default, this.vpcParams)
        }
        if (R.type(this.vpcParams) === 'Function') {
          const _params = await this.vpcParams() || {}
          return Object.assign({}, _default, _params)
        }
      }
      return _default
    },
    async fetchVpc (callback) {
      const PARAMS = await this.getVpcParams()
      const MANAGER = new this.$Manager('vpcs', 'v2')
      this.vpcLoading = true
      try {
        const { data = {} } = await MANAGER.list({ params: PARAMS })
        if (this.vpcFetchChange) {
          this.vpcList = await this.vpcFetchChange(this.vpcList)
        } else {
          this.vpcList = data.data || []
        }
        if (this.defaultActiveFirstOption) {
          const prefer = this.getModelField('vpc')
          const hit = prefer && this.vpcList.some(item => item.id === prefer)
          // 列表空：不写；有 prefer 但不在列表 → 回退首项（不保留非法值）
          let next
          if (R.isEmpty(this.vpcList)) {
            next = undefined
          } else if (hit) {
            next = prefer
          } else {
            next = this.vpcList[0].id
          }
          this.setModelFields({ vpc: next }, this.fetchNetwork)
        }
      } catch (err) {
        throw err
      } finally {
        this.vpcLoading = false
        if (callback && R.type(callback) === 'Function') {
          // eslint-disable-next-line standard/no-callback-literal
          callback({
            vpcList: this.vpcList || [],
          })
        }
      }
    },
    RenderVpc () {
      const { vpcLoading, filterOption, disabled } = this
      const _handleChange = (vpcId) => {
        this.$set(this.model, 'vpc', vpcId)
        const data = this.getSelectedValue('vpc', vpcId)
        this.$emit('vpcChange', data)
        this.$nextTick(() => {
          this.fetchNetwork()
        })
      }
      // 须用 legacyH：把 Vue2 的 props/on 归一化，否则 optionLabelProp/label 传不进 antdv4
      const h = legacyH
      const options = this.vpcList.map((item) => {
        const { id, name } = item
        const label = this.vpcFormat ? (typeof this.vpcFormat(item) === 'string' ? this.vpcFormat(item) : name) : name
        return h('a-select-option', { key: id, props: { value: id, label } }, this.vpcFormat ? this.vpcFormat(item) : name)
      })
      const renderStatusDesc = () => {
        return h('a-select-option', { key: '-1', props: { value: '-1', disabled: true } }, [
          h('a-badge', { props: { status: 'success' }, class: 'oc-custom-badge text-left text-wrap', attrs: { text: this.$t('compute.vpc_status_desc') } }),
        ])
      }
      return h('a-select', {
        props: {
          disabled,
          showSearch: true,
          placeholder: i18n.t('common_226'),
          loading: vpcLoading,
          filterOption,
          optionLabelProp: 'label',
          optionFilterProp: 'label',
          value: this.model.vpc,
        },
        on: { change: _handleChange },
      }, [
        renderStatusDesc(),
        ...options,
      ])
    },
    async getNetworkParams () {
      const vpc = this.getModelField('vpc')
      const _default = {
        vpc,
        limit: 0,
        usable: true,
      }
      if (this.networkParams) {
        if (R.type(this.networkParams) === 'Object') {
          return Object.assign({}, _default, this.networkParams)
        }
        if (R.type(this.networkParams) === 'Function') {
          const _params = await this.networkParams() || {}
          return Object.assign({}, _default, _params)
        }
      }
      return _default
    },
    async fetchNetwork (callback) {
      const PARAMS = await this.getNetworkParams()
      if (this.types.indexOf('vpc') > -1 && !PARAMS.vpc) {
        this.networkList = []
        if (callback && R.type(callback) === 'Function') {
          // eslint-disable-next-line standard/no-callback-literal
          callback({ networkList: [] })
        }
        return false
      }
      const MANAGER = new this.$Manager('networks', 'v2')
      this.networkLoading = true
      try {
        const { data = {} } = await MANAGER.list({ params: PARAMS })
        if (this.networkFetchChange) {
          this.networkList = await this.networkFetchChange(data.data)
        } else {
          this.networkList = (data.data || [])
        }
        if (this.defaultActiveFirstOption) {
          const prefer = this.getModelField('network')
          const hit = prefer && this.networkList.some(item => item.id === prefer)
          let next
          if (R.isEmpty(this.networkList)) {
            next = undefined
          } else if (hit) {
            next = prefer
          } else {
            next = this.networkList[0].id
          }
          this.setModelFields({ network: next })
        }
      } catch (err) {
        this.networkList = []
        this.setModelFields({
          network: undefined,
        })
        throw err
      } finally {
        if (callback && R.type(callback) === 'Function') {
          // eslint-disable-next-line standard/no-callback-literal
          callback({
            networkList: this.networkList || [],
          })
        }
        this.networkLoading = false
      }
    },
    RenderNetwork () {
      const { networkLoading, filterOption, disabled } = this
      const _handleChange = (networkId) => {
        this.$set(this.model, 'network', networkId)
        const data = this.getSelectedValue('network', networkId)
        this.$emit('networkChange', data)
      }
      const h = legacyH
      const options = this.networkList.map((item) => {
        const { id, name } = item
        const text = `${name} (${item.guest_ip_start} - ${item.guest_ip_end}）`
        const content = this.networkFormat
          ? this.networkFormat(item)
          : h('div', { class: 'd-flex' }, [
            h('span', { class: 'text-truncate flex-fill mr-2', attrs: { title: text } }, text),
            h('span', { style: { color: '#8492a6', fontSize: '13px' } }, this.$t('common.available_1var', [item.ports - item.ports_used])),
          ])
        // antdv4：下拉可复杂节点，选中态用 label（名称），避免回退显示 id
        return h('a-select-option', { key: id, props: { value: id, label: name } }, content)
      })
      const select = h('a-select', {
        style: { flex: '1 1 auto', minWidth: 0, width: 'auto' },
        props: {
          disabled,
          showSearch: true,
          placeholder: i18n.t('common_227'),
          loading: networkLoading,
          filterOption,
          optionLabelProp: 'label',
          optionFilterProp: 'label',
          value: this.model.network,
        },
        on: { change: _handleChange },
      }, options)
      // 刷新图标与 Select 同行垂直居中（勿再单独占 a-col，会顶对齐偏上）
      return h('div', {
        class: 'd-flex align-items-center',
        style: { width: '100%' },
      }, [
        select,
        h('icon', {
          props: { type: 'sync', spin: this.networkLoading },
          class: 'ml-2 primary-color flex-shrink-0',
          style: { cursor: 'pointer', lineHeight: 1 },
          on: { click: this.fetchNetwork },
        }),
      ])
    },
  },
  render () {
    const h = legacyH
    const RenderCols = this.types.map(name => {
      const sn = this.firstName(name)
      if (this[`Render${sn}`]) {
        const Render = this[`Render${sn}`]()
        // 子项勿空 label / 勿挂 extra（空 label→follow-label 缩进；extra 放外层），校验仍走 prop
        return h('a-col', { props: { span: this.colSpan } }, [
          h('a-form-model-item', {
            class: 'mb-0',
            props: { prop: name, required: false },
          }, [Render]),
        ])
      }
      return null
    })
    const outerProps = {
      required: this.isRequired,
      label: this.label,
    }
    if (this.labelCol) outerProps.labelCol = this.labelCol
    if (this.wrapperCol) outerProps.wrapperCol = this.wrapperCol
    // helplink → 外层 extra（与 AreaSelects 一致），避免嵌套 form-item 错位/把网络列挤没
    const resolveHelplink = () => {
      const link = this.$slots.helplink
      if (!link) return null
      return typeof link === 'function' ? link() : link
    }
    const outerSlots = {
      default: () => [
        h('a-row', { props: { gutter: 8 }, class: 'align-items-start' }, RenderCols),
      ],
    }
    if (this.$slots.helplink) {
      outerSlots.extra = resolveHelplink
    }
    return h('a-form-model-item', { props: outerProps }, outerSlots)
  },
}
