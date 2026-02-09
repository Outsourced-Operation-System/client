<template>
    <div class="execution-order-management">
        <el-card class="full-height-card">
            <!-- 筛选区域 -->
            <div class="filter-section">
                <el-input v-model="queryParams.keyword" placeholder="搜索单号/名称" style="width: 200px" clearable
                    @keyup.enter="handleSearch" size="large" />
                <el-select v-model="queryParams.status" placeholder="状态" clearable size="large"
                    style="width: 150px; margin-left: 10px">
                    <el-option v-for="(val, key) in ExecutionOrderStatus" :key="key" :label="val" :value="val" />
                </el-select>
                <el-button type="primary" size="large" style="margin-left: 10px" @click="handleSearch">
                    搜索
                </el-button>
                <el-button @click="resetQuery" size="large">重置</el-button>
                <el-button type="primary" style="margin-left: auto" @click="handleAdd" size="large">
                    新建执行单
                </el-button>
            </div>

            <!-- 表格区域 -->
            <ExecutionOrderTable v-model:page="queryParams.page" v-model:pageSize="queryParams.pageSize"
                :loading="loading" :data="list" :total="total" @pageChange="handleSearch" @detail="handleDetail"
                @edit="handleEdit" @delete="handleDelete" />
        </el-card>

        <!-- Dialogs -->
        <ExecutionOrderDialog ref="dialogRef" @success="handleSearch" />

        <el-drawer v-model="drawerVisible" title="执行单详情" size="60%">
            <ExecutionOrderDetail :id="currentDetailId" />
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();
import {
    getExecutionOrders,
    deleteExecutionOrder,
    ExecutionOrderStatus,
    type ExecutionOrder,
    type ExecutionOrderQueryParams
} from '@/api/executionOrder';
import ExecutionOrderDialog from '@/components/ExecutionOrder/ExecutionOrderDialog.vue';
import ExecutionOrderDetail from '@/components/ExecutionOrder/ExecutionOrderDetail.vue';
import ExecutionOrderTable from '@/components/ExecutionOrder/ExecutionOrderTable.vue';

const loading = ref(false);
const list = ref<ExecutionOrder[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | null>(null);

const queryParams = reactive<ExecutionOrderQueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
    status: '',
    startDate: '',
    endDate: ''
});

const dialogRef = ref<InstanceType<typeof ExecutionOrderDialog>>();
const drawerVisible = ref(false);
const currentDetailId = ref<number | null>(null);

const handleSearch = async () => {
    loading.value = true;
    try {
        if (dateRange.value) {
            queryParams.startDate = dateRange.value[0];
            queryParams.endDate = dateRange.value[1];
        } else {
            delete queryParams.startDate;
            delete queryParams.endDate;
        }

        const res = await getExecutionOrders(queryParams);
        list.value = res.list;
        total.value = res.total;
    } catch (error) {
        console.error(error);
        ElMessage.error('获取列表失败');
    } finally {
        loading.value = false;
    }
};

const resetQuery = () => {
    queryParams.keyword = '';
    queryParams.status = '';
    queryParams.page = 1;
    dateRange.value = null;
    handleSearch();
};

const handleAdd = (prefilledTalentId?: number, prefilledTalentName?: string) => {
    if (dialogRef.value) {
        dialogRef.value.init(undefined, prefilledTalentId, prefilledTalentName);
    }
};

const handleEdit = (row: ExecutionOrder) => {
    dialogRef.value?.init(row);
};

const handleDetail = (row: ExecutionOrder) => {
    currentDetailId.value = row.id;
    drawerVisible.value = true;
};

const handleDelete = (row: ExecutionOrder) => {
    ElMessageBox.confirm('确认删除该执行单吗？', '提示', {
        type: 'warning'
    }).then(async () => {
        try {
            await deleteExecutionOrder(row.id);
            ElMessage.success('删除成功');
            handleSearch();
        } catch (error) {
            console.error(error);
            ElMessage.error('删除失败');
        }
    });
};

// 处理从达人管理页面跳转过来的情况
const handleRouteQuery = async () => {
    if (route.query.action === 'create' && route.query.talentId) {
        const talentId = parseInt(route.query.talentId as string);
        const talentName = route.query.talentName as string;

        // 清除路由参数，避免重复触发
        await router.replace({
            name: 'ExecutionOrderManagement',
            query: {}
        });

        // 使用 nextTick 确保组件已完全渲染，并延迟足够时间确保 dialogRef 已准备好
        await nextTick();
        setTimeout(() => {
            handleAdd(talentId, talentName);
        }, 500);
    }
};

// 监听路由变化
watch(
    () => route.query,
    () => {
        handleRouteQuery();
    },
    { immediate: true }
);

onMounted(() => {
    handleSearch();
});
</script>

<style scoped>
.execution-order-management {
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
}

.full-height-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.full-height-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.filter-section {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    flex-shrink: 0;
}

.table-section {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    flex-shrink: 0;
}
</style>
