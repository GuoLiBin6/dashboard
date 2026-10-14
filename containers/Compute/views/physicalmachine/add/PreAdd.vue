<template>
  <div>
    <mode-select />
    <template v-if="isSingle">
      <a-form-model-item :label="$t('compute.text_385')" :extra="$t('compute.text_783')" prop="mac">
        <a-input v-model:value="fd.mac" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_772')" :extra="$t('compute.text_773')" prop="name">
        <a-input v-model:value="fd.name" :placeholder="$t('validator.serverName')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')" prop="description">
        <a-textarea v-model:value="fd.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :wrapper-col="offsetWrapperCol" prop="no_bmc">
        <a-checkbox v-model:checked="fd.no_bmc">{{$t('compute.no_bmc')}}</a-checkbox>
      </a-form-model-item>
      <template v-if="!noBMC">
        <a-form-model-item :label="$t('compute.text_774')" :extra="$t('compute.text_784')" prop="ipmi_ip_addr">
          <a-input v-model:value="fd.ipmi_ip_addr" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_776')" :extra="$t('compute.text_785')" prop="ipmi_username">
          <a-input v-model:value="fd.ipmi_username" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_777')" :extra="$t('compute.text_782', [ ipmiPassword ])" prop="ipmi_password">
          <a-input-password v-model:value="fd.ipmi_password" />
        </a-form-model-item>
      </template>
      <template v-if="noBMC">
        <a-form-model-item :label="$t('compute.text_778')" prop="net">
          <net-select @change="v => $set(fd, 'net', v)" :project-domain="fd.project_domain" />
          <template #extra>
            {{ $t('compute.text_779') }} <help-link href="/network/create">{{$t('common.create')}}</help-link>
          </template>
        </a-form-model-item>
      </template>
      <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
        <tag v-model:value="fd.__meta__" />
      </a-form-model-item>
    </template>
    <template v-if="isBatch">
      <a-form-model-item :wrapper-col="offsetWrapperCol">
        <a-alert type="warning">
          <template v-slot:message>
            <div>{{$t('compute.text_786')}}</div>
            <div>{{$t('compute.text_787')}}</div>
            <div>{{$t('compute.text_788')}}</div>
            <div>{{$t('compute.text_789')}}</div>
            <div>{{$t('compute.text_790')}}</div>
            <div>{{$t('compute.text_793')}}</div>
            <div>{{$t('compute.text_794')}}</div>
            <div>{{$t('compute.text_795')}}</div>
            <div>{{$t('compute.text_796', [ ipmiPassword ])}}</div>
          </template>
        </a-alert>
      </a-form-model-item>
      <a-form-model-item :wrapper-col="offsetWrapperCol" prop="content">
        <a-textarea v-model:value="fd.content" :placeholder="$t('compute.text_797')" :autosize="{ minRows: 5, maxRows: 10 }" />
        <div class="text-right">
          <span class="text-color-help">{{$t('compute.text_798', [ total ])}}</span> | <a-button class="pl-0 pr-0" type="link" @click="handleClearContent">{{$t('compute.text_799')}}</a-button>
        </div>
      </a-form-model-item>
    </template>
    <template v-if="isFile">
      <file-select
        :offset-wrapper-col="offsetWrapperCol"
        download-url="/v1/downloads/BatchHostRegister" />
    </template>
  </div>
</template>

<script>
import Tag from '@/sections/Tag'
import ModeSelect from '../components/ModeSelect'
import FileSelect from '../components/FileSelect'
import NetSelect from '../components/NetSelect'
export default {
  name: 'PhysicalmachinePreAdd',
  components: {
    ModeSelect,
    FileSelect,
    NetSelect,
    Tag,
  },
  props: {
    offsetWrapperCol: {
      type: Object,
      required: true,
    },
    fd: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      ipmiPassword: '-',
    }
  },
  computed: {
    isSingle () {
      return this.fd.mode === 'single'
    },
    isBatch () {
      return this.fd.mode === 'batch'
    },
    isFile () {
      return this.fd.mode === 'file'
    },
    total () {
      const lines = (this.fd.content && this.fd.content.split(/\r*\n/).filter((item) => item.length > 0)) || []
      return lines.length || 0
    },
    noBMC () {
      return this.fd.no_bmc
    },
  },
  created () {
    this.fetchDefaultIpmiPassword()
  },
  methods: {
    handleClearContent () {
      this.$set(this.fd, 'content', undefined)
    },
    async fetchDefaultIpmiPassword () {
      let manager = new this.$Manager('services', 'v1')
      try {
        const listResponse = await manager.list({
          params: {
            type: ['baremetal'],
          },
        })
        const data = (listResponse.data.data || [])[0]
        const serviceId = data && data.id
        if (!serviceId) return
        const configResponse = await manager.getSpecific({
          id: serviceId,
          spec: 'config',
        })
        const config = (configResponse.data.config && configResponse.data.config.default) || {}
        this.ipmiPassword = config.default_ipmi_password
      } catch (error) {
        throw error
      } finally {
        manager = null
      }
    },
  },
}
</script>
