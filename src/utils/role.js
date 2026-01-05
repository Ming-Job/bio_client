export function getRoleText(role) {
  const roleMap = {
    admin: "管理员",
    user: "普通用户",
  };
  return roleMap[role] || "用户";
}

export function getRoleTagType(role) {
  const roleTagMap = {
    admin: "danger",      // 管理员用红色/危险色
    user: "warning",      // 普通用户用黄色/警告色
  };
  return roleTagMap[role] || "success"; // 默认用绿色
}