<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules">
    <a-form-model-item :label="$t('dictionary.policy')" prop="policies">
      <list-select
        v-model:value="form.policies"
        :listProps="policiesSelectProps"
        :formatter="row => `${row.name} / ${row.description || ''}`"
        :multiple="true"
        :dialog-params="{ mask: false, width: 900, title: $t('common.tips.select', [$t('dictionary.policy')]) }" />
    </a-form-model-item>
    <a-collapse accordion :border="false">
      <a-collapse-panel key="1" :header="$t('common.adv_config')">
        <a-form-model-item :label="$t('system.text_328')" prop="ips">
          <template v-slot:extra>
            <div>{{$t('system.text_329')}}</div>
            <div>{{$t('system.text_331')}}</div>
          </template>
          <a-input v-model:value="form.ips" />
        </a-form-model-item>
        <a-form-model-item :label="$t('res.project')" prop="project">
          <template v-slot:extra>
            <div>{{$t('system.text_585')}}</div>
          </template>
          <base-select
            v-model="form.project"
            resource="projects"
            version="v1"
            remote
            :params="projectParams"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ mode: 'default' }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('iam.role_policy_valid_time_range')">
          <a-date-picker
            v-model:value="form.valid_since"
            :disabled-date="dateDisabledStart"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            :show-time="{ format: 'HH:mm' }" />
          <span class="ml-2 mr-2">~</span>
          <a-date-picker
            v-model:value="form.valid_until"
            :disabled-date="dateDisabledEnd"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            :show-time="{ format: 'HH:mm' }" />
        </a-form-model-item>
      </a-collapse-panel>
    </a-collapse>
  </a-form-model>
</template>

<script>
import { getNameFilter } from '@/utils/common/tableFilter'
import { REGEXP } from '@/utils/validate'
import ListSelect from '@/sections/ListSelect'

export default {
  name: 'SetPoliciesForm',
  components: {
    ListSelect,
  },
  props: {
    data: {
      type: Array,
    },
  },
  data () {
    return {
      form: {
        policies: undefined,
        ips: undefined,
        project: undefined,
        valid_since: undefined,
        valid_until: undefined,
      },
      rules: {
        policies: [
          {
            required: true,
            message: this.$t('common.tips.select', [this.$t('dictionary.policy')]),
          },
        ],
        ips: [
          {
            validator: (rule, value, callback) => {
              if (value && value.length > 0) {
                const ips = value.split(',')
                for (let i = 0; i < ips.length; i++) {
                  const ip = ips[i]
                  if (!REGEXP.cidr.regexp.test(ip)) {
                    return callback(new Error(this.$t('system.text_339', [ip])))
                  }
                }
              }
              callback()
            },
          },
        ],
      },
    }
  },
  computed: {
    scopeParams () {
      const scopeParams = {}
      if (!this.data) return scopeParams
      if (this.$store.getters.isAdminMode) {
        scopeParams.project_domain = this.data[0].domain_id
      } else {
        scopeParams.scope = this.$store.getters.scope
      }
      return scopeParams
    },
    projectParams () {
      return { ...this.scopeParams }
    },
    policiesSelectProps () {
      return {
        list: this.$list.createList(this, {
          resource: 'policies',
          apiVersion: 'v1',
          genParamsCb: (params) => {
            const genParams = { ...params, ...this.scopeParams }
            delete genParams.scope
            return genParams
          },
          filterOptions: {
            name: getNameFilter(),
          },
        }),
        columns: [
          {
            field: 'name',
            title: this.$t('table.title.name'),
            showOverflow: 'title',
          },
          {
            field: 'description',
            title: this.$t('table.title.introduction'),
            showOverflow: 'title',
          },
        ],
      }
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('roles', 'v1')
  },
  methods: {
    async set (rid, action = 'repace') {
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const policies = []
        let ips
        if (values.ips) {
          ips = values.ips.split(',')
        }
        if (values.policies && values.policies.length) {
          for (let i = 0, len = values.policies.length; i < len; i++) {
            const item = {
              policy_id: values.policies[i],
            }
            if (ips) {
              item.ips = ips
            }
            if (values.project) {
              item.project_id = values.project
            }
            if (values.valid_since) {
              item.valid_since = this.formatValidTime(values.valid_since)
            }
            if (values.valid_until) {
              item.valid_until = this.formatValidTime(values.valid_until)
            }
            policies.push(item)
          }
        }
        const response = await this.manager.performAction({
          id: rid,
          action: 'set-policies',
          data: {
            policies,
            action,
          },
        })
        return response
      } catch (error) {
        throw error
      }
    },
    formatValidTime (value) {
      if (!value) return value
      if (typeof value === 'string') return value
      if (typeof value.format === 'function') return value.format('YYYY-MM-DD HH:mm:ss')
      return this.$moment(value).format('YYYY-MM-DD HH:mm:ss')
    },
    toTs (value) {
      if (!value) return null
      if (typeof value.valueOf === 'function') return value.valueOf()
      return this.$moment(value).valueOf()
    },
    dateDisabledStart (current) {
      if (!current) return false
      const endTs = this.toTs(this.form.valid_until)
      if (endTs && current.valueOf() > endTs) return true
      return current.valueOf() < this.$moment().startOf('day').valueOf()
    },
    dateDisabledEnd (current) {
      if (!current) return false
      const startTs = this.toTs(this.form.valid_since)
      if (startTs && current.valueOf() < startTs) return true
      return current.valueOf() < this.$moment().startOf('day').valueOf()
    },
  },
}
</script>
