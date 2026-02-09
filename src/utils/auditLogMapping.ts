/**
 * 审计日志字段映射工具
 */

// 对象类型映射
const targetTypeMap: Record<string, string> = {
  Talent: "达人",
  Bundle: "货组",
  ExecutionOrder: "执行单",
  User: "用户",
};

// 操作类型映射
const actionMap: Record<string, string> = {
  Create: "创建",
  Update: "更新",
  Delete: "删除",
};

/**
 * 获取对象类型的中文名称
 */
export function getTargetTypeLabel(targetType: string): string {
  return targetTypeMap[targetType] || targetType;
}

/**
 * 获取操作类型的中文名称
 */
export function getActionLabel(action: string): string {
  return actionMap[action] || action;
}

/**
 * 根据操作类型获取颜色
 */
export function getActionColor(action: string): string {
  const colorMap: Record<string, string> = {
    Create: "success",
    Update: "primary",
    Delete: "danger",
  };
  return colorMap[action] || "info";
}

/**
 * 根据操作类型获取时间轴类型
 */
export function getActionTimelineType(
  action: string,
): "success" | "primary" | "danger" | "info" {
  const typeMap: Record<string, "success" | "primary" | "danger" | "info"> = {
    Create: "success",
    Update: "primary",
    Delete: "danger",
  };
  return typeMap[action] || "info";
}

/**
 * 获取对象类型颜色
 */
export function getTargetTypeColor(targetType: string): string {
  const colorMap: Record<string, string> = {
    Talent: "primary",
    Bundle: "warning",
    ExecutionOrder: "danger",
    User: "success",
  };
  return colorMap[targetType] || "info";
}

/**
 * 获取所有对象类型选项
 */
export function getTargetTypeOptions() {
  return [
    { label: "达人", value: "Talent" },
    { label: "货组", value: "Bundle" },
    { label: "执行单", value: "ExecutionOrder" },
    { label: "用户", value: "User" },
  ];
}
