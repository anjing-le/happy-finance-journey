![Happy Finance Journey：知识、最佳实践、活动；一起学，一起做，不断变好](assets/journey-poster.png)

- [知识](knowledge/README.md)：理解金融概念、机制与它们的适用范围。
- [最佳实践](practices/README.md)：整理有依据、能复查的研究与判断方法。
- [活动](activities/README.md)：从具体问题出发，学习、实践、验证并复盘。

[进入网站](https://happy-finance.anjing.cc) · [GitHub Pages 备用入口](https://anjing-le.github.io/happy-finance-journey/overview.html)

## 目标

Happy Finance Journey 是我对金融领域的长期学习与实践记录，以股票投资与交易为最终实践方向。希望把值得理解的问题、亲自检验的方法和可参与的活动逐步整理出来，让读者能直接阅读、查证和实践，不需要先熟悉仓库结构，也不需要使用特定 AI 工具。

当前先积累知识与最佳实践，活动暂缓。学习范围沿用已收录的两条主线与 12 个章节，新增主题按实际需要确定；不把未经验证的观点写成结论。

## 维护规则

- **开始维护**：先读本页和目标模块 README；设计活动时再读[共同原则](activities/DESIGN.md)。仓库文件是接续工作的依据。
- **内容组织**：一份内容维护一份 Markdown，用相对链接串联。三个模块先平铺；有足够内容和明确用途时再细分。
- **证据与时效**：事实注明来源；涉及数据、市场、政策或规则时记录对应时间、地区与适用条件。区分已确认事实、推测、个人观点和待验证问题。
- **最佳实践**：写清解决的问题、做法、适用条件、验证依据与限制。个人经验不直接升格为普遍结论；草稿不标成已验证。
- **活动**：围绕具体问题设置目标、过程和可检查的成果。活动中按需引用知识和最佳实践，不重复维护正文。
- **公开边界**：不公开私人账户、交易记录、凭据或未经授权的材料；案例需说明数据来源，示例与真实记录分开。
- **迭代发布**：提出问题 → 查证与实践 → 记录结果 → 复盘修订。修改 Markdown 后检查链接，运行 `npm run build`，再同步发布；网页由内容源构建，不另行维护正文。

## 待办

框架已建立，[知识学习脉络](knowledge/README.md)已收录两条主线和 12 个章节；它是待学范围，具体正文与方法尚未验证。当前先积累知识与最佳实践，活动暂缓。

- [ ] 选第一个真实金融问题，确定所需知识与来源。
- [ ] 从亲自实践过的方法中选一项，写出依据、适用条件和限制。
- [ ] 活动暂缓；恢复时为第一个活动确定目标、参与基础和可检查的成果。

## 前端工程

内容和呈现分别维护在同一个仓库：

- `knowledge/`、`practices/`、`activities/`：Markdown 内容，继续作为唯一正文来源。
- `src/`：React + TypeScript 页面组件与样式。
- `scripts/content.mjs`：读取 Markdown、生成章节和文章数据，检查本地文档链接并清理 HTML。
- `scripts/prerender.mjs`：预渲染完整 HTML 到 `dist/`；客户端接管阅读浮窗与手机栏目切换。
- `assets/`：原始公共素材；构建时复制到网站。

### 本地开发

需要 Node.js 22.12+。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

开发服务器更新 Markdown 后运行 `npm run content` 即可刷新内容。生成数据和构建产物不提交。新增知识或实践文章时，直接在对应目录添加 Markdown；网站自动列出文章，章节关联继续在模块 README 中添加链接。不需要手改 HTML 或 JSON。

### 发布

- Cloudflare Pages 项目：`happy-finance-journey`，域名：`happy-finance.anjing.cc`。
- 构建命令：`npm run build`；输出目录：`dist`；Node.js：22。
- GitHub `main` 更新触发 Cloudflare 构建；部署钩子由仓库 secret `CF_PAGES_DEPLOY_HOOK` 保存。
- GitHub Pages 由 Actions 构建，使用 `BASE_PATH=/happy-finance-journey/`。
- `overview.html` 由同一前端工程生成，兼容旧收藏地址。

继续迭代：先维护工程与框架，再逐篇打磨内容，最后根据真实使用反馈改进。

呈现采用左、中、右三列：知识、最佳实践、活动。首页不展示品牌大标题、海报或宣传文案；知识主线作为每个章节标题左侧的标签，章节保持同层卡片，点击后用阅读浮窗展示。手机端横向滑动或点击栏目切换。
