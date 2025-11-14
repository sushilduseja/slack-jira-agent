# Troubleshooting Guide

Common issues and solutions for the Slack-Jira Agent.

## Slack Connection Issues

### "Request URL failed to verify"

**Symptom:** Error during Slack Event Subscriptions setup

**Solutions:**
1. Verify Sim.ai webhook URL is correct
   ```bash
   # Test URL reachability
   curl -I https://www.sim.ai/api/webhooks/trigger/{workflow_id}
   ```

2. Check that webhook URL is publicly accessible
   - Not blocked by firewall
   - Not requiring authentication
   - HTTPS certificate is valid

3. Ensure Slack is sending POST requests (not GET)

4. Check Sim.ai workflow is deployed and active
   - Go to Sim.ai Dashboard
   - Verify workflow status shows "Deployed"

---

### "Bot not responding to @mentions"

**Symptom:** Message sent but no bot reply

**Solutions:**

1. **Check bot is installed in channel:**
   ```
   @Jira Agent (should show as a member)
   ```
   If not visible:
   ```
   /invite @Jira Agent
   ```

2. **Verify scopes:**
   - Go to Slack App → OAuth & Permissions
   - Confirm `app_mentions:read` and `chat:write` are enabled

3. **Check bot token hasn't expired:**
   - Regenerate at: https://api.slack.com/apps/{APP_ID}/install-on-workspace
   - Update in Sim.ai workflow editor

4. **Verify event subscriptions:**
   - Slack App → Event Subscriptions
   - Ensure `app_mention` is subscribed
   - URL should show ✅ Verified

5. **Check Sim.ai workflow logs:**
   - Sim.ai Dashboard → Workflow Executions
   - Look for error messages
   - Check timestamp matches your test message

---

### "Webhook signature verification failed"

**Symptom:** Sim.ai rejects Slack requests

**Solution:**
1. Get fresh signing secret from Slack:
   - Slack App → Basic Information
   - Copy "Signing Secret"
   
2. Update in Sim.ai workflow:
   - LLM Workflow Editor
   - Slack block → Configuration
   - Paste new signing secret
   
3. Redeploy workflow

---

## Jira Connection Issues

### "Jira API authentication failed"

**Symptom:** Workflow shows "Jira authentication error" in logs

**Solutions:**

1. **Verify API token is valid:**
   ```bash
   curl -u user@company.com:YOUR_API_TOKEN \
     https://yourcompany.atlassian.net/rest/api/3/myself
   ```
   Should return user information (not 401 error)

2. **Check email matches:**
   - Email used to create token must match `JIRA_EMAIL` in config
   - Common mistake: Using workspace email vs. personal email

3. **Verify domain format:**
   - Correct: `mycompany.atlassian.net`
   - Incorrect: `https://mycompany.atlassian.net`
   - Incorrect: `mycompany.atlassian.net/`

4. **Token expiry:**
   - API tokens don't expire in Jira Cloud
   - But double-check token isn't restricted to specific IPs

5. **Rate limiting:**
   ```
   Error: 429 Too Many Requests
   ```
   - Jira Cloud limits to ~100 requests/minute
   - Check for retry queue issues in logs

---

### "Project key not found"

**Symptom:** Error "Project {KEY} does not exist"

**Solutions:**

1. **Verify project exists:**
   - Go to https://yourcompany.atlassian.net
   - Navigate to Projects
   - Confirm project key matches `JIRA_PROJECT_KEY`

2. **Check user permissions:**
   - User creating token must have "Create Issues" permission
   - Go to Project Settings → Permissions
   - Ensure token user has appropriate role

3. **Custom field mapping:**
   ```
   Error: "Field customfield_10001 does not exist"
   ```
   - Edit `config/jira_fields_mapping.json`
   - Replace with actual custom field IDs
   - Find correct ID: Jira → Settings → Fields

---

### "Invalid field value for status"

**Symptom:** Error creating ticket with default status

**Solution:**
1. Check valid statuses for your project:
   ```bash
   curl -u user@company.com:TOKEN \
     https://yourcompany.atlassian.net/rest/api/3/issue/createmeta?projectKeys=PROJ
   ```

2. Update Jira block to not force specific status
3. Let Jira use default issue type status

---

## LLM & Claude Issues

### "Anthropic API key invalid"

**Symptom:** "401 Unauthorized" or "Invalid API key"

**Solutions:**

1. **Get new API key:**
   - Go to https://console.anthropic.com/account/keys
   - Create new key
   - Copy it (full string starting with `sk-ant-`)

2. **Update in Sim.ai:**
   - Workflow Editor
   - LLM block → Configuration
   - Paste new API key
   - Test with "Run Test"

3. **Check account status:**
   - Sign in to Anthropic Console
   - Verify account has available credit/quota
   - Check no usage alerts or suspensions

---

### "Claude request timeout (>30s)"

**Symptom:** LLM analysis takes too long

**Solutions:**

1. **Increase timeout:**
   - Edit `.env`: `REQUEST_TIMEOUT_MS=60000` (60 seconds)
   - Restart workflow

2. **Simplify prompt:**
   - Current prompt is very detailed
   - Try removing examples from system prompt
   - Reduce temperature from 0.3 to 0.1

3. **Check Claude API status:**
   - https://status.anthropic.com/
   - Look for degradation notices

4. **Try different model:**
   - Switch from `claude-sonnet-4-20250514` to `claude-3-5-sonnet-20241022`
   - Faster but slightly lower quality

---

### "LLM output parsing failed"

**Symptom:** Workflow fails at "Parse LLM Output" step

**Solutions:**

1. **Check LLM response format:**
   - Add logging to see actual response:
   ```javascript
   console.log('Raw LLM output:', agentOutput);
   ```

