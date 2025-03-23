#!/usr/bin/env python3
import os
import sys
import datetime

def add_yaml_header(file_path, title=""):
    """
    给Markdown文件添加YAML头部
    
    参数:
    file_path -- Markdown文件路径
    title -- 文章标题，默认为空
    """
    # 获取当前时间
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # 创建YAML头部
    yaml_header = f"""---
layout:     post
title:      "{title}"
date:       {current_time}
author:     "YuuPin"
header-img: "img/83506320_p0.png"
catalog: true
tags:
---

"""
    
    # 读取原文件内容
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
    except FileNotFoundError:
        print(f"错误: 找不到文件 '{file_path}'")
        return False
    except Exception as e:
        print(f"读取文件时出错: {e}")
        return False
    
    # 检查文件是否已经有YAML头部
    if content.startswith('---'):
        print("文件似乎已经有YAML头部了")
        return False
    
    # 写入新内容
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(yaml_header + content)
        print(f"成功添加YAML头部到 '{file_path}'")
        return True
    except Exception as e:
        print(f"写入文件时出错: {e}")
        return False

def main():
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("用法: python add_yaml_header.py <markdown文件路径> [标题]")
        return
    
    file_path = sys.argv[1]
    
    # 检查文件扩展名
    if not file_path.endswith(('.md', '.markdown')):
        print("警告: 文件不是Markdown格式（.md或.markdown）")
        response = input("是否继续? (y/n): ")
        if response.lower() != 'y':
            return
    
    # 获取标题（如果提供）
    title = ""
    if len(sys.argv) > 2:
        title = sys.argv[2]
    
    # 添加YAML头部
    add_yaml_header(file_path, title)

if __name__ == "__main__":
    main()