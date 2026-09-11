<template>
  <div class="licenses-page">
    <a-card class="license-card" size="small">
      <template #title>
        <span class="license-card__title">{{ $t('scope.text_145') }}</span>
      </template>
      <div class="license-fields">
        <div class="license-field">
          <div class="license-label">{{ $t('scope.text_146') }}</div>
          <div class="license-value">{{ productName }}</div>
        </div>
        <div class="license-field">
          <div class="license-label">{{ $t('scope.text_147') }}</div>
          <div class="license-value">{{ version || '-' }}</div>
        </div>
        <div class="license-field">
          <div class="license-label">{{ $t('scope.text_156') }}</div>
          <div class="license-value">{{ copyright }}</div>
        </div>
        <div class="license-field">
          <div class="license-label">{{ $t('scope.text_154') }}</div>
          <div class="license-value">
            <img class="license-qr" src="@/assets/contact.png" alt="support" />
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script>
import setting from '@/config/setting'

export default {
  name: 'Licenses',
  data () {
    return {
      email: 'info@yunion.cn',
      copyright: '北京云联壹云技术有限公司',
    }
  },
  computed: {
    version () {
      if (setting.oemVersion) {
        return `v${setting.oemVersion.replace(/^[v]/, '')}`
      }
      return '-'
    },
    productName () {
      if (process.env.PRODUCT) {
        return setting.product[setting.language] || 'Cloudpods'
      }
      return 'Cloudpods'
    },
  },
}
</script>

<style lang="less" scoped>
.licenses-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 24px 24px;
  min-width: 0;
  box-sizing: border-box;
}

.license-card {
  width: 100%;
  max-width: 960px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06);

  :deep(.ant-card-head) {
    min-height: 48px;
    padding: 0 20px;
    border-bottom-color: #f0f0f0;
  }

  :deep(.ant-card-head-title) {
    padding: 12px 0;
  }

  :deep(.ant-card-body) {
    padding: 16px 20px 20px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: rgba(0, 0, 0, 0.88);
  }
}

.license-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.license-field {
  display: flex;
  align-items: flex-start;
  min-height: 22px;
  line-height: 22px;
}

.license-label {
  width: 120px;
  flex: 0 0 120px;
  color: rgba(0, 0, 0, 0.45);
  padding-right: 12px;
}

.license-value {
  flex: 1;
  min-width: 0;
  color: rgba(0, 0, 0, 0.88);
  word-break: break-word;
}

.license-qr {
  display: block;
  width: 160px;
  max-width: 100%;
  min-width: 100px;
  height: auto;
  border-radius: 6px;
  outline: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 576px) {
  .licenses-page {
    padding: 12px 12px 24px;
  }

  .license-field {
    flex-direction: column;
    gap: 4px;
  }

  .license-label {
    width: auto;
    flex: none;
    padding-right: 0;
  }
}
</style>
