<template>
  <div class="ip-subnet">
    <div v-if="decorator.name" class="ip-subnet__row ip-subnet__row--name">
      <a-form-item class="mb-0">
        <a-input :addon-before="$t('network.text_21')" v-decorator="decorator.name" :placeholder="$t('network.text_21')" />
      </a-form-item>
    </div>
    <div class="ip-subnet__row ip-subnet__row--v4">
      <a-form-item class="mb-0">
        <a-input :addon-before="$t('network.text_607')" v-decorator="decorator.startip" :placeholder="$t('common_161')" />
      </a-form-item>
      <a-form-item class="mb-0">
        <a-input :addon-before="$t('network.text_608')" v-decorator="decorator.endip" :placeholder="$t('common_162')" />
      </a-form-item>
      <a-form-item class="mb-0 ip-subnet__mask">
        <a-select v-decorator="decorator.netmask" :placeholder="$t('network.text_595')" dropdownClassName="oc-select-dropdown">
          <a-select-option
            v-for="item of netMaskOptions"
            :key="item.key"
            :value="item.key">
            <span class="text-color-secondary option-prefix">{{$t('common_600')}}: </span>{{item.label}}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item class="mb-0">
        <a-input :addon-before="$t('network.text_610')" v-decorator="decorator.gateway" :placeholder="$t('common_163')" />
      </a-form-item>
      <a-form-item class="mb-0 ip-subnet__vlan">
        <a-input addon-before="VLAN ID" v-decorator="decorator.vlan" placeholder="VLAN ID" />
      </a-form-item>
    </div>
    <div class="ip-subnet__row ip-subnet__row--v6" v-if="showV6 || !isButtonHide">
      <template v-if="showV6">
        <a-form-item class="mb-0">
          <a-input :addon-before="$t('network.ipv6.ip_start.label')" v-decorator="decorator.startip6" :placeholder="$t('network.ipv6.ip_start.label')" />
        </a-form-item>
        <a-form-item class="mb-0">
          <a-input :addon-before="$t('network.ipv6.ip_end.label')" v-decorator="decorator.endip6" :placeholder="$t('network.ipv6.ip_end.label')" />
        </a-form-item>
        <a-form-item class="mb-0 ip-subnet__mask">
          <a-select v-decorator="decorator.netmask6" :placeholder="$t('network.ipv6.ip_mask.label')" dropdownClassName="oc-select-dropdown">
            <a-select-option
              v-for="item of net6MaskOptions"
              :key="item.key"
              :value="item.key">
              <span class="text-color-secondary option-prefix">{{$t('common_600')}}: </span>{{item.label}}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item class="mb-0">
          <a-input :addon-before="$t('network.ipv6.gateway.label')" v-decorator="decorator.gateway6" :placeholder="$t('network.ipv6.gateway.label')" />
        </a-form-item>
        <div class="ip-subnet__vlan ip-subnet__spacer" />
      </template>
      <a-button
        v-if="!isButtonHide"
        type="link"
        class="ip-subnet__v6-toggle"
        @click="showV6 = !showV6">
        {{ showV6 ? $t('common.hide_ipv6') : $t('common.config_ipv6') }}
      </a-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IpSubnet',
  props: {
    decorator: {
      type: Object,
      required: true,
      validator: val => {
        const fields = ['startip', 'endip', 'netmask', 'gateway', 'startip6', 'endip6', 'netmask6', 'gateway6', 'vlan']
        return fields.every(item => val.hasOwnProperty(item))
      },
    },
    showIpv6: {
      type: Boolean,
      default: false,
    },
    isButtonHide: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      netMaskOptions: [
        { label: '16', key: '16' },
        { label: '17', key: '17' },
        { label: '18', key: '18' },
        { label: '19', key: '19' },
        { label: '20', key: '20' },
        { label: '21', key: '21' },
        { label: '22', key: '22' },
        { label: '23', key: '23' },
        { label: '24', key: '24' },
        { label: '25', key: '25' },
        { label: '26', key: '26' },
        { label: '27', key: '27' },
        { label: '28', key: '28' },
        { label: '29', key: '29' },
        { label: '30', key: '30' },
      ],
      net6MaskOptions: [
        { label: '64', key: '64' },
        { label: '72', key: '72' },
        { label: '80', key: '80' },
        { label: '88', key: '88' },
        { label: '96', key: '96' },
        { label: '104', key: '104' },
        { label: '112', key: '112' },
        { label: '120', key: '120' },
        { label: '124', key: '124' },
      ],
      showV6: this.showIpv6,
    }
  },
}
</script>

<style lang="less" scoped>
.ip-subnet {
  width: 100%;
  min-width: 0;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  box-sizing: border-box;
}

.ip-subnet__row {
  display: grid;
  gap: 8px;
  align-items: start;
  min-width: 0;

  & + & {
    margin-top: 8px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 0;
    min-width: 0;
  }

  :deep(.ant-input-group-wrapper),
  :deep(.ant-input-affix-wrapper),
  :deep(.ant-select),
  :deep(.ant-input) {
    width: 100%;
  }
}

/* 起/止/掩码/网关/VLAN — 掩码与 VLAN 定宽，其余均分，IPv4/IPv6 列对齐 */
.ip-subnet__row--v4,
.ip-subnet__row--v6 {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.2fr) 108px minmax(0, 1fr) 128px;
}

.ip-subnet__row--name {
  grid-template-columns: minmax(0, 1fr);
}

.ip-subnet__mask,
.ip-subnet__vlan {
  width: 100%;
}

.ip-subnet__spacer {
  min-height: 1px;
}

.ip-subnet__v6-toggle {
  grid-column: 1 / -1;
  justify-self: start;
  padding-left: 0;
  height: auto;
}

@media (max-width: 1200px) {
  .ip-subnet__row--v4,
  .ip-subnet__row--v6 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .ip-subnet__mask,
  .ip-subnet__vlan {
    max-width: none;
  }
}
</style>
