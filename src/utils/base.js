/**
 * 是否存在值
 * @template T
 * @param {T} value
 * @returns {value is NonNullable<T>}
 */
export const isPresent = (value) => typeof value !== 'undefined' && value !== null

/**
 * @template T
 * @param {T} value
 * @param {NonNullable<T>} defaultValue
 */
export const getIfPresent = (value, defaultValue) => {
  return isPresent(value) ? value : defaultValue
}

/**
 * @typedef {{[p:string|number|symbol]:never}} EmptyObject
 */
/**
 * @template T
 * @param {T} value
 * @returns {value is Exclude<NonNullable<T>, EmptyObject|[]|''>}
 */
const isNotBlank = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0
  } else if (Object.prototype.toString.call(value) === '[object Object]') {
    return Object.keys(value).length > 0
  } else {
    return isPresent(value) && value !== ''
  }
}

/**
 * @template T
 * @param {T} value 
 * @param {Exclude<NonNullable<T>, EmptyObject|[]|''>} [defaultValue]
 */
export const getIfNotBlank = (value, defaultValue) => {
  return isNotBlank(value) ? value : defaultValue
}
