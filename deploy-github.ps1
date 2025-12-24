# 1. 构建项目
Write-Host "正在构建项目..."
cd frontend
npm run build

# 2. 进入构建输出目录
cd dist

# 3. 初始化临时 Git 仓库
git init
git checkout -b gh-pages

# 4. 添加所有文件
git add -A
git commit -m "deploy to github pages"

# 5. 推送到 GitHub
# 使用您之前提供的 GitHub 仓库地址
$github_repo = "https://github.com/XiaoYangTuoTuo/KoreanLearningTool.git"

Write-Host "正在推送到 GitHub Pages 分支..."
git remote add origin $github_repo
git push -f origin gh-pages

# 6. 清理
cd ../..
Write-Host "推送完成！请前往 GitHub 仓库设置页面开启 Pages 服务。"
