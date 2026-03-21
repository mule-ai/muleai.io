---
weight: 2
title: "AI Providers"
description: "Configure AI providers including OpenAI, Anthropic, Gemini, Ollama, and custom providers"
icon: "article"
date: "2025-02-20T20:54:21-05:00"
lastmod: "2026-03-21T00:00:00-05:00"
toc: true
---

![ai-providers](https://storage.googleapis.com/mule-storage/ai-providers.png)

Mule supports configuring multiple AI providers. These are used to provide the models that will be used by Agents.

Mule uses [pi](https://pi.dev) as its AI runtime, which supports a wide range of providers:

## Subscription Providers (OAuth)

Use `/login` in interactive mode for OAuth-based authentication:

* Claude Pro/Max
* ChatGPT Plus/Pro (Codex)
* GitHub Copilot
* Google Gemini CLI
* Google Antigravity

## API Key Authentication

Configure via environment variables:

| Provider | Environment Variable |
|----------|---------------------|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` |
| Mistral | `MISTRAL_API_KEY` |
| Groq | `GROQ_API_KEY` |
| Cerebras | `CEREBRAS_API_KEY` |
| xAI | `XAI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` |
| ZAI | `ZAI_API_KEY` |
| OpenCode Zen | `OPENCODE_API_KEY` |
| Hugging Face | `HF_TOKEN` |
| Kimi For Coding | `KIMI_API_KEY` |
| MiniMax | `MINIMAX_API_KEY` |

## Cloud Providers

**Azure OpenAI:**
```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.openai.azure.com
export AZURE_OPENAI_API_VERSION=2024-02-01
```

**Amazon Bedrock:**
```bash
export AWS_PROFILE=your-profile
# Or IAM keys
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
# Optional region
export AWS_REGION=us-west-2
```

**Google Vertex AI:**
```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_CLOUD_LOCATION=us-central1
```

## Local Models

For local models, configure via `models.json`:

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "llama3.1:8b" },
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

Also supports LM Studio and vLLM or any provider that speaks OpenAI Completions, OpenAI Responses, Anthropic Messages, or Google Generative AI.

## Custom Providers

For custom providers with specific API requirements, you can create a pi extension to register custom provider implementations. See the [pi custom provider documentation](https://pi.dev/docs/providers#custom-providers) for details.

All providers support model switching, tool assignment, and dynamic configuration.

Not all fields are required—only the information necessary to interact with your chosen provider must be provided.