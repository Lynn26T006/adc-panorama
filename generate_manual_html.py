#!/usr/bin/env python3
"""生成软著用户手册 HTML，截图后浏览器打开 → Ctrl+P → 另存为 PDF"""

TITLE = "ADC Panorama 全景数据库系统"

pages = [
    # (标题, 图片文件名, 正文)
    ("封面", "00-cover.png", f"""
        <div class="cover">
            <h1>{TITLE}</h1>
            <p class="subtitle">用户手册</p>
            <p>版本：V1.0</p>
            <p>完成日期：2026 年 5 月</p>
            <p>著作权人：Lynn</p>
        </div>
    """),
    # ── 第2页（纯文字，无截图）──
    ("系统概述", "", """
        <h2>1. 系统概述</h2>
        <p>ADC Panorama 是一个抗体药物偶联物（ADC）全景数据库系统，提供全球已上市及在研 ADC 药物的数据查询、可视化分析和制剂配方管理功能。</p>
        <h3>主要功能模块</h3>
        <ul>
            <li>产品数据检索与筛选</li>
            <li>药品详情（CMC、偶联工艺、制剂冻干工艺）</li>
            <li>3D 可视化图谱</li>
            <li>配方生成器</li>
            <li>用户注册登录、收藏、评论</li>
            <li>管理后台</li>
        </ul>
        <p>技术栈：Next.js + TypeScript + MySQL + Drizzle ORM + Three.js</p>
        <p>数据来源：FDA、EMA、PMDA、NMPA/CDE、ClinicalTrials.gov、PubMed、Google Patents 等公开数据库。</p>
    """),
    # ── 第3页 ──
    ("首页", "03-homepage.png", """
        <h2>2. 首页</h2>
        <p>首页顶部为 Hero 区域，展示网站名称和一句话描述，提供全局搜索框，支持按药品名称、靶点、公司名进行快速检索。</p>
        <p>搜索框下方为六格统计卡片，从数据库实时获取，展示收录药物总数、靶点种类、已上市药物数量、IND 阶段数量、临床试验阶段数量、收录公司数量。</p>
        <p>首页中部嵌入 3D 力导向图，将药品按研发阶段分布在球面的不同纬度带上，用颜色区分阶段。鼠标悬停显示基本信息，点击展开详情面板。</p>
        <p>首页底部提供快速导航卡片：按研发阶段、按热门靶点、按偶联方式三种快捷入口，点击跳转到产品列表页并自动应用筛选条件。</p>
    """),
    # ── 第4页 ──
    ("产品列表", "04-products.png", """
        <h2>3. 产品列表</h2>
        <p>左侧为筛选面板，支持关键词搜索、研发阶段、靶点、适应症、偶联方式、载荷类型、连接子类型等维度。筛选条件以 URL 参数同步，支持浏览器前进后退和链接分享。</p>
        <p>右侧展示产品表格，包含商品名、靶点、适应症、研发阶段、原研公司、偶联方式、批准年份。每项均可点击跳转交叉检索。移动端自动切换为卡片布局。右上角搜索框支持文字搜索，表格上方实时显示匹配总数。底部为分页组件，超过 10 页时出现快捷跳转输入框。</p>
    """),
    # ── 第5页 ──
    ("产品详情", "05-detail.png", """
        <h2>4. 产品详情</h2>
        <p>点击任意药品名称进入详情页，以卡片式布局组织信息：</p>
        <ul>
            <li><strong>基本信息</strong> — 商品名、通用名、靶点、抗体名称与亚型、适应症、原研公司与合作方</li>
            <li><strong>载荷与连接子</strong> — 载荷名称、类型、作用机制、SMILES、结构式图片、连接子名称与类型</li>
            <li><strong>偶联工艺</strong> — 偶联方式、位点、化学反应、DAR 值及分布、纯化方式</li>
            <li><strong>制剂与冻干工艺</strong> — 剂型、冻干参数、缓冲体系、稳定剂、表面活性剂、pH、储存条件、有效期、包材</li>
            <li><strong>分析质控</strong> — CQA、纯度及活性检测方法</li>
            <li><strong>细胞株与序列</strong> — 细胞类型、重链/轻链氨基酸序列</li>
            <li><strong>PDB 结构</strong> — PDB 编号，链接至 RCSB PDB 官网</li>
            <li><strong>专利与来源</strong> — 专利号链接 Google Patents、专利权人、过期日、说明书来源</li>
        </ul>
        <p>底部提供评论区。</p>
    """),
    # ── 第6页 ──
    ("制剂与冻干工艺", "06-formulation.png", """
        <h2>5. 制剂与冻干工艺</h2>
        <p>独立页面专门展示 ADC 药物的制剂配方和冻干工艺数据。顶部统计卡片显示制剂产品总数、冻干粉针数量、已上市 ADC 数量、缓冲体系种类、收录药物总数、稳定剂种类。</p>
        <p>剂型筛选支持"全部 / 冻干粉针 / 注射液"三种切换。缓冲体系筛选按类别过滤。搜索框支持按抗体名称或商品名搜索，实时过滤表格。</p>
        <p>表格列出所有制剂数据产品，包含抗体名称、商品名、剂型、缓冲体系、稳定剂、表面活性剂、pH（颜色编码区分酸碱）、储存条件、有效期。支持分页和跳转。</p>
    """),
    # ── 第7页 ──
    ("配方生成器", "07-recipe.png", """
        <h2>6. 配方生成器</h2>
        <p>制剂页下半部分为配方生成器。左侧选择参数：缓冲体系、稳定剂/赋形剂、表面活性剂、pH 值、储存条件（下拉选项均来自数据库去重归类）。"随机推荐"按钮自动从可用选项中随机选取一组参数。</p>
        <p>点击"生成配方"后，系统查询匹配该参数的药品，在右侧展示匹配产品数量、推荐配方（高频聚合结果，列出缓冲体系、稳定剂、表面活性剂、pH、冻干周期、复溶溶媒、储存条件、有效期、包材的最常见取值）、匹配产品列表（最多 20 条，可点击跳转详情）。已选参数以彩色标签显示在按钮上方。</p>
    """),
    # ── 第8页 ──
    ("可视化图谱", "08-visualize.png", """
        <h2>7. 可视化图谱</h2>
        <p>以 Three.js 渲染的 3D 力导向球体展示在研 ADC 药物的分布。球体表面按研发阶段分纬度带分布节点，颜色区分阶段，每节点附带品牌名标签。外层包含经纬网、大气辉光、星空粒子背景。</p>
        <p>交互：鼠标拖拽旋转球体、滚轮缩放，悬停节点显示浮动提示，点击弹出详情面板（靶点、阶段、公司、载荷、连接子、偶联、DAR、抗体、适应症、生产商、细胞株、SMILES、PDB、来源），面板内链接跳转详情页。自动旋转在选中药品时暂停。底部图例标注各阶段颜色。</p>
    """),
    # ── 第9页 ──
    ("用户系统", "09-auth.png", """
        <h2>8. 用户系统</h2>
        <p><strong>登录</strong>：输入邮箱和密码，JWT 会话保持登录。</p>
        <p><strong>注册</strong>：填写邮箱、密码、显示名称。密码经 bcrypt 哈希存储。</p>
        <p><strong>个人中心</strong>：显示用户信息和数据提交列表，标注审核状态。管理员拒绝时显示审核说明。</p>
        <p>导航栏：登录后显示头像首字母和名称，下拉菜单含个人中心和退出。管理员额外显示"管理后台"入口。未登录用户可正常浏览和搜索，但收藏、评论、提交数据需登录。</p>
    """),
    # ── 第10页 ──
    ("收藏功能", "10-bookmark.png", """
        <h2>9. 收藏功能</h2>
        <p>产品详情页标题旁有星形收藏按钮，点击切换收藏/取消。未登录时不可用。数据存入数据库与用户绑定。</p>
    """),
    # ── 第11页 ──
    ("评论功能", "11-comments.png", """
        <h2>10. 评论功能</h2>
        <p>详情页底部评论区，已登录用户可输入多行文本发表评论。每条显示用户头像首字母、显示名称、发布时间、内容。作者可编辑或删除自己的评论。支持回复嵌套，子评论缩进显示。未登录用户看到"登录后参与讨论"提示。</p>
    """),
    # ── 第12页 ──
    ("管理后台", "12-admin.png", """
        <h2>11. 管理后台</h2>
        <p>管理员通过导航栏进入。统计区显示用户总数、提交总数、待审核数量。审核区列出待审核提交，点击展开查看详情，可选择批准（数据入库并通知用户）或拒绝（填写审核说明并通知）。审核记录区展示已处理的历史记录，标注审核人和处理时间。</p>
    """),
    # ── 第13页 ──
    ("数据提交", "13-submit.png", """
        <h2>12. 数据提交</h2>
        <p>登录用户可通过"提交数据"进入众包提交页面。表单包含药品名称、各项可选数据字段（靶点、阶段、公司、载荷信息、偶联工艺、制剂信息等）、参考来源 URL。提交后进入待审核队列，管理员审核通过后自动入库。用户可在个人中心跟踪状态。</p>
    """),
    # ── 第14页 ──
    ("数据来源与版权", "14-footer.png", """
        <h2>13. 数据来源与免责声明</h2>
        <p><strong>数据来源：</strong>FDA Drugs@FDA · EMA EPAR · PMDA · NMPA/CDE · ClinicalTrials.gov · Google Patents · PubMed · ADCdb · PubChem · RCSB PDB</p>
        <p><strong>免责声明：</strong>本数据库内容仅供学术研究和参考使用，不构成医学建议、诊断或治疗推荐。用药决策请咨询专业医师。数据来源于公开数据库，作者不对其准确性和完整性做任何保证。</p>
        <p><strong>版权：</strong>© 2026 Lynn · 保留所有权利</p>
    """),
]

