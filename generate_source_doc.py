#!/usr/bin/env python3
"""生成软著源代码文档：前1500行 + 后1500行，每页50行，页眉标注软件名称和版本号"""

HEADER = "ADC Panorama 全景数据库系统  V1.0"

# Combine source files in logical order
files = [
    # Types & DB Schema
    "src/lib/types.ts",
    "src/lib/db/schema.ts",
    "src/lib/db/index.ts",
    "src/lib/data.ts",
    "src/lib/api-client.ts",
    "src/lib/auth.ts",
    # Components
    "src/components/Providers.tsx",
    "src/components/ClickableField.tsx",
    "src/components/SearchBar.tsx",
    "src/components/StatsCards.tsx",
    "src/components/Pagination.tsx",
    "src/components/FilterPanel.tsx",
    "src/components/BookmarkButton.tsx",
    "src/components/CommentSection.tsx",
    "src/components/ForceGraph.tsx",
    "src/components/MeteorBackground.tsx",
    "src/components/Navbar.tsx",
    "src/components/ProductCard.tsx",
    "src/components/ProductDetail.tsx",
    "src/components/ProductTable.tsx",
    # Pages
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/products/page.tsx",
    "src/app/products/[id]/page.tsx",
    "src/app/formulation/page.tsx",
    "src/app/visualize/page.tsx",
    "src/app/login/page.tsx",
    "src/app/register/page.tsx",
    "src/app/profile/page.tsx",
    "src/app/submit/page.tsx",
    "src/app/admin/page.tsx",
    # API Routes
    "_api/drugs/route.ts",
    "_api/drugs/[id]/route.ts",
    "_api/formulation/route.ts",
    "_api/stats/route.ts",
    "src/app/api/auth/[...nextauth]/route.ts",
    "src/app/api/auth/register/route.ts",
    "src/app/api/drugs/route.ts",
    "src/app/api/drugs/[id]/route.ts",
    "src/app/api/formulation/route.ts",
    "src/app/api/formulation/recipe/route.ts",
    "src/app/api/stats/route.ts",
    "src/app/api/bookmarks/route.ts",
    "src/app/api/bookmarks/[drugId]/route.ts",
    "src/app/api/comments/route.ts",
    "src/app/api/comments/[id]/route.ts",
    "src/app/api/comments/drug/[drugId]/route.ts",
    "src/app/api/notifications/route.ts",
    "src/app/api/notifications/[id]/route.ts",
    "src/app/api/submissions/route.ts",
    "src/app/api/admin/dashboard/route.ts",
    "src/app/api/admin/submissions/route.ts",
    "src/app/api/admin/submissions/[id]/route.ts",
]

all_lines = []
for f in files:
    try:
        with open(f) as fh:
            all_lines.append(f"\n// ==== {f} ====\n")
            all_lines.extend(fh.readlines())
    except FileNotFoundError:
        print(f"Warning: {f} not found, skipping")

total = len(all_lines)
print(f"Total source lines: {total}")

lines_per_page = 50
part1 = all_lines[:1500]
part2 = all_lines[-1500:]

def write_pages(out, lines, start_page=1):
    page = start_page
    for i in range(0, len(lines), lines_per_page):
        chunk = lines[i:i + lines_per_page]
        out.write(f"\f{HEADER}    第 {page} 页\n\n")
        out.writelines(chunk)
        page += 1
    return page

with open("软著源代码文档.txt", "w", encoding="utf-8") as out:
    # Cover
    out.write(f"{'=' * 60}\n")
    out.write(f"  {HEADER}\n")
    out.write(f"  源代码文档（前1500行 + 后1500行）\n")
    out.write(f"  文件总数: {len(files)} 个\n")
    out.write(f"  源代码总行数: {total} 行\n")
    out.write(f"  提交行数: 3000 行\n")
    out.write(f"  页数: {3000 // lines_per_page} 页 (每页{lines_per_page}行)\n")
    out.write(f"{'=' * 60}\n\n")

    # Part 1: First 1500 lines
    out.write(f"{'─' * 60}\n")
    out.write(f"  第一部分：源代码前 1500 行\n")
    out.write(f"{'─' * 60}\n")
    write_pages(out, part1, start_page=1)

    # Part 2: Last 1500 lines
    out.write(f"\n\n{'─' * 60}\n")
    out.write(f"  第二部分：源代码后 1500 行\n")
    out.write(f"{'─' * 60}\n")
    write_pages(out, part2, start_page=31)

print(f"Done: 软著源代码文档.txt ({3000} lines, {3000 // 50} pages)")
print(f"Part 1: lines 1-1500 of source")
print(f"Part 2: lines {total-1499}-{total} of source")
