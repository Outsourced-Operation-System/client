<template>
    <div class="data-maintenance">
        <el-row :gutter="20" class="main-content">
            <!-- Upload Area -->
            <el-col :span="12">
                <el-card class="box-card mb-20">
                    <template #header>
                        <div class="card-header">
                            <span>数据上传</span>
                        </div>
                    </template>

                    <div class="upload-section">
                        <div class="upload-title">货品表上传</div>
                        <el-upload class="upload-demo" drag action="#" :auto-upload="false"
                            :on-change="handleProductFileChange" :show-file-list="false" accept=".xlsx,.xls,.csv">
                            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            <div class="el-upload__text">
                                将文件拖到此处，或 <em>点击上传</em>
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
                        <el-upload class="upload-demo" drag action="#" :auto-upload="false"
                            :on-change="handleInventoryFileChange" :show-file-list="false" accept=".xlsx,.xls,.csv">
                            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            <div class="el-upload__text">
                                将文件拖到此处，或 <em>点击上传</em>
                            </div>
                            <template #tip>
                                <div class="el-upload__tip">
                                    支持 .xlsx, .xls, .csv 文件
                                </div>
                            </template>
                        </el-upload>
                    </div>
                </el-card>
            </el-col>

            <!-- Data Status -->
            <el-col :span="12">
                <el-card class="box-card mb-20">
                    <template #header>
                        <div class="card-header">
                            <span>数据状态</span>
                        </div>
                    </template>
                    <div class="data-status">
                        <div class="status-item">
                            <span class="label">当前商品数量：</span>
                            <span class="value">{{ stats.count }} 个</span>
                        </div>
                        <div class="status-item">
                            <span class="label">最后更新时间：</span>
                            <span class="value">{{ stats.lastUpdate }}</span>
                        </div>
                        <div class="actions mt-20">
                            <div class="button-row">
                                <el-button type="warning" :icon="Download" @click="handleExportProducts" size="large"
                                    class="action-button" style="min-width: 212px">导出所有商品数据</el-button>
                            </div>
                            <div class="button-row">
                                <el-button type="success" :icon="Download" @click="handleExportGoods" size="large"
                                    class="action-button">导出货品表</el-button>
                                <el-button type="success" :icon="Download" @click="handleExportInventory" size="large"
                                    class="action-button">导出库存表</el-button>
                            </div>
                            <div class="button-row">
                                <el-button type="danger" @click="confirmClearGoods" size="large"
                                    class="action-button">删除货品数据</el-button>
                                <el-button type="danger" @click="confirmClearInventory" size="large"
                                    class="action-button">删除库存数据</el-button>
                            </div>
                        </div>
                    </div>
                </el-card>

                <!-- Backup Card -->
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span>数据备份</span>
                        </div>
                    </template>
                    <div class="backup-section">
                        <div class="backup-desc">
                            定期备份数据，确保数据安全
                        </div>
                        <div class="backup-actions">
                            <el-button type="primary" :icon="Download" size="large" class="backup-button">
                                备份数据
                            </el-button>
                            <el-button type="info" :icon="FolderOpened" size="large" class="backup-button">
                                查看备份
                            </el-button>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 上传模式选择对话框 -->
        <el-dialog v-model="uploadDialogVisible" title="选择上传模式" width="400px" :close-on-click-modal="false">
            <div class="upload-mode-dialog">
                <p>请选择数据上传模式：</p>
                <p class="file-info">文件：{{ pendingFile?.name }}</p>
            </div>
            <template #footer>
                <el-button @click="uploadDialogVisible = false" size="large">取消</el-button>
                <el-button type="primary" @click="handleUploadWithMode('update')" size="large">更新数据</el-button>
                <el-button type="warning" @click="confirmOverwrite" size="large">覆盖数据</el-button>
            </template>
        </el-dialog>

        <!-- 覆盖确认对话框 -->
        <el-dialog v-model="overwriteConfirmVisible" title="确认覆盖" width="400px" :close-on-click-modal="false">
            <div class="overwrite-confirm">
                <el-icon class="warning-icon">
                    <WarningFilled />
                </el-icon>
                <p>警告：该操作会删除数据库中所有现有的货品数据，并用上传的数据替换。</p>
                <p>此操作不可撤销，请确认是否继续？</p>
            </div>
            <template #footer>
                <el-button @click="overwriteConfirmVisible = false" size="large">取消</el-button>
                <el-button type="danger" @click="handleUploadWithMode('overwrite')" size="large">确认覆盖</el-button>
            </template>
        </el-dialog>

        <!-- 清空货品数据确认对话框 -->
        <el-dialog v-model="clearGoodsConfirmVisible" title="确认删除货品数据" width="400px" :close-on-click-modal="false">
            <div class="overwrite-confirm">
                <el-icon class="warning-icon">
                    <WarningFilled />
                </el-icon>
                <p>警告：该操作会永久删除数据库中所有的货品数据！</p>
                <p>此操作不可撤销，请确认是否继续？</p>
            </div>
            <template #footer>
                <el-button @click="clearGoodsConfirmVisible = false" size="large">取消</el-button>
                <el-button type="danger" @click="handleClearGoods" size="large">确认删除</el-button>
            </template>
        </el-dialog>

        <!-- 清空库存数据确认对话框 -->
        <el-dialog v-model="clearInventoryConfirmVisible" title="确认删除库存数据" width="400px" :close-on-click-modal="false">
            <div class="overwrite-confirm">
                <el-icon class="warning-icon">
                    <WarningFilled />
                </el-icon>
                <p>警告：该操作会永久删除数据库中所有的库存数据！</p>
                <p>此操作不可撤销，请确认是否继续？</p>
            </div>
            <template #footer>
                <el-button @click="clearInventoryConfirmVisible = false" size="large">取消</el-button>
                <el-button type="danger" @click="handleClearInventory" size="large">确认删除</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UploadFilled, Download, WarningFilled, FolderOpened } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const stats = ref({ count: 0, lastUpdate: '-' })
