<template>
    <div class="bundle-manager">
        <el-card class="box-card">
            <!-- Filter Area -->
            <div class="filter-area">
                <div class="filter-item">
                    <span class="label">时间筛选：</span>
                    <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
                        end-placeholder="结束日期" size="large" />
                </div>
                <div class="filter-item">
                    <span class="label">关键词：</span>
                    <el-input v-model="keyword" placeholder="请输入关键词" style="width: 200px" size="large" />
                </div>
                <div class="filter-actions">
                    <el-button type="primary" :icon="Search" @click="fetchBundles" size="large">搜索</el-button>
                    <el-button @click="resetFilter" size="large">重置</el-button>
                </div>
            </div>

            <!-- Batch Operations -->
            <div class="batch-operations">
                <el-button type="success" plain size="large">批量导出</el-button>
                <el-button type="danger" plain size="large">批量删除</el-button>
            </div>

            <!-- Bundle List Table -->
            <el-table :data="bundleList" style="width: 100%" border stripe>
                <el-table-column type="selection" width="55" />
                <el-table-column prop="virtual_code" label="虚拟编码" width="150" align="center" />
                <el-table-column prop="name" label="货组名称" min-width="150" align="center" />
                <el-table-column prop="start_date" label="开始日期" width="120" align="center" />
                <el-table-column prop="end_date" label="结束日期" width="120" align="center" />
                <el-table-column prop="total_value" label="总货值" width="100" align="right">
                    <template #default="scope">
                        ¥{{ scope.row.total_value }}
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.status === '有效' ? 'success' : 'info'">
                            {{ scope.row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="250" fixed="right" align="center">
                    <template #default="scope">
                        <el-button link type="primary" size="small">编辑</el-button>
                        <el-button link type="primary" size="small">复制</el-button>
                        <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                        <el-button link type="primary" size="small">导出</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- Pagination -->
            <div class="pagination-container">
                <el-pagination background layout="prev, pager, next" :total="100" />
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const dateRange = ref('')
const keyword = ref('')
const bundleList = ref([])

const fetchBundles = async () => {
    try {
        const filters = {
            keyword: keyword.value,
        }
        const res = await (window as any).electronAPI.getBundles(filters)
        bundleList.value = res
    } catch (e) {
        console.error(e)
    }
}

const resetFilter = () => {
    keyword.value = ''
    dateRange.value = ''
    fetchBundles()
}

const handleDelete = (row: any) => {
    ElMessageBox.confirm('确定要删除该货组吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            const res = await (window as any).electronAPI.deleteBundle(row.id)
            if (res.success) {
                ElMessage.success('删除成功')
                fetchBundles()
            } else {
                ElMessage.error('删除失败')
            }
        } catch (e) {
            ElMessage.error('删除出错')
        }
    })
}

onMounted(fetchBundles)
</script>

<style scoped>
.filter-area {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.filter-item {
    display: flex;
    align-items: center;
}

.filter-item .label {
    margin-right: 10px;
    font-size: 14px;
    color: #606266;
}

.batch-operations {
    margin-bottom: 15px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 模块标题 */
:deep(.el-card__header) span {
    font-size: 20px;
    font-weight: bold;
}

/* 表格内容字号 */
:deep(.el-table) {
    font-size: 14px;
}
</style>
