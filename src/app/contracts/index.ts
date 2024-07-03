import { StoreValue } from 'antd/es/form/interface'
import { message } from 'antd'

async function createWhitelistInvestment(values: StoreValue) {
  console.log('🍻 createWhitelistInvestment values :', values)
  // const title = values.title
  // const content = values.content
  //
  const totlePercent = values.whitelist.reduce((acc: number, cur: any) => {
    return acc + cur.percent
  }, 0)
  if (totlePercent !== 100) {
    message.error('error: total percent must be 100')
    return false
  }

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
