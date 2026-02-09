<template>
    <el-dialog :title="form.id ? '编辑执行单' : '新建执行单'" v-model="visible" width="800px" @close="handleClose"
        :close-on-click-modal="false">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <!-- 基础信息 -->
            <div class="section-title">基础信息</div>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="执行单名称" prop="name">
                        <el-input v-model="form.name" placeholder="请输入执行单名称" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="关联达人" prop="talentId">
                        <el-input :model-value="selectedTalentName" readonly placeholder="请选择达人"
                            @click="openTalentSelector" clearable @clear="clearTalent" style="cursor: pointer;" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="合作类型" prop="type">
                        <el-select v-model="form.type" placeholder="请选择">
                            <el-option label="直播" value="直播" />
                            <el-option label="短视频" value="短视频" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="预计排期" prop="date">
                        <el-date-picker v-model="form.date" type="date" placeholder="选择日期" style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="坑位费" prop="pitFee">
                        <el-input-number v-model="form.pitFee" :min="0" :precision="2" :step="100"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="佣金率(%)" prop="commissionRate">
                        <el-input-number v-model="form.commissionRate" :min="0" :max="100" :precision="2" :step="1"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="状态" prop="status" v-if="form.id">
                <el-select v-model="form.status">
                    <el-option v-for="(val, key) in ExecutionOrderStatus" :key="key" :label="val" :value="val" />
                </el-select>
            </el-form-item>


            <!-- 货品规划 -->
            <div class="section-header">
                <div class="section-title" style="margin:0">货品规划</div>
                <el-button type="primary" size="mid" @click="openBundleSelector">
                    添加货组
                </el-button>
            </div>

            <el-table :data="form.bundles" border style="margin-top: 10px" row-key="tempKey">
                <el-table-column label="排序" width="80">
                    <template #default="{ row }">
                        <el-input-number v-model="row.sortOrder" size="small" :min="1" controls-position="right"
                            style="width: 100%" />
                    </template>
                </el-table-column>
                <el-table-column label="货组名称" min-width="150">
                    <template #default="{ row }">
                        {{ row.bundleName || getBundleName(row.bundleId) }}
                    </template>
                </el-table-column>
                <el-table-column label="价格机制/备注" min-width="200">
                    <template #default="{ row }">
                        <el-input v-model="row.mechanism" size="small" placeholder="价格机制/买赠等" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                    <template #default="{ $index }">
                        <el-button type="danger" link size="small" @click="removeBundle($index)">移除</el-button>
                    </template>
                </el-table-column>
            </el-table>

        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">
                    确定
                </el-button>
            </span>
        </template>

        <!-- 达人选择弹窗 -->
        <el-dialog title="选择达人" v-model="talentSelectorVisible" max-width="70%" append-to-body>
            <div class="search-bar">
                <el-input v-model="talentKeyword" placeholder="搜索达人昵称" @keyup.enter="searchTalentsForDialog" clearable
                    @clear="searchTalentsForDialog">
                    <template #append><el-button @click="searchTalentsForDialog">搜索</el-button></template>
                </el-input>
            </div>
            <el-table :data="talentList" v-loading="talentDialogLoading" height="400" @row-click="handleTalentRowClick"
                :row-class-name="getTalentRowClass">
                <el-table-column prop="nickname" label="达人昵称" min-width="150" show-overflow-tooltip />
                <el-table-column prop="type" label="类型" width="100" />
                <el-table-column prop="fansCount" label="粉丝数" width="120">
                    <template #default="{ row }">
                        {{ formatNumber(row.fansCount) }}
                    </template>
                </el-table-column>
                <el-table-column prop="cumulativeGmv" label="累计GMV" width="150">
                    <template #default="{ row }">
                        {{ formatCurrency(row.cumulativeGmv) }}
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link size="small" @click.stop="selectTalent(row)"
                            :disabled="row.status === '已失效'">选择</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination-container">
                <el-pagination small layout="prev, pager, next" :total="talentTotal" :page-size="10"
                    v-model:current-page="talentPage" @current-change="searchTalentsForDialog" />
            </div>
            <template #footer>
                <el-button @click="talentSelectorVisible = false">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 内部货组选择弹窗 -->
        <el-dialog title="选择货组" v-model="bundleSelectorVisible" width="700px" append-to-body>
            <div class="search-bar">
                <el-input v-model="bundleKeyword" placeholder="搜索货组名称/编码" @keyup.enter="searchBundles" clearable
                    @clear="searchBundles">
                    <template #append><el-button @click="searchBundles">搜索</el-button></template>
                </el-input>
            </div>
            <el-table :data="bundleList" v-loading="bundleLoading" @selection-change="handleBundleSelectionChange"
                height="400" ref="bundleTableRef">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="virtual_code" label="编码" width="120" />
                <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
                <el-table-column prop="total_value" label="总货值" width="120" align="right">
                    <template #default="{ row }">
                        {{ formatCurrency(row.total_value) }}
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getBundleStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link size="small"
                            @click.stop="viewBundleDetail(row.id)">详情</el-button>
                        <el-button type="success" link size="small"
                            @click.stop="handleBundleRowClick(row)">选择</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination-container">
                <el-pagination small layout="prev, pager, next" :total="bundleTotal" :page-size="10"
                    v-model:current-page="bundlePage" @current-change="searchBundles" />
            </div>
            <template #footer>
                <el-button @click="bundleSelectorVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmBundleSelection">确定选择</el-button>
            </template>
        </el-dialog>

        <!-- 货组详情弹窗 -->
        <el-dialog title="货组详情" v-model="bundleDetailVisible" width="900px" append-to-body>
            <div v-loading="bundleDetailLoading">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="货组编码">
                        {{ currentBundleDetail?.virtual_code }}
                    </el-descriptions-item>
                    <el-descriptions-item label="货组名称">
                        {{ currentBundleDetail?.name }}
                    </el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getBundleStatusType(currentBundleDetail?.status || '')" size="small">
                            {{ currentBundleDetail?.status }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="类型">
                        {{ currentBundleDetail?.product_type }}
                    </el-descriptions-item>
                    <el-descriptions-item label="总货值">
                        {{ formatCurrency(currentBundleDetail?.total_value ?? 0) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="正装总值">
                        {{ formatCurrency(currentBundleDetail?.main_value ?? 0) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="赠品总值">
                        {{ formatCurrency(currentBundleDetail?.gift_value ?? 0) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="创建日期">
                        {{ formatDateTime(currentBundleDetail?.create_date) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="结束日期">
                        {{ formatDateTime(currentBundleDetail?.end_date) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="使用类型">
                        {{ currentBundleDetail?.usage_type }}
                    </el-descriptions-item>
                    <el-descriptions-item label="分类">
                        {{ currentBundleDetail?.category }}
                    </el-descriptions-item>
                    <el-descriptions-item label="香型">
                        {{ currentBundleDetail?.fragrance }}
                    </el-descriptions-item>
                    <el-descriptions-item label="主打SKU">
                        {{ currentBundleDetail?.by_sku }}
                    </el-descriptions-item>
                    <el-descriptions-item label="最后更新">
                        {{ formatDateTime(currentBundleDetail?.last_update_time) }}
                    </el-descriptions-item>
                </el-descriptions>

                <div v-if="currentBundleDetail?.items && currentBundleDetail.items.length > 0"
                    style="margin-top: 20px;">
                    <div style="font-weight: bold; margin-bottom: 10px;">商品明细：</div>
                    <el-table :data="currentBundleDetail.items" border>
                        <el-table-column prop="sku" label="SKU" width="120" />
                        <el-table-column prop="article_code" label="货号" width="100" />
                        <el-table-column prop="tu" label="TU" width="80" />
                        <el-table-column prop="product_name_cn" label="中文名" min-width="150" show-overflow-tooltip />
                        <el-table-column prop="type" label="类型" width="80">
                            <template #default="{ row }">
                                <el-tag :type="row.type === 'main' ? 'success' : 'info'" size="small">
                                    {{ row.type === 'main' ? '正装' : '赠品' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="quantity" label="数量" width="80" align="center" />
                        <el-table-column prop="cn_current_price" label="单价" width="100" align="right">
                            <template #default="{ row }">
                                {{ formatCurrency(row.cn_current_price ?? 0) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="小计" width="100" align="right">
                            <template #default="{ row }">
                                {{ formatCurrency((row.cn_current_price ?? 0) * (row.quantity ?? 0)) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="qty_available" label="库存" width="80" align="center" />
                    </el-table>
                </div>
            </div>
            <template #footer>
                <el-button @click="bundleDetailVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import {
    createExecutionOrder,
    updateExecutionOrder,
    getExecutionOrder,
    type ExecutionOrder,
    ExecutionOrderStatus
} from '@/api/executionOrder';
import { getTalents, type Talent } from '@/api/talent';
import { bundleApi, type BundleRecord } from '@/api/bundle';

const props = defineProps<{
}>();

const emit = defineEmits(['success', 'update:modelValue']);

const visible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
    id: 0,
    name: '',
    type: '直播',
    date: '',
    talentId: undefined as number | undefined,
    pitFee: 0,
    commissionRate: 0,
    status: '沟通中',
    bundles: [] as {
        bundleId: number;
        sortOrder: number;
        mechanism: string;
        bundleName?: string; // Cache for display
        tempKey?: number;
    }[],
});

const selectedTalentName = ref<string>('');

const rules = {
    name: [{ required: true, message: '请输入执行单名称', trigger: 'blur' }],
    talentId: [{ required: true, message: '请选择关联达人', trigger: 'change' }],
    type: [{ required: true, message: '请选择合作类型', trigger: 'change' }],
    date: [{ required: true, message: '请选择预计排期', trigger: 'change' }],
    pitFee: [{ required: true, message: '请输入坑位费', trigger: 'blur' }],
    commissionRate: [{ required: true, message: '请输入佣金率', trigger: 'blur' }],
};

// 达人选择弹窗相关
const talentSelectorVisible = ref(false);
const talentList = ref<Talent[]>([]);
const talentDialogLoading = ref(false);
const talentKeyword = ref('');
const talentTotal = ref(0);
const talentPage = ref(1);

const openTalentSelector = () => {
    talentSelectorVisible.value = true;
    searchTalentsForDialog();
};

const searchTalentsForDialog = async () => {
    talentDialogLoading.value = true;
    try {
        const res = await getTalents({
            keyword: talentKeyword.value,
            page: talentPage.value,
            pageSize: 10
        });
        console.log("达人搜索", res);
        if (res.data) {
            talentList.value = res.data;
            talentTotal.value = res.total;
        }
    } catch (e) {
        console.error(e);
    } finally {
        talentDialogLoading.value = false;
    }
};

const selectTalent = (talent: Talent) => {
    if (talent.status === '已失效') {
        ElMessage.warning('该达人已失效');
        return;
    }

    form.talentId = talent.id;
    selectedTalentName.value = talent.nickname;

    // Auto fill cooperation type based on talent type
    if (talent.type) {
        if (talent.type === '直播') {
            form.type = '直播';
        } else if (talent.type === '短视频' || talent.type === '图文') {
            form.type = '短视频';
        }
    }
    if (talent.pitFee !== undefined && talent.pitFee !== null) {
        form.pitFee = talent.pitFee;
    }
    if (talent.commissionRateOnline !== undefined && talent.commissionRateOnline !== null) {
        form.commissionRate = talent.commissionRateOnline;
    }

    talentSelectorVisible.value = false;
    ElMessage.success('已选择达人：' + talent.nickname);
};

const clearTalent = () => {
    form.talentId = undefined;
    selectedTalentName.value = '';
};

const handleTalentRowClick = (row: Talent) => {
    if (row.status !== '已失效') {
        selectTalent(row);
    }
};

const getTalentRowClass = ({ row }: { row: Talent }) => {
    return row.status === '已失效' ? 'disabled-row' : 'clickable-row';
};

const getStatusType = (status: string) => {
    const statusMap: Record<string, any> = {
        '沟通中': '',
        '已合作': 'success',
        '已失效': 'info'
    };
    return statusMap[status] || '';
};

const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w';
    }
    return num.toString();
};

const formatCurrency = (amount: number) => {
    if (!amount) return '¥0';
    if (amount >= 10000) {
        return '¥' + (amount / 10000).toFixed(2) + 'w';
    }
    return '¥' + amount.toFixed(2);
};

// 货组选择相关
const bundleSelectorVisible = ref(false);
const bundleList = ref<BundleRecord[]>([]);
const bundleLoading = ref(false);
const bundleKeyword = ref('');
const bundleTotal = ref(0);
const bundlePage = ref(1);
const selectedBundles = ref<BundleRecord[]>([]);
const bundleTableRef = ref();
const bundleDetailVisible = ref(false);
const bundleDetailLoading = ref(false);
const currentBundleDetail = ref<BundleRecord | null>(null);

const openBundleSelector = () => {
    bundleSelectorVisible.value = true;
    selectedBundles.value = [];
    searchBundles();
};

const searchBundles = async () => {
    bundleLoading.value = true;
    try {
        const res = await bundleApi.getBundles({ keyword: bundleKeyword.value, page: bundlePage.value, pageSize: 10 });
        if (res.data) {
            bundleList.value = res.data;
            bundleTotal.value = res.total;
        }
    } catch (e) { console.error(e); }
    finally {
        bundleLoading.value = false;
    }
};

const handleBundleSelectionChange = (val: BundleRecord[]) => {
    selectedBundles.value = val;
};

const handleBundleRowClick = (row: BundleRecord) => {
    if (bundleTableRef.value) {
        bundleTableRef.value.toggleRowSelection(row);
    }
};

const viewBundleDetail = async (id: number) => {
    bundleDetailVisible.value = true;
    bundleDetailLoading.value = true;
    try {
        const res = await bundleApi.getBundleDetail(id);
        if (res.success && res.data) {
            currentBundleDetail.value = res.data;
        }
    } catch (e) {
        console.error(e);
        ElMessage.error('获取货组详情失败');
    } finally {
        bundleDetailLoading.value = false;
    }
};

const getBundleStatusType = (status: string) => {
    const statusMap: Record<string, any> = {
        '正常': 'success',
        '已失效': 'info',
        '已禁用': 'danger'
    };
    return statusMap[status] || '';
};

const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const confirmBundleSelection = () => {
    selectedBundles.value.forEach(b => {
        // Avoid duplicates
        if (!form.bundles.find(item => item.bundleId === b.id)) {
            form.bundles.push({
                bundleId: b.id,
                sortOrder: form.bundles.length + 1,
                mechanism: '',
                bundleName: b.name,
                tempKey: Date.now() + Math.random()
            });
        }
    });
    bundleSelectorVisible.value = false;
};

const removeBundle = (index: number) => {
    form.bundles.splice(index, 1);
};

const getBundleName = (id: number) => {
    // Fallback if needed, though we try to set it on add
    return `Bundle #${id}`;
};

// 提交逻辑
const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (valid) {
            if (form.bundles.length === 0) {
                ElMessage.warning('请至少添加一个货组');
                return;
            }

            submitting.value = true;
            try {
                const payload = {
                    ...form,
                    talentId: form.talentId as number,
                    date: new Date(form.date).toISOString()
                };

                if (form.id) {
                    await updateExecutionOrder(form.id, payload);
                    ElMessage.success('更新成功');
                } else {
                    await createExecutionOrder(payload);
                    ElMessage.success('创建成功');
                }
                visible.value = false;
                emit('success');
            } catch (error) {
                console.error(error);
                ElMessage.error('操作失败');
            } finally {
                submitting.value = false;
            }
        }
    });
};

const handleClose = () => {
    formRef.value?.resetFields();
    form.bundles = [];
    form.id = 0;
    selectedTalentName.value = '';
    talentKeyword.value = '';
    talentPage.value = 1;
    bundleDetailVisible.value = false;
    currentBundleDetail.value = null;
};

// Initialize helper
const init = async (row?: ExecutionOrder, prefilledTalentId?: number, prefilledTalentName?: string) => {
    visible.value = true;

    if (row && row.id) {
        // Fetch full details to get Bundles
        try {
            const res = await getExecutionOrder(row.id);
            if (res.success && res.data) {
                const detailedOrder = res.data;
                form.id = detailedOrder.id;
                form.name = detailedOrder.name;
                form.type = detailedOrder.type;
                form.date = detailedOrder.date;
                form.talentId = detailedOrder.talentId;
                form.pitFee = detailedOrder.pitFee;
                form.commissionRate = detailedOrder.commissionRate;
                form.status = detailedOrder.status;
                form.bundles = (detailedOrder.bundles || []).map(b => ({
                    bundleId: b.bundleId,
                    sortOrder: b.sortOrder,
                    mechanism: b.mechanism || '',
                    bundleName: b.bundle?.name || '',
                    tempKey: Date.now() + Math.random()
                }));

                // Set talent name for display
                if (detailedOrder.talent) {
                    selectedTalentName.value = detailedOrder.talent.nickname;
                }
            }
        } catch (e) {
            console.error("Failed to fetch order details", e);
            ElMessage.error("获取订单详情失败");
        }
    } else {
        // Reset manual handled fields
        form.id = 0;
        form.bundles = [];
        form.name = '';
        form.talentId = undefined;
        form.date = '';
        form.status = '沟通中';
        form.commissionRate = 0;
        form.pitFee = 0;
        selectedTalentName.value = '';

        // 如果提供了预填充的达人信息，则自动获取达人详情并填充
        if (prefilledTalentId && prefilledTalentName) {
            form.talentId = prefilledTalentId;
            selectedTalentName.value = prefilledTalentName;

            // 获取达人详细信息以自动填充其他字段
            try {
                const res = await getTalents({ keyword: '', page: 1, pageSize: 1000 });
                if (res.data) {
                    const talent = res.data.find(t => t.id === prefilledTalentId);
                    if (talent) {
                        if (talent.type === '直播') {
                            form.type = '直播';
                        } else if (talent.type === '短视频' || talent.type === '图文') {
                            form.type = '短视频';
                        }
                        if (talent.pitFee !== undefined && talent.pitFee !== null) {
                            form.pitFee = talent.pitFee;
                        }
                        if (talent.commissionRateOnline !== undefined && talent.commissionRateOnline !== null) {
                            form.commissionRate = talent.commissionRateOnline;
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch talent details", e);
            }
        }
    }
};

defineExpose({ init });
</script>

<style scoped>
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    margin-bottom: 12px;
}

.section-title {
    font-size: 16px;
    font-weight: bold;
    border-left: 4px solid #409eff;
    padding-left: 8px;
}

.option-sub {
    float: right;
    color: #8492a6;
    font-size: 13px;
    margin-left: 10px;
}

.search-bar {
    margin-bottom: 15px;
}

.pagination-container {
    margin-top: 10px;
    text-align: right;
}

:deep(.disabled-row) {
    background-color: #f5f7fa;
    color: #c0c4cc;
    cursor: not-allowed;
}

:deep(.clickable-row) {
    cursor: pointer;
}

:deep(.clickable-row:hover) {
    background-color: #f5f7fa;
}

:deep(.el-table__row) {
    cursor: pointer;
}

:deep(.el-table__row:hover) {
    background-color: #f5f7fa;
}
</style>
