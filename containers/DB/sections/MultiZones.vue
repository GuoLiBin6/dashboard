<template>
  <div>
    <a-form-model-item class="mb-0">
      <a-checkbox :value="checked" @change="onChecked">
        {{ $t('db.redis.replicas_zones') }}
      </a-checkbox>
      <div v-for="(z, i) of this.selectedZones" :key="i">
        <span>{{ $t('db.redis.replicas', [i + 1]) + '  ' }}</span>
        <base-select
            class="w-50"
            v-model="selectedZones[i]"
            isDefaultSelect
            filterable
            :key="'slave_zone_'+i+z"
            :options="options"
            @change="onChange"
            style="display: inline-block;" />
      </div>
    </a-form-model-item>
  </div>
</template>

<script>
export default {
  name: 'MultiZones',
  props: {
    form: {
      type: Object,
    },
    /** a-form-model fd（优先于 form.fd） */
    model: {
      type: Object,
      default: null,
    },
    options: {
      type: Array,
    },
  },
  data () {
    return {
      checked: false,
      selectedZones: undefined,
    }
  },
  computed: {
    boundFd () {
      return this.model || this.form?.fd
    },
  },
  watch: {
    'form.fd.sku.replicas_num' () {
      this.resetZones()
    },
    'form.fd.zone' () {
      this.resetZones()
    },
  },
  methods: {
    resetZones () {
      const fd = this.boundFd
      if (!this.checked) {
        this.selectedZones = undefined
      } else {
        const selectedZones = []
        const mainZone = fd?.zone || ''
        const replicasNumber = fd?.sku?.replicas_num || 0
        for (let i = 0; i < replicasNumber; i++) {
          selectedZones.push(mainZone)
        }
        this.selectedZones = selectedZones
      }
      if (fd) this.$set(fd, 'slave_zones', this.selectedZones)
    },
    onChecked (v) {
      this.checked = v.target.checked
      this.resetZones()
    },
    onChange () {
      const fd = this.boundFd
      if (fd) this.$set(fd, 'slave_zones', this.selectedZones)
    },
  },
}
</script>

<style scoped>

</style>
