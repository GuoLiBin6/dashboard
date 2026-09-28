/** Port mapping / dynamic label key-value field names */

export function portMappingKeyField (i) {
  return `containerPorts[${i}]`
}

export function portMappingValueField (i) {
  return `hostPorts[${i}]`
}

export function portMappingProtocolField (i) {
  return `portProtocols[${i}]`
}

export function networkPortMappingKeyField (netKey, rowKey) {
  return `networkContainerPorts[${netKey}][${rowKey}]`
}

export function networkPortMappingValueField (netKey, rowKey) {
  return `networkHostPorts[${netKey}][${rowKey}]`
}

export function networkPortMappingProtocolField (netKey, rowKey) {
  return `networkPortProtocols[${netKey}][${rowKey}]`
}

export const PORT_MAPPING_FIELD_FACTORIES = {
  key: portMappingKeyField,
  value: portMappingValueField,
  protocol: portMappingProtocolField,
}

export function buildNetworkPortMappingFields (netKey) {
  return {
    key: rowKey => networkPortMappingKeyField(netKey, rowKey),
    value: rowKey => networkPortMappingValueField(netKey, rowKey),
    protocol: rowKey => networkPortMappingProtocolField(netKey, rowKey),
  }
}
