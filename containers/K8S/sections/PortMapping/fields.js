import i18n from '@/locales'
import validateForm from '@/utils/validate'
import { checkIpInSegment } from '@Compute/utils/createServer'

export const SERVICE_TYPE_FIELD = 'serviceType'
export const LB_CLUSTER_FIELD = 'loadBalancerCluster'
export const LB_NETWORK_FIELD = 'loadBalancerNetwork'
export const LB_ADDRESS_FIELD = 'loadBalancerAddress'

export const PORT_FIELD_FACTORIES = {
  port: i => `ports[${i}]`,
  targetPort: i => `targetPorts[${i}]`,
  nodePort: i => `nodePorts[${i}]`,
  protocol: i => `protocols[${i}]`,
}

export const PORT_FIELD_INITIAL = {
  port: 1,
  targetPort: 1,
  nodePort: 30000,
  protocol: 'TCP',
}

export function portFieldRules (field) {
  const map = {
    port: [{ required: true, message: i18n.t('k8s.text_134') }],
    targetPort: [{ required: true, message: i18n.t('k8s.text_135') }],
    nodePort: [
      { required: true, message: i18n.t('k8s.input_node_port') },
      {
        validator: (rule, val, cb) => {
          if ((val < 30000) || (val > 32767)) {
            cb(new Error(i18n.t('k8s.node_port.desc')))
          } else {
            cb()
          }
        },
      },
    ],
    protocol: [{ required: true, message: i18n.t('k8s.text_136') }],
  }
  return map[field] || []
}

export function loadBalancerAddressRules (ip, network) {
  return [
    { required: true, message: i18n.t('compute.text_218') },
    { validator: validateForm('IPv4') },
    { validator: checkIpInSegment(ip, network) },
  ]
}
