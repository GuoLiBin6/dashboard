import { shallowMount } from '@vue/test-utils'
import { IMAGES_TYPE_MAP } from '@/constants/compute'
import OsSelect from '../index'

const $route = {
  query: {
  },
}

describe('OsSelect', () => {
  it('IDC base', () => {
    const type = 'idc'
    const hypervisor = 'kvm'
    const wrapper = shallowMount(OsSelect, {
      propsData: {
        model: { imageType: IMAGES_TYPE_MAP.standard.key },
        form: { fd: {}, fi: {} },
        type,
        hypervisor,
      },
      mocks: {
        $route,
      },
    })
    expect(wrapper.vm.mirrorTypeOptions).toEqual([IMAGES_TYPE_MAP.standard, IMAGES_TYPE_MAP.customize, IMAGES_TYPE_MAP.iso, IMAGES_TYPE_MAP.host, IMAGES_TYPE_MAP.snapshot])
    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})
