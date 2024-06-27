import dayjs, { OpUnitType } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import { parseToInt } from './numberConverter'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)
dayjs.extend(relativeTime)

/**
 * 格式化日期
 * @param ts 时间戳
 * @param format 格式 参考: https://dayjs.gitee.io/docs/zh-CN/display/format
 * @param tz 时区
 * @returns 格式化后的日期
 */
export const formatTime = (
  ts: number,
  format: string,
  tz = getGuessTimezone(),
) => {
  return dayjs(ts).tz(tz).format(format)
}

/**
 * 获取用户当前时区
 * @returns 用户当前时区
 */
export const getGuessTimezone = () => dayjs.tz.guess()

/**
 * 获取当前时间戳
 * @param second 是否获取到秒一级，默认毫秒
 * @returns
 */
export const nowTimestamp = (second = false) =>
  second ? dayjs().unix() : dayjs().valueOf()

/**
 * 判断给定的时间戳是否在现在之前
 * @param ts 需要判断的时间戳
 * @param unit 比较的颗粒度 参考: https://dayjs.gitee.io/docs/zh-CN/query/is-before
 * @returns
 */
export const isBeforeNow = (ts: number, unit: OpUnitType | undefined) =>
  dayjs(ts).isBefore(dayjs(), unit)

/**
 * @param second ts参数单位是否是秒，默认: 毫秒
 * @returns
 */
export const timeago = (ts: number | bigint, second = false) => {
  if (second) {
    return dayjs.unix(parseToInt(ts)).fromNow()
  } else {
    return dayjs(parseToInt(ts)).fromNow()
  }
}
