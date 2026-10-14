<template>
  <div>
    <a-spin :spinning="loading">
      <page-header :title="$t('network.text_606')" />
      <a-card :bordered="false" size="small">
        <template #title>
          <dialog-selected-tips :name="$t('network.text_565')" :count="networks.length" :action="$t('network.text_606')" />
        </template>
        <dialog-table :data="networks" :columns="renderColumns" />
      </a-card>
      <div class="form-wrapper">
        <a-form-model ref="formRef" v-bind="formItemLayout" :model="form.fd" @submit.prevent="handleSubmit">
          <a-form-model-item :label="$t('network.text_551')" :validate-status="ipSubnetsValidateStatus" :help="ipSubnetsHelp" required>
            <ip-subnets
              ref="ipSubnetsRef"
              factory-preset="batchEdit"
              :model="form.fd"
              :hiddenAddAction="true"
              :hiddenDeleteAction="true"
              @clear-error="clearIpSubnetsError" />
          </a-form-model-item>
          <page-footer>
            <template v-slot:right>
              <a-button type="primary" html-type="submit" class="ml-3" :loading="submiting">{{$t('network.text_606')}}</a-button>
            </template>
          </page-footer>
        </a-form-model>
      </div>
    </a-spin>
  </div>
</template>

<script>
import * as R from 'ramda'
import { uuid } from '@/utils/utils'
import ColumnsMixin from './mixins/columns'
import IpSubnets from './components/IpSubnets'

export default {
  name: 'BatchEditAttributes',
  components: {
    IpSubnets,
  },
  mixins: [ColumnsMixin],
  provide () {
    return {
      form: this.form,
    }
  },
  data () {
    return {
      loading: false,
      submiting: false,
      networks: [],
      networkIds: [],
      ipSubnetsValidateStatus: '',
      ipSubnetsHelp: '',
      form: {
        fd: {
          name: {},
          startip: {},
          endip: {},
          netmask: {},
          gateway: {},
          vlan: {},
        },
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 23 },
          xl: { span: 23 },
          xxl: { span: 23 },
        },
        labelCol: {
          md: { span: 1 },
          xl: { span: 1 },
          xxl: { span: 1 },
        },
      },
    }
  },
  computed: {
    isRender () {
      return this.networks.length > 0
    },
    renderColumns () {
      const hiddenColumns = ['metadata', 'schedtag', 'is_auto_alloc', 'brand', 'account', 'public_scope']
      return this.columns.filter((item) => {
        return !hiddenColumns.includes(item.field)
      })
    },
  },
  created () {
    this.fetchData()
    this.$watch('networks', () => {
      if (this.networks) {
        this.$refs.ipSubnetsRef.ipSubnets = []
        this.networks.forEach(item => {
          const key = uuid()
          this.networkIds.push(item.id)
          this.$refs.ipSubnetsRef.ipSubnets.push({ key })
          this.$nextTick(() => {
            this.setNestedField('name', key, item.name)
            this.setNestedField('startip', key, item.guest_ip_start)
            this.setNestedField('endip', key, item.guest_ip_end)
            this.setNestedField('netmask', key, item.guest_ip_mask + '')
            this.setNestedField('gateway', key, item.guest_gateway)
            this.setNestedField('vlan', key, item.vlan_id)
          })
        })
      }
    })
  },
  methods: {
    setNestedField (root, key, value) {
      if (!this.form.fd[root] || typeof this.form.fd[root] !== 'object') {
        this.$set(this.form.fd, root, {})
      }
      this.$set(this.form.fd[root], key, value)
    },
    fetchData () {
      const m = new this.$Manager('networks')
      let ids = [this.$route.query.id]
      if (Array.isArray(this.$route.query.id)) {
        ids = this.$route.query.id
      }
      this.loading = true
      m.batchGet({ id: ids })
        .then((res) => {
          const { data } = res.data
          this.networks = data
          this.loading = false
        })
        .catch((err) => {
          this.loading = false
          throw err
        })
    },
    clearIpSubnetsError () {
      this.ipSubnetsValidateStatus = ''
      this.ipSubnetsHelp = ''
    },
    doUpdate (data) {
      return new this.$Manager('networks').batchUpdate({
        ids: this.networkIds,
        data,
        params: { batch_params: true },
      })
    },
    genData (values) {
      const data = []
      R.forEachObjIndexed((value, key) => {
        const obj = {
          name: values.name[key],
          guest_gateway: values.gateway[key],
          guest_ip_end: values.endip[key],
          guest_ip_mask: values.netmask[key],
          guest_ip_start: values.startip[key],
          vlan_id: values.vlan[key] === '' ? '1' : values.vlan[key],
        }
        data.push(obj)
      }, values.startip)
      return data
    },
    async handleSubmit () {
      this.submiting = true
      try {
        if (this.$refs.formRef?.validate) {
          await this.$refs.formRef.validate()
        }
        if (typeof this.$refs.ipSubnetsRef?.validate === 'function') {
          await this.$refs.ipSubnetsRef.validate()
        }
        const values = { ...this.form.fd }
        const data = this.genData(values)
        await this.doUpdate(data)
        this.$store.commit('keepAlive/ADD_DELAY_EVENT', { name: 'ResourceListSingleRefresh', params: this.networkIds })
        this.$router.push('/network')
      } catch (err) {
        throw err
      } finally {
        this.submiting = false
      }
    },
  },
}
</script>
