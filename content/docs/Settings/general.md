---
weight: 1
title: "General"
description: ""
icon: "article"
date: "2025-02-20T20:53:59-05:00"
lastmod: "2025-02-20T20:53:59-05:00"
toc: true
---

![general-settings](https://storage.googleapis.com/mule-storage/general-settings.png)

Currently the only thing that gets configured under general is a GitHub token. This token is used to retrieve:

* Repositories
* Issues
* Pull Requests

And various details such as comments and reactions about the above items.

In the future we will have the ability to also use this token to clone a repository. For now that is limited to SSH auth on the system where mule is running.

For more information on creating a GitHub Token, check out [their documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)