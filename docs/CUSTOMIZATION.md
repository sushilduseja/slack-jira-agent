# Customization Guide

Learn how to adapt the Slack-Jira Agent for your organization's unique needs.

## 1. Custom LLM Prompts

### Add Domain-Specific Context

Edit the LLM Analysis block in `workflow_config.json`:

```json
{
  "id": "llm_analysis",
  "system_prompt": "You are a technical task analyzer for our organization.\n\nOur technology stack:\n- Frontend: React 18 with TypeScript\n- Backend: Node.js (Express/Fastify)\n- Databases: PostgreSQL (primary), Redis (cache)\n- Services: Auth, Payment, Analytics, Notifications\n\nWhen analyzing tasks:\n1. Infer which service is most affected\n2. Consider our architecture constraints\n3. Estimate effort based on service complexity\n4. Suggest appropriate labels (frontend, backend, devops, etc)\n\nOutput format (one per line):\nTITLE: [concise title]\nDESCRIPTION: [detailed analysis]\nMODULES: [affected services]\nASSIGNEE: [team/person]\nCOMPLEXITY: [1-5]\nPRIORITY: [Low|Medium|High|Critical]\nHOURS: [estimated hours]\nLABELS: [tags]"
}
```

### Use Different LLM Provider

Replace Claude with OpenAI GPT-4:

```json
{
  "id": "llm_analysis",
  "type": "agent",
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "api_key": "${OPENAI_API_KEY}",
  "temperature": 0.3,
  "max_tokens": 1000
}
```

Or use Anthropic's newer models:

```json
{
  "model": "claude-opus-4-1-20250805",  // Newer model
  "temperature": 0.2  // More deterministic
}
```

---

## 2. Custom Jira Fields

### Map Organization-Specific Fields

Edit `config/jira_fields_mapping.json`:

```json
{
  "field_mappings": {
    "customfield_10010": {
      "name": "Team Assignment",
      "source": "task.team",
      "type": "select",
      "options": ["Backend", "Frontend", "DevOps", "QA"]
    },
    "customfield_10011": {
      "name": "Sprint",
      "source": "current_sprint",
      "type": "string"
    },
    "customfield_10012": {
      "name": "Revenue Impact",
      "source": "business_value",
      "type": "number",
      "unit": "USD"
    }
  }
}
```

### Auto-Populate Based on Complexity

```javascript
// In parse_llm_output function
const effortMapping = {
  1: { hours: 2, points: 1, type: 'Story' },
  2: { hours: 4, points: 2, type: 'Story' },
  3: { hours: 8, points: 3, type: 'Task' },
  4: { hours: 16, points: 5, type: 'Task' },
  5: { hours: 32, points: 8, type: 'Epic' }
};

const effort = effortMapping[complexity];
```

---

## 3. Custom Priority Rules

### Sentiment-Based Priority

Add this to the LLM system prompt:

```
When analyzing urgency:
- Keywords: urgent, asap, blocking, critical → Critical
- Keywords: important, needed soon → High
- Keywords: would be nice, can wait → Low
- Default → Medium
```

### Business Hours Priority Boost

```javascript
// In parse_llm_output function
const now = new Date();
const isPeakHours = now.getHours() >= 9 && now.getHours() <= 17;
const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

if (isPeakHours && isWeekday) {
  // Slightly boost priority during business hours
  if (priority === 'Medium') priority = 'High';
}
```

---

## 4. Integration with Other Systems

### Send Notifications to Slack Channel

```javascript
// Add after Jira ticket creation
const slackMessage = {
  channel: '#eng-tasks',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ ${jiraKey} created by <@${userId}>\n*${title}*`
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Priority:*\n${priority}` },
        { type: 'mrkdwn', text: `*Complexity:*\n${complexity}/5` },
        { type: 'mrkdwn', text: `*Effort:*\n${hours}h` },
        { type: 'mrkdwn', text: `*Modules:*\n${modules_formatted}` }
      ]
    }
  ]
};
```

### Create Incident in PagerDuty (Critical Only)

```javascript
if (priority === 'Critical') {
  const pagerdutyEvent = {
    routing_key: process.env.PAGERDUTY_ROUTING_KEY,
    event_action: 'trigger',
    dedup_key: jiraKey,
    payload: {
      summary: title,
      severity: 'critical',
      source: 'Slack-Jira Agent',
      custom_details: {
        jira_ticket: jiraKey,
        complexity: complexity,
        modules: modules
      }
    }
  };
  
  // Send to PagerDuty API
}
```

### Post to Analytics Dashboard

```javascript
// Track all requests for analytics
const analytics = {
  timestamp: new Date().toISOString(),
  user_id: userId,
  channel_id: channelId,
  complexity: complexity,
  priority: priority,
  modules: modules,
  hours: hours,
  llm_model: 'claude-sonnet-4',
  jira_project: projectKey,
  status: 'success'
};

// Send to your analytics system (Mixpanel, Segment, etc)
analytics.send(analytics);
```

---

## 5. Advanced Parsing Rules

### Extract Code Blocks from Messages

