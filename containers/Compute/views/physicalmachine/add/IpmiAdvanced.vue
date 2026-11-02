<template>
  <advance-config-block collapsible>
    <a-form-model-item :label="$t('compute.ipmi_port')" :extra="$t('compute.ipmi_port_extra')" prop="ipmi_port">
      <a-input-number
        v-model:value="fd.ipmi_port"
        :min="1"
        :max="65535"
        :precision="0"
        style="width: 200px" />
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.ipmi_redfish_port')" :extra="$t('compute.ipmi_redfish_port_extra')" class="mb-0" prop="ipmi_redfish_port">
      <a-input-number
        v-model:value="fd.ipmi_redfish_port"
        :min="1"
        :max="65535"
        :precision="0"
        style="width: 200px" />
    </a-form-model-item>
  </advance-config-block>
</template>

<script>
export default {
  name: 'PhysicalmachineIpmiAdvanced',
  props: {
    fd: {
      type: Object,
      required: true,
    },
  },
}
</script>
