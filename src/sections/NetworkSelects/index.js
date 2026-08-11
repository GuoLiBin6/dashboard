import * as R from 'ramda'
import i18n from '@/locales'

export default {
  name: 'NetworkSelects',
  inject: ['form'],
  props: {
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
    decorators: {
      type: Object,
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
      default: () => {
        return {
          span: 24,
        }
      },
    },
    wrapperCol: {
      type: Object,
      default: () => {
        return {
          span: 24,
        }
      },
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
    FC () {
      if (this.form && this.form.fc) {
        return this.form.fc
      }
      return this.$form.createForm(this)
    },
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
    firstName (name) {
      return name.replace(/^\S/, s => s.toUpperCase())
    },
    filterOption (input, option) {
      const subChild = option.componentOptions.children[0]
      if (subChild.text) {
        return (
          subChild.text.toLowerCase().indexOf(input.toLowerCase()) >= 0
        )
      }
      if (subChild.children[0]) {
        return subChild.children[0].data.attrs.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    },
    async fetchs (callback) {
      if (this.types.indexOf('vpc') > -1) {
        await this.fetchVpc(callback)
      }
      if (this.types.indexOf('network') > -1) {
        await this.fetchNetwork(callback)
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
          const prefer = this.FC.getFieldValue('vpc')
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
          this.FC.setFieldsValue({ vpc: next }, this.fetchNetwork)
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
        const data = this.getSelectedValue('vpc', vpcId)
        this.$emit('vpcChange', data)
        this.$nextTick(() => {
          this.fetchNetwork()
        })
      }
      const h = this.$createElement
      const options = this.vpcList.map((item) => {
        const { id, name } = item
        return h('a-select-option', { key: id, props: { value: id } }, this.vpcFormat ? this.vpcFormat(item) : name)
      })
      const renderStatusDesc = () => {
        return h('a-select-option', { key: '-1', props: { value: '-1', disabled: true } }, [
          h('a-badge', { props: { status: 'success' }, class: 'oc-custom-badge text-left text-wrap', attrs: { text: this.$t('compute.vpc_status_desc') } }),
        ])
      }
      return h('a-select', {
        props: { disabled, showSearch: true, placeholder: i18n.t('common_226'), loading: vpcLoading, filterOption },
        on: { change: _handleChange },
      }, [
        renderStatusDesc(),
        ...options,
      ])
    },
    async getNetworkParams () {
      const vpc = this.FC.getFieldValue('vpc')
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
          const prefer = this.FC.getFieldValue('network')
          const hit = prefer && this.networkList.some(item => item.id === prefer)
          let next
          if (R.isEmpty(this.networkList)) {
            next = undefined
          } else if (hit) {
            next = prefer
          } else {
            next = this.networkList[0].id
          }
          this.FC.setFieldsValue({ network: next })
        }
      } catch (err) {
        this.networkList = []
        this.FC.setFieldsValue({
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
        const data = this.getSelectedValue('network', networkId)
        this.$emit('networkChange', data)
      }
      const h = this.$createElement
      const options = this.networkList.map((item) => {
        const { id, name } = item
        const text = `${name} (${item.guest_ip_start} - ${item.guest_ip_end}）`
        const content = this.networkFormat
          ? this.networkFormat(item)
          : h('div', { class: 'd-flex' }, [
            h('span', { class: 'text-truncate flex-fill mr-2', attrs: { title: text } }, text),
            h('span', { style: { color: '#8492a6', fontSize: '13px' } }, this.$t('common.available_1var', [item.ports - item.ports_used])),
          ])
        return h('a-select-option', { key: id, props: { value: id } }, content)
      })
      return h('a-select', {
        style: { width: 'calc(100% - 22px)' },
        props: { disabled, showSearch: true, placeholder: i18n.t('common_227'), loading: networkLoading, filterOption },
        on: { change: _handleChange },
      }, options)
    },
  },
  render () {
    const { getFieldDecorator } = this.FC
    const RenderCols = this.types.map(name => {
      const sn = this.firstName(name)
      const decorator = this.decorators && this.decorators[name]
      let _options = {}
      if (decorator) {
        const [, options] = decorator
        _options = options || {}
      }
      if (this.isRequired && R.isEmpty(_options)) {
        _options.rules = []
        _options.rules.push({
          required: true,
          message: this.placeholders[name],
        })
      }
      if (this[`Render${sn}`]) {
        const Render = this[`Render${sn}`]()
        return h('a-col', { props: { span: name === 'network' ? this.colSpan - 1 : this.colSpan } }, [
          h('a-form-item', { props: { wrapperCol: { span: 24 } } }, [
            getFieldDecorator(name, _options)(Render),
            h('div', { slot: 'extra', key: name }, name === 'network' ? this.$slots.helplink : null),
          ]),
        ])
      }
      return null
    })
    return h('a-form-item', {
      props: { required: this.isRequired, labelCol: this.labelCol, wrapperCol: this.wrapperCol, label: this.label },
    }, [
      h('a-row', { props: { gutter: 8 } }, [
        ...RenderCols,
        h('a-col', { props: { span: 1 } }, [
          h('icon', { props: { type: 'sync', spin: this.networkLoading }, class: 'ml-2 primary-color', on: { click: this.fetchNetwork } }),
        ]),
      ]),
    ])
  },
}
