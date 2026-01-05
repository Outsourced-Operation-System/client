<template>
    <el-dialog v-model="dialogVisible" title="标签表管理" width="50%" :before-close="handleClose">
        <el-tabs v-model="activeTab" type="card">
            <!-- 分类标签 -->
            <el-tab-pane label="分类" name="category">
                <div class="label-management-section">
                    <div class="add-section">
                        <el-input v-model="newLabels.category" placeholder="输入新的分类标签" class="input-with-button">
                            <template #append>
                                <el-button type="primary" @click="handleAddLabel('category')">添加</el-button>
                            </template>
                        </el-input>
                    </div>
                    <div class="label-list">
                        <el-tag v-for="label in labels.category" :key="label.id" :closable="true"
                            @close="handleDeleteLabel('category', label)" size="large" class="label-tag">
                            {{ label.value }}
                        </el-tag>
                        <div v-if="labels.category.length === 0" class="empty-hint">暂无标签</div>
                    </div>
                </div>
            </el-tab-pane>

            <!-- 品类标签 -->
            <el-tab-pane label="品类" name="productType">
                <div class="label-management-section">
                    <div class="add-section">
                        <el-input v-model="newLabels.productType" placeholder="输入新的品类标签" class="input-with-button">
                            <template #append>
                                <el-button type="primary" @click="handleAddLabel('productType')">添加</el-button>
                            </template>
                        </el-input>
                    </div>
                    <div class="label-list">
                        <el-tag v-for="label in labels.productType" :key="label.id" :closable="true"
                            @close="handleDeleteLabel('productType', label)" size="large" class="label-tag">
                            {{ label.value }}
                        </el-tag>
                        <div v-if="labels.productType.length === 0" class="empty-hint">暂无标签</div>
                    </div>
                </div>
            </el-tab-pane>

            <!-- bySKU标签 -->
            <el-tab-pane label="品类By-sku" name="bySku">
                <div class="label-management-section">
                    <div class="add-section">
                        <el-input v-model="newLabels.bySku" placeholder="输入新的bySKU标签" class="input-with-button">
                            <template #append>
                                <el-button type="primary" @click="handleAddLabel('bySku')">添加</el-button>
                            </template>
                        </el-input>
                    </div>
                    <div class="label-list">
                        <el-tag v-for="label in labels.bySku" :key="label.id" :closable="true"
                            @close="handleDeleteLabel('bySku', label)" size="large" class="label-tag">
                            {{ label.value }}
                        </el-tag>
                        <div v-if="labels.bySku.length === 0" class="empty-hint">暂无标签</div>
                    </div>
                </div>
            </el-tab-pane>

            <!-- 香型标签 -->
            <el-tab-pane label="香型" name="fragrance">
                <div class="label-management-section">
                    <div class="add-section">
                        <el-input v-model="newLabels.fragrance" placeholder="输入新的香型标签" class="input-with-button">
                            <template #append>
                                <el-button type="primary" @click="handleAddLabel('fragrance')">添加</el-button>
                            </template>
                        </el-input>
                    </div>
                    <div class="label-list">
                        <el-tag v-for="label in labels.fragrance" :key="label.id" :closable="true"
                            @close="handleDeleteLabel('fragrance', label)" size="large" class="label-tag">
                            {{ label.value }}
                        </el-tag>
                        <div v-if="labels.fragrance.length === 0" class="empty-hint">暂无标签</div>
                    </div>
                </div>
            </el-tab-pane>
        </el-tabs>

        <template #footer>
            <el-button @click="handleClose">关闭</el-button>
        </template>
    </el-dialog>

    <!-- 添加标签确认对话框 -->
    <el-dialog v-model="addConfirmVisible" title="确认添加" width="400px">
        <p>确定要添加标签 <strong>"{{ pendingAddLabel?.value }}"</strong> 到 <strong>{{ getLabelTypeName(pendingAddLabel?.field)
                }}</strong> 吗？</p>
        <template #footer>
            <el-button @click="addConfirmVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmAddLabel">确认</el-button>
        </template>
    </el-dialog>

    <!-- 删除标签确认对话框 -->
    <el-dialog v-model="deleteConfirmVisible" title="确认删除" width="400px">
        <p>确定要从 <strong>{{
            getLabelTypeName(pendingDeleteLabel?.field) }}</strong> 删除标签 <strong>"{{ pendingDeleteLabel?.label.value
                }}"</strong> 吗？</p>
        <p style="color: #f56c6c; margin-top: 10px;">此操作不可撤销！</p>
        <template #footer>
            <el-button @click="deleteConfirmVisible = false">取消</el-button>
            <el-button type="danger" @click="confirmDeleteLabel">确认删除</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Label {
    id: number
    value: string
    updatedAt: string
}

