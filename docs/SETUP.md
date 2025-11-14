# Setup Instructions

Complete step-by-step guide to deploy the Slack-Jira Agent workflow.

## Prerequisites

- **Sim.ai Account** - [Sign up free](https://www.sim.ai)
- **Slack Workspace** - Admin access required
- **Jira Cloud Instance** - API access required
- **Anthropic API Key** - For Claude Sonnet 4 access

## Part 1: Create Slack App

### Step 1: Register App with Slack

1. Navigate to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → Select **"From scratch"**
3. Fill in:
   - **App name:** `Jira Agent`
   - **Workspace:** Select your workspace
4. Click **"Create App"**

### Step 2: Configure OAuth Permissions

1. Go to **OAuth & Permissions** (left sidebar)
2. Under **Bot Token Scopes**, add:
   - `app_mentions:read` - Listen for @mentions
   - `chat:write` - Send messages
   - `channels:history` - Read message context (optional)
3. Click **"Install to Workspace"**
4. Copy your **Bot User OAuth Token** (starts with `xoxb-`)
   - Save this in `.env` as `SLACK_BOT_TOKEN`

### Step 3: Enable Event Subscriptions

1. Go to **Event Subscriptions** (left sidebar)
2. Toggle **"Enable Events"** to ON
3. Set **Request URL** to: `https://www.sim.ai/api/webhooks/trigger/{WORKFLOW_ID}`
   - Replace `{WORKFLOW_ID}` with your Sim.ai workflow ID (see Part 3)
4. Under **Subscribe to bot events**, add:
   - `app_mention` - Trigger on @mentions
5. Click **"Save Changes"**

### Step 4: Get Signing Secret

1. Go to **Basic Information** (left sidebar)
2. Copy **Signing Secret**
   - Save this in `.env` as `SLACK_SIGNING_SECRET`

### Step 5: Install App to Channel

1. In your Slack workspace, go to the channel where you want to use the bot
2. Type `/invite @Jira Agent`
3. The bot is now active in that channel

---

## Part 2: Configure Jira Cloud

### Step 1: Create API Token

1. Go to [https://id.atlassian.com/manage/api-tokens](https://id.atlassian.com/manage/api-tokens)
2. Click **"Create API token"**
3. Label it `slack-jira-agent-token`
4. Copy the token
   - Save this in `.env` as `JIRA_API_TOKEN`

### Step 2: Get Domain and Email

1. Your **Jira domain** is from your instance URL:
   - Example: `https://mycompany.atlassian.net` → `mycompany.atlassian.net`
   - Save this in `.env` as `JIRA_DOMAIN`

2. Use the email associated with your Jira account
   - Save this in `.env` as `JIRA_EMAIL`

### Step 3: Create Project (if needed)

1. In Jira, go to **Projects** → **Create project**
2. Select template (e.g., "Software" with Kanban)
3. Name: `AI Tasks` or similar
4. Get the **project key** (e.g., `PROJ`)
   - Save this in `.env` as `JIRA_PROJECT_KEY`

### Step 4: Configure Custom Fields (Optional)

For better tracking, add these custom fields to your Jira project:

1. Go to **Project Settings** → **Custom Fields**
2. Create:
   - **Effort Estimate** (Number field) - For hours
   - **Complexity** (Number 1-5) - For difficulty rating
   - **Affected Modules** (Text field) - Comma-separated list
   - **AI Confidence** (Number 0-100) - LLM confidence score

---

## Part 3: Set Up Sim.ai Workflow

### Step 1: Import Workflow

1. Log in to [Sim.ai Dashboard](https://www.sim.ai/dashboard)
2. Click **"Import Workflow"**
3. Upload `config/workflow_config.json`
4. Name it `Slack to Jira Agent`
5. Click **"Import"**

### Step 2: Add Credentials

In the workflow editor:

1. **Slack Block:**
   - OAuth Token: Paste your `SLACK_BOT_TOKEN`
   - Signing Secret: Paste your `SLACK_SIGNING_SECRET`

2. **LLM Block (Claude):**
   - Provider: `Anthropic`
   - Model: `claude-sonnet-4-20250514`
   - API Key: Paste your `ANTHROPIC_API_KEY`

3. **Jira Block:**
   - Domain: `{JIRA_DOMAIN}`
   - Email: `{JIRA_EMAIL}`
   - API Token: `{JIRA_API_TOKEN}`
   - Project Key: `{JIRA_PROJECT_KEY}`

### Step 3: Get Webhook URL

1. In Sim.ai workflow editor, click **"Test & Deploy"**
2. Copy the **Webhook URL** (format: `https://www.sim.ai/api/webhooks/trigger/...`)
3. Save the `{workflow_id}` portion for Slack Event Subscriptions

### Step 4: Update Slack App

Return to [Slack App Settings](https://api.slack.com/apps):

1. Go to **Event Subscriptions**
2. Update **Request URL** with the Sim.ai webhook URL
3. Slack will verify the URL automatically
4. Save changes

---

## Part 4: Environment Setup (Local Testing)

### Step 1: Create .env File

```bash
# Create in project root
cp .env.example .env
```

### Step 2: Edit .env

```bash
# Slack Configuration
SLACK_SIGNING_SECRET=your_signing_secret
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_APP_TOKEN=xapp-your-app-token

# Jira Configuration
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=PROJ

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-xxx

# Application Settings
NODE_ENV=production
LOG_LEVEL=info
REQUEST_TIMEOUT_MS=30000
MAX_RETRIES=3
```

---

## Part 5: Test the Workflow

### Test 1: Simple Task Creation

1. Go to your Slack channel
2. Type: `@Jira Agent Create a login page for mobile users`
3. Expected response within 15 seconds:
   ```
   ✅ PROJ-123 created
   https://company.atlassian.net/browse/PROJ-123
   Create a login page for mobile users
   Priority: Medium | Complexity: 3/5 | Est: 4h
   ```

### Test 2: Complex Task with Modules

1. Type: `@Jira Agent Build API endpoint for user authentication with OAuth2 support and rate limiting`
2. Expected: Ticket created with:
   - Priority: High
   - Complexity: 4-5
   - Modules: backend, auth-service, database
   - Hours: 6-8

### Test 3: Error Handling

1. Type: `@Jira Agent xyz` (too short)
2. Expected: Error message about minimum character requirement

---

## Troubleshooting

### "Request URL failed to verify"
- Ensure Sim.ai webhook URL is correct and publicly accessible
- Check that Event Subscriptions page shows "✅ Verified"

### "Jira API authentication failed"
- Verify `JIRA_EMAIL` matches the account that created the API token
- Check that API token is valid (not expired)
- Confirm `JIRA_DOMAIN` doesn't include `https://` or trailing `/`

### "Claude API key invalid"
- Get new API key from [https://console.anthropic.com](https://console.anthropic.com)
- Ensure key starts with `sk-ant-`
- Check that you have quota/credit in Anthropic console

### "LLM timeout (>30s)"
- Increase `REQUEST_TIMEOUT_MS` in `.env`
- Check Anthropic API status page
- Try simpler prompts to diagnose

### Bot not responding in Slack
1. Check bot is installed in channel: `/invite @Jira Agent`
2. Verify bot has message permissions
3. Check Sim.ai workflow execution logs
4. Verify all credentials are correct in workflow editor

---

## Security Best Practices

1. **Never commit `.env`** - Always use `.gitignore`
2. **Rotate API tokens regularly** - Every 90 days recommended
3. **Use least-privilege tokens** - Only grant needed scopes
4. **Monitor logs** - Check Sim.ai logs for failed attempts
5. **Rate limiting** - Implement per-user or per-channel limits in production

---

## Next Steps

- See `CUSTOMIZATION.md` for adapting the workflow
- See `API_REFERENCE.md` for Sim.ai block specifications
- See `TROUBLESHOOTING.md` for common issues
