<template>
  <div class="home-container">
    <header class="home-header">
      <div class="header-left">
        <FileTextOutlined class="header-icon" />
        <h1>工单管理系统</h1>
      </div>
      <div class="header-right">
        <span class="user-info">
          <UserOutlined />
          {{ username }}
          <a-tag :color="isAdmin ? 'purple' : 'blue'">
            {{ isAdmin ? '管理员' : '普通用户' }}
          </a-tag>
        </span>
        <a-button type="text" @click="handleLogout" class="logout-btn">
          <LogoutOutlined /> 退出
        </a-button>
      </div>
    </header>

    <main class="home-main">
      <div class="content-grid">
        <div class="card table-card">
          <div class="card-header">
            <h2><TableOutlined /> 工单列表</h2>
            <a-button v-if="isAdmin" type="primary" @click="openModal">
              <PlusOutlined /> 新增工单
            </a-button>
          </div>
          <a-table
            :columns="columns"
            :data-source="workOrders"
            :pagination="false"
            row-key="id"
            class="workorder-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'overtime'">
                <a-tag :color="record.overtime ? 'orange' : 'green'">
                  {{ record.overtime ? '是' : '否' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button
                  v-if="isAdmin"
                  type="text"
                  danger
                  size="small"
                  @click="handleDelete(record.id)"
                >
                  <DeleteOutlined /> 删除
                </a-button>
                <span v-else class="no-permission">无权限</span>
              </template>
            </template>
          </a-table>
        </div>

        <div class="card chart-card">
          <div class="card-header">
            <h2><BarChartOutlined /> 项目工时分布</h2>
          </div>
          <div class="chart-container" ref="chartRef"></div>
        </div>
      </div>
    </main>

    <a-modal
      v-model:open="modalVisible"
      title="新增工单"
      @ok="handleAdd"
      @cancel="closeModal"
      :confirm-loading="confirmLoading"
    >
      <a-form :model="formState" layout="vertical" class="add-form">
        <a-form-item label="项目名称" required>
          <a-select
            v-model:value="formState.project"
            placeholder="请选择项目"
            :options="projectOptions"
          />
        </a-form-item>
        <a-form-item label="是否加班">
          <a-switch v-model:checked="formState.overtime" />
        </a-form-item>
        <a-form-item label="工时" required>
          <a-input-number
            v-model:value="formState.hours"
            :min="0"
            :step="0.5"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
/**
 * 首页组件 - 工单管理与图表展示
 * 功能：
 *  - 工单列表展示（表格）
 *  - 新增工单（对话框）
 *  - 删除工单（仅管理员）
 *  - 图表展示（ECharts柱状图）
 * 权限：
 *  - 管理员(admin)：可查看、新增、删除工单
 *  - 普通用户：仅可查看工单和图表
 */
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import * as echarts from 'echarts'
import {
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  TableOutlined,
  BarChartOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

// 路由实例，用于退出登录时跳转
const router = useRouter()
// 图表DOM引用
const chartRef = ref(null)
// ECharts实例
let chartInstance = null

// 模拟工单数据（初始化5条数据）
const mockData = [
  { id: '001', project: 'Road Project A', overtime: true, hours: 3.5, created_at: '2024-04-10 10:30' },
  { id: '002', project: 'Bridge Maintenance B', overtime: false, hours: 2, created_at: '2024-04-09 13:00' },
  { id: '003', project: 'Pipeline Fix C', overtime: true, hours: 4.5, created_at: '2024-04-08 08:00' },
  { id: '004', project: 'Bridge Maintenance B', overtime: true, hours: 3, created_at: '2024-04-07 16:45' },
  { id: '005', project: 'Tunnel Cleaning D', overtime: false, hours: 8.1, created_at: '2024-04-03 11:43' }
]

// 工单列表数据（响应式）
const workOrders = ref([...mockData])

// 新增工单时的项目下拉选项（与mockData中的项目对应）
const projectOptions = [
  { value: 'Road Project A', label: 'Road Project A' },
  { value: 'Bridge Maintenance B', label: 'Bridge Maintenance B' },
  { value: 'Pipeline Fix C', label: 'Pipeline Fix C' },
  { value: 'Tunnel Cleaning D', label: 'Tunnel Cleaning D' },
]

// 表格列配置
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '项目名称', dataIndex: 'project', key: 'project' },
  { title: '是否加班', dataIndex: 'overtime', key: 'overtime', width: 100 },
  { title: '工时', dataIndex: 'hours', key: 'hours', width: 80 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  { title: '操作', key: 'action', width: 100 }
]

// 从sessionStorage获取当前用户名
const username = ref(sessionStorage.getItem('username') || 'user')
// 计算属性：判断是否为管理员
const isAdmin = computed(() => sessionStorage.getItem('userRole') === 'admin')

// 新增工单对话框是否可见
const modalVisible = ref(false)
// 新增工单对话框确定按钮loading状态
const confirmLoading = ref(false)
// 新增工单表单数据
const formState = reactive({
  project: '',      // 项目名称
  overtime: false,  // 是否加班
  hours: 1           // 工时
})

// 打开新增工单对话框
const openModal = () => {
  // 重置表单数据
  formState.project = ''
  formState.overtime = false
  formState.hours = 1
  modalVisible.value = true
}

// 关闭新增工单对话框
const closeModal = () => {
  modalVisible.value = false
}

/**
 * 处理新增工单
 * 1. 校验表单数据
 * 2. 生成新工单ID和创建时间
 * 3. 添加到工单列表末尾
 * 4. 显示成功提示
 */
const handleAdd = () => {
  // 校验项目名称
  if (!formState.project) {
    message.warning('请选择项目')
    return
  }
  // 校验工时
  if (!formState.hours || formState.hours <= 0) {
    message.warning('请输入有效工时')
    return
  }
  confirmLoading.value = true
  setTimeout(() => {
    // 生成新工单ID（使用当前数量+1）
    const newId = String(workOrders.value.length + 1).padStart(3, '0')
    // 生成当前时间作为创建时间
    const now = new Date()
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    // 添加新工单到列表末尾
    workOrders.value.push({
      id: newId,
      project: formState.project,
      overtime: formState.overtime,
      hours: formState.hours,
      created_at: createdAt
    })
    
    message.success('工单添加成功')
    confirmLoading.value = false
    closeModal()
  }, 500)
}

/**
 * 处理删除工单
 * 1. 弹出确认对话框
 * 2. 用户确认后从列表中移除
 * 3. 重新排序剩余工单的ID
 * 4. 显示成功提示
 */
const handleDelete = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条工单吗？',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      // 过滤掉要删除的工单
      workOrders.value = workOrders.value.filter(item => item.id !== id)
      // 重新排序ID（001, 002, 003...）
      workOrders.value.forEach((item, index) => {
        item.id = String(index + 1).padStart(3, '0')
      })
      message.success('工单删除成功')
    }
  })
}

