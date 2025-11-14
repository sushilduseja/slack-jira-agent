# Edge Cases & Error Handling

Examples of unusual inputs and how the system handles them.

## Edge Case 1: Message Too Short

### Input
```
@Jira Agent xyz
```

### Expected Behavior
**Rejected:** Message length < 10 characters  
**Slack Response:**
```
❌ Message too short
Your request must be at least 10 characters. Please provide more detail.
```

**Jira Ticket:** Not created

---

## Edge Case 2: Only Bot Mention

### Input
```
@Jira Agent
```

### Expected Behavior
**Rejected:** Empty message after removing mention  
**Slack Response:**
```
❌ Message too short
Your request must be at least 10 characters. Please provide more detail.
```

---

## Edge Case 3: Ambiguous Request

### Input
```
@Jira Agent Fix the issue
```

### Expected Behavior
**Accepted:** LLM will request clarification  
**Slack Response:**
```
✅ PROJ-201 created

Fix the issue
Priority: Medium | Complexity: 3/5 | Est: 4h
```

**Note:** Ticket created with generic description. Manager should add details.

---

## Edge Case 4: Non-English Message

### Input
```
@Jira Agent Créer une page de connexion pour les utilisateurs mobiles
```

### Expected Behavior
**Accepted:** Claude supports multiple languages  
**Jira Ticket:**
- **Summary:** Create a login page for mobile users
- **Description:** (Analyzed and translated by Claude)
- Works correctly despite French input

---

## Edge Case 5: Code Blocks in Message

### Input
```
@Jira Agent Fix this bug in the payment processor:

```javascript
function processPayment(amount) {
  if (amount > 0) {
    return charge(amount); // Bug: doesn't validate card
  }
}
```
```

### Expected Behavior
**Accepted:** Code blocks are included in analysis  
**Jira Ticket:**
- **Summary:** Fix payment processor card validation
- **Description:** Includes code snippet
- **Modules:** backend, payment-gateway
- **Complexity:** 3
- Better context for developers

---

## Edge Case 6: Very Long Message (>2000 chars)

### Input
```
@Jira Agent Create a comprehensive user management system with role-based access control, 
audit logging, user provisioning/deprovisioning workflows, 
integration with external identity providers (SAML/OAuth2), 
multi-factor authentication support, API-first design, 
and comprehensive dashboard for admin operations...
[continues for many paragraphs]
```

### Expected Behavior
**Accepted:** Claude handles long input  
**Processing:**
- Message is truncated to first 2000 characters by some systems
- Claude extracts key points despite truncation
- Ticket is created successfully

**Recommendation:** Encourage users to summarize or create multiple smaller requests

---

## Edge Case 7: Special Characters & Emojis

### Input
```
@Jira Agent 🎨 Design landing page with header logo & footer ©️ 2024
```

### Expected Behavior
**Accepted:** Handled by text sanitization  
**Processed as:** "Design landing page with header logo & footer © 2024"  
**Jira Ticket:** Created successfully

---

## Edge Case 8: Malformed LLM Response

### LLM Returns
```
This is not structured at all. Just rambling about the task
without following the template format.
```

### Expected Behavior
**Fallback to Defaults:**
- **Title:** "Auto-generated Task"
- **Complexity:** 3
- **Priority:** Medium
- **Hours:** 4
- **Modules:** []

**Slack Response:**
```
✅ PROJ-202 created

Auto-generated Task
Priority: Medium | Complexity: 3/5 | Est: 4h

Note: LLM could not parse task details. Please review ticket.
```

---

## Edge Case 9: Jira API Timeout

### Trigger
```
@Jira Agent Create a task
[Jira API takes >30 seconds or times out]
```

### Expected Behavior
**Retry Logic:**
1. First attempt: Fails (timeout)
2. Wait 1 second
3. Second attempt: Fails
4. Wait 2 seconds
5. Third attempt: Fails
6. Abort after 3 retries

