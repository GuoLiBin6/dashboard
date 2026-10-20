<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title === 'edit' ? $t('compute.text_982') : params.title === 'create' ? $t('compute.perform_create') : $t('compute.text_983')}}{{$t('compute.rule')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_175')" v-if="params.title !== 'edit'" prop="type">
          <a-select
            v-model:value="form.type"
            :disabled="typeDisabled"
            :placeholder="$t('compute.text_219')"
            @change="typeChange">
            <a-select-option v-for="item in typeOptions" :key="item.value" :value="item.value">
              {{item.label}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="targetTypeLabel" prop="target_type">
          <a-select v-model:value="form.target_type" @change="targetTypeChange">
            <a-select-option v-for="item in targetTypeOptions" :key="item.value" :value="item.value">
              {{item.label}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="decLabel" :extra="sourcePromptText" :prop="targetType === 'ip_set' ? 'ip_set_id' : (targetType === 'cidr' ? 'source' : undefined)">
          <base-select v-if="targetType === 'ip_set'"
            v-model:value="form.ip_set_id"
            version="v2"
            resource="ipsets"
            filterable
            :params="ipsetParams"
            :isDefaultSelect="true"
            :select-props="{ placeholder: $t('compute.secgroup.source.ip_set.placeholder') }" />
          <a-select v-else-if="targetType === 'cidr'"
            mode="combobox"
            option-filter-prop="children"
            :placeholder="$t('compute.secgroup.source.placeholder')"
            v-model:value="form.source">
            <a-select-opt-group>
              <span slot="label">CIDR</span>
              <a-select-option v-for="item in cidrOptions" :key="item.value" :value="item.value">
              {{item.label}}
              </a-select-option>
            </a-select-opt-group>
          </a-select>
          <span v-else>ALL</span>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_980')" prop="protocol">
          <a-select v-model:value="form.protocol" @change="protocolChange" :disabled="protocolDisabled || cidrDisabled">
            <a-select-option v-for="item in protocolOptions" :key="item.value" :value="item.value">
              {{item.label}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_998')" :extra="portExtra" prop="ports">
          <a-input :disabled="portsDisabled || cidrDisabled" v-model:value="form.ports" :placeholder="$t('compute.text_350')" />
          <a-checkbox class="right-checkbox" @change="portsChange" :checked="portsChecked" :disabled="portsCheckboxDisabled || cidrDisabled">{{$t('compute.text_1000')}}</a-checkbox>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_694')" prop="action">
          <a-select v-model:value="form.action" :disabled="!isPrioritySupport || cidrDisabled">
            <a-select-option v-for="item in actionOptions" :key="item.value" :value="item.value">
              {{item.label}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item v-if="isPrioritySupport" :label="$t('compute.text_1001')" :extra="priorityExtra" prop="priority">
          <a-input-number :min="priorityMin" :max="priorityMax" :disabled="priorityDisabled || cidrDisabled" v-model:value="form.priority" />
        </a-form-model-item>
        <a-form-model-item :extra="isAws ? $t('compute.use_en_comment') : ''" prop="description">
          <span slot="label">{{$t('compute.text_312')}}</span>
          <a-input v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { isUcloudLikeProvider } from '@/constants'
import { REGEXP } from '@/utils/validate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { priorityRuleMap } from '../constants'

export default {
  name: 'EditRulesDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const selectItem = this.params.data[0]
    const { brand, cloud_env } = this.params
    const item = brand ? priorityRuleMap[brand.toLowerCase()] || {} : {}
    const priorityMin = !item.priorityNoSupport ? item.min : 1
    const priorityMax = !item.priorityNoSupport ? item.max : 1
    let cidrChecked = JSON.stringify(selectItem) === '{}' ? true : !selectItem.cidr
    let cidrCheckedShow = true
    if (cloud_env === 'public') {
      cidrCheckedShow = false
      cidrChecked = false
    }
    let initTargetType = 'all'
    if (selectItem && selectItem.target_type && (selectItem.target_type !== 'cidr' || selectItem.CIDR || selectItem.cidr)) {
      initTargetType = selectItem.target_type
    }
    return {
      loading: false,
      form: {
        type: undefined,
        target_type: initTargetType,
        source: selectItem.cidr || '0.0.0.0/0',
        ip_set_id: selectItem.cidr || '',
        protocol: selectItem.protocol || 'tcp',
        ports: JSON.stringify(selectItem) === '{}' ? '' : selectItem.ports ? selectItem.ports : 'ALL',
        action: selectItem.action || 'allow',
        priority: selectItem.priority || priorityMin,
        description: selectItem.description || '',
      },
      rules: {
        source: [
          { validator: this.validateCIDR, required: true },
        ],
        ip_set_id: [
          { required: true },
        ],
        ports: [
          { required: true, message: this.$t('compute.text_347') },
          { validator: this.validatePorts },
        ],
        action: [
          { required: true },
        ],
        description: [
          {
            validator: (rule, value, callback) => {
              if (value && (this.isKsyun || this.isAws)) {
                if (/[\u4e00-\u9fff]/.test(value)) {
                  callback(new Error(this.$t('scope.text_339')))
                }
              }
              callback()
            },
          },
        ],
      },
      typeOptions: [
        { label: this.$t('compute.text_144'), value: 'custom', description: '' },
        { label: this.$t('compute.text_1003'), value: 'windows', description: this.$t('compute.text_1004') },
        { label: 'SSH (22)', value: 'linux', description: this.$t('compute.text_1005') },
        { label: 'HTTP（80）', value: 'http', description: this.$t('compute.text_1006') },
        { label: 'HTTPS（443）', value: 'https', description: this.$t('compute.text_1007') },
        { label: 'Ping', value: 'ping', description: this.$t('compute.text_1008') },
      ],
      actionOptions: [
        { label: this.$t('compute.text_976'), value: 'allow' },
        { label: this.$t('compute.text_977'), value: 'deny' },
      ],
      cidrOptions: [
        { label: '0.0.0.0/0', value: '0.0.0.0/0' },
        { label: '10.0.0.0/8', value: '10.0.0.0/8' },
        { label: '172.16.0.0/12', value: '172.16.0.0/12' },
        { label: '192.168.0.0/16', value: '192.168.0.0/16' },
        { label: '::/0', value: '::/0' },
        { label: 'fd::/64', value: 'fd::/64' },
      ],
      secgroupOpts: [
      ],
      cidrChecked,
      cidrCheckedShow,
      typeDisabled: false,
      portsDisabled: JSON.stringify(selectItem) === '{}' ? false : !selectItem.ports,
      portsCheckboxDisabled: selectItem.protocol === 'any' || selectItem.protocol === 'icmp',
      portsChecked: JSON.stringify(selectItem) === '{}' ? false : !selectItem.ports,
      targetTypeLabel: (this.params.type === 'in' ? this.$t('compute.text_979') : this.$t('compute.text_978')) + this.$t('compute.text_175'),
      decLabel: this.params.type === 'in' ? this.$t('compute.text_979') : this.$t('compute.text_978'),
      targetType: initTargetType,
      protocolDisabled: this.params.title !== 'edit',
      priorityMin,
      priorityMax,
      isPrioritySupport: !item.priorityNoSupport,
      priorityItem: item,
      cloud_env,
    }
  },
  computed: {
    ...mapGetters(['scope']),
    priorityExtra () {
      if (this.priorityItem.priorityNoSupport) {
        return ''
      } else if (this.priorityItem.max) {
        return `${this.priorityItem.min}-${this.priorityItem.max}, ${this.priorityItem.isMaxHigh ? this.$t('compute.secgroup_priority_tip2') : this.$t('compute.secgroup_priority_tip')}${this.priorityItem.noRepeat ? ', ' + this.$t('compute.secgroup_priority_no_repeat') : ''}`
      }
      return this.$t('compute.text_1002')
    },
    portExtra () {
      if (this.priorityItem.portSupportComma) {
        return this.$t('compute.text_999')
      }
      return this.$t('compute.text_999_1')
    },
    isAws () {
      return this.params.brand === 'Aws'
    },
    isKsyun () {
      return this.params.brand === 'Ksyun'
    },
    isKvm () {
      return this.params.brand === 'OneCloud'
    },
    supportsIpSet () {
      const brand = (this.params.brand || '').toLowerCase()
      return ['onecloud', 'cloudpods', 'qcloud', 'aliyun'].includes(brand)
    },
    targetTypeOptions () {
      const ret = [
        { label: this.$t('compute.secgroup.rule.target_type.all'), value: 'all' },
        { label: this.$t('compute.secgroup.rule.target_type.cidr'), value: 'cidr' },
      ]
      if (this.supportsIpSet) {
        ret.push({ label: this.$t('compute.secgroup.rule.target_type.ip_set'), value: 'ip_set' })
      }
      if (this.isEdit) {
        return ret.filter(item => {
          if (this.targetType === 'all' || this.targetType === 'cidr') {
            return item.value === 'all' || item.value === 'cidr'
          } else {
            return item.value === this.targetType
          }
        })
      } else {
        return ret
      }
    },
    protocolOptions () {
      let ret = [
        { label: 'TCP', value: 'tcp' },
        { label: 'UDP', value: 'udp' },
        { label: 'ICMP', value: 'icmp' },
        { label: this.$t('compute.any_protocol.text'), value: 'any' },
      ]
      if (this.params.brand && isUcloudLikeProvider(this.params.brand)) {
        ret = ret.filter(item => item.value !== 'any')
      }
      return ret
    },
    cidrDisabled () {
      if (this.params.title === 'edit' && ['ctyun'].includes(this.params.brand.toLowerCase())) {
        return true
      }
      return false
    },
    isEdit () {
      return this.params.title === 'edit'
    },
    priorityDisabled () {
      return this.params.title === 'edit' && ['qcloud'].includes(this.params.brand.toLowerCase())
    },
    ipsetParams () {
      const params = {
        scope: this.scope,
      }
      const cloudregionId = this.params.cloudregion_id
      const managerId = this.params.manager_id
      const isQcloud = (this.params.brand || '').toLowerCase() === 'qcloud'
      if (cloudregionId && !isQcloud) {
        params.cloudregion_id = cloudregionId
      }
      if (managerId) {
        params.manager_id = managerId
      } else {
        params.is_managed = false
      }
      return params
    },
    sourcePromptText () {
      if (this.targetType === 'ip_set') {
        return this.$t('compute.secgroup.secrule.source.ip_set.prompt')
      } else if (this.targetType === 'cidr') {
        return this.$t('compute.secgroup.secrule.source.prompt')
      } else {
        return this.$t('compute.secgroup.secrule.source.all.prompt')
      }
    },
  },
  created () {
    // this.fetchSecgroups('')
  },
  methods: {
    validatePorts (rule, value, callback) {
      const portReg = /^\d+$/
      if (value === 'ALL') {
        callback()
        return
      }
      if (!value) {
        callback(new Error(this.$t('validator.ports')))
        return
      }
      if (!this.priorityItem.portSupportComma && value.indexOf(',') !== -1) {
        callback(new Error(this.$t('validator.ports')))
        return
      }
      if (value.indexOf(',') !== -1) {
        const ports = value.split(',')
        if (ports.some(item => !portReg.test(item) || +item < 0 || +item > 65535)) {
          callback(new Error(this.$t('validator.ports')))
          return
        }
      } else if (value.indexOf('-') !== -1) {
        const ports = value.split('-')
        if (ports.length !== 2 || ports.some(item => !portReg.test(item) || +item < 3306 || +item > 20000)) {
          callback(new Error(this.$t('validator.ports')))
          return
        }
      } else if (!portReg.test(value) || +value < 0 || +value > 65535) {
        callback(new Error(this.$t('validator.ports')))
        return
      }
      callback()
    },
    validateCIDR (rule, value, callback) {
      if (this.targetType !== 'cidr') {
        return callback()
      }
      if (!this.cidrCheckedShow && !value) {
        return callback(new Error(this.$t('common.tips.input', [this.decLabel])))
      }
      if (this.cidrChecked || !value) {
        return callback()
      }
      if (value.indexOf(',') >= 0) {
        const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
        for (const item of items) {
          if (!REGEXP.IPv6.regexp.test(item) && !REGEXP.IPv4.regexp.test(item) && !REGEXP.cidr.regexp.test(item) && !REGEXP.cidr6.regexp.test(item)) {
            return callback(new Error(this.$t('common.tips.input', ['IPv4/IPv6'])))
          }
        }
        return callback()
      }
      if (!REGEXP.IPv6.regexp.test(value) && !REGEXP.IPv4.regexp.test(value) && !REGEXP.cidr.regexp.test(value) && !REGEXP.cidr6.regexp.test(value)) {
        return callback(new Error(this.$t('common.tips.input', ['IPv4/IPv6'])))
      }
      return callback()
    },
    changeCidrChecked (bool) {
      this.cidrChecked = this.cidrCheckedShow ? bool : this.cidrCheckedShow
    },
    typeChange (e) {
      if (e === 'windows') {
        this.form.ports = '3389'
        this.form.protocol = 'tcp'
        this.changeCidrChecked(true)
        this.portsChecked = false
        this.portsDisabled = true
        this.portsCheckboxDisabled = true
        this.protocolDisabled = true
      } else if (e === 'linux') {
        this.form.ports = '22'
        this.form.protocol = 'tcp'
        this.changeCidrChecked(true)
        this.portsChecked = false
        this.portsDisabled = true
        this.portsCheckboxDisabled = true
        this.protocolDisabled = true
      } else if (e === 'http') {
        this.form.ports = '80'
        this.form.protocol = 'tcp'
        this.changeCidrChecked(true)
        this.portsChecked = false
        this.portsDisabled = true
        this.portsCheckboxDisabled = true
        this.protocolDisabled = true
      } else if (e === 'https') {
        this.form.ports = '443'
        this.form.protocol = 'tcp'
        this.changeCidrChecked(true)
        this.portsChecked = false
        this.portsDisabled = true
        this.portsCheckboxDisabled = true
        this.protocolDisabled = true
      } else if (e === 'ping') {
        this.form.ports = 'ALL'
        this.form.protocol = 'icmp'
        this.changeCidrChecked(true)
        this.portsChecked = true
        this.portsDisabled = true
        this.portsCheckboxDisabled = true
        this.protocolDisabled = true
      } else {
        this.changeCidrChecked(true)
        this.portsChecked = false
        this.portsDisabled = false
        this.form.ports = undefined
        this.portsCheckboxDisabled = false
        this.protocolDisabled = false
      }
    },
    protocolChange (e) {
      if (e === 'icmp') {
        this.portsChecked = true
        this.portsDisabled = true
        this.$nextTick(() => {
          this.form.ports = 'ALL'
        })
        this.portsCheckboxDisabled = true
      } else {
        if (e === 'any') {
          this.portsChecked = true
          this.$nextTick(() => {
            this.form.ports = 'ALL'
          })
          this.portsCheckboxDisabled = true
          this.portsDisabled = true
          this.typeDisabled = true
        } else {
          this.portsCheckboxDisabled = false
          this.typeDisabled = false
        }
      }
    },
    targetTypeChange (e) {
      this.targetType = e
    },
    portsChange (e) {
      this.portsChecked = !this.portsChecked
      this.portsDisabled = !this.portsDisabled
      if (e.target.checked) {
        this.$nextTick(() => {
          this.form.ports = 'ALL'
        })
      } else {
        this.$nextTick(() => {
          this.form.ports = ''
        })
      }
    },
    cidrChange (e) {
      this.cidrChecked = !this.cidrChecked
      if (e.target.checked) {
        this.$nextTick(() => {
          this.form.source = 'ALL'
          this.form.target_type = 'cidr'
          this.targetType = 'cidr'
        })
      } else {
        this.$nextTick(() => {
          this.form.source = '0.0.0.0/0'
          this.form.target_type = 'cidr'
          this.targetType = 'cidr'
        })
      }
    },
    saveEdit (data) {
      if (this.params.title === 'clone') {
        let description = ''
        this.typeOptions.forEach((item) => {
          if (item.value === data.type) {
            description = item.description
          }
        })
        const params = {
          ...this.params.data[0],
          ...data,
          secgroup: this.params.secgroup,
          description: data.description && data.description.length > 0 ? data.description : description,
        }
        return new this.$Manager('secgrouprules').create({
          data: params,
        })
      } else if (this.params.title === 'create') {
        let description = ''
        this.typeOptions.forEach((item) => {
          if (item.value === data.type) {
            description = item.description
          }
        })
        const params = {
          ...data,
          secgroup: this.params.secgroup,
          description: data.description && data.description.length > 0 ? data.description : description,
          direction: this.params.type,
        }
        return new this.$Manager('secgrouprules').create({
          data: params,
        })
      } else {
        const id = this.params.data[0].id
        return new this.$Manager('secgrouprules').update({
          id,
          data,
        })
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (values.ports === 'ALL') {
          values.ports = ''
        }
        if (this.targetType === 'all') {
          values.target_type = 'cidr'
          values.cidr = ''
        } else if (this.targetType === 'cidr') {
          values.target_type = 'cidr'
          values.cidr = values.source
        } else if (this.targetType === 'ip_set') {
          values.target_type = 'ip_set'
          values.cidr = values.ip_set_id
        }
        delete values.source
        delete values.ip_set_id
        await this.saveEdit(values)
        this.params.refresh && this.params.refresh()
        this.cancelDialog()
      } catch (e) {
        throw e
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
.right-checkbox {
  width: 100px;
  height: 40px;
  left: 500px;
  font-size: 12px!important;
  color: #ccc;
  position: absolute;
}
</style>
