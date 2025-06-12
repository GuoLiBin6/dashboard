<template>
  <div class="account-wrapper">
    <a-row type="flex" justify="start">
      <a-col :span="5" style="text-align: center;">
        <icon type="res-network" style="font-size: 48px;" />
        <div class="account-name">{{ card.name }}</div>
      </a-col>
      <a-col :span="19">
        <table class="account-table">
          <tr>
            <td />
            <td>{{$t('dashboard.text_44')}}</td>
            <td>{{$t('dashboard.allocated')}}</td>
          </tr>
          <tr>
            <td>CPU{{$te('cloudenv.text_63') ? `(${$t('common_60')})` : ''}}</td>
            <td>{{card.cpu_count}}</td>
            <td>{{card.vcpu_count}}</td>
          </tr>
          <tr>
            <td>{{$t('compute.text_369')}}(GiB)</td>
            <td>{{getSize(card.mem_size, 'M', 'G')}}</td>
            <td>{{getSize(card.vmem_size, 'M', 'G')}}</td>
          </tr>
          <tr>
            <td>{{$t('cloudenv.text_6')}}(TB)</td>
            <td>{{getSize(card.storage_size_mb || card.storage_size, 'M', 'T')}}</td>
            <td>{{getSize(card.storage_actual_size_mb || card.storage_actual_size, 'M', 'T')}}</td>
          </tr>
          <tr>
            <td>GPU{{$te('cloudenv.text_63') ? `(${$t('cloudenv.text_63')})` : ''}}</td>
            <td>{{card.gpu_count}}</td>
            <td>{{card.gpu_used_count}}</td>
          </tr>
        </table>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import { sizeToDesignatedUnit } from '@/utils/utils'
export default {
  props: {
    card: {
      type: Object,
      required: true,
    },
  },
  methods: {
    getSize (size, origin, target = 'G') {
      return sizeToDesignatedUnit(size, origin, target, 1024, false)
    },
  },
}
</script>

<style scoped lang="less">
.account-name {
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
}
.account-table {
  font-size: 14px;
  margin-left: 20px;
  td {
    padding: 2px 10px;
  }
}

</style>
