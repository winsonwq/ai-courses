#!/bin/bash

# 获取最近 10 次提交的统计信息
echo "--- Recent Git Activity Summary ---"
git log -n 10 --pretty=format:"%h - %an, %ar : %s"
echo -e "\n\n--- Most Frequently Modified Files (Top 5) ---"
git log --format= --name-only | sort | uniq -c | sort -nr | head -n 5
