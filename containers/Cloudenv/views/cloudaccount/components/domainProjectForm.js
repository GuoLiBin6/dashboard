export function getDomainProjectInitialState (cloneData = {}, vm) {
  const initResourceMapType = []
  const initProjectMapping = []
  let initEffectiveScope = ''
  const {
    auto_create_project,
    auto_create_project_for_provider,
    project_mapping_id,
    tenant,
    enable_resource_sync,
    enable_project_sync,
  } = cloneData
  if (auto_create_project_for_provider) initResourceMapType.push('cloudprovider')
  if (project_mapping_id) {
    initResourceMapType.push('project_mapping')
    initProjectMapping.push(project_mapping_id)
  }
  if (auto_create_project) initResourceMapType.push('external_project')
  if (tenant) {
    initResourceMapType.push('project')
  }
  if (enable_resource_sync && !initEffectiveScope) {
    initEffectiveScope = 'resource'
  } else if (enable_project_sync && !initEffectiveScope) {
    initEffectiveScope = 'project'
  }
  const t = vm && vm.$t ? vm.$t.bind(vm) : (k) => k
  return {
    resource_map_type: initResourceMapType,
    project_mapping_id: initProjectMapping,
    effective_scope: initEffectiveScope || 'resource',
    resourceMapType: initResourceMapType,
    openProjectMapping: initResourceMapType.includes('project_mapping'),
    effectiveScope: initEffectiveScope || 'resource',
    rules: {
      resource_map_type: [
        { required: true, message: t('cloudenv.select_resource_map_type') },
      ],
      project_mapping_id: [
        { required: true, message: t('common.tips.select', [t('cloudenv.text_580')]) },
      ],
    },
  }
}

export function getDomainProjectExtraRules (vm) {
  const { rules } = getDomainProjectInitialState(vm.cloneData, vm)
  return rules
}

export function ensureDomainProjectFormFields (form, cloneData, vm) {
  const init = getDomainProjectInitialState(cloneData, vm)
  if (form.resource_map_type === undefined) form.resource_map_type = init.resource_map_type
  if (form.project_mapping_id === undefined) form.project_mapping_id = init.project_mapping_id
  if (form.effective_scope === undefined) form.effective_scope = init.effective_scope
  return init
}
