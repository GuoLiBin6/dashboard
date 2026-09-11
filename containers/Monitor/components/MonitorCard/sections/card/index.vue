<template>
  <div class="overview-summary-card">
    <div class="overview-summary-card__head">
      <div class="overview-summary-card__identity">
        <icon :type="card.icon" class="overview-summary-card__icon" />
        <div class="overview-summary-card__meta">
          <div class="overview-summary-card__title">{{ card.title }}</div>
          <div class="overview-summary-card__total">
            <span class="overview-summary-card__total-num">{{ card.total }}</span>
            <span v-if="card.unit" class="overview-summary-card__total-unit">{{ card.unit }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="overview-summary-card__body">
      <div
        v-for="(v, k) in card.items"
        :key="k"
        class="overview-summary-card__row"
        :class="{ 'is-clickable': isClickable }"
        @click="handleResClick(card, k)">
        <status :status="k" statusModule="monitorresources" class="overview-summary-card__status" />
        <span class="overview-summary-card__count">{{ card.items[k] || 0 }}</span>
        <span class="overview-summary-card__percent">{{ percentOf(v) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import Status from '@/components/Status'

export default {
  name: 'OverviewSummaryCard',
  components: { Status },
  props: {
    card: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isClickable () {
      return ['guest', 'host'].includes(this.card.resType)
    },
  },
  methods: {
    percentOf (v) {
      if (!this.card.total) return '0%'
      return `${((v * 100) / this.card.total).toFixed(0)}%`
    },
    handleResClick (res, alert_state) {
      this.$emit('resourceClick', { resType: res.resType, alert_state })
    },
  },
}
</script>

<style lang="less" scoped>
.overview-summary-card {
  height: 100%;
  padding: 14px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
  transition: border-color 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    border-color: #e6e6e6;
    background: #fff;
  }

  &__head {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  &__icon {
    flex-shrink: 0;
    font-size: 36px;
    line-height: 1;
    color: rgba(0, 0, 0, 0.65);
  }

  &__meta {
    min-width: 0;
  }

  &__title {
    color: rgba(0, 0, 0, 0.45);
    font-size: 13px;
    line-height: 1.3;
  }

  &__total {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-top: 2px;
  }

  &__total-num {
    color: rgba(0, 0, 0, 0.85);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  &__total-unit {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    column-gap: 12px;
    min-height: 22px;

    &.is-clickable {
      cursor: pointer;
      border-radius: 4px;
      margin: 0 -6px;
      padding: 0 6px;
      transition: background-color 0.15s cubic-bezier(0.2, 0, 0, 1);

      &:hover {
        background: rgba(0, 0, 0, 0.03);

        .overview-summary-card__count {
          color: var(--antd-wave-shadow-color);
        }
      }
    }
  }

  &__status {
    display: inline-grid;
    min-width: 0;
  }

  &__count {
    color: rgba(0, 0, 0, 0.85);
    font-size: 14px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    text-align: right;
    transition: color 0.15s cubic-bezier(0.2, 0, 0, 1);
  }

  &__percent {
    min-width: 42px;
    padding: 0 6px;
    color: var(--antd-wave-shadow-color);
    font-size: 12px;
    line-height: 20px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 4px;
  }
}
</style>
