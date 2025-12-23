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
                            <el-icon class="el-icon--upload" size="30px"><upload-filled /></el-icon>
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
                        <el-upload class="upload-demo" drag action="#" :auto-upload="false"
                            :on-change="handleInventoryFileChange" :show-file-list="false" accept=".xlsx,.xls,.csv">
                            <el-icon class="el-icon--upload" size="30px"><upload-filled /></el-icon>
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
                        <el-upload class="upload-demo" drag action="#" :auto-upload="false"
                            :on-change="handleLabelFileChange" :show-file-list="false" accept=".xlsx,.xls,.csv">
                            <el-icon class="el-icon--upload" size="30px"><upload-filled /></el-icon>
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
            </el-col>

            <!-- 数据状态卡片 -->
            <el-col :span="12" class="right-column">
                <el-card class="box-card status-card mb-20">
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
                            <span class="label">货品最后更新时间：</span>
                            <span class="value">{{ stats.goodsLastUpdate }}</span>
                        </div>
                        <div class="status-item">
                            <span class="label">库存最后更新时间：</span>
                            <span class="value">{{ stats.inventoryLastUpdate }}</span>
                        </div>
                        <div class="status-item">
                            <span class="label">标签最后更新时间：</span>
                            <span class="value">{{ stats.labelLastUpdate }}</span>
                        </div>
                        <div class="actions mt-20">
                            <!-- <div class="button-row">
                                <el-button type="warning" :icon="Download" @click="handleExportProducts" size="large"
                                    class="action-button" style="min-width: 212px">导出所有商品数据</el-button>
                            </div> -->
                            <div class="button-row">
                                <el-button type="primary" :icon="Download" @click="handleExportGoods" size="large"
                                    class="action-button">导出货品表</el-button>
                                <el-button type="primary" :icon="Download" @click="handleExportInventory" size="large"
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

                <!-- 备份数据卡片 -->
                <el-card class="box-card backup-card mb-20">
                    <template #header>
                        <div class="card-header">
                            <span>数据备份</span>
                        </div>
                    </template>
                    <div class="backup-section">
                        <div class="backup-desc">
                            定期备份数据，确保数据安全
                        </div>
                        <div class="backup-status">
                            <div class="status-item">
                                <span class="label">最新备份时间：</span>
                                <span class="value">{{ stats.lastBackupTime }}</span>
                            </div>
                        </div>
                        <div class="backup-actions">
                            <el-button type="primary" :icon="Download" size="large" class="backup-button"
                                @click="confirmBackup">
                                备份数据
                            </el-button>
                            <el-button type="info" :icon="FolderOpened" size="large" class="backup-button"
                                @click="showBackupList">
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

        <!-- 备份确认对话框 -->
        <el-dialog v-model="backupConfirmVisible" title="确认备份" width="400px" :close-on-click-modal="false">
            <div class="backup-confirm">
                <el-icon class="info-icon">
                    <InfoFilled />
                </el-icon>
                <p>是否要备份当前数据？</p>
                <p class="tip">备份文件将保存到系统应用数据目录</p>
            </div>
            <template #footer>
                <el-button @click="backupConfirmVisible = false" size="large">取消</el-button>
                <el-button type="primary" @click="handleBackup" size="large">确认备份</el-button>
            </template>
        </el-dialog>

        <!-- 查看备份列表对话框 -->
        <el-dialog v-model="backupListVisible" title="备份列表" width="600px" :close-on-click-modal="false">
            <el-table :data="backupList" style="width: 100%" max-height="400px">
                <el-table-column prop="datetime" label="备份时间" min-width="100" />
                <el-table-column label="恢复数据" width="120">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="confirmRestore(row)">恢复</el-button>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                        <el-button type="danger" size="small" @click="confirmDeleteBackup(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <template #footer>
                <el-button @click="backupListVisible = false" size="large">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 恢复备份确认对话框 -->
        <el-dialog v-model="restoreConfirmVisible" title="确认恢复" width="400px" :close-on-click-modal="false">
            <div class="overwrite-confirm">
                <el-icon class="warning-icon">
                    <WarningFilled />
                </el-icon>
                <p>是否确认恢复到该备份？</p>
                <p>系统会自动备份当前数据</p>
                <p class="backup-time" v-if="selectedBackup">备份时间：{{ selectedBackup.datetime }}</p>
            </div>
            <template #footer>
                <el-button @click="restoreConfirmVisible = false" size="large">取消</el-button>
                <el-button type="primary" @click="handleRestore" size="large">确认恢复</el-button>
            </template>
        </el-dialog>

        <!-- 删除备份确认对话框 -->
        <el-dialog v-model="deleteBackupConfirmVisible" title="确认删除备份" width="400px" :close-on-click-modal="false">
            <div class="overwrite-confirm">
                <el-icon class="warning-icon">
                    <WarningFilled />
                </el-icon>
                <p>确定要删除该备份文件吗？</p>
                <p>此操作不可撤销！</p>
                <p class="backup-time" v-if="selectedBackup">备份时间：{{ selectedBackup.datetime }}</p>
            </div>
            <template #footer>
                <el-button @click="deleteBackupConfirmVisible = false" size="large">取消</el-button>
                <el-button type="danger" @click="handleDeleteBackup" size="large">确认删除</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UploadFilled, Download, WarningFilled, FolderOpened, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface BackupItem {
    filename: string
    timestamp: number
    datetime: string
}

