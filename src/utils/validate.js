/**
 * 验证用户名
 */
export function validateUsername(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3) {
    callback(new Error('用户名长度不能少于3个字符'))
  } else if (value.length > 20) {
    callback(new Error('用户名长度不能超过20个字符'))
  } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线'))
  } else {
    callback()
  }
}

/**
 * 验证密码
 */
export function validatePassword(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6个字符'))
  } else if (value.length > 20) {
    callback(new Error('密码长度不能超过20个字符'))
  } else {
    callback()
  }
}

/**
 * 验证邮箱
 */
export function validateEmail(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入邮箱'))
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

/**
 * 验证手机号
 */
export function validatePhone(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号格式'))
  } else {
    callback()
  }
}

/**
 * 验证确认密码
 */
export function validateConfirmPassword(rule, value, callback, source) {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== source.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}