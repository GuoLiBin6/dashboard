<script lang="jsx">
/**
 * 云账号 + 区域双选。prop `model` 必传（a-form-model）。
 */
export default {
  name: 'CloudProviderRegion',
  props: {
    /**
     * a-form-model：父级 form 对象，字段名默认 manager / cloudregion_id，可用 fieldMap 覆盖。
     */
    model: {
      type: Object,
      required: true,
    },
    cloudprovideParams: {
      type: Object,
    },
    cloudregionParams: {
      type: Object,
    },
    fieldMap: {
      type: Object,
    },
    defaultActiveFirstOption: {
      type: Boolean,
      default: () => true,
    },
    isRequired: {
      type: Boolean,
      default: () => true,
    },
  },
  data () {
    return {
      cloudproviderLoading: false,
      cloudproviderList: [],
      cloudregionLoading: false,
      cloudregionList: [],
    }
  },
  computed: {

    _fieldMap () {
      const { isRequired } = this
      const manager = {
        name: 'manager',
        rules: [
          {
            required: isRequired, message: this.$t('storage.text_92'),
          },
        ],
      }
      const cloudregion = {
        name: 'cloudregion_id',
        rules: [
          {
            required: isRequired, message: this.$t('storage.text_57'),
          },
        ],
      }
      const _ = {
        manager,
        cloudregion,
      }
      return Object.assign({}, _, this.fieldMap)
    },
    managerField () {
      return this._fieldMap.manager.name
    },
    cloudregionField () {
      return this._fieldMap.cloudregion.name
    },
  },
  watch: {
    cloudprovideParams: {
      handler () {
        this.fetchCloudproviders()
      },
      deep: true,
      immediate: true,
    },
  },
  created () {
    if (this.model[this.managerField] === undefined) {
      this.$set(this.model, this.managerField, undefined)
    }
    if (this.model[this.cloudregionField] === undefined) {
      this.$set(this.model, this.cloudregionField, undefined)
    }
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
    modelFieldValue (fieldName) {
      return this.model[fieldName]
    },
    setModelField (fieldName, value) {
      this.$set(this.model, fieldName, value)
    },
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
    async fetchCloudproviders () {
      const params = Object.assign({}, {
        limit: 0,
        enabled: 1,
        details: true,
        scope: this.$store.getters.scope,
        has_object_storage: true,
      }, this.cloudprovideParams)
      if (this.$store.getters.isAdminMode && params.project_domain) {
        delete params.scope
      }
      this.cloudproviderLoading = true
      const managerField = this.managerField
      this.setModelFields({
        [managerField]: undefined,
      })
      try {
        const manager = new this.$Manager('cloudproviders', 'v2')
        const { data = {} } = await manager.list({ params })
        const list = data.data || []
        this.cloudproviderList = list
        if (list && list.length > 0 && this.defaultActiveFirstOption) {
          this.setModelFields({
            [managerField]: list[0].id,
          }, () => {
            this.fetchCloudregions({ manager: list[0].id })
          })
        } else {
          this.setModelFields({
            [this.cloudregionField]: undefined,
          })
          this.cloudregionList = []
        }
      } catch (err) {
        throw err
      } finally {
        this.cloudproviderLoading = false
      }
    },
    async fetchCloudregions (queryParams = {}) {
      const params = Object.assign({}, {
        limit: 0,
        scope: this.$store.getters.scope,
      }, this.cloudregionParams, queryParams)
      if (this.$store.getters.isAdminMode && params.project_domain) {
        delete params.scope
      }
      this.cloudregionLoading = true
      const cloudregionField = this.cloudregionField
      this.setModelFields({
        [cloudregionField]: undefined,
      })
      try {
        const manager = new this.$Manager('cloudregions', 'v2')
        const { data = {} } = await manager.list({ params })
        const list = data.data || []
        this.cloudregionList = list
        if (list && list.length > 0 && this.defaultActiveFirstOption) {
          this.setModelFields({
            [cloudregionField]: list[0].id,
          })
          this.$emit('cloudregionChange', list[0])
        }
      } catch (err) {
        throw err
      } finally {
        this.cloudregionLoading = false
      }
    },
    renderSelect (name) {
      const { cloudproviderLoading, cloudproviderList, cloudregionLoading, cloudregionList } = this
      const selectConfig = {
        manager: {
          loading: cloudproviderLoading,
          list: cloudproviderList,
          field: this.managerField,
          onChange: (manager) => {
            this.setModelField(this.managerField, manager)
            if (manager) {
              this.fetchCloudregions({ manager })
            } else {
              this.cloudregionList = []
              this.setModelFields({
                [this.cloudregionField]: undefined,
              }, () => {
                this.validateModelFields([this.cloudregionField])
              })
            }
          },
        },
        cloudregion: {
          loading: cloudregionLoading,
          list: cloudregionList,
          field: this.cloudregionField,
          onChange: (id, vnode) => {
            this.setModelField(this.cloudregionField, id)
            const { row } = vnode.data.attrs
            this.$emit('cloudregionChange', row)
          },
        },
      }
      const { loading, list = [], onChange, field } = selectConfig[name]
      const selectProps = {
        class: 'w-100',
        allowClear: true,
        showSearch: true,
        filterOption: this.filterOption,
        loading,
        onChange,
      }
      selectProps.value = this.modelFieldValue(field)
      const selectVnode = (
        <a-select {...{ props: selectProps }}>
          {
            list.map(item => {
              const { id } = item
              const label = this._$t(item)
              return <a-select-option row={item} value={id} >{label}</a-select-option>
            })
          }
        </a-select>
      )
      const FormItem = ({ children }) => (
        <a-col span={12}>
          <a-form-model-item wrapperCol={{ span: 24 }} prop={field}>
            {children}
          </a-form-model-item>
        </a-col>
      )
      return (
        <FormItem>
          {selectVnode}
        </FormItem>
      )
    },
  },
  render () {
    const names = ['manager', 'cloudregion']
    return (
      <a-row gutter={8}>
        {names.map(name => this.renderSelect(name))}
      </a-row>
    )
  },
}
</script>
