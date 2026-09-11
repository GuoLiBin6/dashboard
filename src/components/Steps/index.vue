<template>
  <a-steps :current="value.currentStep" labelPlacement="vertical">
    <a-step v-for="(item, idx) in value.steps" :title="item.title" :key="idx" @click="stepItemClick(idx, item)">
      <template #icon v-if="item.iconType">
        <icon :type="item.iconType" />
      </template>
      <template #description v-if="item.description">
        <span>{{ item.description }}</span>
      </template>
    </a-step>
  </a-steps>
</template>
<script>
import * as R from 'ramda'

export default {
  name: 'Steps',
  props: {
    value: {
      type: Object,
      required: true,
      validator: val => R.is(Array, val.steps) && R.is(Number, val.currentStep),
    },
  },
  methods: {
    stepItemClick (idx, item) {
      this.$emit('stepClick', idx, item)
    },
  },
}
</script>
