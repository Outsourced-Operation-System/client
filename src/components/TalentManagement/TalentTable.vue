<template>
    <div class="table-wrapper">
        <el-table :data="data" v-loading="loading" stripe border height="100%" @sort-change="handleSortChange">
            <el-table-column type="index" label="序号" width="60" />

            <el-table-column prop="nickname" label="达人昵称" min-width="140" />

            <el-table-column prop="type" label="达人类型" width="100">
                <template #default="{ row }">
                    <el-tag :type="getTypeTagType(row.type)" size="small">
                        {{ row.type }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="fansCount" label="粉丝数" width="120" sortable>
                <template #default="{ row }">
                    {{ formatNumber(row.fansCount) }}
                </template>
            </el-table-column>

            <el-table-column prop="pitFee" label="坑位费" width="120" sortable>
                <template #default="{ row }">
                    ¥{{ formatNumber(row.pitFee) }}
                </template>
            </el-table-column>

            <el-table-column prop="commissionRateOnline" label="线上佣金" width="100">
                <template #default="{ row }">
                    {{ row.commissionRateOnline }}%
                </template>
            </el-table-column>

            <el-table-column prop="commissionRateOffline" label="线下佣金" width="100">
                <template #default="{ row }">
                    {{ row.commissionRateOffline }}%
                </template>
            </el-table-column>

            <el-table-column prop="liaison" label="商务负责人" width="120">
                <template #default="{ row }">
                    {{ row.liaison?.realName || row.liaison?.username || '-' }}
                </template>
            </el-table-column>

            <el-table-column prop="cumulativeGmv" label="累计GMV" width="120" sortable>
                <template #default="{ row }">
                    ¥{{ formatNumber(row.cumulativeGmv) }}
                </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)" size="small">
                        {{ row.status }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="createdAt" label="创建时间" width="160">
                <template #default="{ row }">
                    {{ formatDate(row.createdAt) }}
                </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                    <el-button text type="primary" size="small" @click="handleView(row)">
                        查看
                    </el-button>
                    <el-button text type="primary" size="small" @click="handleEdit(row)">
                        编辑
                    </el-button>
                    <el-button text type="danger" size="small" @click="handleDelete(row)">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script setup lang="ts">
import { type Talent } from '@/api/talent';

interface Props {
    data: Talent[];
    loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
    view: [talent: Talent];
    edit: [talent: Talent];
    delete: [talent: Talent];
    sortChange: [sortData: any];
}>();

// 格式化数字
const formatNumber = (num: number) => {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
};

// 格式化日期
const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取类型标签类型
const getTypeTagType = (type: string) => {
    const typeMap: Record<string, any> = {
        '直播': 'primary',
        '短视频': 'warning',
        '图文': 'success'
    };
    return typeMap[type] || 'info';
};

// 获取状态标签类型
const getStatusTagType = (status: string | undefined) => {
    const statusMap: Record<string, any> = {
        '沟通中': '',
        '已合作': 'success',
        '已失效': 'info'
    };
    return statusMap[status || '沟通中'] || '';
};

// 操作处理
const handleView = (row: Talent) => {
    emit('view', row);
};

const handleEdit = (row: Talent) => {
    emit('edit', row);
};

const handleDelete = (row: Talent) => {
    emit('delete', row);
};

const handleSortChange = (sortData: any) => {
    emit('sortChange', sortData);
};
</script>

<style scoped>
.table-wrapper {
    height: 100%;
    /* min-height: 400px; */
}

:deep(.el-table) {
    font-size: 14px;
}

:deep(.el-table__header) {
    font-weight: 600;
}
</style>
