<template>
    <el-card class="box-card mb-20" :style="cardStyle">
        <template #header>
            <div class="card-header">
                <span>数据上传</span>
                <el-radio-group v-model="uploadMode" size="default" class="upload-mode-switch">
                    <el-radio-button value="separate">分表上传</el-radio-button>
                    <el-radio-button value="combined">合表上传</el-radio-button>
                </el-radio-group>
            </div>
        </template>

        <!-- 分表上传模式 -->
        <div v-if="uploadMode === 'separate'" class="upload-container">
            <div class="upload-section">
                <div class="upload-title">货品表上传</div>
                <div class="upload-wrapper">
                    <el-upload v-if="!productFile" class="upload-demo" drag action="#" :auto-upload="false"
                        :on-change="handleProductFileSelect" :show-file-list="false" accept=".xlsx,.xls,.csv">
                        <el-icon class="el-icon--upload" size="30px">
                            <upload-filled />
                        </el-icon>
                        <div class="el-upload__text">
                            将货品表拖到此处，或 <em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                支持 .xlsx, .xls, .csv 文件
                            </div>
                        </template>
                    </el-upload>
                    <div v-else class="file-preview">
                        <div class="file-info">
                            <el-icon size="30px" color="#67C23A">
                                <document />
                            </el-icon>
                            <div class="file-details">
                                <div class="file-name">{{ productFile.name }}</div>
                                <div class="file-size">{{ formatFileSize(productFile.size) }}</div>
                            </div>
                        </div>
                        <div class="file-actions">
                            <el-button type="primary" @click="confirmProductUpload">确认上传</el-button>
                            <el-button @click="cancelProductUpload">取消</el-button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="upload-section mt-20">
                <div class="upload-title">库存表上传</div>
                <div class="upload-wrapper">
                    <el-upload v-if="!inventoryFile" class="upload-demo" drag action="#" :auto-upload="false"
                        :on-change="handleInventoryFileSelect" :show-file-list="false" accept=".xlsx,.xls,.csv">
                        <el-icon class="el-icon--upload" size="30px">
                            <upload-filled />
                        </el-icon>
                        <div class="el-upload__text">
                            将库存表拖到此处，或 <em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                支持 .xlsx, .xls, .csv 文件
                            </div>
                        </template>
                    </el-upload>
                    <div v-else class="file-preview">
                        <div class="file-info">
                            <el-icon size="30px" color="#67C23A">
                                <document />
                            </el-icon>
                            <div class="file-details">
                                <div class="file-name">{{ inventoryFile.name }}</div>
                                <div class="file-size">{{ formatFileSize(inventoryFile.size) }}</div>
                            </div>
                        </div>
                        <div class="file-actions">
                            <el-button type="primary" @click="confirmInventoryUpload">确认上传</el-button>
                            <el-button @click="cancelInventoryUpload">取消</el-button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="upload-section mt-20">
                <div class="upload-title">标签表上传</div>
                <div class="upload-wrapper">
                    <el-upload v-if="!labelFile" class="upload-demo" drag action="#" :auto-upload="false"
                        :on-change="handleLabelFileSelect" :show-file-list="false" accept=".xlsx,.xls,.csv">
                        <el-icon class="el-icon--upload" size="30px">
                            <upload-filled />
                        </el-icon>
                        <div class="el-upload__text">
                            将标签表拖到此处,或 <em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                支持 .xlsx, .xls, .csv 文件（列顺序：分类、品类、By-SKU、香型）
                            </div>
                        </template>
                    </el-upload>
                    <div v-else class="file-preview">
                        <div class="file-info">
                            <el-icon size="30px" color="#67C23A">
                                <document />
                            </el-icon>
                            <div class="file-details">
                                <div class="file-name">{{ labelFile.name }}</div>
                                <div class="file-size">{{ formatFileSize(labelFile.size) }}</div>
                            </div>
                        </div>
                        <div class="file-actions">
                            <el-button type="primary" @click="confirmLabelUpload">确认上传</el-button>
                            <el-button @click="cancelLabelUpload">取消</el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 合表上传模式 -->
        <div v-else class="upload-container">
            <div class="upload-section combined-section">
                <div class="upload-title">
                    三表合一上传
                    <span class="upload-hint">（Excel文件需包含三个Sheet：库存表、货品表、标签表）</span>
                </div>
                <div class="upload-wrapper">
                    <el-upload v-if="!combinedFile" class="upload-demo full-height" drag action="#" :auto-upload="false"
                        :on-change="handleCombinedFileSelect" :show-file-list="false" accept=".xlsx,.xls">
                        <el-icon class="el-icon--upload" size="80px">
                            <upload-filled />
                        </el-icon>
                        <div class="el-upload__text">
                            将包含三个Sheet的Excel文件拖到此处，或 <em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                仅支持 .xlsx, .xls 文件，Sheet顺序必须为：库存表、货品表、标签表
                            </div>
                        </template>
                    </el-upload>
                    <div v-else class="file-preview full-height">
                        <div class="file-info">
                            <el-icon size="30px" color="#67C23A">
                                <document />
                            </el-icon>
                            <div class="file-details">
                                <div class="file-name">{{ combinedFile.name }}</div>
                                <div class="file-size">{{ formatFileSize(combinedFile.size) }}</div>
                            </div>
                        </div>
                        <div class="file-actions">
                            <el-button type="primary" @click="confirmCombinedUpload">确认上传</el-button>
                            <el-button @click="cancelCombinedUpload">取消</el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadFilled, Document } from '@element-plus/icons-vue'

