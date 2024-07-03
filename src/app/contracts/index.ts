import { StoreValue } from 'antd/es/form/interface'
import { message } from 'antd'

async function createWhitelistInvestment(values: StoreValue) {
  console.log('🍻 createWhitelistInvestment values :', values)
  // const title = values.title
  // const content = values.content
  //

  if (!values.endTime) {
    message.error('error: missing end time')
    return false
  }

  if (values.endTime2 < values.endTime) {
    message.error('error: second end time must be greater than end time')
    return false
  }
}

export { createWhitelistInvestment }
