---
weight: 2
title: "Integration Capabilities"
description: "Connecting Mule with external messaging and notification systems"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2025-05-19T12:00:00-05:00"
toc: true
---

Mule can integrate with external messaging and notification platforms, allowing it to receive commands and send updates about its activities. This enables seamless collaboration between AI agents and human teams.

## Supported Integrations

Mule currently supports the following integrations:

### Discord

Connect Mule to Discord channels to:
- Receive commands via mentions and slash commands
- Send notifications about repository activity
- Share results of AI-generated code
- Provide status updates on ongoing tasks

### Matrix

Connect Mule to Matrix rooms for:
- Secure, encrypted communication
- Command and control of Mule agents
- Status updates and notifications
- File sharing and code snippets

### Task Integration

Internal integration for workflow task management:
- Schedule and queue tasks
- Track task completion status
- Handle dependencies between tasks
- Manage retries and error handling

## Configuration

Each integration is configured in the settings section with its own specific parameters:

### Discord Configuration

```json
{
  "discord": {
    "enabled": true,
    "messageOnConnect": true,
    "botToken": "your-discord-bot-token",
    "guildId": "your-server-id",
    "channelId": "your-channel-id"
  }
}
```

- **enabled**: Toggle Discord integration on/off
- **messageOnConnect**: Send a notification when Mule connects
- **botToken**: Your Discord bot's authentication token
- **guildId**: ID of the server (guild) to connect to
- **channelId**: ID of the default channel for messages

### Matrix Configuration

```json
{
  "matrix": {
    "enabled": true,
    "messageOnConnect": true,
    "homeServer": "https://matrix.org",
    "userId": "@mule:matrix.org",
    "accessToken": "your-matrix-access-token",
    "deviceId": "your-device-id",
    "recoveryKey": "your-recovery-key",
    "pickleKey": "your-pickle-key",
    "roomId": "!roomid:matrix.org"
  }
}
```

- **enabled**: Toggle Matrix integration on/off
- **messageOnConnect**: Send a notification when Mule connects
- **homeServer**: URL of your Matrix server
- **userId**: Matrix user ID for the bot
- **accessToken**: Authentication token for the Matrix account
- **deviceId**: Device identifier for end-to-end encryption
- **recoveryKey**: Key for recovering encrypted messages
- **pickleKey**: Key for session storage
- **roomId**: ID of the default room for messages

## Interaction Patterns

### Command Processing

Integrations support different command patterns:

1. **Mention-based**: Trigger Mule by mentioning it in a message
   ```
   @Mule help
   ```

2. **Slash commands**: Use slash commands for specific actions
   ```
   /mule status
   ```

3. **Direct messages**: Send private messages to the Mule bot

### Notifications

Mule can send various notifications:

- **Issue updates**: When new issues are assigned to Mule
- **PR creation**: When a pull request is created
- **Validation results**: Success or failure of code validation
- **Error alerts**: When something goes wrong

## Creating Custom Integrations

Mule's integration system is designed to be extensible. To create a custom integration:

1. Implement the `Integration` interface:
   ```go
   type Integration interface {
       Call(name string, data any) (any, error)
       GetChannel() chan any
       Name() string
       Send(message any) error
       RegisterTrigger(trigger string, data any, channel chan any)
   }
   ```

2. Add your integration to the integration loader

3. Configure it in the settings

## Security Considerations

When setting up integrations:

- Store tokens and credentials securely
- Use minimal permissions required for functionality
- For Discord, create a dedicated bot with limited server access
- For Matrix, use a dedicated account with room-specific permissions

## Example: Setting Up Discord Integration

1. **Create a Discord bot**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Add a bot to your application
   - Copy the bot token

2. **Invite the bot to your server**:
   - Generate an OAuth2 URL with bot scope and appropriate permissions
   - Visit the URL to add the bot to your server

3. **Configure in Mule**:
   - Open Mule settings
   - Navigate to the Integrations section
   - Enable Discord integration
   - Enter your bot token, server ID, and channel ID
   - Save settings

4. **Test the integration**:
   - Mention the bot in your Discord channel
   - The bot should respond and be ready to process commands