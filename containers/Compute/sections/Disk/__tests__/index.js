import { shallowMount } from '@vue/test-utils'
import { diskValidator } from '@Compute/utils/createServer'
import { isRequired } from '@/utils/validate'
import i18n from '@/locales'
import Disk from '../index'
let fieldMap = null
let typesMap = null
let elements = null

beforeEach(() => {
  elements = ['mount-point', 'snapshot', 'schedtag']
  fieldMap = {
    type: {
      name: 'dataDiskTypes',
      rules: [
        { validator: isRequired(), message: i18n.t('compute.text_121') },
      ],
    },
    size: {
      name: 'dataDiskSizes',
      rules: [
        { required: true, message: i18n.t('compute.text_122') },
      ],
    },
    schedtag: {
      name: 'dataDiskSchedtags',
      validateTrigger: ['change', 'blur'],
      rules: [{
        required: true,
        message: i18n.t('compute.text_123'),
      }],
    },
    policy: {
      name: 'dataDiskPolicys',
      validateTrigger: ['blur', 'change'],
      rules: [{
        required: true,
        message: i18n.t('compute.text_123'),
      }],
    },
    snapshot: {
      name: 'dataDiskSnapshots',
      validateTrigger: ['blur', 'change'],
      rules: [{
        required: true,
        message: i18n.t('compute.text_124'),
      }],
    },
    filetype: {
      name: 'dataDiskFiletypes',
      validateTrigger: ['blur', 'change'],
      rules: [{
        required: true,
        message: i18n.t('compute.text_125'),
      }],
    },
    mountPath: {
      name: 'dataDiskMountPaths',
      validateTrigger: ['blur', 'change'],
      rules: [{
        required: true,
        message: i18n.t('compute.text_126'),
      }, {
        validator: diskValidator,
      }],
    },
  }
  typesMap = {
    local: {
      label: i18n.t('compute.text_70'),
      key: 'local',
      min: 1,
      max: 3072,
      default: true,
      sysMin: 30,
      sysMax: 500,
      unCreateCloud: true,
    },
    rbd: {
      label: 'Ceph RBD',
      key: 'rbd',
      min: 1,
      max: 3072,
      sysMin: 30,
      sysMax: 500,
    },
  }
})

describe('Disk', () => {
  it('check disk minSize >= snapshot size', () => {
    const wrapper = shallowMount(Disk, {
      data () {
        return {
          showSchedtag: false,
          showMountpoint: false,
          showSnapshot: false,
          snapshotObj: {
            size: 51200,
            name: 'test',
            id: 1,
          },
        }
      },
      propsData: {
        elements,
        fieldMap,
        typesMap,
        min: 30,
        max: 500,
      },
    })
    expect(wrapper.vm.minSize).toBeGreaterThanOrEqual(51200 / 1024)
    expect(wrapper.vm.$el).toMatchSnapshot()
  })
  it('check disk minSize >= min size', () => {
    const min = 60
    const wrapper = shallowMount(Disk, {
      data () {
        return {
          showSchedtag: false,
          showMountpoint: false,
          showSnapshot: false,
          snapshotObj: {
            size: 51200,
            name: 'test',
            id: 1,
          },
        }
      },
      propsData: {
        elements,
        fieldMap,
        typesMap,
        min,
        max: 500,
      },
    })
    expect(wrapper.vm.minSize).toBeGreaterThanOrEqual(min)
    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})
