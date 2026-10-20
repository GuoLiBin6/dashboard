import * as R from 'ramda'
import _ from 'lodash'
import { mapGetters } from 'vuex'
import { SCHED_POLICY_OPTIONS_MAP, SERVER_TYPE, LOGIN_TYPES_MAP } from '@Compute/constants'
import OsSelect from '@Compute/sections/OsSelect'
import ServerPassword from '@Compute/sections/ServerPassword'
import CpuRadio from '@Compute/sections/CpuRadio'
import MemRadio from '@Compute/sections/MemRadio'
import sku from '@Compute/sections/SKU'
import gpu from '@Compute/sections/GPU/index'
import { createVmFormDefaults, GenCreateData } from '@Compute/utils/createServer'
import ServerNetwork from '@Compute/sections/ServerNetwork'
import ServerAccount from '@Compute/sections/ServerAccount'
import SchedPolicy from '@Compute/sections/SchedPolicy'
import Bios from '@Compute/sections/BIOS'
import Backup from '@Compute/sections/Backup'
import Duration from '@Compute/sections/Duration'
import InstanceGroups from '@Compute/sections/InstanceGroups'
import DataDisk from '@Compute/sections/DataDisk'
import { PRICE_COMPARA_KEY_SUFFIX } from '@Cloudenv/constants'
import storage from '@/utils/storage'
import { WORKFLOW_TYPES } from '@/constants/workflow'
import workflowMixin from '@/mixins/workflow'
import { Manager } from '@/utils/manager'
import NameRepeated from '@/sections/NameRepeated'
import CloudregionZone from '@/sections/CloudregionZone'
import HypervisorRadio from '@/sections/HypervisorRadio'
import DomainProject from '@/sections/DomainProject/model'
import { IMAGES_TYPE_MAP } from '@/constants/compute'
import { HYPERVISORS_MAP } from '@/constants'
import i18n from '@/locales'
import { uuid } from '@/utils/utils'
import { currencyUnitMap } from '@/constants/currency'
import BottomBar from '../components/BottomBar'
import SystemDisk from '../components/SystemDisk'
import Tag from '../components/Tag'

