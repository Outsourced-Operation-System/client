import { ref, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getExecutionOrders,
  deleteExecutionOrder,
  type ExecutionOrder,
  type ExecutionOrderQueryParams,
} from "@/api/executionOrder";

/**
 * 执行单列表管理
 */
export function useExecutionOrderList() {
  const loading = ref(false);
  const list = ref<ExecutionOrder[]>([]);
  const total = ref(0);

  const queryParams = reactive<ExecutionOrderQueryParams>({
    page: 1,
    pageSize: 20,
    keyword: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  /**
   * 获取列表数据
   */
  const fetchList = async () => {
    loading.value = true;
    try {
      const res = await getExecutionOrders(queryParams);
      list.value = res.list;
      total.value = res.total;
    } catch (error) {
      console.error(error);
      ElMessage.error("获取列表失败");
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重置查询条件
   */
  const resetQuery = () => {
    queryParams.keyword = "";
    queryParams.status = "";
    queryParams.page = 1;
    queryParams.startDate = "";
    queryParams.endDate = "";
    fetchList();
  };

  /**
   * 删除执行单
   */
  const handleDelete = async (row: ExecutionOrder) => {
    try {
      await ElMessageBox.confirm("确认删除该执行单吗？", "提示", {
        type: "warning",
      });

      await deleteExecutionOrder(row.id);
      ElMessage.success("删除成功");
      fetchList();
    } catch (error) {
      if (error !== "cancel") {
        console.error(error);
        ElMessage.error("删除失败");
      }
    }
  };

  return {
    loading,
    list,
    total,
    queryParams,
    fetchList,
    resetQuery,
    handleDelete,
  };
}
