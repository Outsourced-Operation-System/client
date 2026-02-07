<template>
    <el-dialog :model-value="visible" :title="title" width="700px" @close="handleClose">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
            <el-form-item label="达人昵称" prop="nickname">
                <el-input v-model="formData.nickname" placeholder="请输入达人昵称" />
            </el-form-item>

            <el-form-item label="达人类型" prop="type">
                <el-select v-model="formData.type" placeholder="请选择达人类型" style="width: 100%">
                    <el-option label="直播" value="直播" />
                    <el-option label="短视频" value="短视频" />
                    <el-option label="图文" value="图文" />
                </el-select>
            </el-form-item>

            <el-form-item label="粉丝数" prop="fansCount">
                <el-input-number v-model="formData.fansCount" :min="0" :step="10000" style="width: 100%"
                    placeholder="请输入粉丝数" />
            </el-form-item>

            <el-form-item label="坑位费" prop="pitFee">
                <el-input-number v-model="formData.pitFee" :min="0" :precision="2" :step="1000" style="width: 100%"
                    placeholder="请输入坑位费（默认报价）">
                    <template #prefix>¥</template>
                </el-input-number>
            </el-form-item>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="线上佣金率" prop="commissionRateOnline">
                        <el-input-number v-model="formData.commissionRateOnline" :min="0" :max="100" :precision="2"
                            style="width: 100%" placeholder="线上佣金率">
                            <template #suffix>%</template>
                        </el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="线下佣金率" prop="commissionRateOffline">
                        <el-input-number v-model="formData.commissionRateOffline" :min="0" :max="100" :precision="2"
                            style="width: 100%" placeholder="线下佣金率">
                            <template #suffix>%</template>
                        </el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="联系方式" prop="contactInfo">
                <el-input v-model="formData.contactInfo" type="textarea" :rows="3" placeholder="请输入联系方式（微信、电话等）" />
            </el-form-item>

            <el-form-item label="状态" prop="status">
                <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                    <el-option label="沟通中" value="沟通中" />
                    <el-option label="已合作" value="已合作" />
                    <el-option label="已失效" value="已失效" />
                </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">
                确定
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { Talent } from '@/api/talent';
import { useAuthStore } from '@/stores/auth';

interface Props {
    visible: boolean;
    title: string;
    data?: Talent | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    submit: [data: Partial<Talent>];
}>();

const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const submitting = ref(false);

// 表单数据
const formData = reactive<Partial<Talent>>({
    nickname: '',
    type: '',
    fansCount: 0,
    pitFee: 0,
    commissionRateOnline: 0,
    commissionRateOffline: 0,
    contactInfo: '',
    status: '沟通中',
    liaisonId: authStore.user?.id || 0
});

// 表单验证规则
const rules: FormRules = {
    nickname: [
        { required: true, message: '请输入达人昵称', trigger: 'blur' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    type: [
        { required: true, message: '请选择达人类型', trigger: 'change' }
    ],
    fansCount: [
        { required: true, message: '请输入粉丝数', trigger: 'blur' }
    ],
    pitFee: [
        { required: true, message: '请输入坑位费', trigger: 'blur' }
    ],
    commissionRateOnline: [
        { required: true, message: '请输入线上佣金率', trigger: 'blur' }
    ],
    commissionRateOffline: [
        { required: true, message: '请输入线下佣金率', trigger: 'blur' }
    ]
};

// 重置表单 - 必须在 watch 之前定义
const resetForm = () => {
    formData.nickname = '';
    formData.type = '';
    formData.fansCount = 0;
    formData.pitFee = 0;
    formData.commissionRateOnline = 0;
    formData.commissionRateOffline = 0;
    formData.contactInfo = '';
    formData.status = '沟通中';
    formData.liaisonId = authStore.user?.id || 0;
    formRef.value?.clearValidate();
};

// 监听数据变化，用于编辑时填充表单
watch(
    () => props.data,
    (newData) => {
        if (newData) {
            Object.assign(formData, newData);
        } else {
            resetForm();
        }
    },
    { immediate: true, deep: true }
);

// 关闭对话框
const handleClose = () => {
    resetForm();
    emit('close');
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();
        submitting.value = true;
        emit('submit', { ...formData });
    } catch (error) {
        console.error('表单验证失败:', error);
    } finally {
        submitting.value = false;
    }
};
</script>

<style scoped>
:deep(.el-input-number) {
    width: 100%;
}
</style>
