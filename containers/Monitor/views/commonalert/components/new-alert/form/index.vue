<template>
  <a-form-model ref="formRef" :model="form.fd" :rules="rules">
    <container-title :title="$t('monitor.commonalert.base_info')" />
    <scope-radio :model="form.fd" @change="scopeChange" :form="form" :disabled="disabled" :label="label" />
    <a-form-model-item :label="$t('common.name')" prop="name">
      <a-input v-model:value="form.fd.name" @update:value="v => syncFd('name', v)" :placeholder="$t('common.placeholder')" :disabled="disabled" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')" prop="description">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" @update:value="v => syncFd('description', v)" :placeholder="$t('common_367')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('monitor.alert_reason')" prop="reason">
      <a-input v-model:value="form.fd.reason" @update:value="v => syncFd('reason', v)" :placeholder="$t('common.placeholder')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('monitor.text_97')" prop="metric_res_type">
      <base-select
        v-model:value="form.fd.metric_res_type"
        :options="metricTypeOpts"
        filterable
        :disabled="disabled"
        :select-props="{ placeholder: $t('monitor.text_111'), loading }"
        @change="v => { syncFd('metric_res_type', v); metricTypeHandle(v) }" />
    </a-form-model-item>
    <container-title :title="$t('monitor.commonalert.alarm_strategy')" />
    <a-form-model-item :label="$t('monitor.commonalert.alert_condition')">{{$t('monitor.commonalert.alert_condition.content')}}</a-form-model-item>
    <a-form-model-item :label="$t('monitor.condition')">
      <condition
        ref="conditionRef"
        :model="form.fd"
        :res_type_measurements="res_type_measurements"
        :metric_res_type="form.fd.metric_res_type"
        :disabled="disabled"
        @metricChange="metricChangeHandle"
        @delta-change="hasDeltaCondition = $event" />
    </a-form-model-item>
    <a-form-model-item
      :label="$t('monitor.commonalert.query_condition')"
      :extra="hasDeltaCondition ? $t('monitor.commonalert.delta_condition_no_duration') : undefined">
      <a-row :gutter="2">
        <a-col :span="6">
          <a-form-model-item class="mb-0" prop="period">
            <base-select v-model:value="form.fd.period" @change="v => syncFd('period', v)" :options="preiodOpts" />
          </a-form-model-item>
        </a-col>
        <a-col v-if="!hasDeltaCondition" :span="6">
          <a-form-model-item class="mb-0" prop="alert_duration">
            <base-select v-model:value="form.fd.alert_duration" @change="v => syncFd('alert_duration', v)" :options="durationOpts" />
          </a-form-model-item>
        </a-col>
        <a-col v-else :span="12" class="d-flex align-items-center ml-4">
          <span class="mr-1">{{ $t('monitor.commonalert.from_period_label') }}</span>
          <a-form-model-item class="mb-0" prop="from">
            <base-select
              v-model:value="form.fd.from"
              @change="v => syncFd('from', v)"
              :options="fromOpts"
              :select-props="{ placeholder: $t('monitor.commonalert.from_period_placeholder') }" />
          </a-form-model-item>
        </a-col>
      </a-row>
    </a-form-model-item>
    <a-form-model-item :label="$t('monitor.monitor_filters')">
      <a-row>
        <a-col>
          <a-radio-group :value="form.fd.res_scope" @change="e => { syncFd('res_scope', e.target.value); resScopeChangeHandle(e) }">
            <a-radio-button value="all">{{$t('monitor.commonalert.res_scope.all')}}</a-radio-button>
            <a-radio-button value="custom">{{$t('monitor.commonalert.res_scope.custom')}}</a-radio-button>
          </a-radio-group>
        </a-col>
      </a-row>
      <a-row class="mt-4" v-if="form.fd.res_scope === 'custom'">
        <filters
          :form="form"
          :model="form.fd"
          ref="filtersRef"
          :tags="tags"
          :disabled="disabled"
          @remove="$nextTick(toParams)"
          :loading="metricInfoLoading"
          :metricInfo="metricInfo" />
      </a-row>
    </a-form-model-item>
    <container-title :title="$t('monitor.commonalert.alarm_notify')" />
    <a-form-model-item :label="$t('monitor.commonalerts.form.column.silent')" class="mb-0" prop="silent_period">
      <a-form-model-item class="mr-1">
        <base-select v-model:value="form.fd.silent_period" @change="v => syncFd('silent_period', v)" :options="silentOpts" style="display: inline-flex;" />
        <a-tooltip style="padding-left: 5px;" placement="top"><icon type="question-circle" />
        <template slot="title">
          <span>{{ $t('monitor.commonalerts.form.column.silent.tips') }}</span>
        </template>
        </a-tooltip>
      </a-form-model-item>
    </a-form-model-item>
    <a-form-model-item :label="$t('monitor.commonalerts.disable_notify_recovery')" prop="disable_notify_recovery">
      <a-switch v-model:checked="form.fd.disable_notify_recovery" @change="v => syncFd('disable_notify_recovery', v)" :checked-children="$t('common.true')" :un-checked-children="$t('common.false')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('monitor.level')" prop="level">
      <a-radio-group :value="form.fd.level" @change="e => syncFd('level', e.target.value)">
        <a-radio-button v-for="item in levelOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('monitor.notification_type')" prop="notify_type">
      <a-checkbox-group :value="form.fd.notify_type" @change="v => syncFd('notify_type', v)">
        <a-checkbox value="recipient">{{ $t('monitor.recipient') }}</a-checkbox>
        <a-checkbox v-if="currentScope!=='project'" value="role">{{ $t('monitor.role') }}</a-checkbox>
        <a-checkbox value="robot">{{ $t('monitor.text_11') }}</a-checkbox>
      </a-checkbox-group>
    </a-form-model-item>
    <a-form-model-item v-if="notifyTypes.includes('recipient')" :label="$t('monitor.recipient')" style="white-space: nowrap;" prop="recipients">
      <template #extra style="width: 1200px;" v-if="scope !== 'project'">
        <i18n tag="div" path="monitor_text00001">
          <help-link slot="new" href="/contact">{{$t('monitor.text_15')}}</help-link>
        </i18n>
      </template>
      <base-select
        v-model:value="form.fd.recipients"
        optionLabelProp="label"
        resource="receivers"
        version="v1"
        filterable
        show-sync
        @change="v => { syncFd('recipients', v); contactArrOptsChange(v) }"
        v-model:resList="recipientOpts"
        :select-props="{ mode: 'multiple', placeholder: $t('common.tips.select', [$t('monitor.recipient')]) }"
        :params="contactParams" />
    </a-form-model-item>
    <a-form-model-item v-if="contactArrAllOpts && contactArrAllOpts.length > 0" :label="$t('monitor.channel')" prop="channel">
      <a-checkbox-group
        :value="form.fd.channel"
        @change="v => syncFd('channel', v)">
        <a-checkbox
          v-for="v in contactArrAllOpts"
          :key="v.label"
          :value="v.value"
          :disabled="v.disabled">
          <template v-if="v.disabled">
            <a-tooltip placement="top">
              <template slot="title">
               {{$t('monitor.commonalerts.channel.disable.tips', [v.label])}}
              </template>
              {{ v.label }}
            </a-tooltip>
          </template>
          <template v-else>
            {{ v.label }}
          </template>
        </a-checkbox>
      </a-checkbox-group>
    </a-form-model-item>
    <a-form-model-item v-if="notifyTypes.includes('role') && currentScope!=='project'" :label="$t('monitor.role')" prop="roles">
      <base-select
        v-model:value="form.fd.roles"
        @change="v => syncFd('roles', v)"
        resource="roles"
        version="v1"
        filterable
        show-sync
        :select-props="{ mode: 'multiple', placeholder: $t('common.tips.select', [$t('monitor.role')]) }"
        :params="rolesParams" />
    </a-form-model-item>
    <notify-types
      v-if="notifyTypes.includes('robot')"
      :model="form.fd"
      :label="$t('monitor.text_11')"
      :placeholder="$t('common.tips.select', [$t('monitor.text_11')])"
      field="robot_ids"
      :getParams="robotParams" />
  </a-form-model>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { mapGetters } from 'vuex'
