/**
 * 达人管理逻辑 Composable
 */
import { ref, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getTalents,
  createTalent,
  updateTalent,
  deleteTalent,
  getTalentDetail,
  type Talent,
  type TalentQueryParams,
} from "@/api/talent";

export function useTalent() {
  const loading = ref(false);
  const tableData = ref<Talent[]>([]);
  const total = ref(0);

  // 查询参数
  const queryParams = reactive<TalentQueryParams>({
    page: 1,
    pageSize: 20,
    keyword: "",
    type: "",
    status: "",
  });

  // 加载达人列表
  const loadTalents = async () => {
    loading.value = true;
    try {
      const response = await getTalents(queryParams);
      console.log(response);
      // 兼容 data 和 list 两种响应格式
      tableData.value = response.data || response.list || [];
      total.value = response.total;
    } catch (error) {
      console.error("加载达人列表失败:", error);
      ElMessage.error("加载达人列表失败");
    } finally {
      loading.value = false;
    }
  };

  // 搜索达人
  const searchTalents = () => {
    queryParams.page = 1;
    loadTalents();
  };

  // 重置搜索
  const resetSearch = () => {
    queryParams.keyword = "";
    queryParams.type = "";
    queryParams.status = "";
    queryParams.page = 1;
    loadTalents();
  };

  // 页码变化
  const handlePageChange = (page: number) => {
    queryParams.page = page;
    loadTalents();
  };

  // 页大小变化
  const handleSizeChange = (size: number) => {
    queryParams.pageSize = size;
    queryParams.page = 1;
    loadTalents();
  };

  // 创建达人
  const handleCreate = async (data: Partial<Talent>) => {
    try {
      const response = await createTalent(data);
      if (response.success) {
        ElMessage.success("创建达人成功");
        loadTalents();
        return true;
      }
      return false;
    } catch (error) {
      console.error("创建达人失败:", error);
      ElMessage.error("创建达人失败");
      return false;
    }
  };

  // 更新达人
  const handleUpdate = async (id: number, data: Partial<Talent>) => {
    try {
      const response = await updateTalent(id, data);
      if (response.success) {
        ElMessage.success("更新达人成功");
        loadTalents();
        return true;
      }
      return false;
    } catch (error) {
      console.error("更新达人失败:", error);
      ElMessage.error("更新达人失败");
      return false;
    }
  };

  // 删除达人
  const handleDelete = async (id: number, name: string) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除达人"${name}"吗？此操作不可恢复。`,
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        },
      );

      await deleteTalent(id);
      ElMessage.success("删除达人成功");
      loadTalents();
      return true;
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除达人失败:", error);
        ElMessage.error("删除达人失败");
      }
      return false;
    }
  };

  // 获取达人详情
  const getTalentInfo = async (id: number) => {
    try {
      return await getTalentDetail(id);
    } catch (error) {
      console.error("获取达人详情失败:", error);
      ElMessage.error("获取达人详情失败");
      return null;
    }
  };

  return {
    loading,
    tableData,
    total,
    queryParams,
    loadTalents,
    searchTalents,
    resetSearch,
    handlePageChange,
    handleSizeChange,
    handleCreate,
    handleUpdate,
    handleDelete,
    getTalentInfo,
  };
}