**Slack Response:**
```
❌ Failed to create ticket after 3 attempts
Jira service is not responding. Please try again in a few minutes.

[Optional: Link to manual ticket creation form]
```

---

## Edge Case 10: Duplicate Request (Same Message Twice)

### Scenario
User accidentally sends same message twice within 10 seconds:

```
@Jira Agent Create user dashboard
[5 seconds later]
@Jira Agent Create user dashboard
```

### Current Behavior
**Accepted:** Both create tickets  
- PROJ-203: Create user dashboard
- PROJ-204: Create user dashboard

### Recommended Enhancement
**Deduplication:**
```javascript
// Check last message from user in past 5 minutes
const recentMessages = cache.get(`user_${userId}_messages`);
if (recentMessages.includes(cleanText)) {
  throw new Error('Duplicate request detected');
}
```

---

## Edge Case 11: Bot Mentions Itself

### Input
```
@Jira Agent Ask @Jira Agent to handle this
```

### Expected Behavior
**Detected and Filtered:**  
1. Self-mention removed by sanitization
2. Message becomes: "Ask to handle this"
3. Too short? Rejected
4. Otherwise: Processed normally

---

## Edge Case 12: Jira Project Doesn't Exist

### Configuration Error
```
JIRA_PROJECT_KEY=NONEXISTENT
```

### Expected Behavior
**Error Response:**
```
❌ Jira configuration error
Project NONEXISTENT not found. Contact your admin to verify project settings.

Slack Response: /config/workflow_config.json
```

**Action:** Manual verification of Jira project key required

---

## Edge Case 13: Permission Denied (Read-Only User)

### Scenario
Jira API token doesn't have "Create Issues" permission

### Expected Behavior
**Error Response:**
```
❌ Permission denied
The configured Jira user doesn't have permission to create issues.
Contact your Jira admin to grant proper permissions.
```

**HTTP Status:** 403 Forbidden  
**Jira Response:** 
```json
{
  "errorMessages": ["You do not have permission to create issues in this project."]
}
```

---

## Edge Case 14: Slack Channel is Archived

### Scenario
Bot is installed in archived channel, user tries to mention it

### Expected Behavior
**Rejected:** Slack prevents posting in archived channels  
**Error Message:** From Slack (not our system)

---

## Edge Case 15: Rate Limit Hit

### Scenario
User creates 100 tickets in 1 minute

### Expected Behavior

**Attempt 1-100:** Succeed (within Jira's 100 req/min limit)  
**Attempt 101+:** Fail with 429

**Slack Response:**
```
⚠️ Rate limit exceeded
You've created too many tickets too quickly. 
Please wait a few minutes before trying again.
```

---

## Testing Edge Cases

### Unit Test Examples

```javascript
describe('Edge Cases', () => {
  test('rejects messages shorter than 10 chars', () => {
    const result = sanitize('@Jira xyz');
    expect(result).toThrow('Message too short');
  });

  test('handles non-English input', () => {
    const input = 'Créer une page';
    const result = parse(input);
    expect(result.title).toBeTruthy();
  });

  test('uses defaults when LLM fails', () => {
    const malformedLLM = 'Random text';
    const result = parseLLMOutput(malformedLLM);
    expect(result.complexity).toBe(3);
    expect(result.priority).toBe('Medium');
  });

  test('retries on Jira timeout', async () => {
    mock.setupJiraTimeout(2); // Fail first 2 times
    const result = await createTicket(task);
    expect(result.key).toBeDefined(); // Succeeds on 3rd try
  });
});
```

---

## Recommendations for Production

1. **Implement caching** for recent message deduplication
2. **Add idempotency keys** to prevent double-creation
3. **Log all failures** for monitoring and debugging
4. **Set up alerts** for:
   - High error rates
   - Repeated failures from same user
   - API timeouts from Jira/Claude
5. **Implement circuit breaker** for Jira API
   - Stop trying if 5 consecutive failures
   - Exponential backoff
   - Manual recovery required