// 退出登录
const handleLogout = () => {
  // 清除sessionStorage中的用户信息
  sessionStorage.clear()
  // 跳转到登录页
  router.push('/login')
}

/**
 * 获取图表数据
 * 按项目名称分组，统计累计工时
 * @returns {Object} categories: 项目名称数组, values: 工时数组
 */
const getChartData = () => {
  const projectHours = {}
  // 遍历工单，按项目累加工时
  workOrders.value.forEach(item => {
    if (projectHours[item.project]) {
      projectHours[item.project] += item.hours
    } else {
      projectHours[item.project] = item.hours
    }
  })
  return {
    categories: Object.keys(projectHours),
    values: Object.values(projectHours)
  }
}

/**
 * 初始化ECharts图表
 * 配置柱状图展示各项目累计工时
 */
const initChart = () => {
  if (!chartRef.value) return
  
  // 销毁已存在的图表实例
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  // 初始化新图表实例
  chartInstance = echarts.init(chartRef.value)
  const { categories, values } = getChartData()
  
  // 图表配置
  const option = {
    // 提示框
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: '{b}: {c} 小时'
    },
    // 网格配置
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    // X轴配置
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisLabel: { 
        color: '#333', 
        fontSize: 11,
        fontWeight: 500,
        interval: 0,
        formatter: (value) => {
          const len = 12
          if (value.length > len) {
            return value.slice(0, len) + '\n' + value.slice(len)
          }
          return value
        }
      },
      axisTick: { alignWithLabel: true }
    },
    // Y轴配置
    yAxis: {
      type: 'value',
      name: '工时 (小时)',
      nameTextStyle: { color: '#999', padding: [0, 0, 0, 60] },
      axisLine: { show: false },
      axisLabel: { color: '#999' },
      splitLine: { lineStyle: { type: 'dashed', color: '#e8e8e8' } }
    },
    // 系列配置（柱状图）
    series: [{
      name: '工时',
      type: 'bar',
      barWidth: '50%',
      // 处理数据，添加渐变色和顶部标签
      data: values.map((val, idx) => ({
        value: val,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      })),
      // 顶部数值标签
      label: {
        show: true,
        position: 'top',
        formatter: '{c} h',
        color: '#333',
        fontSize: 14,
        fontWeight: 600
      },
      // 悬停效果
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#764ba2' },
            { offset: 1, color: '#667eea' }
          ])
        }
      }
    }]
  }
  
  // 设置图表配置
  chartInstance.setOption(option)
}

// 监听工单数据变化，自动更新图表
watch(workOrders, () => {
  nextTick(() => {
    initChart()
  })
}, { deep: true })

// 组件挂载后初始化图表
onMounted(() => {
  nextTick(() => {
    initChart()
  })
  // 监听窗口大小变化，自动调整图表尺寸
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 28px;
  color: #667eea;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.logout-btn {
  color: #999;
}

.logout-btn:hover {
  color: #ff4d4f;
}

.home-main {
  padding: 30px 40px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-card {
  min-height: 500px;
}

.workorder-table {
  padding: 0 24px 24px;
}

.workorder-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #333;
}

.workorder-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f7fa;
}

.chart-card {
  min-height: 500px;
}

.chart-container {
  height: 400px;
  padding: 20px;
}

.add-form {
  padding: 10px 0;
}

.no-permission {
  color: #999;
  font-size: 12px;
}
</style>