import Filters from '@Monitor/sections/Filters'
import { levelMaps, preiodMaps } from '@Monitor/constants'
import ScopeRadio from '@/sections/ScopeRadio'
import NotifyTypes from '@/sections/NotifyTypes'
import workflowMixin from '@/mixins/workflow'
import { WORKFLOW_TYPES } from '@/constants/workflow'
import Condition from './Condition'
export default {
  name: 'CommonalertForm',
  components: {
    ScopeRadio,
    Filters,
    Condition,
    NotifyTypes,
  },
  provide: function () {
    return {
      form: this.form,
    }
  },
  mixins: [workflowMixin],
  props: {
    alertData: {},
    timeRangeParams: {
      type: Object,
      default: () => ({}),
    },
    commonalertId: {
      type: String,
    },
    isUpdate: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    let tags = []
    const initialValue = {
      period: '5m',
      comparator: '>=',
      alert_duration: 2,
      from: '10m',
      silent_period: '5m',
      reduce: 'avg',
      level: 'normal',
      scope: this.$store.getters.scope,
      recipients: [],
      robot_ids: [],
      channel: ['webconsole'],
      notifyTypes: [],
      disable_notify_recovery: false,
    }
    if (this.commonalertId) {
      initialValue.name = this.alertData.name
      initialValue.period = this.alertData.period
      initialValue.level = this.alertData.level
      initialValue.domain = this.alertData.domain_id
      initialValue.project = this.alertData.tenant_id
      initialValue.silent_period = this.alertData.silent_period
      initialValue.res_type = _.get(this.alertData, 'common_alert_metric_details[0].res_type')
      initialValue.reason = this.alertData.reason
      initialValue.description = this.alertData.description
      tags = _.get(this.alertData, 'common_alert_metric_details[0].filters') || []

      if (this.alertData.robot_ids && this.alertData.robot_ids.length) {
        initialValue.robot_ids = this.alertData.robot_ids
        initialValue.notifyTypes.push('robot')
      }
      if (this.alertData.recipients && this.alertData.recipients.length) {
        initialValue.recipients = this.alertData.recipients
        initialValue.notifyTypes.push('recipient')
      }
      if (this.alertData.role_ids && this.alertData.role_ids.length) {
        initialValue.roles = this.alertData.role_ids
        initialValue.notifyTypes.push('role')
      }
      if (this.alertData.channel && this.alertData.channel.length) {
        if (this.alertData.channel.indexOf('webconsole') < 0) {
          initialValue.channel.push(...this.alertData.channel.filter((c) => !c.endsWith('robot')))
        } else {
          initialValue.channel = this.alertData.channel.filter((c) => !c.endsWith('robot'))
        }
      }
      if (!initialValue.project && !initialValue.domain) {
        initialValue.scope = 'system'
      }
      if (this.alertData.alert_duration) initialValue.alert_duration = this.alertData.alert_duration
      if (!initialValue.project && initialValue.domain) {
        initialValue.scope = 'domain'
      }
      if (initialValue.project) {
        initialValue.scope = 'project'
      }
      if (this.alertData.disable_notify_recovery) {
        initialValue.disable_notify_recovery = true
      }
    }

    if (!initialValue.notifyTypes.length) {
      initialValue.notifyTypes.push('recipient')
    }
    return {
      form: {
        fd: {
          scope: initialValue.scope,
          domain: initialValue.domain,
          project: initialValue.project,
          name: initialValue.name,
          description: initialValue.description,
          reason: initialValue.reason,
          metric_res_type: initialValue.res_type,
          res_scope: 'all',
          period: initialValue.period,
          alert_duration: initialValue.alert_duration,
          from: initialValue.from,
          silent_period: initialValue.silent_period,
          level: initialValue.level,
          disable_notify_recovery: initialValue.disable_notify_recovery,
          notify_type: initialValue.notifyTypes,
          recipients: initialValue.recipients || [],
          roles: initialValue.roles || [],
          robot_ids: initialValue.robot_ids || [],
          channel: initialValue.channel || ['webconsole'],
        },
      },
      formScopeParams: {
        scope: initialValue.scope,
      },
      fieldMap: {
        scope: { name: 'scope', initialValue: initialValue.scope },
        domain: {
          name: 'domain',
          initialValue: initialValue.domain,
          rules: [
            { required: true, message: `${this.$t('common.select')}` },
          ],
        },
        project: {
          name: 'project',
          initialValue: initialValue.project,
          rules: [
            { required: true, message: `${this.$t('common.select')}` },
          ],
        },
        name: {
          name: 'name',
          initialValue: initialValue.name,
          rules: [
            { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
          ],
        },
        description: { name: 'description', initialValue: initialValue.description },
        reason: { name: 'reason', initialValue: initialValue.reason },
        metric_res_type: {
          name: 'metric_res_type',
          initialValue: initialValue.res_type,
          rules: [
            { required: true, message: this.$t('monitor.text_111') },
          ],
        },
        res_scope: { name: 'res_scope', initialValue: 'all' },
        condition: {
          metric_key: i => ({
            name: `metric_key[${i}]`,
            initialValue: initialValue.metric_key,
            rules: [
              { required: true, message: this.$t('monitor.text_112') },
            ],
          }),
          metric_value: i => ({
            name: `metric_value[${i}]`,
            initialValue: initialValue.metric_value,
            rules: [
              { required: true, message: this.$t('monitor.text_113') },
            ],
          }),
          reduce: i => ({
            name: `reduce[${i}]`,
            initialValue: initialValue.reduce,
            rules: [
              { required: true, message: this.$t('common.select') },
            ],
          }),
          comparator: i => ({
            name: `comparator[${i}]`,
            initialValue: initialValue.comparator,
            rules: [
              { required: true, message: this.$t('common.select') },
            ],
          }),
          threshold: i => ({
            name: `threshold[${i}]`,
            initialValue: initialValue.threshold || 1,
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('monitor.commonalert.threshold.message') },
              {
                validator: (rule, value, callback) => {
                  if (!(/^\d+(\.\d+)?$/.test(value))) {
                    callback(this.$t('monitor.validate_number'))
                  }
                  callback()
                },
              },
            ],
          }),
          threshold_start: i => ({
            name: `threshold_start[${i}]`,
            initialValue: initialValue.threshold_start || 1,
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('monitor.commonalert.threshold.message') },
              {
                validator: (rule, value, callback) => {
                  if (!(/^\d+(\.\d+)?$/.test(value))) {
                    callback(this.$t('monitor.validate_number'))
                    return
                  }
                  const endValue = this.form.fd.threshold_end?.[i]
                  if (endValue !== undefined && endValue !== null && endValue !== '') {
                    const start = parseFloat(value)
                    const end = parseFloat(endValue)
                    if (!isNaN(start) && !isNaN(end) && start >= end) {
                      callback(this.$t('monitor.commonalert.threshold_start_lt_end'))
                      return
                    }
                  }
                  callback()
                },
              },
            ],
          }),
          threshold_end: i => ({
            name: `threshold_end[${i}]`,
            initialValue: initialValue.threshold_end || 2,
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('monitor.commonalert.threshold.message') },
              {
                validator: (rule, value, callback) => {
                  if (!(/^\d+(\.\d+)?$/.test(value))) {
                    callback(this.$t('monitor.validate_number'))
                    return
                  }
                  const startValue = this.form.fd.threshold_start?.[i]
                  if (startValue !== undefined && startValue !== null && startValue !== '') {
                    const start = parseFloat(startValue)
                    const end = parseFloat(value)
                    if (!isNaN(start) && !isNaN(end) && end <= start) {
                      callback(this.$t('monitor.commonalert.threshold_end_gt_start'))
                      return
                    }
                  }
                  callback()
                },
              },
            ],
          }),
        },
        filters: {
          tagCondition: i => ({
            name: `tagConditions[${i}]`,
            initialValue: 'AND',
            rules: [
              { required: true, message: this.$t('common.select') },
            ],
          }),
          tagKey: i => ({
            name: `tagKeys[${i}]`,
            rules: [
              { required: true, message: this.$t('monitor.text_109') },
            ],
          }),
          tagOperator: i => ({
            name: `tagOperators[${i}]`,
            initialValue: '=~',
            rules: [
              { required: true, message: this.$t('common.select') },
            ],
          }),
          tagValue: i => ({
            name: `tagValues[${i}]`,
            rules: [
              { required: true, message: this.$t('monitor.text_110') },
            ],
          }),
        },
        period: {
          name: 'period',
          initialValue: initialValue.period,
          rules: [
            { required: true, message: this.$t('common.select') },
          ],
        },
        alert_duration: {
          name: 'alert_duration',
          initialValue: initialValue.alert_duration,
          rules: [
            { required: true, message: this.$t('common.select') },
          ],
        },
        from: {
          name: 'from',
          initialValue: initialValue.from,
          rules: [
            { required: true, message: this.$t('common.select') },
          ],
        },
        silent_period: {
          name: 'silent_period',
          initialValue: initialValue.silent_period,
          rules: [],
        },
        level: { name: 'level', initialValue: initialValue.level },
        disable_notify_recovery: {
          name: 'disable_notify_recovery',
          valuePropName: 'checked',
          initialValue: initialValue.disable_notify_recovery,
        },
        notify_type: {
          name: 'notify_type',
          initialValue: initialValue.notifyTypes || [],
          rules: [
            { required: true, message: this.$t('common.tips.select', [this.$t('monitor.notification_type')]) },
          ],
        },
        roles: {
          name: 'roles',
          initialValue: initialValue.roles || [],
          rules: [
            { required: true, message: this.$t('common.tips.select', [this.$t('monitor.role')]) },
          ],
        },
        recipients: {
          name: 'recipients',
          initialValue: initialValue.recipients || [],
          rules: [
            { required: true, message: this.$t('common.tips.select', [this.$t('monitor.recipient')]) },
          ],
        },
        robot_ids: {
          name: 'robot_ids',
          initialValue: initialValue.robot_ids || [],
          rules: [
            { required: true, message: this.$t('common.tips.select', [this.$t('monitor.text_11')]) },
          ],
        },
        channel: { name: 'channel', initialValue: initialValue.channel || [] },
      },
      tags,
      oldParams: {},
      metricInfo: {},
      conditionUnit: '',
      metricKeyItem: {},
      contactParams: {
        with_meta: true,
        limit: 0,
        enabled: true,
      },
      levelOpts: Object.values(levelMaps),
      silentOpts: [
        { key: '5m', label: this.$t('monitor.duration.silent.minute', [5]) },
        { key: '10m', label: this.$t('monitor.duration.silent.minute', [10]) },
        { key: '15m', label: this.$t('monitor.duration.silent.minute', [15]) },
        { key: '30m', label: this.$t('monitor.duration.silent.minute', [30]) },
        { key: '60m', label: this.$t('monitor.duration.silent.hour', [1]) },
        { key: '120m', label: this.$t('monitor.duration.silent.hour', [2]) },
        { key: '180m', label: this.$t('monitor.duration.silent.hour', [3]) },
        { key: '360m', label: this.$t('monitor.duration.silent.hour', [6]) },
        { key: '720m', label: this.$t('monitor.duration.silent.hour', [12]) },
        { key: '1440m', label: this.$t('monitor.duration.silent.hour', [24]) },
      ],
      preiodOpts: Object.values(preiodMaps),
      fromPeriodOpts: [
        { key: '10m', label: this.$t('monitor.duration.silent.minute', [10]) },
        { key: '30m', label: this.$t('monitor.duration.silent.minute', [30]) },
        { key: '60m', label: this.$t('monitor.duration.silent.hour', [1]) },
        { key: '180m', label: this.$t('monitor.duration.silent.hour', [3]) },
        { key: '360m', label: this.$t('monitor.duration.silent.hour', [6]) },
        { key: '720m', label: this.$t('monitor.duration.silent.hour', [12]) },
        { key: '1440m', label: this.$t('monitor.duration.silent.hour', [24]) },
        { key: '2880m', label: this.$t('monitor.duration.silent.hour', [48]) },
      ],
      durationOpts: [
        { key: 1, label: this.$t('monitor.duration.label', [1]) },
        { key: 2, label: this.$t('monitor.duration.label', [2]) },
        { key: 3, label: this.$t('monitor.duration.label', [3]) },
        { key: 6, label: this.$t('monitor.duration.label', [6]) },
        { key: 12, label: this.$t('monitor.duration.label', [12]) },
        { key: 24, label: this.$t('monitor.duration.label', [24]) },
        { key: 48, label: this.$t('monitor.duration.label', [48]) },
        { key: 96, label: this.$t('monitor.duration.label', [96]) },
      ],
      projectItem: {},
      metricLoading: false,
      metricInfoLoading: false,
      recipientOpts: [],
      contactArrOpts: [],
      res_type_measurements: {},
      res_types: [],
      currentScope: initialValue.scope,
      notifyTypes: initialValue.notifyTypes,
      label: this.$t('monitor.text00015'),
      isFirstMetricChange: this.isUpdate,
      conditionMap: new Map(),
      hasDeltaCondition: false,
    }
  },
  computed: {
    ...mapGetters(['isDomainMode', 'scope']),
    rules () {
      return {
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
        ],
        metric_res_type: [
          { required: true, message: this.$t('monitor.text_111') },
        ],
        period: [
          { required: true, message: this.$t('common.select') },
        ],
        alert_duration: [
          { required: true, message: this.$t('common.select') },
        ],
        from: [
          { required: true, message: this.$t('common.select') },
        ],
        notify_type: [
          { required: true, message: this.$t('common.tips.select', [this.$t('monitor.notification_type')]) },
        ],
        recipients: [
          { required: true, message: this.$t('common.tips.select', [this.$t('monitor.recipient')]) },
        ],
        roles: [
          { required: true, message: this.$t('common.tips.select', [this.$t('monitor.role')]) },
        ],
      }
    },
    disabled () {
      return this.$route.query.alertType === 'system' && this.isUpdate
    },
    showResType () {
      if (this.alertData && this.alertData.alert_type === 'system') {
        const { initialValue } = this.fieldMap.metric_res_type
        if (!initialValue) {
          return false // 如果是默认策略并且资源类型没有默认值的话，不显示
        }
      }
      return true
    },
    rolesParams () {
      return {
        scope: this.currentScope,
        limit: 0,
      }
    },
    fromOpts () {
      const period = this.form.fd.period
      const pMin = this.periodMinutes(period)
      return this.fromPeriodOpts.filter(opt => this.periodMinutes(opt.key) > pMin)
    },
    robotParams () {
      if (this.currentScope === 'project' && this.formScopeParams.project_id) {
        return {
          scope: this.currentScope,
          project_id: this.formScopeParams.project_id,
        }
      }
      if (this.currentScope === 'domain' && this.formScopeParams.domain_id) {
        return {
          scope: this.currentScope,
          project_domain_id: this.formScopeParams.domain_id,
        }
      }
      return { scope: this.currentScope }
    },
    metricTypeOpts () {
      return this.res_types.map(val => {
        const label = this.$t(`dictionary.${val}`)
        return {
          key: val,
          label,
        }
      })
    },
    contactArrAllOpts () {
      const ret = []
      if (this.checkWorkflowEnabled(WORKFLOW_TYPES.ALERT_EVENT)) {
        ret.push({
          value: 'alert_event',
          label: this.$t('common.workflow.alert_event'),
          disabled: false,
        })
      }
      if (this.checkWorkflowEnabled(WORKFLOW_TYPES.ALERT_TICKET)) {
        ret.push({
          value: 'alert_ticket',
          label: this.$t('common.workflow.alert_ticket'),
          disabled: false,
        })
      }
      return [...this.contactArrOpts, ...ret]
    },
  },
  watch: {
    timeRangeParams () {
      this.getMeasurement(this.formScopeParams)
    },
    recipientOpts (val) {
      if (!this.alertData && val) {
        if (val.length === 1) {
          this.syncFd('recipients', [val[0].id])
          this.contactArrOptsChange([val[0].id])
        } else if (val.length > 1) {
          const currentUser = this.$store.getters.userInfo.id
          const hasCurrentUser = val.find(val => val.id === currentUser)
          if (hasCurrentUser) {
            this.syncFd('recipients', [hasCurrentUser.id])
            this.contactArrOptsChange([hasCurrentUser.id])
          }
        }
      }
      if (this.alertData) {
        this.contactArrOptsChange(this.alertData.recipients)
      }
    },
    contactArrOpts () {
      const ect = this.form.fd.channel
      if (ect) {
        let newContactTypes = this.contactArrAllOpts.filter((c) => { return ect.indexOf(c.value) >= 0 }).map((c) => c.value)
        if (newContactTypes.length === 0) {
          newContactTypes = ['webconsole']
        }
        this.syncFd('channel', newContactTypes)
      }
    },
  },
  created () {
    const scope = this.formScopeParams.scope
    const params = {
      scope,
    }
    if (scope !== 'system' && this.fieldMap[scope].initialValue) {
      params[`${scope}_id`] = this.fieldMap[scope].initialValue
    }
    this.formScopeParams = params
    this.scopeChange(params)
    this.initContactParams(this.contactParams)
  },
  mounted () {
    if (this.commonalertId) {
      this.initResType()
    } else {
      this.$refs.conditionRef.add()
    }
    this.$nextTick(() => {
      const from = this.form.fd.from
      const opts = this.fromOpts
      if (opts.length && !opts.some(opt => opt.key === from)) {
        this.syncFd('from', opts[0].key)
      }
    })
  },
  methods: {
    syncFd (key, val) {
      this.$set(this.form.fd, key, val)
      if (key === 'notify_type') {
        this.notifyTypes = val
      }
      if (key === 'period') {
        const opts = this.fromOpts
        const curFrom = this.form.fd.from
        const valid = opts.some(opt => opt.key === curFrom)
        if (!valid && opts.length) {
          this.$set(this.form.fd, 'from', opts[0].key)
        }
      }
      this.$nextTick(this.toParams)
    },
    periodMinutes (periodKey) {
      if (!periodKey || typeof periodKey !== 'string') return 0
      const num = parseInt(periodKey, 10)
      const unit = periodKey.slice(-1)
      return unit === 'h' ? num * 60 : num
    },
    initResType () {
      this.form.fd.metric_res_type = this.alertData.common_alert_metric_details[0].res_type
    },
    initCondition () {
      const metric_details = this.alertData.common_alert_metric_details
      const conditionRef = this.$refs.conditionRef
      conditionRef.reset(false)
      metric_details.forEach((item, idx) => {
        conditionRef.add({ comparator: item.comparator })
        this.$nextTick(() => {
          const conditionList = conditionRef.conditionList
          const key = conditionList[idx].key
          conditionRef.dualWriteFields({
            [`metric_key[${key}]`]: item.measurement,
            [`reduce[${key}]`]: item.reduce,
            [`comparator[${key}]`]: item.comparator,
          })
          conditionRef.metricKeyChange(item.measurement, { key })
          conditionRef.dualWriteFields({
            [`metric_value[${key}]`]: item.field,
          })
          conditionRef.metricValueChange(item.field, { key })
          setTimeout(() => {
            const comparator = item.comparator
            if (comparator === 'within_range' || comparator === 'outside_range') {
              let thresholdArray = []
              if (Array.isArray(item.threshold_range) && item.threshold_range.length >= 2) {
                thresholdArray = item.threshold_range
              } else if (item.threshold_start !== undefined && item.threshold_end !== undefined) {
                thresholdArray = [item.threshold_start, item.threshold_end]
              } else if (Array.isArray(item.threshold) && item.threshold.length >= 2) {
                thresholdArray = item.threshold
              } else if (item.threshold !== undefined) {
                thresholdArray = [item.threshold, item.threshold]
              } else {
                thresholdArray = [1, 2]
              }
              conditionRef.dualWriteFields({
                [`threshold[${key}]`]: thresholdArray,
                [`threshold_start[${key}]`]: thresholdArray[0],
                [`threshold_end[${key}]`]: thresholdArray[1],
              })
            } else {
              conditionRef.dualWriteFields({
                [`threshold[${key}]`]: item.threshold,
              })
            }
          }, 100)
        })
      })
    },
    initFilter () {
      const { filters = [] } = this.alertData.common_alert_metric_details[0]
      this.syncFd('res_scope', filters.length > 0 ? 'custom' : 'all')
    },
    contactArrOptsChange (rs) {
      const getLabel = (val) => {
        if (val === 'mobile') val = 'message' // mobile 应该翻译为 短信
        if (this.$t(`common.${val}`)) {
          return this.$t(`common.${val}`)
        }
        return val
      }
      if (rs) {
        const ect = this.recipientOpts.filter((opt) => {
          return rs.indexOf(opt.id) >= 0
        }).map((opt) => {
          return opt.enabled_contact_types
        })
        this.contactArrOpts = _.intersection(...ect).map((c) => {
          return {
            value: c,
            label: getLabel(c),
            disabled: c === 'webconsole',
          }
        })
      }
    },
    scopeChange (scopeParams) {
      this.getMeasurement(scopeParams)
      this.$emit('scopeChange', scopeParams)
      this.currentScope = scopeParams.scope
    },
    async getMeasurement (params = {}) {
      try {
        this.metricLoading = true
        this.formScopeParams = params
        const { data: { res_type_measurements, res_types } } = await new this.$Manager('unifiedmonitors', 'v1').get({ id: 'measurements', params: { ...params, ...this.timeRangeParams } })
        this.res_type_measurements = res_type_measurements
        this.res_types = res_types
        if (R.is(Object, this.alertData)) {
          this.toParams()
        }
        if (this.commonalertId) {
          this.initCondition()
          this.initFilter()
        }
        this.metricLoading = false
      } catch (error) {
        this.metricLoading = false
        throw error
      }
    },
    async validate () {
      const metric_query = this.toParams(false)
      await this.$refs.formRef.validate()
      if (typeof this.$refs.conditionRef?.validate === 'function') {
        await this.$refs.conditionRef.validate()
      }
      if (this.form.fd.res_scope === 'custom' && typeof this.$refs.filtersRef?.validate === 'function') {
        await this.$refs.filtersRef.validate()
      }
      const fd = { ...this.form.fd }
      if (this.projectItem && this.projectItem.domain_id) fd.domain_id = this.projectItem.domain_id
      return {
        metric_query,
        fd,
      }
    },
    metricChangeHandle (metricMap) {
      const conditionList = this.$refs.conditionRef.conditionList
      const firstMetricKey = conditionList[0].key
      const firstMetric = metricMap[firstMetricKey]
      this.getMetricInfo(firstMetric)
    },
    async getMetricInfo ({ metricKey, mertric, mertricItem, metricKeyItem }) {
      try {
        this.metricKeyItem = metricKeyItem || {}
        this.conditionUnit = _.get(mertricItem, 'description.unit') || ''
        const scopeFormValues = {
          scope: this.form.fd.scope,
          domain: this.form.fd.domain,
          project: this.form.fd.project,
        }
        const scopeParams = {}
        for (const k in scopeFormValues) {
          if (scopeFormValues[k]) {
            if (k === 'scope') {
              scopeParams[k] = scopeFormValues[k]
            } else {
              scopeParams[`${k}_id`] = scopeFormValues[k]
            }
          }
        }
        const params = {
          database: this.metricKeyItem.database || _.get(this.alertData, 'common_alert_metric_details[0].db', 'telegraf'),
          measurement: metricKey,
          field: mertric,
          ...scopeParams,
          ...this.timeRangeParams,
        }
        this.metricInfoLoading = true
        const { data } = await new this.$Manager('unifiedmonitors', 'v1').get({ id: 'metric-measurement', params })
        if (metricKey === 'cloudaccount_balance' && !this.isFirstMetricChange) {
          const { tag_key = [], tag_value = {} } = data
          if (tag_key.includes('currency') && tag_value.currency && tag_value.currency.length) {
            this.tags = [{ key: 'currency', value: tag_value.currency[0], operator: '=' }]
          }
        }
        this.isFirstMetricChange = false
        this.metricInfo = data
        this.metricInfoLoading = false
      } catch (error) {
        this.metricInfo = {
          field_key: [],
          func: {},
          tag_key: [],
          tag_value: {},
        }
        const params = this.toParams()
        this.$emit('paramsChange', params)
        this.metricInfoLoading = false
        throw error
      }
    },
    toParams () {
      const fd = { ...this.form.fd }
      let fromValue
      if (fd.from) {
        fromValue = fd.from
      } else if (fd.period && fd.alert_duration != null) {
        const periodNum = parseInt(fd.period, 10)
        const unit = String(fd.period).slice(-1)
        if (unit === 'm' && periodNum * fd.alert_duration < 10) {
          fromValue = '10m'
        } else {
          fromValue = (periodNum * fd.alert_duration) + unit
        }
      }
      if (!fromValue) fromValue = '24h'
      const metric_query = []
      const conditionList = this.$refs.conditionRef.conditionList
      conditionList.forEach(({ key }) => {
        const params = {
          from: fromValue,
        }
        const model = {
          database: this.metricKeyItem.database || _.get(this.alertData, 'common_alert_metric_details[0].db', 'telegraf'),
        }
        const tags = []
        if (fd.metric_key[key]) model.measurement = fd.metric_key[key]
        if (fd.reduce[key]) params.reduce = fd.reduce[key]
        if (fd.comparator[key]) {
          params.comparator = fd.comparator[key]
          if (params.comparator === 'nodata') {
            params.condition_type = 'nodata_query'
          } else if (params.comparator === 'within_range' || params.comparator === 'outside_range') {
            params.threshold_range = [fd.threshold_start[key] || fd.threshold[key], fd.threshold_end[key] || fd.threshold[key]]
          } else {
            // 非范围类型：threshold 是单个值
            if (fd.threshold && fd.threshold[key]) {
              params.threshold = fd.threshold[key]
            }
          }
        } else {
          if (fd.threshold && fd.threshold[key]) {
            params.threshold = fd.threshold[key]
          }
        }
        if (fd.metric_value[key]) model.select = [[{ type: 'field', params: [fd.metric_value[key]] }]]
        if (R.is(Object, fd.tagValues)) {
          R.forEachObjIndexed((value, key) => {
            if (value) {
              let val = value
              if ((fd.tagOperators[key] === '=~' || fd.tagOperators[key] === '!~') && val && val.length) {
                const arr = Array.isArray(val) ? val : [val]
                val = `/${arr.map(v => `^${v}$`).join('|')}/`
              }
              const tag = {
                key: fd.tagKeys[key],
                value: val,
                operator: fd.tagOperators[key],
              }
              if (fd.tagConditions && fd.tagConditions[key]) {
                tag.condition = fd.tagConditions[key]
              }
              tags.push(tag)
            }
          }, fd.tagValues)
        }
        if (tags.length) {
          model.tags = tags
        }
        if (fd.group_by) {
          // eslint-disable-next-line no-template-curly-in-string
          params.group_by = [{ type: 'tag', params: [fd.group_by] }]
        }
        if (params.select && R.is(String, fd.function)) {
          model.select[0].push({ type: fd.function.toLowerCase(), params: [] })
        }
        params.model = model
        metric_query.push(params)
      })
      return metric_query
    },
    initContactParams (contactParams) {
      contactParams.scope = this.scope
      if (this.isDomainMode) {
        contactParams.project_domain_filter = true
      }
    },
    resScopeChangeHandle () {
      this.$nextTick(() => {
        if (this.$refs.filtersRef) {
          this.$refs.filtersRef.reset()
        }
      })
    },
    metricTypeHandle () {
      if (this.$refs.conditionRef) {
        this.$refs.conditionRef.reset()
      }
      if (this.$refs.filtersRef) {
        this.$refs.filtersRef.reset()
        this.metricInfo = {}
      }
    },
  },
}
</script>