interface Labels {
    category: Label[]
    productType: Label[]
    bySku: Label[]
    fragrance: Label[]
}

interface Props {
    modelValue: boolean
    labels: Labels
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'addLabel', field: string, value: string): void
    (e: 'deleteLabel', field: string, labelId: number): void
    (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('category')
const newLabels = ref({
    category: '',
    productType: '',
    bySku: '',
    fragrance: ''
})

const addConfirmVisible = ref(false)
const deleteConfirmVisible = ref(false)
const pendingAddLabel = ref<{ field: string; value: string } | null>(null)
const pendingDeleteLabel = ref<{ field: string; label: Label } | null>(null)

// 获取标签类型的中文名称
const getLabelTypeName = (field: string | undefined) => {
    const names: Record<string, string> = {
        category: '分类',
        productType: '品类',
        bySku: 'bySKU',
        fragrance: '香型'
    }
    return field ? names[field] : ''
}

// 处理添加标签
const handleAddLabel = (field: string) => {
    const value = newLabels.value[field as keyof typeof newLabels.value].trim()
    if (!value) {
        return
    }

    // 检查是否已存在
    const existingLabels = props.labels[field as keyof Labels]
    if (existingLabels.some(label => label.value === value)) {
        ElMessage.warning('该标签已存在')
        return
    }

    pendingAddLabel.value = { field, value }
    addConfirmVisible.value = true
}

// 确认添加标签
const confirmAddLabel = () => {
    if (pendingAddLabel.value) {
        emit('addLabel', pendingAddLabel.value.field, pendingAddLabel.value.value)
        newLabels.value[pendingAddLabel.value.field as keyof typeof newLabels.value] = ''
        pendingAddLabel.value = null
    }
    addConfirmVisible.value = false
}

// 处理删除标签
const handleDeleteLabel = (field: string, label: Label) => {
    pendingDeleteLabel.value = { field, label }
    deleteConfirmVisible.value = true
}

// 确认删除标签
const confirmDeleteLabel = () => {
    if (pendingDeleteLabel.value) {
        emit('deleteLabel', pendingDeleteLabel.value.field, pendingDeleteLabel.value.label.id)
        pendingDeleteLabel.value = null
    }
    deleteConfirmVisible.value = false
}

const handleClose = () => {
    dialogVisible.value = false
}

// 当对话框打开时刷新数据
watch(dialogVisible, (newVal) => {
    if (newVal) {
        emit('refresh')
    }
})
</script>

<style scoped>
.label-management-section {
    padding: 20px;
    min-height: 400px;
}

.add-section {
    margin-bottom: 20px;
}

.input-with-button {
    max-width: 500px;
}

.label-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    min-height: 100px;
}

.label-tag {
    margin: 0;
}

.empty-hint {
    width: 100%;
    text-align: center;
    color: #909399;
    padding: 40px 0;
    font-size: 14px;
}

:deep(.el-dialog__body) {
    padding-top: 10px;
}

:deep(.el-tabs__content) {
    overflow: visible;
}
</style>
