import { enumToOptions } from '../../util/util'

export default function (def, schema) {
  def.type = 'j-radio'

  if (schema && schema.enums) {
    def.input = {
      options: enumToOptions(schema.enums),
    }
  }

  def.field = [
    {
      initialValue: schema.default,
      rules: [
        {
          validator: this.handleFieldValidate,
        },
      ],
    },
  ]
}
