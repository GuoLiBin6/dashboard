<template>
  <a-card style="border: none;">
    <h5 class="text-center mb-4">{{ title }}</h5>
    <a-form-model ref="formRef" :model="formData" :rules="rules" @submit.prevent="handleSubmit">
      <template v-for="(questionGroup, idx) of questionGroupKeys" :key="questionGroup">
        <div>
          <a-form-model-item :label="`${$t('common.text00113')}${idx + 1}`" v-bind="formItemLayout" :prop="`question${idx}`">
            <a-select :placeholder="$t('common.text00114')" v-model:value="formData[`question${idx}`]" :disabled="isVerify">
              <a-select-option
                v-for="question of questionOptions[questionGroup]"
                :key="question.label"
                :value="question.label">{{ question.label }}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('common.text00115')" v-bind="formItemLayout" :prop="`answer${idx}`">
            <a-input :placeholder="$t('auth.question.answer.placeholder')" v-model:value="formData[`answer${idx}`]" />
          </a-form-model-item>
        </div>
      </template>
      <a-form-model-item>
        <div class="text-center">
          <a-button @click="$router.back()">{{ $t('common.text00116') }}</a-button>
          <a-button class="ml-2" type="primary" html-type="submit" :loading="loading">{{ submitText }}</a-button>
        </div>
      </a-form-model-item>
    </a-form-model>
  </a-card>
</template>

<script>
import i18n from '@/locales'

const QUESTION_GROUPS = ['group1', 'group2', 'group3']

export default {
  name: 'SecretQuestionForm',
  props: {
    title: {
      type: String,
      default: i18n.t('auth.mfa.title'),
    },
    loading: Boolean,
    questions: Array,
    submitText: {
      type: String,
      default: i18n.t('auth.mfa.submit'),
    },
  },
  data () {
    // vue-i18n v9+：$t 对对象文案返回 key 字符串，需用 $tm
    const authSecretQuestion = this.$tm('authSecretQuestion') || {}
    const questionGroupKeys = QUESTION_GROUPS.filter(key => Array.isArray(authSecretQuestion[key]))
    const formData = {}
    const rules = {}
    for (let i = 0, len = questionGroupKeys.length; i < len; i++) {
      let initQuestion = authSecretQuestion[questionGroupKeys[i]][0].label
      if (this.questions && this.questions.length) {
        initQuestion = this.questions[i]
      }
      formData[`question${i}`] = initQuestion
      formData[`answer${i}`] = ''
      rules[`answer${i}`] = [
        { required: true, min: 1, max: 15, message: this.$t('auth.question.answer.validate') },
      ]
    }
    return {
      questionOptions: authSecretQuestion,
      questionGroupKeys,
      formData,
      rules,
      formItemLayout: {
        wrapperCol: {
          md: { span: 21 },
          xl: { span: 21 },
          xxl: { span: 21 },
        },
        labelCol: {
          md: { span: 3 },
          xl: { span: 3 },
          xxl: { span: 3 },
        },
      },
    }
  },
  computed: {
    isVerify () {
      return this.questions && this.questions.length > 0
    },
  },
  methods: {
    handleSubmit () {
      this.$refs.formRef.validate(valid => {
        if (!valid) return
        const data = []
        for (let i = 0, len = this.questionGroupKeys.length; i < len; i++) {
          data.push({
            question: this.formData[`question${i}`],
            answer: this.formData[`answer${i}`],
          })
        }
        this.$emit('submit', data)
      })
    },
  },
}
</script>
