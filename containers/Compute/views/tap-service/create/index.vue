<template>
  <div>
    <page-header :title="$t('compute.create_tap_service')" />
    <page-body>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        class="mt-3">
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.serverCreateName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-input v-model:value="form.description" :placeholder="$t('scope.text_55')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_175')" prop="type">
          <a-radio-group v-model:value="form.type" @change="onTypeChange">
            <a-radio-button value="host">{{ $t('compute.host_port') }}</a-radio-button>
            <a-radio-button value="guest">{{ $t('compute.guest_port') }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.target_server')" prop="target_id">
          <base-select
            v-model="form.target_id"
            class="w-100"
            :filterable="true"
            :resource="form.type === 'guest' ? 'servers' : 'hosts'"
            version="v1"
            needParams
            :params="serverParams"
            isDefaultSelect
            :select-props="{ placeholder: $t('compute.text_148', [$t('compute.target_server')]) }"
            @update:item="serverChange" />
        </a-form-model-item>
        <a-form-model-item v-if="form.type === 'host'" :label="$t('compute.target_mac')" prop="mac_addr">
          <base-select
            v-model="form.mac_addr"
            :options="macAddrs"
            idKey="mac"
            nameKey="mac"
            isDefaultSelect
            :select-props="{ placeholder: $t('compute.text_148', [$t('compute.target_mac')]) }" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button class="mr-3" type="primary" @click="handleConfirm" :loading="loading">{{$t('compute.text_907')}}</a-button>
        <a-button @click="handleCancel">{{$t('compute.text_908')}}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import validateForm from '@/utils/validate'

export default {
  name: 'TapServiceCreate',
  data () {
    return {
      loading: false,
      form: {
        name: '',
        description: '',
        type: 'host',
        target_id: undefined,
        mac_addr: undefined,
      },
      currentHost: {},
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'scope']),
    rules () {
      const rules = {
        name: [
          { required: true, message: this.$t('compute.text_210'), trigger: 'blur' },
          { validator: validateForm('serverCreateName'), trigger: 'blur' },
        ],
        target_id: [
          { required: true, message: this.$t('compute.text_148', [this.$t('compute.target_server')]), trigger: 'change' },
        ],
      }
      if (this.form.type === 'host') {
        rules.mac_addr = [
          { required: true, message: this.$t('compute.text_148', [this.$t('compute.target_mac')]), trigger: 'change' },
        ]
      }
      return rules
    },
    serverParams () {
      return {
        scope: this.scope,
        filter: 'hypervisor.notin(baremetal,container)',
        brand: 'OneCloud',
        limit: 20,
        system: this.isAdminMode,
      }
    },
    macAddrs () {
      const { nic_info = [] } = this.currentHost
      return nic_info.filter(item => !item.wire_id)
    },
  },
  methods: {
    onTypeChange () {
      this.form.target_id = undefined
      this.form.mac_addr = undefined
      this.currentHost = {}
    },
    serverChange (data) {
      if (this.form.type === 'host') {
        this.currentHost = data || {}
        this.form.mac_addr = undefined
      } else {
        this.currentHost = {}
      }
    },
    handleCancel () {
      this.$router.push({
        name: 'TapService',
      })
    },
    async handleConfirm () {
      const manager = new this.$Manager('tap_services', 'v1')
      try {
        await this.$refs.formRef.validate()
        this.loading = true
        const data = { ...this.form }
        if (data.type !== 'host') {
          delete data.mac_addr
        }
        await manager.create({ data })
        this.handleCancel()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