css = """
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; font-size: 13px; line-height: 1.8; color: #222; max-width: 800px; margin: 0 auto; padding: 20px; }
h1 { font-size: 26px; margin-bottom: 8px; }
h2 { font-size: 17px; margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
h3 { font-size: 14px; margin: 10px 0 4px; }
p { margin: 5px 0; }
ul { margin: 5px 0 5px 20px; }
li { margin: 2px 0; }

.cover { text-align: center; padding-top: 120px; }
.cover h1 { font-size: 30px; margin-bottom: 16px; }
.cover .subtitle { font-size: 20px; margin-bottom: 40px; color: #555; }
.cover p { font-size: 15px; margin: 8px 0; color: #444; }

.screenshot { text-align: center; margin: 16px 0; }
.screenshot img { max-width: 100%; max-height: 420px; border: 1px solid #ddd; border-radius: 4px; }
.screenshot .hint { font-size: 11px; color: #999; margin-top: 4px; }

.page { page-break-after: always; min-height: 90vh; }
.page:last-child { page-break-after: auto; }

.header { text-align: right; font-size: 10px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 16px; }

@media print {
    body { padding: 0; }
    .page { min-height: auto; }
}

.screenshot .missing { display: inline-block; width: 100%; height: 200px; border: 2px dashed #ccc; border-radius: 4px; color: #bbb; font-size: 13px; line-height: 200px; }
"""

