import { ethers, toBigInt } from 'ethers'

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

export const transformPercentNumber = (value: number, total: number) => {
  const v = (value / total) * 100
  const f = parseFloat(v.toFixed(2))
  return f
}

export const bigTransformPercentNumber = (value: bigint, total: bigint) => {
  let rawPercentageBigInt = (value * 10000n) / total
  let percentageNumber = Number(rawPercentageBigInt) / 100
  return percentageNumber
}

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
 * 转换为最小精度单位
 * @param n 需要转换的数值
 * @param decimals 精度
 */
export const unwrapUnits = (
  n: number | bigint | string,
  decimals: number | bigint | string,
) => {
  return ethers.parseUnits(n.toString(), decimals)
}

/**
 * 转换为Ether单位
 * @param n 需要转换的数值
 * @param decimals 精度
 */
export const wrapUnits = (
  n: number | bigint | string,
  decimals: number | bigint | string,
) => {
  return ethers.formatUnits(n, decimals)
}

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

export const parseToBigInt = (n: number | bigint | string) => {
  if (typeof n === 'bigint') {
    return n
  }
  return toBigInt(n.toString())
}

export const parseToInt = (n: number | bigint | string) => {
  return parseInt(n.toString())
}

export const parseToFloat = (n: number | bigint | string) => {
  return parseFloat(n.toString())
}
