/**
 * a-form-model 用法入口。
 * Duration：必传 :model；字段用 v-model:durationStandard / v-model:duration 绑 shell model（如 form.fd）。
 *
 * @example
 * import Duration from '@Compute/sections/Duration/model'
 * <a-form-model :model="form.fd">
 *   <duration
 *     v-model:durationStandard="form.fd.durationStandard"
 *     v-model:duration="form.fd.duration" />
 * </a-form-model>
 */
export { default } from './index.vue'
