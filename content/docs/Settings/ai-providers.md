---
weight: 2
title: "AI Providers"
description: ""
icon: "article"
date: "2025-02-20T20:54:21-05:00"
lastmod: "2026-03-20T00:00:00-05:00"
toc: true
---

![ai-providers](https://storage.googleapis.com/mule-storage/ai-providers.png)

Mule supports configuring multiple AI providers. These are used to provide the models that will be used by Agents.

Mule uses [pi](https://pi.dev) as its AI runtime, which supports a wide range of providers:

**API Key Authentication:**
* OpenAI
* Anthropic
* Google Gemini
* Azure OpenAI
* Google Vertex
* Amazon Bedrock
* Mistral
* Groq
* Cerebras
* xAI
* OpenRouter
* Vercel AI Gateway
* OpenCode Zen

**Subscription Support:**
* Anthropic Claude Pro/Max
* OpenAI ChatGPT Plus/Pro
* GitHub Copilot
* Google Gemini CLI

For local models, you can also configure:
* Ollama

All providers support model switching, tool assignment, and dynamic configuration.

Not all fields are required—only the information necessary to interact with your chosen provider must be provided.