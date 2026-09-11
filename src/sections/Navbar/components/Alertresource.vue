<template>
  <div class="position-relative navbar-alert-resource">
    <div class="trigger d-flex align-items-center justify-content-center" @click="toggle">
      <a-tooltip :title="$t('common.resource_alert')" placement="bottom">
        <a-badge :count="total" :overflowCount="99">
          <icon type="res-commonalerts" class="alertresource-icon" />
        </a-badge>
      </a-tooltip>
    </div>
    <a-alert type="info" v-if="visible" class="alertresource-error">
      <template #message>
        <template v-if="total > 0">
          <div v-if="res_total > 0">
            {{$t('common_719', [res_total])}}<a-button type="link" size="small" @click="routerRes">{{$t('common.view')}}</a-button>
          </div>
          <div v-if="alert_total > 0">
            {{$t('common_alert_tips', [alert_total])}}<a-button type="link" size="small" @click="routerAlert">{{$t('common.view')}}</a-button>
          </div>
        </template>
        <template v-else>
          {{$t('common_720')}}
        </template>
      </template>
    </a-alert>
  </div>
</template>

<script>
export default {
  name: 'Alertresource',
  props: {
    res_total: {
      type: Number,
      default: 0,
    },
    alert_total: {
      type: Number,
      default: 0,
    },
  },
  data () {
    return {
      visible: (this.res_total + this.alert_total) > 0,
    }
  },
  computed: {
    total () {
      return this.res_total + this.alert_total
    },
  },
  watch: {
    total (v) {
      if (v > 0) this.visible = true
      else this.visible = false
    },
  },
  methods: {
    toggle () {
      this.visible = !this.visible
    },
    routerRes (e) {
      this.$router.push('/alertresource')
    },
    routerAlert (e) {
      this.$router.push('/alertrecord')
    },
  },
}
</script>

<style lang="less" scoped>
@import "../../../styles/less/theme";

.navbar-alert-resource {
  width: 100%;
  height: 100%;
  color: inherit;

  &:hover {
    color: var(--ant-color-primary, #1890ff);

    :deep(.ant-badge) {
      color: inherit !important;
    }
    :deep(.ant-badge-count),
    :deep(.ant-scroll-number) {
      color: #fff !important;
    }
    .alertresource-icon,
    :deep(.oc-icon) {
      color: inherit !important;
      fill: currentColor !important;
    }
  }
}

.trigger {
  height: 100%;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.alertresource-icon {
  font-size: 20px;
  color: inherit;
}

.alertresource-error {
  color: #374151;
  width: max-content;
  max-width: 360px;
  position: absolute;
  top: 50%;
  right: 44px;
  z-index: 10;
  transform: translateY(-50%);
  border-radius: 8px !important;
  border: 0 !important;
  background: #fff !important;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.08) !important;
  padding: 8px 12px !important;

  :deep(.ant-alert-message) {
    color: #374151;
    font-size: 14px;
    line-height: 1.45;
  }

  :deep(.ant-btn-link) {
    padding: 0 0 0 4px;
    height: auto;
    font-size: 14px;
    color: var(--ant-color-primary, #1890ff);

    &:hover,
    &:focus {
      color: var(--ant-color-primary, #1890ff);
    }
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: -5px;
    width: 10px;
    height: 10px;
    background: #fff;
    transform: translateY(-50%) rotate(45deg);
    box-shadow: 2px -2px 4px rgba(0, 0, 0, 0.04);
  }
}
</style>
