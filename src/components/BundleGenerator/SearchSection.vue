<template>
    <el-card class="box-card search-card">
        <template #header>
            <div class="card-header">
                <span>商品搜索</span>
            </div>
        </template>
        <div class="search-area">
            <div class="search-type-radio">
                <el-radio-group v-model="searchType" size="large">
                    <el-radio label="productName">品名</el-radio>
                    <el-radio label="skuCode">SKU码</el-radio>
                    <el-radio label="articleCode">A码</el-radio>
                </el-radio-group>
            </div>
            <div class="search-input-row">
                <el-autocomplete v-model="searchQuery" :fetch-suggestions="querySearch" placeholder="输入搜索内容"
                    class="search-input" clearable size="large" @keyup.enter="handleSearch" @select="handleSelect">
                    <template #append>
                        <el-button :icon="Search" @click="handleSearch" size="large" />
                    </template>
                </el-autocomplete>
                <el-checkbox v-model="filterZeroStock" size="large" style="margin-left: 10px;">
                    过滤库存为0
                </el-checkbox>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

// Props
const props = defineProps<{
    searchQuery: string
    searchType: string
    filterZeroStock: boolean
    querySearch: (queryString: string, cb: any) => void
}>()

const emit = defineEmits<{
    'update:searchQuery': [value: string]
    'update:searchType': [value: string]
    'update:filterZeroStock': [value: boolean]
    search: []
    select: [item: any]
}>()
const searchQuery = computed({
    get: () => props.searchQuery,
    set: (val) => emit('update:searchQuery', val)
})

const searchType = computed({
    get: () => props.searchType,
    set: (val) => emit('update:searchType', val)
})

const filterZeroStock = computed({
    get: () => props.filterZeroStock,
    set: (val) => emit('update:filterZeroStock', val)
})

const querySearch = props.querySearch

const handleSearch = () => {
    emit('search')
}

const handleSelect = (item: any) => {
    emit('select', item)
}
</script>

<style scoped>
.search-card {
    margin-bottom: 0;
    border-bottom: none;
    border-radius: 4px 4px 0 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header>span {
    font-size: 18px;
    font-weight: bold;
}

.search-area {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.search-type-radio {
    display: flex;
    align-items: center;
}

.search-input-row {
    display: flex;
    gap: 10px;
    align-items: center;
}

.search-input {
    flex: 1;
}
</style>
