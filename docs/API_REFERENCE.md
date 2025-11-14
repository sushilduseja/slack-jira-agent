# API Reference

Detailed specification of the workflow blocks, API endpoints, and data structures.

## Workflow Blocks

### 1. Slack Message Trigger

**Type:** Webhook Trigger  
**Event:** `app_mention`  

**Input Payload:**
```json
{
  "body": {
    "event": {
      "type": "app_mention",
      "user": "U12345678",
      "text": "<@U87654321> Create a new user dashboard",
      "ts": "1699999999.000100",
      "channel": "C12345678",
      "event_ts": "1699999999.000100"
    },
    "event_id": "Ev123456789",
    "event_time": 1699999999
  }
}
```

**Output:**
```json
{
  "userId": "U12345678",
  "messageText": "<@U87654321> Create a new user dashboard",
  "timestamp": "1699999999.000100",
  "channelId": "C12345678",
  "eventId": "Ev123456789"
}
```

---

### 2. Sanitize Message Text

**Type:** JavaScript Function

**Input Variables:**
```javascript
{
  userId: string,
  messageText: string,
  timestamp: string,
  channelId: string,
  eventId: string
}
```

**Processing:**
```javascript
const cleanText = messageText
  .replace(/<@[A-Z0-9]+>/g, '')  // Remove @mentions
  .replace(/^\\s+|\\s+$/g, '');   // Trim whitespace

// Validation
if (cleanText.length < 10) {
  throw new Error('Message too short');
}
```

**Output:**
```javascript
{
  ...input,
  cleanText: "Create a new user dashboard"
}
```

---

### 3. LLM Analysis (Claude Sonnet 4)

**Type:** Agent Block (Anthropic)  
**API:** https://api.anthropic.com/v1/messages

**Request:**
```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ANTHROPIC_API_KEY}" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1000,
    "temperature": 0.3,
    "system": "You are a technical task analyzer...",
    "messages": [{
      "role": "user",
      "content": "Create a new user dashboard"
    }]
  }'
```

**Response:**
```json
{
  "id": "msg_123456",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "TITLE: Build new user dashboard\nDESCRIPTION: Create responsive dashboard showing user stats..."
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 450
  }
}
```

---

### 4. Parse LLM Output

**Type:** JavaScript Function

**Input Variables:**
```javascript
{
  llm_output: string,  // Full response from Claude
  ...previousData
}
```

**Regex Patterns:**
```javascript
// Extract field values using regex
const titleMatch = output.match(/TITLE:\s*(.+?)(?=\n|$)/i);
const complexityMatch = output.match(/COMPLEXITY:\s*(\d+)/i);
const priorityMatch = output.match(/PRIORITY:\s*(Low|Medium|High|Critical)/i);
const hoursMatch = output.match(/HOURS:\s*(\d+)/i);
const modulesMatch = output.match(/MODULES:\s*(.+?)(?=\n[A-Z]+:|$)/i);
```

**Output:**
```javascript
{
  ...input,
  task: {
    title: "Build new user dashboard",
    description: "Create responsive dashboard...",
    complexity: 4,
    priority: "High",
    hours: 8,
    modules: ["frontend", "backend", "database"],
    labels: ["feature", "dashboard"]
  }
}
```

---

### 5. Format Timestamp

**Type:** JavaScript Function

**Input:**
```javascript
{
  timestamp: "1699999999.000100"
}
```

**Processing:**
```javascript
const date = new Date(parseFloat(timestamp) * 1000);
const formatted = date.toLocaleString('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
```

**Output:**
```javascript
{
  formattedTimestamp: "Nov 14, 2024, 10:20",
  originalTimestamp: 1699999999.000100
}
```

---

### 6. Jira Cloud REST API v3

**Endpoint:** POST `/rest/api/3/issues`  
**Authentication:** Basic Auth (email:api_token)

**Request:**
```bash
curl -X POST \
  -u "user@company.com:JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": {
        "key": "PROJ"
      },
      "summary": "Build new user dashboard",
      "description": {
        "type": "doc",
        "version": 1,
        "content": [...]
      },
      "issuetype": {
        "name": "Task"
      },
      "priority": {
        "name": "High"
      },
      "labels": ["feature", "dashboard"]
    }
  }' \
  https://yourcompany.atlassian.net/rest/api/3/issues
```

**Response (201 Created):**
```json
{
  "id": "10000",
  "key": "PROJ-123",
  "self": "https://yourcompany.atlassian.net/rest/api/3/issues/10000"
}
```

---

### 7. Slack Chat API

**Endpoint:** POST `/api/chat.postMessage`  
**Authentication:** Bearer Token

**Request:**
```bash
curl -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer xoxb-YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C12345678",
    "thread_ts": "1699999999.000100",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "✅ *PROJ-123* created"
        }
      }
    ]
  }'
```

**Response (200 OK):**
```json
{
  "ok": true,
  "channel": "C12345678",
  "ts": "1700000000.000200",
  "message": {
    "type": "message",
    "user": "U87654321",
    "ts": "1700000000.000200",
    "blocks": [...]
  }
}
```

---

## Data Structures

### Task Object

```javascript
{
  title: string,              // Max 255 chars
  description: string,        // Detailed analysis
  complexity: 1-5,            // Scale
  priority: string,           // Low|Medium|High|Critical
  hours: number,              // Estimated effort
  modules: string[],          // Affected components
  labels: string[],           // Tags for categorization
  assignee: string,           // Email or username
  modules_formatted: string,  // Comma-separated for display
  labels_formatted: string    // Comma-separated for display
}
```

### Slack Event Object

