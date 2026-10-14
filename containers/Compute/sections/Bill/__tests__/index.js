import { shallowMount } from '@vue/test-utils'
import i18n from '@/locales'
import VmPublicCreateBill from '../index.vue'

describe('VmPublicCreateBill', () => {
  it('check buyDurationOptions in aliyun, first item is 1W', () => {
    const providerList = ['aliyun']
    const wrapper = shallowMount(VmPublicCreateBill, {
      propsData: {
        model: {
          billType: 'quantity',
          duration: '1M',
        },
        providerList,
      },
    })
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.buyDurationOptions[0]).toEqual({
        label: i18n.t('compute.text_24'),
        key: '1W',
        unit: 'W',
        includes: ['aliyun'],
        disabled: false,
      })
    })
  })
})
