<template>
  <div>
    <mode-select ignore-mode="batch" />
    <template v-if="isSingle">
      <a-form-model-item :label="$t('compute.text_772')" :extra="$t('compute.text_773')" prop="name">
        <a-input v-model:value="fd.name" :placeholder="$t('validator.serverName')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')" prop="description">
        <a-textarea v-model:value="fd.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_774')" :extra="$t('compute.text_775')" prop="ipmi_ip_addr">
        <a-input v-model:value="fd.ipmi_ip_addr" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_776')" :extra="$t('compute.text_775')" prop="ipmi_username">
        <a-input v-model:value="fd.ipmi_username" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_777')" :extra="$t('compute.text_775')" prop="ipmi_password">
        <a-input-password v-model:value="fd.ipmi_password" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_778')" prop="net">
        <net-select @change="v => $set(fd, 'net', v)" :project-domain="fd.project_domain" />
        <template #extra>
          {{ $t('compute.text_779') }} <help-link href="/network/create">{{$t('common.create')}}</help-link>
        </template>
      </a-form-model-item>
      <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
        <tag v-model:value="fd.__meta__" />
      </a-form-model-item>
    </template>
    <template v-if="isFile">
      <file-select
        :offset-wrapper-col="offsetWrapperCol"
        download-url="/v1/downloads/BatchHostISORegister" />
    </template>
    <a-form-model-item :wrapper-col="offsetWrapperCol" prop="no_prepare">
      <a-checkbox v-model:checked="fd.no_prepare">{{$t('compute.text_780')}}</a-checkbox>
    </a-form-model-item>
  </div>
</template>

<script>
import Tag from '@/sections/Tag'
import ModeSelect from '../components/ModeSelect'
import FileSelect from '../components/FileSelect'
import NetSelect from '../components/NetSelect'
export default {
  name: 'PhysicalmachineISOAdd',
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
  computed: {
    isSingle () {
      return this.fd.mode === 'single'
    },
    isFile () {
      return this.fd.mode === 'file'
    },
  },
}
</script>