```javascript
{
  type: "app_mention",
  user: string,           // Slack user ID (U...)
  text: string,           // Full message text
  ts: string,             // Timestamp (Unix decimal)
  channel: string,        // Channel ID (C...)
  event_ts: string,       // Event timestamp
  team: string,           // Workspace ID (T...)
  bot_id: string          // This app's bot ID
}
```

### Jira Issue Object

```javascript
{
  fields: {
    project: {
      key: string         // Project key (e.g., PROJ)
    },
    summary: string,      // Issue title
    description: {
      type: "doc",
      version: 1,
      content: Block[]    // Jira Document Format
    },
    issuetype: {
      name: string        // Story|Task|Bug|Epic
    },
    priority: {
      name: string        // Lowest|Low|Medium|High|Highest
    },
    labels: string[],
    assignee: {
      name: string        // Username or email
    }
  }
}
```

---

## Error Handling

### Retry Strategy

```javascript
// Exponential backoff configuration
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 32000,         // 32 seconds
  backoffMultiplier: 2     // 1s, 2s, 4s, 8s...
};

// Retryable HTTP status codes
const retryableStatuses = [408, 429, 500, 502, 503, 504];
```

### Error Response Examples

**Jira 401 Unauthorized:**
```json
{
  "errorMessages": ["You do not have permission to create issues in this project."],
  "errors": {}
}
```

**Claude API Rate Limit:**
```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded"
  }
}
```

**Slack Signature Verification:**
```javascript
// HMAC-SHA256 verification
const signature = req.headers['x-slack-signature'];
const timestamp = req.headers['x-slack-request-timestamp'];
const body = req.rawBody;

const baseString = `v0:${timestamp}:${body}`;
const mySignature = `v0=${HMAC_SHA256(baseString, SIGNING_SECRET)}`;

if (signature !== mySignature) {
  throw new Error('Invalid signature');
}
```

---

## Rate Limits

### Slack Events API
- **Concurrent Webhooks:** 30 per app
- **Request Timeout:** 3 seconds
- **Queue:** Events queued for 3 hours if not delivered

### Jira Cloud REST API
- **Rate Limit:** 100 requests/minute (per user)
- **Concurrent:** No stated limit
- **Rate Limit Response:** 429 with `Retry-After` header

### Anthropic Claude API
- **Free Tier:** 50 requests/minute
- **Paid Tier:** 100 requests/minute (minimum)
- **Token Limit:** 100,000 tokens/minute
- **Rate Limit Response:** 429 with `retry-after` header

---

## Authentication

### Slack Bot Token
```
Format: xoxb-{workspace_id}-{app_id}-{token}
Scopes required:
  - app_mentions:read
  - chat:write
  - channels:history (optional)
```

### Jira API Token
```
Format: {32-character hex string}
Created at: https://id.atlassian.com/manage/api-tokens
Expires: Never (no expiration in Cloud)
```

### Anthropic API Key
```
Format: sk-ant-{base64 string}
Created at: https://console.anthropic.com/account/keys
Expires: Can be set per key
```

---

## Example: Full Request/Response Cycle

**1. User sends Slack message:**
```
@Jira Agent Build payment processing API with Stripe integration
```

**2. Slack webhook triggers workflow:**
```json
POST /webhook/trigger/abc123
{
  "event": {
    "user": "U12345678",
    "text": "<@U87654321> Build payment processing API with Stripe integration",
    "ts": "1699999999.000100",
    "channel": "C12345678"
  }
}
```

**3. Workflow processes:**
- Extract: `userId=U12345678`, `channelId=C12345678`
- Sanitize: `cleanText="Build payment processing API with Stripe integration"`
- LLM: Send to Claude, get analysis
- Parse: Extract TITLE, COMPLEXITY, etc.
- Format: Timestamp and arrays
- Create: POST to Jira API
- Notify: Send Slack message with link

**4. Jira response:**
```json
{
  "key": "PROJ-456",
  "id": "10001",
  "self": "..."
}
```

**5. Slack notification:**
```
✅ PROJ-456 created
https://company.atlassian.net/browse/PROJ-456

Build payment processing API with Stripe integration
Priority: High | Complexity: 4/5 | Est: 8h
```

---

## Webhook Signature Validation

All webhook requests from Slack must be validated:

```javascript
// Node.js example
const crypto = require('crypto');

function verifySlackSignature(req, signingSecret) {
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  
  // Check timestamp is recent (prevent replay attacks)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
  if (timestamp < fiveMinutesAgo) {
    return false;
  }
  
  // Create signature
  const baseString = `v0:${timestamp}:${req.rawBody}`;
  const hash = crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex');
  
  const expectedSignature = `v0=${hash}`;
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Pagination & Limits

### Jira Search API
```bash
# Get paginated results
curl -u user:token \
  'https://company.atlassian.net/rest/api/3/issues/search' \
  -d '{
    "jql": "project = PROJ",
    "startAt": 0,
    "maxResults": 50
  }'
```

### Slack API
- Message thread replies: Unlimited
- Blocks per message: Up to 100 blocks
- Text length: 4000 characters max per block

---

## Testing with curl

```bash
# Test Slack webhook
curl -X POST https://webhook.example.com/slack \
  -H "X-Slack-Signature: v0=..." \
  -H "X-Slack-Request-Timestamp: 1699999999" \
  -d '{"event": {...}}'

# Test Jira auth
curl -u user@company.com:API_TOKEN \
  https://company.atlassian.net/rest/api/3/myself

# Test Claude API
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-..." \
  -d '{"model": "claude-sonnet-4-20250514", ...}'
```
