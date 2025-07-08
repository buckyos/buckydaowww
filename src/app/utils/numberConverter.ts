import { ethers, toBigInt } from 'ethers'

/**
 * 格式化大数字余额，根据数值大小添加 K, M, B 单位，并控制小数位数。
 * @param balance - 需要格式化的 BigInt 类型的余额。
 * @param decimals - 余额的精度，默认为 '18n' (18位小数)。
 * @param displayDecimals - 显示的小数位数，默认为 3。
 * @param isKeepEndZero - 是否保留末尾的零，默认为 false。
 * @returns 格式化后的字符串，例如 '1.23K', '4.56M'。
 * @example
 * // 假设 balance 是一个 BigInt，表示 1.2345 ETH (18位小数)
 * formatBalance(1234500000000000000n, '18n', 2) // '1.23'
 * formatBalance(1234500000000000000n, '18n', 2, true) // '1.23'
 * formatBalance(987654321000000000000n, '18n', 2) // '987.65'
 * formatBalance(1234567890123456789012345n, '18n', 2) // '123.46B'
 * formatBalance(1234567890123456789012345n, '18n', 0) // '123B'
 */
export const formatBalance = (
  balance: bigint,
  decimals = '18n',
  displayDecimals = 3,
  isKeepEndZero = false,
) => {
  const balanceAfter = parseToFloat(wrapUnits(balance, decimals))

  let fixedNumber = ''
  let unit = ''
  if (balanceAfter < 1000) {
    fixedNumber = balanceAfter.toFixed(displayDecimals)
    unit = ''
  } else if (balanceAfter < 1_000_000) {
    fixedNumber = (balanceAfter / 1000).toFixed(displayDecimals)
    unit = 'K'
  } else if (balanceAfter < 1_000_000_000) {
    fixedNumber = (balanceAfter / 1_000_000).toFixed(displayDecimals)
    unit = 'M'
  } else {
    fixedNumber = (balanceAfter / 1_000_000_000).toFixed(displayDecimals)
    unit = 'B'
  }

  return isKeepEndZero
    ? `${fixedNumber}${unit}`
    : `${parseFloat(fixedNumber)}${unit}`
}

/**
 * 将两个数字转换为百分比，并保留两位小数。
 * @param value - 当前值。
 * @param total - 总值。
 * @returns 格式化后的百分比数值，例如 50.00。
 * @example
 * transformPercentNumber(50, 100) // 50
 * transformPercentNumber(33.333, 100) // 33.33
 * transformPercentNumber(1, 3) // 33.33
 */
export const transformPercentNumber = (value: number, total: number) => {
  const v = (value / total) * 100
  const f = parseFloat(v.toFixed(2))
  return f
}

/**
 * 将两个 BigInt 数字转换为百分比，并保留两位小数。
 * @param value - 当前的 BigInt 值。
 * @param total - 总的 BigInt 值。
 * @returns 格式化后的百分比数值，例如 50.00。
 * @example
 * bigTransformPercentNumber(50n, 100n) // 50
 * bigTransformPercentNumber(33333n, 100000n) // 33.33
 * bigTransformPercentNumber(1n, 3n) // 33.33
 */
export const bigTransformPercentNumber = (value: bigint, total: bigint) => {
  let rawPercentageBigInt = (value * 10000n) / total
  let percentageNumber = Number(rawPercentageBigInt) / 100
  return percentageNumber
}

/**
 * 根据百分比和总数计算出对应的 BigInt 值。
 * @param percent - 百分比，例如 50 表示 50%。
 * @param total - 总的 BigInt 值。
 * @returns 计算出的 BigInt 值。
 * @example
 * // 计算 1000 的 50%
 * calculateProportion(50, 1000n) // 500n
 * // 计算 2000 的 33.33%
 * calculateProportion(33.33, 2000n) // 666n (近似值，因为 BigInt 不支持小数)
 */
export function calculateProportion(percent: number, total: bigint) {
  let factor = 100000000
  let integerDecimal = Math.round(percent * factor)
  let bigIntDecimal = BigInt(integerDecimal)
  // 现在我们可以执行乘法运算
  let result = total * bigIntDecimal
  // 最后，将结果除以之前乘以的因子，以得到正确的结果
  result = result / BigInt(factor)
  return result
}

