import { encodeBytes32String, decodeBytes32String } from 'ethers'

// 判断字符串是否被 ethers.encodeBytes32String 编码过
function isEncodedString(encodedString: string) {
  // 检查长度
  if (encodedString.length !== 66) {
    return false
  }

  // 检查前缀
  if (!encodedString.startsWith('0x')) {
    return false
  }

  try {
    // 尝试解码
    const decodedString = decodeBytes32String(encodedString)

    // 检查解码后的字符串长度是否小于等于 32 个字符
    if (decodedString.length > 32) {
      return false
    }

    // 检查解码后的字符串是否只包含有效字符
    const validString = encodeBytes32String(decodedString)
    return validString === encodedString
  } catch (error) {
    // 解码失败
    return false
  }
}

// 封装函数：如果被编码过，则解码；否则返回原始字符串
function decodeIfEncoded(inputString: string) {
  if (isEncodedString(inputString)) {
    return decodeBytes32String(inputString)
  } else {
    return inputString
  }
}

export { decodeIfEncoded }
