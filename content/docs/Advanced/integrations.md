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

Mule currently supports 8+ production-ready integrations:

### Discord

Connect Mule to Discord channels to:
- Receive commands via mentions and slash commands
- Send notifications about repository activity
- Share results of AI-generated code
- Generate RSS feeds from Discord messages
- Persistent memory integration for conversation context

### Matrix

Connect Mule to Matrix rooms for:
- Secure, encrypted communication
- Command and control of Mule agents
- ChromeM-based persistent memory for context retention
- Status updates and notifications
- File sharing and code snippets

### gRPC API

External API access for:
- Full workflow execution control
- Agent and provider management
- Asynchronous execution tracking
- Type-safe external system integration
- Production-ready external interfaces

### RSS Feeds

Generate and consume RSS feeds:
- Multi-instance RSS generation
- Discord message feeds
- Hacker News integration
- Custom feed configuration
- Automatic content aggregation

### Memory System

ChromeM-based persistent memory:
- Vector database backend for semantic search
- Conversation history retention
- Context enhancement for agents
- Integration-specific memory spaces
- RAG capabilities for improved responses

### HTTP API Integration

REST API endpoints for:
- External system communication
- Webhook reception
- Status queries
- Workflow triggers
- Agent management

### System Integration

Local system operations:
- Command execution
- File system operations
- Process management
- Environment interaction
- Script execution

### Task Integration

Advanced task management:
- Cron-based scheduled execution
- Workflow triggering
- Task queue management
- Dependency handling
- Retry and error recovery

## Configuration

Each integration is configured in the settings section with its own specific parameters:

### Discord Configuration

```yaml
discord:
  enabled: true
  messageOnConnect: true
  botToken: your-discord-bot-token
  guildId: your-server-id
  channelId: your-channel-id
```

- **enabled**: Toggle Discord integration on/off
- **messageOnConnect**: Send a notification when Mule connects
- **botToken**: Your Discord bot's authentication token
- **guildId**: ID of the server (guild) to connect to
- **channelId**: ID of the default channel for messages

### Matrix Configuration

```yaml
matrix:
  enabled: true
  messageOnConnect: true
  homeServer: https://matrix.org
  userId: '@mule:matrix.org'
  accessToken: your-matrix-access-token
  deviceId: your-device-id
  recoveryKey: your-recovery-key
  pickleKey: your-pickle-key
  roomId: '!roomid:matrix.org'
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