interface Props { }

interface Emits {
    (e: 'productFileChange', file: any): void
    (e: 'inventoryFileChange', file: any): void
    (e: 'labelFileChange', file: any): void
    (e: 'combinedFileChange', file: any): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 上传模式：separate（分表） / combined（合表）
const uploadMode = ref<'separate' | 'combined'>('separate')

// 待上传的文件
const productFile = ref<File | null>(null)
const inventoryFile = ref<File | null>(null)
const labelFile = ref<File | null>(null)
const combinedFile = ref<File | null>(null)

// 计算卡片固定高度，确保切换模式时高度不变
const cardStyle = computed(() => {
    // 分表模式：三个上传区域 + 间距
    // 合表模式：一个上传区域
    // 固定高度以最大的分表模式为准
    return {
        minHeight: '720px'
    }
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 货品表文件选择
const handleProductFileSelect = (file: any) => {
    productFile.value = file.raw
}

// 确认货品表上传
const confirmProductUpload = () => {
    if (productFile.value) {
        emit('productFileChange', { raw: productFile.value })
        productFile.value = null
    }
}

// 取消货品表上传
const cancelProductUpload = () => {
    productFile.value = null
}

// 库存表文件选择
const handleInventoryFileSelect = (file: any) => {
    inventoryFile.value = file.raw
}

// 确认库存表上传
const confirmInventoryUpload = () => {
    if (inventoryFile.value) {
        emit('inventoryFileChange', { raw: inventoryFile.value })
        inventoryFile.value = null
    }
}

// 取消库存表上传
const cancelInventoryUpload = () => {
    inventoryFile.value = null
}

// 标签表文件选择
const handleLabelFileSelect = (file: any) => {
    labelFile.value = file.raw
}

// 确认标签表上传
const confirmLabelUpload = () => {
    if (labelFile.value) {
        emit('labelFileChange', { raw: labelFile.value })
        labelFile.value = null
    }
}

// 取消标签表上传
const cancelLabelUpload = () => {
    labelFile.value = null
}

// 合表文件选择
const handleCombinedFileSelect = (file: any) => {
    combinedFile.value = file.raw
}

// 确认合表上传
const confirmCombinedUpload = () => {
    if (combinedFile.value) {
        emit('combinedFileChange', { raw: combinedFile.value })
        combinedFile.value = null
    }
}

// 取消合表上传
const cancelCombinedUpload = () => {
    combinedFile.value = null
}
</script>

<style scoped>
.mb-20 {
    margin-bottom: 20px;
}

.mt-20 {
    margin-top: 20px;
}

.box-card {
    display: flex;
    flex-direction: column;
}

:deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.upload-container {
    min-height: 550px;
    display: flex;
    flex-direction: column;
    flex: 1;
}

.upload-section {
    flex: 1;
}

.upload-title {
    margin-bottom: 10px;
    font-weight: bold;
    color: #606266;
    font-size: 16px;
}

.upload-hint {
    font-size: 14px;
    font-weight: normal;
    color: #909399;
    margin-left: 8px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header span {
    font-size: 20px;
    font-weight: bold;
}

.upload-mode-switch {
    margin-left: auto;
}

.upload-wrapper {
    height: 100%;
    min-height: 160px;
}

.file-preview {
    border: 2px dashed #dcdfe6;
    border-radius: 6px;
    padding: 30px;
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 160px;
    transition: all 0.3s;
}

.file-preview:hover {
    border-color: #409eff;
    background-color: #f5f7fa;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.file-details {
    text-align: left;
}

.file-name {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 5px;
    word-break: break-all;
}

.file-size {
    font-size: 14px;
    color: #909399;
}

.file-actions {
    display: flex;
    gap: 10px;
}

:deep(.el-upload__tip) {
    font-size: 12px;
}

:deep(.el-upload-dragger) {
    padding: 30px 20px;
    background-color: #fafafa;
}

.combined-section {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.combined-section .upload-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 0;
}

.full-height {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.full-height :deep(.el-upload) {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.full-height :deep(.el-upload-dragger) {
    flex: 1;
    height: 100% !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
}
</style>
