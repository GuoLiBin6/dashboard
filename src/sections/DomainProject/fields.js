import i18n from '@/locales'
import { isRequired } from '@/utils/validate'

export const DOMAIN_FIELD = 'domain'
export const PROJECT_FIELD = 'project'

export const DEFAULT_DOMAIN_PROJECT_RULES = {
  domain: [
    { validator: isRequired(), message: i18n.t('rules.domain'), trigger: 'change' },
  ],
  project: [
    { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
  ],
}

/** 域/项目字段元数据（name + rules），供 DomainProject validate / 初值读取 */
export function domainProjectFieldMeta (domainProp, projectProp) {
  return {
    domain: {
      name: domainProp,
      rules: DEFAULT_DOMAIN_PROJECT_RULES.domain,
    },
    project: {
      name: projectProp,
      rules: DEFAULT_DOMAIN_PROJECT_RULES.project,
    },
  }
}
