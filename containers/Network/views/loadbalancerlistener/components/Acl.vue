<template>
  <div>
    <a-form-item :label="$t('network.text_360')">
      <a-switch :checked="aclStatus" @change="onAclStatusChange" />
    </a-form-item>
    <template v-if="aclStatus">
      <a-form-item :label="$t('network.text_361')">
        <a-select :value="aclTypeValue" @change="onAclTypeChange">
          <a-select-option v-for="item in aclTypeOpts" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('network.text_362')">
        <base-select
          :value="aclValue"
          @change="onAclChange"
          resource="loadbalanceracls"
          show-sync
          :params="aclParams"
          :select-props="{ placeholder: $t('network.text_363') }" />
      </a-form-item>
    </template>
  </div>
</template>

<script>
import _ from 'lodash'
import i18n from '@/locales'
import { resolveFieldMeta } from '@/utils/common/ant'

const FIELDS = {
  acl_status: 'acl_status',
  acl_type: 'acl_type',
  acl: 'acl',
}

export default {
  name: 'LbAcl',
  inject: {
    lbListenerFieldMap: { default: null },
  },
  props: {
    lbDetail: {
      type: Object,
      required: true,
    },
    aclTypeOpts: {
      type: Array,
      default: () => [
        { key: 'white', label: i18n.t('network.text_364') },
        { key: 'black', label: i18n.t('network.text_365') },
      ],
    },
    form: {
      type: Object,
      required: true,
      validator: val => !!val.fd,
    },
    listenerData: {
      type: Object,
    },
  },
  data () {
    const fieldDef = this.lbListenerFieldMap || {}
    return {
      aclStatus: resolveFieldMeta(fieldDef.acl_status, 'acl_status')?.initialValue,
      aclTypeValue: resolveFieldMeta(fieldDef.acl_type, 'acl_type')?.initialValue,
      aclValue: resolveFieldMeta(fieldDef.acl, 'acl')?.initialValue,
    }
  },
  computed: {
    fd () {
      return this.form.fd || {}
    },
    aclParams () {
      const params = {
        limit: 0,
      }
      if (this.$store.getters.isAdminMode) {
        const domain = _.get(this.listenerData, 'domain_id') || _.get(this.lbDetail, 'domain_id')
        params.project_domain = domain
      } else {
        params.scope = this.$store.getters.scope
      }
      return params
    },
  },
  created () {
    this.registerFields()
  },
  mounted () {
    const status = this.fd[FIELDS.acl_status]
    if (status !== undefined) this.aclStatus = status
    const type = this.fd[FIELDS.acl_type]
    if (type !== undefined) this.aclTypeValue = type
    const acl = this.fd[FIELDS.acl]
    if (acl !== undefined) this.aclValue = acl
    this.syncAll()
  },
  methods: {
    fieldOpts (key) {
      const meta = resolveFieldMeta(this.lbListenerFieldMap?.[key], key) || {}
      const { name: _n, ...opts } = meta
      return opts
    },
    registerFields () {
      Object.keys(FIELDS).forEach((key) => {
        const name = FIELDS[key]
        const opts = this.fieldOpts(key)
        if (!this.form.registered) this.form.registered = new Set()
        this.form.registered.add(name)
        if (!this.form.fieldOpts) this.form.fieldOpts = {}
        this.form.fieldOpts[name] = opts
      })
    },
    fieldSet (name, value) {
      if (this.form.fd) this.$set(this.form.fd, name, value)
    },
    syncAll () {
      this.fieldSet(FIELDS.acl_status, this.aclStatus)
      this.fieldSet(FIELDS.acl_type, this.aclTypeValue)
      this.fieldSet(FIELDS.acl, this.aclValue)
    },
    onAclStatusChange (val) {
      this.aclStatus = val
      this.fieldSet(FIELDS.acl_status, val)
    },
    onAclTypeChange (val) {
      this.aclTypeValue = val
      this.fieldSet(FIELDS.acl_type, val)
    },
    onAclChange (val) {
      this.aclValue = val
      this.fieldSet(FIELDS.acl, val)
    },
  },
}
</script>
