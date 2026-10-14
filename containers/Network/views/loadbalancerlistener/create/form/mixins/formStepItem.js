import * as R from 'ramda'
import _ from 'lodash'
import Schema from 'async-validator'
import ListenerTypes from '@Network/views/loadbalancerlistener/components/ListenerTypes'
import SchedulerTypes from '@Network/views/loadbalancerlistener/components/SchedulerTypes'
import { schedulerProviderMaps, healthCheckTypeProviderMaps, healthCheckHttpCodeOpts } from '@Network/views/loadbalancerlistener/constants'
import StickySession from '@Network/views/loadbalancerlistener/components/StickySession'
import Acl from '@Network/views/loadbalancerlistener/components/Acl'
import { getInitialValue, resolveFieldMeta } from '@/utils/common/ant'
import NameRepeated from '@/sections/NameRepeated'
import { HYPERVISORS_MAP } from '@/constants'
import i18n from '@/locales'
import { getFieldMap } from '../utils'
export default {
  components: {
    NameRepeated,
    ListenerTypes,
    SchedulerTypes,
    StickySession,
    Acl,
  },
  provide () {
    return {
      lbListenerFieldMap: this.fieldMap,
    }
  },
  props: {
    lbDetail: {
      type: Object,
      required: true,
    },
    allFd: {
      type: Object,
      required: true,
    },
    listenerData: {
      type: Object,
    },
    isUpdate: {
      type: Boolean,
      default: false,
    },
    currentComponent: {
      type: String,
      required: true,
    },
  },
  computed: {
    certificateParams () {
      const params = {
        usable: true,
        limit: 0,
        project: this.lbDetail.project,
        cloudregion: this.lbDetail.cloudregion_id,
        manager: this.lbDetail.manager_id,
      }
      if (this.$store.getters.isAdminMode) {
        const domain = _.get(this.listenerData, 'domain_id') || _.get(this.lbDetail, 'domain_id')
        params.project_domain = domain
      } else {
        params.scope = this.$store.getters.scope
      }
      return params
    },
    schedulerTypeOpts () {
      let type = this.lbDetail.brand.toLowerCase()
      if (type) {
        if (type === 'aws') type = `${type}_${this.lbDetail.loadbalancer_spec}`
        return schedulerProviderMaps[type.toLowerCase()]
      }
      return []
    },
    healthCheckTypeOpts () {
      let type = this.lbDetail.brand.toLowerCase()
      if (type) {
        if (type === 'aws') type = `${type}_${this.lbDetail.loadbalancer_spec}`
        return healthCheckTypeProviderMaps[type.toLowerCase()]
      }
      return []
    },
    healthCheckHttpCodeOpts () {
      let type = this.lbDetail.brand.toLowerCase()
      if (type) {
        if (type === 'aws') type = `${type}_${this.lbDetail.loadbalancer_spec}`
        return healthCheckHttpCodeOpts[type.toLowerCase()] || healthCheckHttpCodeOpts.default
      }
      return []
    },
    backendgroupParams () {
      const params = {
        loadbalancer: this.lbDetail.id,
        scope: this.$store.getters.scope,
        status: 'enabled',
      }
      if (this.lbDetail.provider === HYPERVISORS_MAP.aliyun.provider) {
        params['filter.0'] = 'type.notequals("default")'
        params.type = 'normal'
      }
      return params
    },
  },
  data () {
    let type = this.lbDetail.brand.toLowerCase()
    const loadbalancer = this.lbDetail.id
    if (type === 'aws') type = `${type}_${this.lbDetail.loadbalancer_spec}`
    const fieldMap = getFieldMap({ provider: type, vm: this, loadbalancer })
    const initFd = getInitialValue(fieldMap)
    return {
      form: {
        fd: initFd,
        registered: new Set(),
        fieldOpts: {},
      },
      fieldMap,
      formItemLayout: {
        wrapperCol: {
          span: 18,
        },
        labelCol: {
          span: 6,
        },
      },
      backendgroup: {},
      backendList: [],
      backendColumns: [
        {
          field: 'name',
          title: i18n.t('network.text_433'),
          minWidth: '30%',
        },
        {
          field: 'address',
          title: i18n.t('network.text_213'),
        },
        {
          field: 'port',
          title: i18n.t('network.text_165'),
        },
        {
          field: 'weight',
          title: i18n.t('network.text_166'),
        },
      ],
    }
  },
  mounted () {
    if (this.isUpdate) {
      this.rollbackForm()
      if (this.$refs.backendgroupsRef) {
        this.$refs.backendgroupsRef.change(this.listenerData.backend_group_id)
      }
    }
  },
  methods: {
    openBackendgroupsCreate () {
      this.createDialog('LoadbalancerbackendgroupsCreateDialog', {
        title: i18n.t('network.text_434'),
        loadbalancer: this.lbDetail.id,
        onManager: this.onManager,
        refresh: async () => {
          const vnode = this.$refs.backendgroupsRef
          if (vnode && vnode.loadOpts) {
            const retList = await vnode.loadOpts()
            if (retList && retList.length > 0) {
              const backend_group = retList[0].id
              this.$set(this.form.fd, 'backend_group', backend_group)
              this.fetchBackendList(backend_group)
            }
          }
        },
      })
    },
    healthCheckChange (val) {
      if (val) {
        this.setDefaultHealthCheckType(this.healthCheckTypeOpts)
      }
    },
    setDefaultHealthCheckType (HealthCheckTypeOpts) {
      const field = resolveFieldMeta(this.fieldMap.health_check_type, 'health_check_type')?.name || 'health_check_type'
      const health_check_type = this.form.fd[field]
      if (!HealthCheckTypeOpts.find(v => v.key === health_check_type)) {
        this.$set(this.form.fd, field, HealthCheckTypeOpts[0].key)
      }
    },
    async fetchBackendList (bgId) {
      if (!bgId) return // 如果没有后端服务器组ID，return
      try {
        const { data: { data = [] } } = await new this.$Manager('loadbalancerbackends')
          .list({
            params: {
              backend_group: bgId,
              details: true,
              scope: this.$store.getters.scope,
            },
          })
        this.backendList = data
      } catch (error) {
        throw error
      }
    },
    rollbackForm () {
      const updateData = {}
      const needTurnBool = ['acl_status', 'health_check', 'sticky_session']
      const updateFieldMap = { // 后端返回数据和前端请求数据不一致，这里做字段映射
        [resolveFieldMeta(this.fieldMap.certificate, 'certificate')?.name]: 'certificate_id',
        [resolveFieldMeta(this.fieldMap.acl, 'acl')?.name]: 'acl_id',
        [resolveFieldMeta(this.fieldMap.generate_name, 'generate_name')?.name]: 'name',
        [resolveFieldMeta(this.fieldMap.backend_group, 'backend_group')?.name]: 'backend_group_id',
      }
      R.forEachObjIndexed((value, mapKey) => {
        const meta = resolveFieldMeta(value, mapKey)
        if (!meta) return
        const key = meta.name
        if (needTurnBool.includes(key)) {
          updateData[key] = (this.listenerData[key] === 'on')
        } else if (key === 'health_check_http_code' && R.is(String, this.listenerData[key])) {
          updateData[key] = this.listenerData[key].split(',')
        } else if (updateFieldMap[key]) {
          updateData[key] = this.listenerData[updateFieldMap[key]]
        } else if (key === 'redirect') {
          updateData[key] = (this.listenerData[key] === 'raw')
        } else {
          updateData[key] = this.listenerData[key]
        }
      }, this.fieldMap)
      Object.keys(updateData).forEach(k => {
        this.$set(this.form.fd, k, updateData[k])
      })
      if (this.currentComponent === 'Protocol') { // 仅在第一步进行allFd的同步，防止已经更改第一步数据后进入第二步时allFd再次呗初始化
        this.$emit('update:allFd', updateData)
      }
      if (this.currentComponent === 'Backendgroup') {
        this.fetchBackendList(this.listenerData.backend_group_id)
      }
    },
    certificateFormatter (item) {
      var label = `${item.name}`
      if (item.common_name) {
        label += ` - ${item.common_name}`
      }
      var valid = true
      const now = new Date()
      if (item.not_before) {
        var notBefore = new Date(item.not_before)
        if (notBefore.getTime() > now.getTime()) {
          valid = false
        }
      }
      if (item.not_after) {
        var notAfter = new Date(item.not_after)
        if (notAfter.getTime() < now.getTime()) {
          valid = false
        }
      }
      if (valid) {
        label += ` - ${this.$t('status.sslCertificate.available')}`
      } else {
        label += ` - ${this.$t('status.sslCertificate.expired')}`
      }
      return label
    },
    /**
     * 校验本步已 register 的 field 规则（对齐原 validateFields）
     */
    async validate () {
      const descriptor = {}
      const registered = this.form.registered || new Set()
      registered.forEach((name) => {
        const opts = this.form.fieldOpts?.[name] || (() => {
          const hit = Object.entries(this.fieldMap).find(([k, d]) => resolveFieldMeta(d, k)?.name === name)
          if (!hit) return {}
          const { name: _n, ...rest } = resolveFieldMeta(hit[1], hit[0]) || {}
          return rest
        })()
        if (opts.rules && opts.rules.length) {
          descriptor[name] = opts.rules
        }
      })
      if (Object.keys(descriptor).length) {
        const validator = new Schema(descriptor)
        try {
          await validator.validate(this.form.fd || {}, { suppressWarning: true })
        } catch (err) {
          // eslint-disable-next-line no-throw-literal
          throw { errors: err.errors || err, values: { ...this.form.fd } }
        }
      }
      return { ...this.form.fd }
    },
    async submit () {
      return this.validate()
    },
  },
}
