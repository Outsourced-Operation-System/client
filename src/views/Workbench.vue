<template>
    <div class="workbench-container">
        <!-- 页面标题 -->
        <div class="page-header" style="display: flex; align-items: center; justify-content: space-between;">
            <div>
                <h2 class="page-title">工作台</h2>
                <p class="page-desc">欢迎回来，这里是您的工作概览</p>
            </div>
            <el-button type="primary" size="large" :icon="Refresh" @click="handleRefresh" :loading="loading"
                style="margin-left: 16px; min-width: 88px;">
                刷新
            </el-button>
        </div>

        <!-- 统计卡片 -->
        <el-row :gutter="24" class="stat-cards" v-loading="loading">
            <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.label">
                <StatCard :label="card.label" :value="card.value" :icon="card.icon" :color="card.color"
                    :trend="card.trend" />
            </el-col>
        </el-row>

        <!-- 快捷操作 -->
        <div class="section">
            <h3 class="section-title">快捷操作</h3>
            <el-row :gutter="16">
                <el-col :xs="12" :sm="6" v-for="action in quickActions" :key="action.label">
                    <QuickAction :label="action.label" :icon="action.icon" @click="handleQuickAction(action.route)" />
                </el-col>
            </el-row>
        </div>

        <!-- 数据概览 -->
        <div class="section">
            <h3 class="section-title">数据概览</h3>
            <el-row :gutter="24">
                <el-col :xs="24" :lg="16" class="chart-col">
                    <GMVTrendChart />
                </el-col>
                <el-col :xs="24" :lg="8" class="chart-col">
                    <InfluencerDistributionChart />
                </el-col>
            </el-row>
        </div>

        <!-- 待办事项 -->
        <div class="section">
            <el-row :gutter="16">
                <el-col :xs="24" :sm="12">
                    <el-card>
                        <template #header>
                            <h3 class="card-title">今日待办</h3>
                        </template>
                        <el-empty description="暂无待处理执行单" />
                    </el-card>
                </el-col>
                <el-col :xs="24" :sm="12">
                    <el-card>
                        <template #header>
                            <h3 class="card-title">系统提醒</h3>
                        </template>
                        <el-empty description="暂无库存预警" />
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 最近活动 -->
        <div class="section">
            <el-card>
                <template #header>
                    <div class="card-header">
                        <h3 class="card-title">最近活动</h3>
                        <el-button text type="primary" @click="showAllLogs">查看全部</el-button>
                    </div>
                </template>
                <div v-loading="activitiesLoading">
                    <el-empty v-if="recentActivities.length === 0" description="无最近活动" />
                    <el-timeline v-else>
                        <el-timeline-item v-for="activity in recentActivities" :key="activity.id"
                            :timestamp="formatActivityTime(activity.createdAt)"
                            :type="getActionTimelineType(activity.action)">
                            <div class="activity-item">
                                <span class="activity-user">{{ activity.user?.username || '未知用户' }}</span>
                                <span class="activity-action">{{ getActionLabel(activity.action) }}</span>
                                <span class="activity-target">{{ getTargetTypeLabel(activity.targetType) }}</span>
                                <el-link type="primary"
                                    @click="handleViewTargetLogs(activity.targetType, activity.targetId)"
                                    style="margin: 0 4px;">
                                    #{{ activity.targetId }}
                                </el-link>
                                <div class="activity-details">{{ activity.details }}</div>
                            </div>
                        </el-timeline-item>
                    </el-timeline>
                </div>
            </el-card>
        </div>

        <!-- 审计日志弹窗 -->
        <AuditLogsDialog v-model="showLogsDialog" :initial-target-type="filterTargetType"
            :initial-target-id="filterTargetId" />
    </div>
</template>

<script setup lang="ts">
import { ref, onActivated } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import StatCard from '@/components/Workbench/StatCard.vue';
import QuickAction from '@/components/Workbench/QuickAction.vue';
import GMVTrendChart from '@/components/Workbench/GMVTrendChart.vue';
import InfluencerDistributionChart from '@/components/Workbench/TalentDistributionChart.vue';
import AuditLogsDialog from '@/components/Workbench/AuditLogsDialog.vue';
import { useWorkbench } from '@/composables/useWorkbench';
import { getActionLabel, getTargetTypeLabel, getActionTimelineType } from '@/utils/auditLogMapping';

const router = useRouter();
const { loading, statCards, loadStats, recentActivities, activitiesLoading, loadRecentActivities } = useWorkbench();

onActivated(() => {
    loadStats();
    loadRecentActivities();
});

// 快捷操作
const quickActions = ref([
    { label: '创建货组', icon: 'Plus', route: '/generator' },
    { label: '货组管理', icon: 'Collection', route: '/manager' },
    { label: '创建执行单', icon: 'DocumentAdd', route: '/execution-orders' },
    { label: '达人管理', icon: 'User', route: '/influencers' },
]);

// 审计日志弹窗
const showLogsDialog = ref(false);
const filterTargetType = ref('');
const filterTargetId = ref('');

// 查看全部日志
const showAllLogs = () => {
    filterTargetType.value = '';
    filterTargetId.value = '';
    showLogsDialog.value = true;
};

// 查看特定对象的操作记录
const handleViewTargetLogs = (targetType: string, targetId: string) => {
    filterTargetType.value = targetType;
    filterTargetId.value = targetId;
    showLogsDialog.value = true;
};

// 格式化活动时间
const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
};

// 处理快捷操作
const handleQuickAction = (route: string) => {
    router.push(route);
};

// 刷新按钮处理
const handleRefresh = () => {
    loadStats();
    loadRecentActivities();
};
</script>

<style scoped>
.workbench-container {
    padding: 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 60px);
    overflow-y: auto;
}

.page-header {
    margin-bottom: 24px;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.page-desc {
    color: #666;
    font-size: 14px;
}

.stat-cards {
    margin-bottom: 24px;
}

.section {
    margin-bottom: 24px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

:deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #e8e8e8;
}

:deep(.el-card__body) {
    padding: 20px;
}

:deep(.el-timeline) {
    padding-left: 0;
}

.activity-item {
    line-height: 1.6;
}

.activity-user {
    font-weight: 600;
    color: #409eff;
    margin-right: 4px;
}

.activity-action {
    color: #333;
    margin-right: 4px;
}

.activity-target {
    color: #666;
    margin-right: 4px;
}

.activity-details {
    color: #999;
    font-size: 13px;
    margin-top: 4px;
}

.chart-col {
    margin-bottom: 24px;
}

@media (min-width: 1200px) {
    .chart-col {
        margin-bottom: 0;
    }
}
</style>
