/** Port mapping / dynamic label key-value field names */

export function portMappingKeyField (i) {
  return `containerPorts[${i}]`
}

export function portMappingValueField (i) {
  return `hostPorts[${i}]`
}

export const PORT_MAPPING_FIELD_FACTORIES = {
  key: portMappingKeyField,
  value: portMappingValueField,
}
