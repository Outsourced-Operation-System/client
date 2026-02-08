<template>
    <div class="influencer-management-container">
        <el-card class="full-height-card">
            <!-- 搜索和操作栏 -->
            <div class="filter-section">
                <el-form :inline="true" :model="queryParams">
                    <el-form-item label="搜索">
                        <el-input v-model="queryParams.keyword" placeholder="搜索达人昵称" clearable style="width: 200px"
                            @keyup.enter="searchTalents">
                            <template #prefix>
                                <el-icon>
                                    <Search />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>

                    <el-form-item label="达人类型">
                        <el-select v-model="queryParams.type" placeholder="全部类型" clearable style="width: 150px">
                            <el-option label="直播" value="直播" />
                            <el-option label="短视频" value="短视频" />
                            <el-option label="图文" value="图文" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="状态">
                        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
                            <el-option label="沟通中" value="沟通中" />
                            <el-option label="已合作" value="已合作" />
                            <el-option label="已失效" value="已失效" />
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="searchTalents">
                            <el-icon>
                                <Search />
                            </el-icon>
                            搜索
                        </el-button>
                        <el-button @click="resetSearch">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                            重置
                        </el-button>
                    </el-form-item>

                    <el-form-item style="margin-left: auto">
                        <el-button type="primary" @click="handleAdd">
                            <el-icon>
                                <Plus />
                            </el-icon>
                            新增达人
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 达人列表 -->
            <div class="table-section">
                <TalentTable :data="tableData" :loading="loading" @view="handleView" @edit="handleEdit"
                    @delete="handleDelete" />

                <!-- 分页 -->
                <div class="pagination-container">
                    <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
                        :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                        @current-change="handlePageChange" @size-change="handleSizeChange" />
                </div>
            </div>
        </el-card>

        <!-- 新增/编辑表单对话框 -->
        <TalentForm :visible="formVisible" :title="formTitle" :data="currentTalent" @close="handleFormClose"
            @submit="handleFormSubmit" />

        <!-- 查看详情对话框 -->
        <el-dialog v-model="detailVisible" title="达人详情" width="600px">
            <el-descriptions v-if="currentTalent" :column="2" border>
                <el-descriptions-item label="达人昵称">
                    {{ currentTalent.nickname }}
                </el-descriptions-item>
                <el-descriptions-item label="达人类型">
                    <el-tag :type="getTypeTagType(currentTalent.type)" size="small">
                        {{ currentTalent.type }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="粉丝数">
                    {{ formatNumber(currentTalent.fansCount) }}
                </el-descriptions-item>
                <el-descriptions-item label="坑位费">
                    ¥{{ formatNumber(currentTalent.pitFee) }}
                </el-descriptions-item>
                <el-descriptions-item label="线上佣金率">
                    {{ currentTalent.commissionRateOnline }}%
                </el-descriptions-item>
                <el-descriptions-item label="线下佣金率">
                    {{ currentTalent.commissionRateOffline }}%
                </el-descriptions-item>
                <el-descriptions-item label="商务负责人">
                    {{ currentTalent.liaison?.realName || currentTalent.liaison?.username || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="累计GMV">
                    ¥{{ formatNumber(currentTalent.cumulativeGmv) }}
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusTagType(currentTalent.status)" size="small">
                        {{ currentTalent.status }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                    {{ formatDate(currentTalent.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="联系方式" :span="2">
                    {{ currentTalent.contactInfo || '-' }}
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import TalentTable from '@/components/TalentManagement/TalentTable.vue';
import TalentForm from '@/components/TalentManagement/TalentForm.vue';
import { useTalent } from '@/composables/useTalent';
import type { Talent } from '@/api/talent';

const {
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
    handleDelete: deleteTalent
} = useTalent();

// 表单相关状态
const formVisible = ref(false);
const formTitle = ref('新增达人');
const currentTalent = ref<Talent | null>(null);
const detailVisible = ref(false);

// 初始化加载
onMounted(() => {
    loadTalents();
});

// 新增达人
const handleAdd = () => {
    currentTalent.value = null;
    formTitle.value = '新增达人';
    formVisible.value = true;
};

// 查看详情
const handleView = (talent: Talent) => {
    currentTalent.value = talent;
    detailVisible.value = true;
};

// 编辑达人
const handleEdit = (talent: Talent) => {
    currentTalent.value = { ...talent };
    formTitle.value = '编辑达人';
    formVisible.value = true;
};

// 删除达人
const handleDelete = async (talent: Talent) => {
    await deleteTalent(talent.id, talent.nickname);
};

// 关闭表单
const handleFormClose = () => {
    formVisible.value = false;
    currentTalent.value = null;
};

// 提交表单
const handleFormSubmit = async (data: Partial<Talent>) => {
    let success = false;

    if (currentTalent.value?.id) {
        // 更新
        success = await handleUpdate(currentTalent.value.id, data);
    } else {
        // 创建
        success = await handleCreate(data);
    }

    if (success) {
        handleFormClose();
    }
};

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
const getStatusTagType = (status: string) => {
    const statusMap: Record<string, any> = {
        '沟通中': '',
        '已合作': 'success',
        '已失效': 'info'
    };
    return statusMap[status] || '';
};
</script>

<style scoped>
.influencer-management-container {
    padding: 24px;
    background: #f5f7fa;
    height: 100%;
    /* min-height: calc(100vh - 60px); */
    overflow: hidden;
}

.full-height-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px;
}

.filter-section {
    margin-bottom: 20px;
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

:deep(.el-form--inline .el-form-item) {
    margin-right: 16px;
    margin-bottom: 0;
}
</style>
