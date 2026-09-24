<template>
  <div class="usage-ring" :class="{ 'is-template': isTemplate }">
    <div class="usage-ring__header">
      <span class="usage-ring__title">{{ title }}</span>
    </div>
    <div class="usage-ring__body">
      <a-progress type="circle" :percent="percent" :width="100" :strokeWidth="10" :status="status" :strokeColor="percentColor">
        <template v-slot:format>
          <span class="usage-ring__percent" :style="{ color: percentColor }">{{ percentTips }}</span>
        </template>
      </a-progress>
      <div class="usage-ring__legend">
        <div class="usage-ring__row">
          <span class="usage-ring__label">{{ useLabel }}</span>
          <span class="usage-ring__num">{{ use }}</span>
        </div>
        <div class="usage-ring__row">
          <span class="usage-ring__label">{{ unuseLabel }}</span>
          <span class="usage-ring__num">{{ unuse }}</span>
        </div>
        <div class="usage-ring__row">
          <span class="usage-ring__label">{{ sumLabel }}</span>
          <span class="usage-ring__num">{{ sum }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import COLORS from '@/constants/color'

export default {
  name: 'UsageRing',
  props: {
    title: {
      type: String,
    },
    field: {
      type: String,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      sumLabel: this.options?.label?.sum,
      sum: this.options?.value?.sum,
      useLabel: this.options?.label?.use,
      use: this.options?.value?.use,
      unuseLabel: this.options?.label?.unuse,
      unuse: this.options?.value?.unuse,
    }
  },
  computed: {
    percent () {
      if (this.use && this.sum) {
        return parseInt((this.use / this.sum) * 100)
      }
      return 0
    },
    percentTips () {
      return `${this.percent}%`
    },
    percentColor () {
      const isReverse = COLORS.COLORS_SCHEME_REVERSE_FIELDS.find(v => this.field.endsWith(v))

      if (isReverse) {
        if (this.percent < 60) {
          return COLORS.COLORS_SCHEME.REVERSE.PERCENT_60
        } else if (this.percent < 80) {
          return COLORS.COLORS_SCHEME.REVERSE.PERCENT_80
        } else {
          return COLORS.COLORS_SCHEME.REVERSE.PERCENT_100
        }
      } else {
        if (this.percent < 60) {
          return COLORS.COLORS_SCHEME.DEFAULT.PERCENT_60
        } else if (this.percent < 80) {
          return COLORS.COLORS_SCHEME.DEFAULT.PERCENT_80
        } else {
          return COLORS.COLORS_SCHEME.DEFAULT.PERCENT_100
        }
      }
    },
    status () {
      let ret = 'normal'
      if (this.percent > 100) {
        ret = 'exception'
      }
      return ret
    },
  },
  watch: {
    options: {
      deep: true,
      handler (val) {
        this.sumLabel = val?.label?.sum
        this.sum = val?.value?.sum
        this.useLabel = val?.label?.use
        this.use = val?.value?.use
        this.unuseLabel = val?.label?.unuse
        this.unuse = val?.value?.unuse
      },
    },
  },
}
</script>

<style lang="scss" scoped>
.usage-ring {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 180px;
  margin-bottom: 16px;
  padding: 16px 18px;
  box-sizing: border-box;
  border-radius: 8px;
  background: var(--oc-color-bg-container, #fff);
  border: 1px solid var(--oc-color-border-secondary, #e8e8e8);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    border-color: var(--oc-color-border, #d9d9d9);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--oc-color-text-heading, rgba(0, 0, 0, 0.85));
    -webkit-font-smoothing: antialiased;
  }

  &__body {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__percent {
    font-size: 16px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
  }

  &__legend {
    flex: 1;
    min-width: 0;
    margin-left: 20px;
  }

  &__row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    line-height: 1.5;

    & + & {
      margin-top: 8px;
    }
  }

  &__label {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--oc-color-text-secondary, rgba(0, 0, 0, 0.55));
  }

  &__num {
    flex: 1;
    text-align: right;
    font-size: 13px;
    font-weight: 500;
    color: var(--oc-color-text, rgba(0, 0, 0, 0.75));
    font-variant-numeric: tabular-nums;
  }

  &.is-template {
    box-shadow: none;
    border: 1px solid #e5e6eb;

    &:hover {
      box-shadow: none;
      border-color: #e5e6eb;
    }
  }
}
</style>