export default {
  name: 'IDCCreate',
  components: {
    OsSelect,
    CloudregionZone,
    BottomBar,
    ServerPassword,
    HypervisorRadio,
    CpuRadio,
    MemRadio,
    sku,
    ServerNetwork,
    SystemDisk,
    DataDisk,
    gpu,
    SchedPolicy,
    Bios,
    Backup,
    DomainProject,
    Duration,
    InstanceGroups,
    Tag,
    NameRepeated,
    ServerAccount,
  },
  mixins: [workflowMixin],
  props: {
    type: {
      type: String,
      required: true,
      validator: val => ['idc', 'private', 'public'].includes(val),
    },
  },
  data () {
    const { defaults: initFd } = createVmFormDefaults(SERVER_TYPE[this.type])
    return {
      submiting: false,
      errors: {},
      form: (() => {
        // createForm / fc shim 已移除：form 仅 { fd, fi }；onValuesChange → 各页 watch form.fd
        const fd = { ...initFd, os: '' }
        return {
          fi: { // formInfo 存储着和表单相关的数据
            capability: {}, // 可用区下的可用资源
            imageMsg: {}, // 当前选中的 image
            cpuMem: {}, // cpu 和 内存 的关联关系
            createType: SERVER_TYPE[this.type],
            dataDiskDisabled: false, // 数据盘是否禁用
            sysDiskDisabled: false, // 系统盘是否禁用
            cpuDisabled: false,
            memDisabled: false,
          },
          fd,
        }
      })(),
      capabilityParams: {}, // 防止 capability 反复调用，这里对当前的接口参数做记录
      price: null,
      collapseActive: [],
      rules: {
        count: [
          { required: true, message: i18n.t('compute.text_211') },
        ],
      },
    }
  },
  provide () {
    return {
      form: this.form,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'l3PermissionEnable', 'isAdminMode']),
    loginTypes () { // 主机模板隐藏手工输入密码
      const maps = R.clone(LOGIN_TYPES_MAP)
      if (this.isWindows) {
        delete maps.keypair
      }
      const loginTypes = Object.keys(maps)
      // if (this.isServertemplate) {
      //   return loginTypes.filter(val => (val !== LOGIN_TYPES_MAP.password.key && val !== LOGIN_TYPES_MAP.keypair.key))
      // }
      return loginTypes
    },
    project_domain () {
      return this.form.fd.domain ? this.form.fd.domain.key : this.$store.getters.userInfo.projectDomainId
    },
    project () {
      return this.form.fd.project ? this.form.fd.project.key : this.$store.getters.userInfo.projectId
    },
    scopeParams () {
      if (this.$store.getters.isAdminMode) {
        return {
          project_domain: this.project_domain,
        }
      }
      return { scope: this.$store.getters.scope }
    },
    gpuOptions () {
      const specs = this.form.fi.capability.specs || {}
      const data = specs.isolated_devices || {}
      const ret = []
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const item = data[key]
          ret.push({
            ...item,
            key: `vendor=${item.vendor}:${item.model}`,
            label: `${item.vendor}/${item.model}`,
          })
        }
      }
      return ret
    },
    backupDisableds () { // 高可用判断哪些宿主机可用
      if (this.form.fd.schedPolicyType === SCHED_POLICY_OPTIONS_MAP.host.key) {
        return [this.form.fd.schedPolicyHost]
      }
      return []
    },
    policyHostDisabled () {
      if (this.form.fd.backupEnable) {
        return [this.form.fd.backup]
      }
      return []
    },
    dataDiskSizes () {
      const disk = this.form.fd.dataDiskSizes
      return R.is(Object, disk) ? Object.values(disk) : []
    },
    secgroupParams () {
      return this.scopeParams
    },
    isOpenWorkflow () {
      if (this.isServertemplate) return false
      return this.checkWorkflowEnabled(WORKFLOW_TYPES.APPLY_MACHINE)
    },
    isHostImageType () { // 镜像类型为主机镜像
      return this.form.fd.imageType === IMAGES_TYPE_MAP.host.key
    },
    isSnapshotImageType () { // 镜像类型为主机快照
      return this.form.fd.imageType === IMAGES_TYPE_MAP.snapshot.key
    },
    isDomainMode () {
      return this.$store.getters.isDomainMode
    },
    hasMeterService () { // 是否有计费的服务
      const { services } = this.$store.getters.userInfo
      const meterService = services.find(val => val.type === 'meter')
      if (meterService && meterService.status === true) {
        return true
      }
      return false
    },
    cloudregionZoneParams () {
      const params = {}
      if (this.type === 'public') { // 公有云
        if (R.is(Object, this.form.fd.sku)) {
          const cloudregion = this.form.fd.sku.cloudregion_id // 取 sku
          const zone = this.form.fd.zone // 取 areaSelect 组件
          if (cloudregion) params.cloudregion = cloudregion
          if (zone) params.zone = zone
        }
      } else { // 私有云和IDC取 CloudregionZone 组件
        const cloudregion = _.get(this.form.fd, 'cloudregion.key')
        const zone = _.get(this.form.fd, 'zone.key')
        if (cloudregion) params.cloudregion = cloudregion
        if (zone) params.zone = zone
      }
      return params
    },
    networkVpcParams () {
      const params = {
        // usable: true,
        limit: 0,
        // show_emulated: true,
        ...this.scopeParams,
      }
      if (this.isZStack) {
        params.show_emulated = true
      }
      return params
    },
    vpcResource () {
      if (R.is(String, this.cloudregionZoneParams.cloudregion)) return `cloudregions/${this.cloudregionZoneParams.cloudregion}/vpcs`
      return ''
    },
    schedtagParams () { // 网络里指定调度标签
      return {
        limit: 0,
        resource_type: 'networks',
        ...this.scopeParams,
      }
    },
    policySchedtagParams () { // 高级配置里面调度策略选择 指定调度标签
      const ret = {
        limit: 0,
        'filter.0': 'resource_type.equals(hosts)',
        ...this.scopeParams,
      }
      const zone = _.get(this.form.fd, 'zone.key')
      if (zone) {
        ret.zone_id = zone
      }
      return ret
    },
    isWindows () {
      let isWindows = false
      const osType = (_.get(this.form.fi, 'imageMsg.info.properties.os_type') || '').toLowerCase()
      const os = (_.get(this.form.fd, 'os') || '').toLowerCase()
      if (~[osType, os].indexOf('windows')) {
        isWindows = true
      }
      return isWindows
    },
    osType () {
      return this.isWindows ? 'windows' : 'linux'
    },
    enableEip () {
      const externalAccessMode = _.get(this.form.fi, 'networkVpcObj.external_access_mode')
      if (externalAccessMode === 'none') return false // "eip-distgw" "eip" 是正常可以使用EIP的，"none"不可以
      return true
    },
    isZStack () {
      return this.form.fd.hypervisor === HYPERVISORS_MAP.zstack.key
    },
    showServerAccount () {
      return this.form.fd.loginType !== LOGIN_TYPES_MAP.image.key
    },
  },
  created () {
    this.zoneM = new Manager('zones')
    this.serverM = new Manager('servers')
    this.servertemplateM = new Manager('servertemplates', 'v2')
    this.serverskusM = new Manager('serverskus')
    this.schedulerM = new Manager('schedulers', 'v1')
    this.$bus.$on('VMGetPrice', (price) => {
      this.price = price
    })
    this.$store.dispatch('app/fetchWorkflowEnabledKeys')
  },
  watch: {
    'form.fi.imageMsg': {
      deep: true,
      handler (val, oldVal) {
        if (R.equals(val, oldVal)) return
        this.$nextTick(() => {
          this._resetDataDisk() // 重置数据盘数据
        })
      },
    },
  },
  methods: {
    baywatch (props, watcher) {
      const iterator = function (prop) {
        this.$watch(prop, watcher)
      }
      props.forEach(iterator, this)
    },
    updateFi (fiItems) { // 子组件更新fi
      if (R.is(Object, fiItems)) {
        R.forEachObjIndexed((item, key) => {
          this.$set(this.form.fi, key, item)
        }, fiItems)
      }
    },
    submit (e) {
      e.preventDefault()
      this.validateForm()
        .then(async formData => {
          this.submiting = true
          const genCreteData = new GenCreateData(formData, this.form.fi)
          this.doAddToList(genCreteData)
        })
        .catch(error => {
          this.submiting = false
          throw error
        })
    },
    doAddToList (genCreateData) {
      const {
        sku,
        count,
        duration,
        zone,
        hypervisor,
        provider,
        cloudregion,
        billType,
      } = this.form.fd
      const getPrice = (originPrice) => {
        if (isNaN(parseFloat(originPrice))) {
          return '-'
        }
        let currency = currencyUnitMap.CNY.sign
        if (sku.currency && currencyUnitMap[sku.currency]) {
          currency = currencyUnitMap[sku.currency].sign
        }
        return `${currency}${parseFloat(originPrice).toFixed(2)}`
      }
      const getBrand = (v) => {
        const vs = {
          kvm: 'OneCloud',
          esxi: 'VMware',
          zstack: 'ZStack',
          openstack: 'OpenStack',
        }
        return vs[v.toLowerCase()] || v
      }
      const getDuration = (v) => {
        if (billType === 'quantity') return '1h'
        return v
      }
      const { dataDisk, dataDiskLabel, systemDisk, config, originPrice } = this.$refs.bottomBarRef
      const data = {
        id: uuid(),
        uid: this.userInfo.id,
        // 资源类型, 配置, 系统盘, 数据盘, 平台, 区域, 计费模式, 购买数量, 购买时长, 费用估算
        type: 'server',
        instance_type: sku.name,
        config,
        dataDisk: `${dataDisk}GB ${dataDiskLabel}`,
        systemDisk,
        brand: getBrand(hypervisor || provider),
        region: cloudregion?.label || sku.region,
        zone: zone?.label || sku.zone,
        billing_type: billType === 'package' ? 'prepaid' : 'postpaid', // "postpaid": "按量付费", "prepaid": "包年包月"
        count,
        duration: getDuration(duration),
        fee: getPrice(originPrice),
      }
      this.submiting = true
      let serverPriceComparator = storage.get(PRICE_COMPARA_KEY_SUFFIX) || []
      serverPriceComparator = serverPriceComparator.filter(v => v.uid === data.uid)
      storage.set(PRICE_COMPARA_KEY_SUFFIX, [data].concat(serverPriceComparator))
      this.$message.success(i18n.t('common.success'))
      this.$router.push('/pricecomparator')
    },
    async validateForm () {
      const formRef = this.$refs.formRef
      if (formRef?.validate) {
        await formRef.validate()
      }
      // end-state sections：字段走组件 validate，不依赖 fc.validateFields
      if (typeof this.$refs.domainProjectRef?.validate === 'function') {
        await this.$refs.domainProjectRef.validate()
      }
      if (typeof this.$refs.cloudregionZoneRef?.validate === 'function') {
        await this.$refs.cloudregionZoneRef.validate()
      }
      if (typeof this.$refs.areaSelectRef?.validate === 'function') {
        await this.$refs.areaSelectRef.validate()
      }
      if (typeof this.$refs.hypervisorRadioRef?.validate === 'function') {
        await this.$refs.hypervisorRadioRef.validate()
      }
      if (typeof this.$refs.skuRef?.validate === 'function') {
        await this.$refs.skuRef.validate()
      }
      if (typeof this.$refs.systemDiskRef?.validate === 'function') {
        await this.$refs.systemDiskRef.validate()
      }
      if (typeof this.$refs.dataDiskRef?.validate === 'function') {
        await this.$refs.dataDiskRef.validate()
      }
      return { ...this.form.fd }
    },
    cpuChange (cpu) {
      // end-state：Cpu/Mem 只写 form.fd
      const setCpuMem = (vals) => {
        if (!vals || typeof vals !== 'object') return
        Object.keys(vals).forEach((k) => { this.form.fd[k] = vals[k] })
      }
      const memOpts = this.form.fi.cpuMem.cpu_mems_mb?.[cpu] || this.form.fi.cpuMem.cpu_mems_mb?.[String(cpu)]
      if (!memOpts || !memOpts.length) { // 没有内存Opts，则内存为0
        let vcpu = cpu
        if (!this.form.fi.cpuMem.cpus?.includes(cpu) && !this.form.fi.cpuMem.cpus?.some(c => String(c) === String(cpu))) {
          if (this.form.fi.cpuMem.cpus && this.form.fi.cpuMem.cpus.length) {
            vcpu = this.form.fi.cpuMem.cpus[0]
          } else {
            vcpu = 0
          }
        }
        setCpuMem({ vcpu, vmem: 0 })
        return
      }
      this.form.fi.cpuMem.mems_mb = memOpts
      let defaultMem = 2048
      if (!memOpts.some(m => Number(m) === 2048)) {
        defaultMem = memOpts[0]
      }
      setCpuMem({ vcpu: cpu, vmem: defaultMem })
    },
    _getProjectDomainInfo (variables) {
      variables.project = this.form.fd.project.key
      if (!variables.project) {
        variables.project = this.$store.getters.userInfo.projectName
      }
      variables.project_domain = _.get(this.form.fd, 'domain.label')
      if (!variables.project_domain) {
        variables.project_domain = this.$store.getters.userInfo.projectDomain
      }
    },
    _resetDataDisk () { // 重置数据盘
      const sizes = this.form.fd?.dataDiskSizes
      if (sizes && this.$refs.dataDiskRef) {
        Object.keys(sizes).forEach(key => this.$refs.dataDiskRef.decrease(key))
      }
    },
    /** 程序化写 form.fd */
    setFormFieldsAndSyncFd (values) {
      if (!values || typeof values !== 'object' || !this.form?.fd) return
      Object.keys(values).forEach((k) => {
        if (values[k] !== undefined) this.form.fd[k] = values[k]
      })
    },
    networkResourceMapper (list) {
      return list
        .map(val => {
          const remain = val.ports - val.ports_used
          if (remain <= 0) {
            return {
              ...val,
              __disabled: true,
            }
          }
          return val
        })
        .sort((a, b) => (b.ports - b.ports_used) - (a.ports - a.ports_used))
    },
    countBlur () {
      const count = this.form.fd.count
      if (!count) {
        this.form.fd.count = 1
      }
    },
    fetchDomainCallback () {
      const domain = this.$route.query.domain_id
      if (!R.isNil(domain) && !R.isEmpty(domain)) {
        this.form.fd.domain = domain
      }
    },
    fetchProjectCallback () {
      const project = this.$route.query.tenant_id
      if (!R.isNil(project) && !R.isEmpty(project)) {
        this.form.fd.project = { key: project }
      }
    },
  },
}