const stats = ref({
    count: 0,
    goodsLastUpdate: '-',
    inventoryLastUpdate: '-',
    labelLastUpdate: '-',
    lastBackupTime: '-'
})
const uploadDialogVisible = ref(false)
const overwriteConfirmVisible = ref(false)
const clearGoodsConfirmVisible = ref(false)
const clearInventoryConfirmVisible = ref(false)
const backupConfirmVisible = ref(false)
const backupListVisible = ref(false)
const restoreConfirmVisible = ref(false)
const deleteBackupConfirmVisible = ref(false)
const pendingFile = ref<any>(null)
const pendingType = ref<'product' | 'inventory' | 'label'>('product')
const backupList = ref<BackupItem[]>([])
const selectedBackup = ref<BackupItem | null>(null)

const fetchStats = async () => {
    try {
        const res = await (window as any).electronAPI.getStats()
        const backupRes = await (window as any).electronAPI.getLastBackupTime()
        stats.value = {
            count: res.count,
            goodsLastUpdate: res.goodsLastUpdate || '-',
            inventoryLastUpdate: res.inventoryLastUpdate || '-',
            labelLastUpdate: res.labelLastUpdate || '-',
            lastBackupTime: backupRes.success && backupRes.lastBackupTime ? backupRes.lastBackupTime : '-'
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

const handleLabelFileChange = async (file: any) => {
    pendingFile.value = file.raw
    pendingType.value = 'label'

    // 标签表直接覆盖上传，不需要选择模式
    handleUploadWithMode('overwrite')
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
            const typeText = pendingType.value === 'product' ? '商品' :
                pendingType.value === 'inventory' ? '库存' : '标签'
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

// const handleExportProducts = async () => {
//     try {
//         const res = await (window as any).electronAPI.exportProducts()
//         if (res.success) {
//             ElMessage.success(`成功导出 ${res.count} 条记录到 ${res.filePath}`)
//         } else {
//             if (res.error !== '用户取消了保存') {
//                 console.error('导出失败:', res.error)
//                 ElMessage.error('导出失败: ' + (res.error || '未知错误'))
//             }
//         }
//     } catch (e: any) {
//         console.error('导出出错:', e)
//         ElMessage.error('导出出错: ' + (e?.message || String(e)))
//     }
// }

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

// 备份相关函数
const confirmBackup = () => {
    backupConfirmVisible.value = true
}

const handleBackup = async () => {
    backupConfirmVisible.value = false
    try {
        const res = await (window as any).electronAPI.backupDatabase()
        if (res.success) {
            ElMessage.success('数据备份成功')
            fetchStats()
        } else {
            ElMessage.error('备份失败: ' + (res.error || '未知错误'))
        }
    } catch (e: any) {
        console.error('备份出错:', e)
        ElMessage.error('备份出错: ' + (e?.message || String(e)))
    }
}

const showBackupList = async () => {
    try {
        const res = await (window as any).electronAPI.getBackups()
        if (res.success) {
            backupList.value = res.backups
            backupListVisible.value = true
        } else {
            ElMessage.error('获取备份列表失败: ' + (res.error || '未知错误'))
        }
    } catch (e: any) {
        console.error('获取备份列表出错:', e)
        ElMessage.error('获取备份列表出错: ' + (e?.message || String(e)))
    }
}

const confirmRestore = (backup: BackupItem) => {
    selectedBackup.value = backup
    restoreConfirmVisible.value = true
}

const handleRestore = async () => {
    restoreConfirmVisible.value = false
    if (!selectedBackup.value) return

    try {
        const res = await (window as any).electronAPI.restoreBackup(selectedBackup.value.timestamp)
        if (res.success) {
            ElMessage.success('数据恢复成功，已自动备份当前数据')
            fetchStats()
            // 刷新备份列表
            const backupRes = await (window as any).electronAPI.getBackups()
            if (backupRes.success) {
                backupList.value = backupRes.backups
            }
        } else {
            ElMessage.error('恢复失败: ' + (res.error || '未知错误'))
        }
    } catch (e: any) {
        console.error('恢复出错:', e)
        ElMessage.error('恢复出错: ' + (e?.message || String(e)))
    } finally {
        selectedBackup.value = null
    }
}

const confirmDeleteBackup = (backup: BackupItem) => {
    selectedBackup.value = backup
    deleteBackupConfirmVisible.value = true
}

const handleDeleteBackup = async () => {
    deleteBackupConfirmVisible.value = false
    if (!selectedBackup.value) return

    try {
        const res = await (window as any).electronAPI.deleteBackup(selectedBackup.value.timestamp)
        if (res.success) {
            ElMessage.success('备份已删除')
            // 刷新备份列表
            const backupRes = await (window as any).electronAPI.getBackups()
            if (backupRes.success) {
                backupList.value = backupRes.backups
            }
            fetchStats()
        } else {
            ElMessage.error('删除失败: ' + (res.error || '未知错误'))
        }
    } catch (e: any) {
        console.error('删除备份出错:', e)
        ElMessage.error('删除备份出错: ' + (e?.message || String(e)))
    } finally {
        selectedBackup.value = null
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
    display: flex;
    align-items: stretch;
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
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.status-item {
    margin-bottom: 15px;
    font-size: 14px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

.status-item .label {
    color: #909399;
    width: 160px;
    text-align: left;
}

.status-item .value {
    font-weight: bold;
    color: #303133;
    width: 150px;
    text-align: left;
}

.actions {
    display: flex;
    flex-direction: column;
    width: 60%;
    gap: 15px;
    margin: 20px 0 0;
}

.button-row {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
}

.action-button {
    flex: 1;
    min-width: 100px;
}

.right-column {
    display: flex;
    flex-direction: column;
}

.status-card {
    flex: 5;
    display: flex;
    flex-direction: column;
}

.status-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.backup-card {
    flex: 4;
    display: flex;
    flex-direction: column;
}

.backup-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.backup-section {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.backup-desc {
    color: #909399;
    font-size: 14px;
    margin-bottom: 20px;
    text-align: left;
}

.backup-status {
    margin-bottom: 20px;
    width: 100%;
    display: flex;
    justify-content: flex-start;
}

.backup-actions {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    width: 60%;
}

.backup-button {
    min-width: 140px;
    flex: 1;
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

.backup-confirm {
    text-align: center;
}

.backup-confirm .info-icon {
    font-size: 48px;
    color: #409EFF;
    margin-bottom: 15px;
}

.backup-confirm p {
    margin: 10px 0;
    color: #606266;
    font-size: 14px;
}

.backup-confirm .tip {
    color: #909399;
    font-size: 12px;
}

.backup-time {
    color: #409EFF;
    font-weight: bold;
}
</style>