html_parts = ['<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">',
              '<title>', TITLE, ' V1.0 用户手册</title><style>', css, '</style></head><body>']

import os, base64

# 使用脚本所在目录为基准，避免 CWD 问题
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
screenshot_dir = os.path.join(BASE_DIR, "manual_screenshots")
base64_cache = {}

def img_tag(fn, title):
    if not fn:
        return ""
    if fn not in base64_cache:
        path = os.path.join(screenshot_dir, fn)
        if os.path.isfile(path):
            with open(path, "rb") as img:
                b64 = base64.b64encode(img.read()).decode()
            base64_cache[fn] = f'data:image/png;base64,{b64}'
            print(f"  embedded: {fn} ({len(b64)//1024}KB)")
        else:
            base64_cache[fn] = ""
            print(f"  MISSING: {path}")
    if base64_cache[fn]:
        return f'<img src="{base64_cache[fn]}" alt="{title}" style="max-width:100%;max-height:420px;border:1px solid #ddd;border-radius:4px">'
    return f'<div class="missing">📷 {fn}<br><span style="font-size:11px">缺少文件: {screenshot_dir}/{fn}</span></div>'

for i, (title, fn, body) in enumerate(pages, 1):
    html_parts.append(f'<div class="page">')
    html_parts.append(f'<div class="header">{TITLE}  V1.0 &nbsp; 第 {i} 页 / 共 {len(pages)} 页</div>')
    if i > 1 and fn:
        html_parts.append(f'<div class="screenshot">')
        html_parts.append(img_tag(fn, title))
        html_parts.append(f'</div>')
    html_parts.append(body)
    html_parts.append('</div>')

html_parts.append('</body></html>')

outpath = os.path.join(BASE_DIR, "软著用户手册.html")
with open(outpath, "w", encoding="utf-8") as f:
    f.write("\n".join(html_parts))

# 创建截图目录
import os
os.makedirs(screenshot_dir, exist_ok=True)

print(f"Done: {outpath} ({len(pages)} 页)")
print(f"浏览器打开 → Ctrl+P → 另存为 PDF 即可提交")
