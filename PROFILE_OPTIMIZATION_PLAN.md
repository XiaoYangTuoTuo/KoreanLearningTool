# 个人中心与头部导航优化计划 (PROFILE_OPTIMIZATION_PLAN.md)

本计划旨在完善用户系统体验，增加个性化设置、数据管理以及更丰富的交互功能。

## 1. 数据存储层升级 (`src/store/useStore.ts`)

需要扩展现有的 `useUserStore` 以支持用户信息和偏好设置。

### 新增状态字段
- **`profile`**: 用户基本资料
  - `username`: 昵称 (默认: "Guest Barista")
  - `avatar`: 头像标识 (支持 emoji 或预设图标 ID)
  - `bio`: 个人签名 (可选)
- **`settings`**:由于偏好设置
  - `soundEnabled`: 音效开关 (默认: true)
  - `dailyGoal`: 每日练习句数目标 (默认: 10)
  - `theme`: 主题设置 ('light' | 'dark' | 'system')

### 新增 Actions
- `updateProfile(profile)`: 更新个人资料
- `updateSettings(settings)`: 更新设置
- `importData(data)`: 导入备份数据

## 2. 顶部导航栏优化 (`src/components/Layout.tsx`)

### 功能增强
- **动态头像展示**: 显示用户的头像和昵称，而非静态的 "A" 和 "Barista"。
- **下拉菜单 (Dropdown Menu)**: 点击头像触发。
  - **个人中心**: 跳转至 `/profile`
  - **偏好设置**: 快速切换音效/主题 (可选)
  - **数据管理**: 快速导出数据
  - **退出/重置**: 清除本地数据 (模拟退出)

## 3. 会员中心页面重构 (`src/pages/Profile.tsx`)

### 3.1 头部区域 (Header Card)
- **编辑模式**: 点击 "设置" 按钮或头像，弹出「编辑资料」模态框。
- **资料修改**:
  - 修改昵称输入框。
  - 头像选择器 (提供一组咖啡/动物相关的 Emoji 或 Icon 供选择)。
  - 每日目标设定滑块。

### 3.2 设置与数据管理 (Settings & Data)
新增一个独立的「设置」标签页或模态框，包含：
- **常规设置**:
  - 音效开关 (打字声、正确/错误提示音)
  - 每日目标设置 (影响打卡日历的达成标准)
- **数据安全**:
  - **导出备份**: 将当前所有进度 (History, Mistakes, Profile) 导出为 JSON 文件。
  - **恢复数据**: 上传 JSON 文件恢复进度。
  - **危险区域**: 重置所有数据。

### 3.3 统计可视化增强
- **目标达成度**: 在概览页增加「今日目标」进度环。
- **徽章系统**: 点击徽章可查看详细获取条件。

## 4. 执行步骤

1.  **Step 1**: 修改 `useStore.ts`，添加新的 State 和 Actions。
2.  **Step 2**: 创建 `ProfileEditModal` 组件 (或直接在 Profile 页实现)，用于修改资料。
3.  **Step 3**: 更新 `Layout.tsx`，实现动态头像和下拉菜单。
4.  **Step 4**: 更新 `Profile.tsx`，集成设置和数据管理功能。
5.  **Step 5**: 验证数据持久化和导入导出功能。

---
*开始执行后，将优先完成 Store 的更新，确保数据流转正常。*
