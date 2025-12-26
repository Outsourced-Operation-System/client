<template>
    <div class="data-maintenance">
        <el-row :gutter="20" class="main-content">
            <!-- 上传区域 -->
            <el-col :span="12">
                <UploadSection @product-file-change="handleProductFileChange"
                    @inventory-file-change="handleInventoryFileChange" @label-file-change="handleLabelFileChange" />
            </el-col>

            <!-- 数据状态与备份区域 -->
            <el-col :span="12" class="right-column">
                <DataStatusCard :stats="stats" @export-products="handleExportProducts"
                    @export-inventory="handleExportInventory" @clear-products="confirmClearProducts"
                    @clear-inventory="confirmClearInventory" />

                <BackupCard :last-backup-time="stats.lastBackupTime" @backup="confirmBackup"
                    @show-backup-list="showBackupList" />
            </el-col>
        </el-row>

        <!-- 上传模式选择对话框 -->
        <UploadModeDialog v-model="uploadDialogVisible" :file-name="pendingFile?.name" @confirm="handleUploadWithMode"
            @confirm-overwrite="confirmOverwrite" />

        <!-- 覆盖确认对话框 -->
        <ConfirmDialog v-model="overwriteConfirmVisible" title="确认覆盖" dialog-type="warning" confirm-text="确认覆盖"
            confirm-type="danger" :messages="[
                { text: '警告：该操作会删除数据库中所有现有的货品数据，并用上传的数据替换。' },
                { text: '此操作不可撤销，请确认是否继续？' }
            ]" @confirm="handleUploadWithMode('overwrite')" />

        <!-- 清空货品数据确认对话框 -->
        <ConfirmDialog v-model="clearProductsConfirmVisible" title="确认删除货品数据" dialog-type="warning" confirm-text="确认删除"
            confirm-type="danger" :messages="[
                { text: '警告：该操作会永久删除数据库中所有的货品数据！' },
                { text: '此操作不可撤销，请确认是否继续？' }
            ]" @confirm="handleClearProducts" />

        <!-- 清空库存数据确认对话框 -->
        <ConfirmDialog v-model="clearInventoryConfirmVisible" title="确认删除库存数据" dialog-type="warning" confirm-text="确认删除"
            confirm-type="danger" :messages="[
                { text: '警告：该操作会永久删除数据库中所有的库存数据！' },
                { text: '此操作不可撤销，请确认是否继续？' }
            ]" @confirm="handleClearInventory" />

        <!-- 备份确认对话框 -->
        <ConfirmDialog v-model="backupConfirmVisible" title="确认备份" dialog-type="info" confirm-text="确认备份"
            confirm-type="primary" :messages="[
                { text: '是否要备份当前数据？' },
                { text: '备份文件将保存到系统应用数据目录' }
            ]" @confirm="handleBackup" />

        <!-- 查看备份列表对话框 -->
        <BackupListDialog v-model="backupListVisible" :backup-list="backupList" @restore="confirmRestore"
            @delete-backup="confirmDeleteBackup" />

        <!-- 恢复备份确认对话框 -->
        <ConfirmDialog v-model="restoreConfirmVisible" title="确认恢复" dialog-type="warning" confirm-text="确认恢复"
            confirm-type="primary" :messages="[
                { text: '是否确认恢复到该备份？' },
                { text: '系统会自动备份当前数据' },
                { text: `备份时间：${selectedBackup?.datetime || ''}`, highlight: true }
            ]" @confirm="handleRestore" />

        <!-- 删除备份确认对话框 -->
        <ConfirmDialog v-model="deleteBackupConfirmVisible" title="确认删除备份" dialog-type="warning" confirm-text="确认删除"
            confirm-type="danger" :messages="[
                { text: '确定要删除该备份文件吗？' },
                { text: '此操作不可撤销！' },
                { text: `备份时间：${selectedBackup?.datetime || ''}`, highlight: true }
            ]" @confirm="handleDeleteBackup" />
    </div>
</template>

<script setup lang="ts">
// 引入组件
import UploadSection from '@/components/DataMaintenance/UploadSection.vue'
import DataStatusCard from '@/components/DataMaintenance/DataStatusCard.vue'
import BackupCard from '@/components/DataMaintenance/BackupCard.vue'
import UploadModeDialog from '@/components/DataMaintenance/UploadModeDialog.vue'
import ConfirmDialog from '@/components/DataMaintenance/ConfirmDialog.vue'
import BackupListDialog from '@/components/DataMaintenance/BackupListDialog.vue'

// 引入组合式函数
import {
    useDataStats,
    useDataUpload,
    useDataExport,
    useDataClear,
    useBackup
} from '@/composables/DataMaintenance'

// 使用数据统计
const { stats, fetchStats } = useDataStats()

// 使用数据上传
const {
    uploadDialogVisible,
    overwriteConfirmVisible,
    pendingFile,
    handleProductFileChange,
    handleInventoryFileChange,
    handleLabelFileChange,
    confirmOverwrite,
    handleUploadWithMode
} = useDataUpload(fetchStats)

// 使用数据导出
const { handleExportProducts, handleExportInventory } = useDataExport()

// 使用数据清除
const {
    clearProductsConfirmVisible,
    clearInventoryConfirmVisible,
    confirmClearProducts,
    handleClearProducts,
    confirmClearInventory,
    handleClearInventory
} = useDataClear(fetchStats)

// 使用备份功能
const {
    backupConfirmVisible,
    backupListVisible,
    restoreConfirmVisible,
    deleteBackupConfirmVisible,
    backupList,
    selectedBackup,
    confirmBackup,
    handleBackup,
    showBackupList,
    confirmRestore,
    handleRestore,
    confirmDeleteBackup,
    handleDeleteBackup
} = useBackup(fetchStats)
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

.right-column {
    display: flex;
    flex-direction: column;
}
</style>
