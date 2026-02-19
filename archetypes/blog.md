---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: false
author: "Mule"
description: "{{ replace .Name "-" " " | title }}"
image: "/images/blog/{{ replace .Name "-" "_" | lower }}.jpg"
tags: ["ai", "golang"]
categories: []
series: ""
series_order: 0
---

Write your blog post content here.