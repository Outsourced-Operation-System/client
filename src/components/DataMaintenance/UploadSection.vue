<template>
    <el-card class="box-card mb-20">
        <template #header>
            <div class="card-header">
                <span>数据上传</span>
            </div>
        </template>

        <div class="upload-section">
            <div class="upload-title">货品表上传</div>
            <el-upload class="upload-demo" drag action="#" :auto-upload="false" :on-change="handleProductFileChange"
                :show-file-list="false" accept=".xlsx,.xls,.csv">
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
        </div>

        <div class="upload-section mt-20">
            <div class="upload-title">库存表上传</div>
            <el-upload class="upload-demo" drag action="#" :auto-upload="false" :on-change="handleInventoryFileChange"
                :show-file-list="false" accept=".xlsx,.xls,.csv">
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
        </div>

        <div class="upload-section mt-20">
            <div class="upload-title">标签表上传</div>
            <el-upload class="upload-demo" drag action="#" :auto-upload="false" :on-change="handleLabelFileChange"
                :show-file-list="false" accept=".xlsx,.xls,.csv">
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
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'

interface Props { }

interface Emits {
    (e: 'productFileChange', file: any): void
    (e: 'inventoryFileChange', file: any): void
    (e: 'labelFileChange', file: any): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleProductFileChange = (file: any) => {
    emit('productFileChange', file)
}

const handleInventoryFileChange = (file: any) => {
    emit('inventoryFileChange', file)
}

const handleLabelFileChange = (file: any) => {
    emit('labelFileChange', file)
}
</script>

<style scoped>
.mb-20 {
    margin-bottom: 20px;
}

.mt-20 {
    margin-top: 20px;
}

.upload-title {
    margin-bottom: 10px;
    font-weight: bold;
    color: #606266;
    font-size: 16px;
}

.card-header span {
    font-size: 20px;
    font-weight: bold;
}

:deep(.el-upload__tip) {
    font-size: 12px;
}
</style>
