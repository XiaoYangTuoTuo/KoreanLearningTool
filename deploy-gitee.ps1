# 1. 构建项目
Write-Host "正在构建项目..."
cd frontend
npm run build

# 2. 进入构建输出目录
cd dist

# 3. 初始化临时 Git 仓库
git init
git checkout -b gitee-pages

# 4. 添加所有文件
git add -A
git commit -m "deploy"

# 5. 推送到 Gitee (需要用户填入仓库地址)
$gitee_repo = Read-Host "请输入您的 Gitee 仓库地址 (例如 https://gitee.com/username/project.git)"

if ($gitee_repo) {
    Write-Host "正在推送到 Gitee..."
    git remote add origin $gitee_repo
    git push -f origin gitee-pages
    Write-Host "部署完成！请去 Gitee 仓库设置页面开启 Gitee Pages 服务，选择 gitee-pages 分支。"
} else {
    Write-Host "未输入仓库地址，已取消推送。"
}

# 6. 清理
cd ../..
Write-Host "脚本执行结束。"