```javascript
// Parse code blocks in Slack messages
const codeBlockRegex = /```([\s\S]*?)```/g;
const codeBlocks = [];

let match;
while ((match = codeBlockRegex.exec(cleanText)) !== null) {
  codeBlocks.push(match[1]);
}

// Add to description if code detected
if (codeBlocks.length > 0) {
  description += `\n\n*Code provided:*\n`;
  codeBlocks.forEach((block, i) => {
    description += `\n${i + 1}. \`\`\`\n${block}\n\`\`\``;
  });
}
```

### Extract Attachments and Links

```javascript
// Get file attachments from Slack event
const files = event.body.event.files || [];
const links = event.body.event.blocks?.flatMap(block => {
  return block.elements?.filter(el => el.type === 'link_button')
    .map(el => el.url) || [];
}) || [];

if (files.length > 0) {
  description += `\n\nAttachments: ${files.map(f => f.name).join(', ')}`;
}

if (links.length > 0) {
  description += `\n\nReferences: ${links.join(', ')}`;
}
```

### Detect Duplicates

```javascript
// Query existing Jira tickets for similarity
const existingTickets = jira.search({
  jql: `project = "${projectKey}" AND resolved = EMPTY`,
  maxResults: 20
});

const titleSimilarity = existingTickets.filter(ticket => {
  // Simple similarity check (use Levenshtein distance for production)
  return ticket.fields.summary.toLowerCase()
    .includes(title.toLowerCase());
});

if (titleSimilarity.length > 0) {
  description += `\n\n*Possible duplicates:*\n`;
  titleSimilarity.forEach(ticket => {
    description += `- [${ticket.key}](${jiraUrl}/browse/${ticket.key})\n`;
  });
}
```

---

## 6. Approval Workflows

### Manager Review Before Creation

```javascript
// Add conditional block after LLM analysis
if (complexity >= 4 || priority === 'Critical') {
  // Send to approval queue instead of direct creation
  
  const approvalRequest = {
    channel: '#approvals',
    user_id: managerId,
    title: task.title,
    complexity: complexity,
    hours: hours,
    modules: modules,
    original_requestor: userId
  };
  
  // Store in database and wait for approval
  await saveApprovalRequest(approvalRequest);
  
  // Notify user they need approval
  slackReply = {
    text: `Your ticket (Complexity ${complexity}/5, ${hours}h) needs manager approval.`
  };
} else {
  // Create immediately for simpler tasks
  createJiraTicket(task);
}
```

### Auto-Escalate Based on Backlog

```javascript
// Increase priority if backlog is high
const backlogSize = jira.search({
  jql: `project = "${projectKey}" AND status = "To Do"`,
  maxResults: 0
}).total;

if (backlogSize > 50) {
  // Reduce priority of new Medium tasks during high backlog
  if (priority === 'Medium') {
    priority = 'Low';
  }
}
```

---

## 7. Custom Notifications

### Rich Slack Messages with Context

```javascript
const slackMessage = {
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `✅ ${jiraKey}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${title}*\n${description.substring(0, 100)}...`
      }
    },
    {
      type: 'image',
      image_url: generateComplexityChart(complexity),
      alt_text: 'Complexity chart'
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Ticket' },
          url: `${jiraUrl}/browse/${jiraKey}`
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Assign to Me' },
          action_id: `assign_${jiraKey}`
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Add to Sprint' },
          action_id: `sprint_${jiraKey}`
        }
      ]
    }
  ]
};
```

---

## 8. Custom Metrics & Analytics

### Track LLM Accuracy

```javascript
// Store prediction for later validation
const prediction = {
  jiraKey: jiraKey,
  predictedComplexity: complexity,
  predictedHours: hours,
  predictedModules: modules,
  actualComplexity: null,  // Filled in after manual review
  actualHours: null,
  accuracy: null
};

// Later, when ticket is resolved:
// Update accuracy = (predictedComplexity === actualComplexity) ? 1 : 0
```

### Generate Weekly Report

```javascript
// Summary of all tickets created this week
const weekTickets = jira.search({
  jql: `project = "${projectKey}" AND created >= -7d`,
  expand: 'changelog'
});

const report = {
  total_tickets: weekTickets.length,
  avg_complexity: weekTickets.reduce((a, t) => a + t.complexity, 0) / weekTickets.length,
  priority_distribution: {
    critical: weekTickets.filter(t => t.priority === 'Critical').length,
    high: weekTickets.filter(t => t.priority === 'High').length,
    medium: weekTickets.filter(t => t.priority === 'Medium').length,
    low: weekTickets.filter(t => t.priority === 'Low').length
  },
  total_hours: weekTickets.reduce((a, t) => a + t.hours, 0),
  top_modules: getTopModules(weekTickets)
};

// Send to Slack #metrics channel
```

---

## Testing Your Customizations

```bash
# Test locally before deploying
npm test

# Run specific test file
npm test tests/unit/parse_function.test.js

# Generate coverage report
npm test -- --coverage

# Test with sample messages
node scripts/test_slack_webhook.js "Create a login page"
```

See the examples folder for test cases and expected outputs.