2. **Verify regex patterns:**
   - Test against sample output at https://regex101.com
   - Make sure pattern matches actual response format

3. **Add fallback values:**
   ```javascript
   const title = extractField('TITLE') || 'Auto-generated Task';
   const complexity = parseInt(extractField('COMPLEXITY') ?? '3');
   ```

4. **Relax parsing rules:**
   - Current regex expects exact format
   - Add multiple pattern alternatives for flexibility

---

## Workflow Execution Issues

### "Workflow timeout"

**Symptom:** Entire workflow takes >60 seconds

**Diagnosis:**
```
Total time = Slack validation (0.1s) 
           + Message extraction (0.2s)
           + Text sanitization (0.1s)
           + LLM analysis (8-12s) ⚠️
           + Output parsing (0.2s)
           + Timestamp formatting (0.1s)
           + Jira API call (2-3s) ⚠️
           + Slack notification (0.5s)
           ≈ 12-15s (normal)
```

**Solutions:**

1. **LLM is too slow (>15s):**
   - Switch to faster model: `claude-3-5-sonnet`
   - Or use OpenAI GPT-4 Turbo
   - Increase `max_tokens` (current: 1000 is reasonable)

2. **Jira API is too slow (>3s):**
   - Check Jira Cloud status
   - Verify network latency from Sim.ai to Jira
   - Reduce description length

3. **Enable parallel execution:**
   - Timestamp formatting and LLM analysis can run in parallel
   - Update workflow YAML to use parallel blocks

---

### "Intermittent failures"

**Symptom:** Works 90% of time, sometimes fails

**Solutions:**

1. **Add retry logic:**
   ```javascript
   const maxRetries = 3;
   let lastError;
   
   for (let i = 0; i < maxRetries; i++) {
     try {
       return await jiraAPI.createIssue(ticket);
     } catch (error) {
       lastError = error;
       if (i < maxRetries - 1) {
         await sleep(1000 * (i + 1)); // Exponential backoff
       }
     }
   }
   throw lastError;
   ```

2. **Check rate limits:**
   - Jira: 100 req/min
   - Claude: 50 req/min (free tier)
   - Add backoff delays

3. **Enable transaction logging:**
   - Log every request/response
   - Find patterns in failures
   - Check time of day correlations

---

## Performance Issues

### "Workflow is slow"

**Optimization tips:**

1. **Cache LLM responses:**
   - Similar messages should use cached analysis
   - Store in Redis: hash(messageText) → analysis

2. **Parallel API calls:**
   - Fetch user info and Jira metadata in parallel
   - Don't wait for Slack notification before returning

3. **Batch operations:**
   - If creating multiple tickets, batch in one Jira call
   - Use Jira Bulk API

4. **Database optimization:**
   - Add index on `messageText` if deduplicating
   - Monitor query performance

### "High cost of Claude API calls"

**Solutions:**

1. **Use cheaper model:**
   - `claude-opus` vs `claude-sonnet`: ~10x cheaper
   - Reduced quality, but acceptable for routing

2. **Shorter prompts:**
   - Remove examples from system prompt
   - Use template instead of natural language

3. **Caching:**
   - Don't re-analyze identical messages
   - Implement LLM cache with prompt_caching

4. **Batching:**
   - Analyze 10 messages in one request
   - Use batch API for async analysis

---

## Data Issues

### "Jira tickets have wrong priority"

**Debugging:**

1. **Check LLM output:**
   ```javascript
   console.log('Raw LLM:', agentOutput);
   console.log('Parsed priority:', priority);
   ```

2. **Verify priority mapping:**
   - `jira_fields_mapping.json` maps priorities correctly
   - Jira project supports all priority levels

3. **Add manual review:**
   - For "Critical" tasks, require approval before creating
   - Allow manager to override priority

---

### "Timestamps are wrong timezone"

**Current format:**
```javascript
date.toLocaleString('en-US', {
  timeZone: 'UTC',
  ...
})
```

**To fix for your timezone:**
```javascript
// Change timeZone from 'UTC' to:
timeZone: 'Asia/Singapore'  // or your timezone
```

**Common timezones:**
- `'America/New_York'` - EST
- `'Europe/London'` - GMT
- `'Asia/Tokyo'` - JST
- `'Australia/Sydney'` - AEDT

---

## Testing & Debugging

### Local Testing

```bash
# Test webhook with sample payload
node scripts/test_slack_webhook.sh "Your test message"

# Test Jira connection
node scripts/validate_config.js

# Run unit tests
npm test

# View live logs (if using Sim.ai)
sim.ai logs --workflow-id {ID} --follow
```

### Enable Debug Logging

```env
# In .env
LOG_LEVEL=debug
DEBUG=slack-jira-agent:*
VERBOSE=true
```

### Check Event Payloads

1. **Slack:**
   - Slack App → Event Subscriptions → Past deliveries
   - Click event to see full JSON payload
   - Verify all expected fields are present

2. **Sim.ai:**
   - Dashboard → Executions
   - Click execution to see inputs/outputs at each step
   - Examine variable values

---

## Getting Help

1. **Check logs first:**
   - Sim.ai: Dashboard → Executions → Logs
   - Slack: Event Subscriptions → Past deliveries
   - Jira: Settings → Logs & Reports → Activity stream

2. **Search existing issues:**
   - GitHub: github.com/sushilduseja/slack-jira-agent/issues
   - Sim.ai docs: docs.sim.ai/troubleshooting

3. **Minimal reproducible example:**
   - Exact message you sent
   - Expected vs actual output
   - Relevant error logs

4. **Contact support:**
   - Slack: https://slack.com/support
   - Jira: https://support.atlassian.com
   - Anthropic: https://support.anthropic.com
   - Sim.ai: support@sim.ai
