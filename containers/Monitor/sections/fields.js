import i18n from '@/locales'

export const METRIC_FIELD_NAMES = {
  metric_res_type: 'metric_res_type',
  metric_key: 'metric_key',
  metric_value: 'metric_value',
}

export function metricFieldRules () {
  const selectRequired = [{ required: true, message: i18n.t('common.select') }]
  return {
    metric_res_type: selectRequired,
    metric_key: selectRequired,
    metric_value: selectRequired,
  }
}

export function buildMetricFieldMap (initial = {}) {
  const rules = metricFieldRules()
  return {
    metric_res_type: { name: METRIC_FIELD_NAMES.metric_res_type, initialValue: initial.res_type, rules: rules.metric_res_type },
    metric_key: { name: METRIC_FIELD_NAMES.metric_key, initialValue: initial.metric_key, rules: rules.metric_key },
    metric_value: { name: METRIC_FIELD_NAMES.metric_value, initialValue: initial.metric_value, rules: rules.metric_value },
  }
}

export const ALERT_CONDITION_FIELD_NAMES = {
  period: 'period',
  alert_duration: 'alert_duration',
  reduce: 'reduce',
  comparator: 'comparator',
  threshold: 'threshold',
}

export function alertConditionFieldRules () {
  const selectRequired = [{ required: true, message: i18n.t('common.select') }]
  return {
    period: selectRequired,
    alert_duration: selectRequired,
    reduce: selectRequired,
    comparator: selectRequired,
    threshold: [{ required: true, message: i18n.t('common.placeholder') }],
  }
}

export function buildAlertConditionFieldMap (initial = {}) {
  const rules = alertConditionFieldRules()
  return {
    period: { name: 'period', initialValue: initial.period ?? '5m', rules: rules.period },
    alert_duration: { name: 'alert_duration', initialValue: initial.alert_duration ?? 2, rules: rules.alert_duration },
    reduce: { name: 'reduce', initialValue: initial.reduce ?? 'avg', rules: rules.reduce },
    comparator: { name: 'comparator', initialValue: initial.comparator ?? '>=', rules: rules.comparator },
    threshold: { name: 'threshold', initialValue: initial.threshold, rules: rules.threshold },
  }
}

export const FILTER_FIELD = {
  tagCondition: i => `tagConditions[${i}]`,
  tagKey: i => `tagKeys[${i}]`,
  tagOperator: i => `tagOperators[${i}]`,
  tagValue: i => `tagValues[${i}]`,
}

export function buildFilterFieldMap () {
  const selectRequired = [{ required: true, message: i18n.t('common.select') }]
  return {
    tagCondition: i => [
      FILTER_FIELD.tagCondition(i),
      { initialValue: 'AND', rules: selectRequired },
    ],
    tagKey: i => [FILTER_FIELD.tagKey(i), { rules: [] }],
    tagOperator: i => [
      FILTER_FIELD.tagOperator(i),
      { initialValue: '=', rules: selectRequired },
    ],
    tagValue: i => [FILTER_FIELD.tagValue(i), { rules: [] }],
  }
}

const numberPattern = /^\d+(\.\d+)?$/

/** 告警条件行 — 与 new-alert form.fd 字段名对齐 */
export function buildConditionFieldMap (ctx = {}) {
  const getFd = () => ctx.getFd?.() || {}
  const t = (key) => (ctx.t ? ctx.t(key) : i18n.t(key))
  const selectRequired = [{ required: true, message: i18n.t('common.select') }]
  const thresholdRequired = [{ required: true, message: t('monitor.commonalert.threshold.message') }]
  const numberRule = {
    validator: (rule, value, callback) => {
      if (!numberPattern.test(value)) {
        callback(t('monitor.validate_number'))
        return
      }
      callback()
    },
  }
  return {
    metric_key: i => ({ name: `metric_key[${i}]`, rules: [{ required: true, message: t('monitor.text_112') }] }),
    metric_value: i => ({ name: `metric_value[${i}]`, rules: [{ required: true, message: t('monitor.text_113') }] }),
    reduce: i => ({ name: `reduce[${i}]`, initialValue: 'avg', rules: selectRequired }),
    comparator: i => ({ name: `comparator[${i}]`, initialValue: '>=', rules: selectRequired }),
    threshold: i => ({ name: `threshold[${i}]`, initialValue: 1, validateFirst: true, rules: [...thresholdRequired, numberRule] }),
    threshold_start: i => ({
      name: `threshold_start[${i}]`,
      initialValue: 1,
      validateFirst: true,
      rules: [
        ...thresholdRequired,
        numberRule,
        {
          validator: (rule, value, callback) => {
            if (!numberPattern.test(value)) {
              callback(t('monitor.validate_number'))
              return
            }
            const endValue = getFd().threshold_end?.[i]
            if (endValue !== undefined && endValue !== null && endValue !== '') {
              const start = parseFloat(value)
              const end = parseFloat(endValue)
              if (!isNaN(start) && !isNaN(end) && start >= end) {
                callback(t('monitor.commonalert.threshold_start_lt_end'))
                return
              }
            }
            callback()
          },
        },
      ],
    }),
    threshold_end: i => ({
      name: `threshold_end[${i}]`,
      initialValue: 2,
      validateFirst: true,
      rules: [
        ...thresholdRequired,
        numberRule,
        {
          validator: (rule, value, callback) => {
            if (!numberPattern.test(value)) {
              callback(t('monitor.validate_number'))
              return
            }
            const startValue = getFd().threshold_start?.[i]
            if (startValue !== undefined && startValue !== null && startValue !== '') {
              const start = parseFloat(startValue)
              const end = parseFloat(value)
              if (!isNaN(start) && !isNaN(end) && end <= start) {
                callback(t('monitor.commonalert.threshold_end_gt_start'))
                return
              }
            }
            callback()
          },
        },
      ],
    }),
  }
}
