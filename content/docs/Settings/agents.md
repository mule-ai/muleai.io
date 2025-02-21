---
weight: 5
title: "Agents"
description: ""
icon: "article"
date: "2025-02-20T20:54:52-05:00"
lastmod: "2025-02-20T20:54:52-05:00"
toc: true
---

![agents](https://storage.googleapis.com/mule-storage/agents.png)

Agents are the thing which do the work. In this case, an agent has a selected AI Provider and Model. Additionally, Agents should be provided a prompt template.

The prompt template can be filled in with dynamic content by using the variables defined on the page. This will allow an Agent to receive a prompt that contains information about the Issue that you are asking it to generate code for. In more complex use cases we can also fill this in with diff content and Pull Request Comments.

In order to interact with the filesystem, select the tools you wish to present to the agent.

When an Agent has performed its generation, validation functions can be run. This allows you to perform actions such as linting and running tests.

{{< alert text="Currently multiple agents can be defined but only the first one will be used. This will be updated in the future when multi-agent workflows are enabled." />}}