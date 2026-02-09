<template>
    <el-dialog v-model="visible" title="审计日志" width="80%" :close-on-click-modal="false" @close="handleClose">
        <!-- 筛选器 -->
        <el-form :inline="true" class="filter-form">
            <el-form-item label="对象类型">
                <el-select v-model="filters.targetType" placeholder="请选择对象类型" clearable style="width: 180px;"
                    @clear="handleSearch" @change="handleSearch">
                    <el-option v-for="option in targetTypeOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="对象ID">
                <el-input v-model="filters.targetID" placeholder="输入对象ID" clearable style="width: 180px;"
                    @clear="handleSearch" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
                <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
            </el-form-item>
        </el-form>

        <!-- 表格 -->
        <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%;" max-height="500">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="user.username" label="操作人" width="120">
                <template #default="{ row }">
                    {{ row.user?.username || '-' }}
                </template>
            </el-table-column>
            <el-table-column prop="action" label="操作" width="100">
                <template #default="{ row }">
                    <el-tag :type="getActionColor(row.action)" size="small">
                        {{ getActionLabel(row.action) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="targetType" label="对象类型" width="140">
                <template #default="{ row }">
                    <el-link :type="getTargetTypeColor(row.targetType)" @click="handleFilterByType(row.targetType)"
                        :underline="false" style="font-weight: 500;">
                        {{ getTargetTypeLabel(row.targetType) }}
                    </el-link>
                </template>
            </el-table-column>
            <el-table-column prop="targetId" label="对象ID" width="120">
                <template #default="{ row }">
                    <el-link type="primary" @click="handleViewTarget(row.targetType, row.targetId)">
                        {{ row.targetId }}
                    </el-link>
                </template>
            </el-table-column>
            <el-table-column prop="details" label="详情" min-width="200" show-overflow-tooltip />
            <el-table-column prop="ipAddress" label="IP地址" width="140" />
            <el-table-column prop="createdAt" label="操作时间" width="180">
                <template #default="{ row }">
                    {{ formatDate(row.createdAt) }}
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
            <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
                :page-sizes="[10, 20, 50, 100]" :total="pagination.total"
                layout="total, sizes, prev, pager, next, jumper" @size-change="handleSearch"
                @current-change="handleSearch" />
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, RefreshLeft } from '@element-plus/icons-vue';
import { workbenchApi, type AuditLog } from '@/api/workbench';
import {
    getActionLabel,
    getTargetTypeLabel,
    getActionColor,
    getTargetTypeColor,
    getTargetTypeOptions
} from '@/utils/auditLogMapping';

interface Props {
    modelValue: boolean;
    initialTargetType?: string;
    initialTargetId?: string;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    initialTargetType: '',
    initialTargetId: '',
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const visible = ref(props.modelValue);
const loading = ref(false);
const tableData = ref<AuditLog[]>([]);
const targetTypeOptions = getTargetTypeOptions();

const filters = reactive({
    targetType: props.initialTargetType || '',
    targetID: props.initialTargetId || '',
});

const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
});

// 监听modelValue变化
watch(() => props.modelValue, (val) => {
    visible.value = val;
    if (val) {
        // 在弹窗打开时应用初始筛选条件
        filters.targetType = props.initialTargetType || '';
        filters.targetID = props.initialTargetId || '';
        pagination.page = 1;
        loadData();
    }
});

// 监听visible变化
watch(visible, (val) => {
    emit('update:modelValue', val);
});

// 加载数据
const loadData = async () => {
    loading.value = true;
    try {
        const res = await workbenchApi.getAuditLogs({
            targetType: filters.targetType || undefined,
            targetID: filters.targetID || undefined,
            page: pagination.page,
            pageSize: pagination.pageSize,
        });
        tableData.value = res.data;
        pagination.total = res.total;
    } catch (error) {
        console.error('加载审计日志失败:', error);
        ElMessage.error('加载审计日志失败');
    } finally {
        loading.value = false;
    }
};

// 查询
const handleSearch = () => {
    pagination.page = 1;
    loadData();
};

// 重置
const handleReset = () => {
    filters.targetType = '';
    filters.targetID = '';
    pagination.page = 1;
    loadData();
};

// 查看目标对象的所有操作记录
const handleViewTarget = (targetType: string, targetId: string) => {
    filters.targetType = targetType;
    filters.targetID = targetId;
    handleSearch();
};

// 点击对象类型进行筛选
const handleFilterByType = (targetType: string) => {
    filters.targetType = targetType;
    filters.targetID = ''; // 清空对象ID筛选
    handleSearch();
};

// 关闭弹窗
const handleClose = () => {
    visible.value = false;
};

// 格式化日期
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};
</script>

<style scoped>
.filter-form {
    margin-bottom: 16px;
}

.pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-link) {
    cursor: pointer;
}

:deep(.el-link:hover) {
    opacity: 0.8;
}
</style>