/**
 * 将给定数值转换为最小精度单位 (wei)。
 * @param n - 需要转换的数值，可以是 number, bigint 或 string。
 * @param decimals - 精度，例如 18 表示以太坊的 18 位小数。
 * @returns 转换后的 BigInt 值。
 * @example
 * // 将 1.5 Ether 转换为 Wei (18 位小数)
 * unwrapUnits(1.5, 18) // 1500000000000000000n
 * // 将 '0.001' BTC 转换为 Satoshi (8 位小数)
 * unwrapUnits('0.001', 8) // 100000n
 */
export const unwrapUnits = (
  n: number | bigint | string,
  decimals: number | bigint | string,
) => {
  return ethers.parseUnits(n.toString(), decimals)
}

/**
 * 将最小精度单位 (wei) 转换为标准单位 (Ether)。
 * @param n - 需要转换的数值，可以是 number, bigint 或 string。
 * @param decimals - 精度，例如 18 表示以太坊的 18 位小数。
 * @returns 转换后的字符串表示的标准单位数值。
 * @example
 * // 将 1500000000000000000 Wei 转换为 Ether (18 位小数)
 * wrapUnits(1500000000000000000n, 18) // '1.5'
 * // 将 100000 Satoshi 转换为 BTC (8 位小数)
 * wrapUnits(100000n, 8) // '0.001'
 */
export const wrapUnits = (
  n: number | bigint | string,
  decimals: number | bigint | string,
) => {
  return ethers.formatUnits(n, decimals)
}

/**
 * 格式化金额，根据数值大小添加 K, M, B 单位，并控制小数位数。
 * @param amount - 需要格式化的金额，可以是 number, bigint 或 string。
 * @param displayDecimals - 显示的小数位数，默认为 3。
 * @param isKeepEndZero - 是否保留末尾的零，默认为 false。
 * @returns 格式化后的字符串，例如 '1.23K', '4.56M'。
 * @example
 * formatAmount(1234.56, 2) // '1.23K'
 * formatAmount(9876543.21, 1) // '9.9M'
 * formatAmount(123, 0) // '123'
 * formatAmount(123.45, 2, true) // '123.45'
 */
export const formatAmount = (
  amount: number | bigint | string,
  displayDecimals = 3,
  isKeepEndZero = false,
) => {
  const balanceAfter = parseToFloat(amount)

  let fixedNumber = ''
  let unit = ''
  if (balanceAfter < 1000) {
    fixedNumber = balanceAfter.toFixed(displayDecimals)
    unit = ''
  } else if (balanceAfter < 1_000_000) {
    fixedNumber = (balanceAfter / 1000).toFixed(displayDecimals)
    unit = 'K'
  } else if (balanceAfter < 1_000_000_000) {
    fixedNumber = (balanceAfter / 1_000_000).toFixed(displayDecimals)
    unit = 'M'
  } else {
    fixedNumber = (balanceAfter / 1_000_000_000).toFixed(displayDecimals)
    unit = 'B'
  }

  return isKeepEndZero
    ? `${fixedNumber}${unit}`
    : `${parseFloat(fixedNumber)}${unit}`
}

/**
 * 将数值转换为 BigInt 类型。
 * @param n - 需要转换的数值，可以是 number, bigint 或 string。
 * @returns 转换后的 BigInt 值。
 * @example
 * parseToBigInt(123) // 123n
 * parseToBigInt('456') // 456n
 * parseToBigInt(789n) // 789n
 */
export const parseToBigInt = (n: number | bigint | string) => {
  if (typeof n === 'bigint') {
    return n
  }
  return toBigInt(n.toString())
}

/**
 * 将数值转换为整数类型。
 * @param n - 需要转换的数值，可以是 number, bigint 或 string。
 * @returns 转换后的整数值。
 * @example
 * parseToInt(123.45) // 123
 * parseToInt('456.78') // 456
 * parseToInt(789n) // 789
 */
export const parseToInt = (n: number | bigint | string) => {
  return parseInt(n.toString())
}

/**
 * 将数值转换为浮点数类型。
 * @param n - 需要转换的数值，可以是 number, bigint 或 string。
 * @returns 转换后的浮点数值。
 * @example
 * parseToFloat(123) // 123.0
 * parseToFloat('456.78') // 456.78
 * parseToFloat(789n) // 789.0
 */
export const parseToFloat = (n: number | bigint | string) => {
  return parseFloat(n.toString())
}