const uploadDialogVisible = ref(false)
const overwriteConfirmVisible = ref(false)
const clearGoodsConfirmVisible = ref(false)
const clearInventoryConfirmVisible = ref(false)
const pendingFile = ref<any>(null)
const pendingType = ref<'product' | 'inventory'>('product')

const fetchStats = async () => {
    try {
        const res = await (window as any).electronAPI.getStats()
        stats.value = {
            count: res.count,
            lastUpdate: res.lastUpdate || '-'
        }
    } catch (e) {
        console.error(e)
    }
}

const handleProductFileChange = async (file: any) => {
    // console.log('选择的文件对象:', file)
    // console.log('file.raw:', file.raw)
    // console.log('file.raw.path:', file.raw?.path)
    pendingFile.value = file.raw
    pendingType.value = 'product'

    try {
        const res = await (window as any).electronAPI.getStats()
        if (res.count === 0) {
            handleUploadWithMode('overwrite')
        } else {
            uploadDialogVisible.value = true
        }
    } catch (e) {
        console.error('获取统计信息失败:', e)
        uploadDialogVisible.value = true
    }
}

const handleInventoryFileChange = async (file: any) => {
    // console.log('库存文件对象:', file)
    // console.log('file.raw:', file.raw)
    pendingFile.value = file.raw
    pendingType.value = 'inventory'

    try {
        const res = await (window as any).electronAPI.getStats()
        if (res.inventoryCount === 0) {
            handleUploadWithMode('overwrite')
        } else {
            uploadDialogVisible.value = true
        }
    } catch (e) {
        console.error('获取统计信息失败:', e)
        uploadDialogVisible.value = true
    }
}

const confirmOverwrite = () => {
    uploadDialogVisible.value = false
    overwriteConfirmVisible.value = true
}

const handleUploadWithMode = async (mode: 'update' | 'overwrite') => {
    uploadDialogVisible.value = false
    overwriteConfirmVisible.value = false

    if (!pendingFile.value) {
        ElMessage.error('没有待上传的文件')
        return
    }

    const filePath = (window as any).electronAPI.getPathForFile(pendingFile.value)
    // console.log('待上传文件对象:', pendingFile.value)
    // console.log('文件路径:', filePath)

    if (!filePath) {
        console.error('无法获取文件路径，pendingFile 对象结构:', JSON.stringify(pendingFile.value, null, 2))
        ElMessage.error('无法获取文件路径，请重新选择文件')
        pendingFile.value = null
        return
    }

    try {
        // console.log('开始导入文件:', filePath, '类型:', pendingType.value, '模式:', mode)
        const res = await (window as any).electronAPI.importData(pendingType.value, filePath, mode)
        // console.log('导入结果:', res)
        if (res.success) {
            const modeText = mode === 'overwrite' ? '覆盖' : '更新'
            const typeText = pendingType.value === 'product' ? '商品' : '库存'
            ElMessage.success(`成功${modeText}了 ${res.count} 条${typeText}数据`)
            fetchStats()
        } else {
            console.error('导入失败详情:', res.error)
            ElMessage.error('导入失败: ' + (res.error || '未知错误'))
        }
    } catch (e: any) {
        console.error('导入出错详情:', e)
        console.error('错误堆栈:', e?.stack)
        ElMessage.error('导入出错: ' + (e?.message || String(e)))
    } finally {
        pendingFile.value = null
    }
}

const handleExportProducts = async () => {
    try {
        const res = await (window as any).electronAPI.exportProducts()
        if (res.success) {
            ElMessage.success(`成功导出 ${res.count} 条记录到 ${res.filePath}`)
        } else {
            if (res.error !== '用户取消了保存') {
                console.error('导出失败:', res.error)
                ElMessage.error('导出失败: ' + (res.error || '未知错误'))
            }
        }
    } catch (e: any) {
        console.error('导出出错:', e)
        ElMessage.error('导出出错: ' + (e?.message || String(e)))
    }
}

const handleExportGoods = async () => {
    try {
        const res = await (window as any).electronAPI.exportGoods()
        if (res.success) {
            ElMessage.success(`成功导出 ${res.count} 条记录到 ${res.filePath}`)
        } else {
            if (res.error !== '用户取消了保存') {
                console.error('导出失败:', res.error)
                ElMessage.error('导出失败: ' + (res.error || '未知错误'))
            }
        }
    } catch (e: any) {
        console.error('导出出错:', e)
        ElMessage.error('导出出错: ' + (e?.message || String(e)))
    }
}

const handleExportInventory = async () => {
    try {
        const res = await (window as any).electronAPI.exportInventory()
        if (res.success) {
            ElMessage.success(`成功导出 ${res.count} 条库存记录到 ${res.filePath}`)
        } else {
            if (res.error !== '用户取消了保存') {
                console.error('导出库存失败:', res.error)
                ElMessage.error('导出库存失败: ' + (res.error || '未知错误'))
            }
        }
    } catch (e: any) {
        console.error('导出库存出错:', e)
        ElMessage.error('导出库存出错: ' + (e?.message || String(e)))
    }
}

const confirmClearGoods = () => {
    clearGoodsConfirmVisible.value = true
}

const handleClearGoods = async () => {
    clearGoodsConfirmVisible.value = false
    try {
        const res = await (window as any).electronAPI.clearGoods()
        if (res.success) {
            ElMessage.success('货品数据已成功删除')
            fetchStats()
        } else {
            ElMessage.error('删除货品数据失败: ' + (res.error || '未知错误'))
        }
    } catch (e: any) {
        console.error('删除货品数据出错:', e)
        ElMessage.error('删除货品数据出错: ' + (e?.message || String(e)))
    }
}

const confirmClearInventory = () => {
    clearInventoryConfirmVisible.value = true
}

const handleClearInventory = async () => {
    clearInventoryConfirmVisible.value = false
    try {
        const res = await (window as any).electronAPI.clearInventory()
        if (res.success) {
            ElMessage.success('库存数据已成功删除')
            fetchStats()
        } else {
            ElMessage.error('删除库存数据失败: ' + (res.error || '未知错误'))
        }
    } catch (e: any) {
        console.error('删除库存数据出错:', e)
        ElMessage.error('删除库存数据出错: ' + (e?.message || String(e)))
    }
}

onMounted(fetchStats)
</script>

<style scoped>
.data-maintenance {
    min-height: calc(100vh - 200px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
}

.main-content {
    width: 92%;
    max-width: 1600px;
}

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

.data-status {
    padding: 20px;
}

.status-item {
    margin-bottom: 15px;
    font-size: 14px;
}

.status-item .label {
    color: #909399;
}

.status-item .value {
    font-weight: bold;
    color: #303133;
}

.actions {
    display: flex;
    flex-direction: column;
    width: 60%;
    gap: 12px;
}

.button-row {
    display: flex;
    /* gap: 12px; */
    justify-content: center;
}

.action-button {
    flex: 1;
    min-width: 100px;
}

.backup-section {
    padding: 20px;
    /* text-align: center; */
}

.backup-desc {
    color: #909399;
    font-size: 14px;
    margin-bottom: 20px;
    margin-left: 10%;
}

.backup-actions {
    display: flex;
    /* gap: 12px; */
    /* justify-content: center; */
}

.backup-button {
    min-width: 140px;
}

.upload-mode-dialog {
    text-align: center;
}

.upload-mode-dialog p {
    margin: 10px 0;
    font-size: 14px;
}

.upload-mode-dialog .file-info {
    color: #909399;
    font-size: 12px;
}

.overwrite-confirm {
    text-align: center;
}

.overwrite-confirm .warning-icon {
    font-size: 48px;
    color: #E6A23C;
    margin-bottom: 15px;
}

.overwrite-confirm p {
    margin: 10px 0;
    color: #606266;
    font-size: 14px;
}

.card-header span {
    font-size: 20px;
    font-weight: bold;
}

:deep(.el-upload__tip) {
    font-size: 12px;
}
</style>
