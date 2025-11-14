/**
 * Integration Tests - End-to-End Workflow
 * 
 * Full workflow simulation from Slack message to Jira ticket
 */

describe('End-to-End Integration Tests', () => {
  
  describe('Complete Workflow', () => {
    
    test('processes simple task from Slack message to Jira', async () => {
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create a login page',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      const jiraTicket = await runCompleteWorkflow(slackEvent);

      expect(jiraTicket).toBeDefined();
      expect(jiraTicket.key).toMatch(/PROJ-\d+/);
      expect(jiraTicket.summary).toContain('login');
      expect(jiraTicket.priority).toBe('Medium');
    });

    test('handles complex multi-module task', async () => {
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Build payment processing API with OAuth2 and rate limiting',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      const jiraTicket = await runCompleteWorkflow(slackEvent);

      expect(jiraTicket).toBeDefined();
      expect(jiraTicket.modules.length).toBeGreaterThan(1);
      expect(jiraTicket.complexity).toBeGreaterThanOrEqual(3);
      expect(jiraTicket.hours).toBeGreaterThan(4);
    });

    test('creates Slack notification with ticket link', async () => {
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      const notification = await getSlackNotification(slackEvent);

      expect(notification).toBeDefined();
      expect(notification.text).toContain('✅');
      expect(notification.blocks[0].text.text).toContain('PROJ-');
    });

    test('handles workflow with all optional fields', async () => {
      const llmResponse = `TITLE: Complex Task
DESCRIPTION: Very detailed description
MODULES: frontend, backend, database, devops
ASSIGNEE: developer@company.com
COMPLEXITY: 5
PRIORITY: Critical
HOURS: 24
LABELS: urgent, critical, infrastructure`;

      const task = parseLLMOutput(llmResponse);

      expect(task.title).toBe('Complex Task');
      expect(task.modules).toHaveLength(4);
      expect(task.assignee).toBe('developer@company.com');
      expect(task.hours).toBe(24);
    });
  });

  describe('Error Handling in Workflow', () => {
    
    test('recovers from LLM timeout', async () => {
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      // Mock LLM timeout
      mockLLMTimeout();

      const jiraTicket = await runCompleteWorkflow(slackEvent);

      expect(jiraTicket).toBeDefined();
      expect(jiraTicket.priority).toBe('Medium'); // Default
      expect(jiraTicket.complexity).toBe(3); // Default
    });

    test('recovers from Jira API failure', async () => {
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      // Mock Jira failure on first attempt
      mockJiraFailure(1);

      const jiraTicket = await runCompleteWorkflow(slackEvent);

      expect(jiraTicket).toBeDefined(); // Should succeed on retry
      expect(jiraTicket.key).toBeDefined();
    });

    test('handles invalid Jira credentials', async () => {
      mockInvalidJiraToken();

      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      const error = await expectWorkflowToFail(slackEvent);

      expect(error.message).toMatch(/authentication|credentials/i);
    });

    test('handles Slack API failure', async () => {
      mockSlackFailure();

      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      // Jira ticket should still be created
      const jiraTicket = await runCompleteWorkflow(slackEvent);

      expect(jiraTicket).toBeDefined();
      expect(jiraTicket.key).toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    
    test('preserves user information through workflow', async () => {
      const userId = 'U12345678';
      const slackEvent = {
        user: userId,
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      const jiraTicket = await runCompleteWorkflow(slackEvent);

      expect(jiraTicket.creator).toBe(userId);
      expect(jiraTicket.slack_user).toBe(userId);
    });

    test('preserves channel and timestamp information', async () => {
      const channelId = 'C12345678';
      const timestamp = '1699999999.000100';
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: timestamp,
        channel: channelId
      };

      const jiraTicket = await runCompleteWorkflow(slackEvent);

      expect(jiraTicket.slack_channel).toBe(channelId);
      expect(jiraTicket.slack_timestamp).toBe(timestamp);
    });

    test('all arrays are properly formatted', async () => {
      const jiraTicket = await runCompleteWorkflow({
        user: 'U12345678',
        text: '<@U87654321> Multi module task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      });

      expect(Array.isArray(jiraTicket.modules)).toBe(true);
      expect(Array.isArray(jiraTicket.labels)).toBe(true);
      
      // Formatted versions should be strings
      expect(typeof jiraTicket.modules_formatted).toBe('string');
      expect(typeof jiraTicket.labels_formatted).toBe('string');
    });
  });

  describe('Performance', () => {
    
    test('completes workflow within timeout', async () => {
      const startTime = Date.now();
      
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      await runCompleteWorkflow(slackEvent);
      
      const duration = Date.now() - startTime;

      // Should complete within 30 seconds (timeout limit)
      expect(duration).toBeLessThan(30000);
    });

    test('handles concurrent requests', async () => {
      const requests = [];
      
      for (let i = 0; i < 5; i++) {
        requests.push(
          runCompleteWorkflow({
            user: `U${i}`,
            text: '<@U87654321> Create task',
            ts: `${1699999999 + i}.000100`,
            channel: 'C12345678'
          })
        );
      }

      const results = await Promise.all(requests);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.key).toBeDefined();
      });
    });
  });

  describe('Retry and Idempotency', () => {
    
    test('idempotent on duplicate Slack webhook', async () => {
      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678',
        event_id: 'Ev123456789'
      };

      const result1 = await runCompleteWorkflow(slackEvent);
      const result2 = await runCompleteWorkflow(slackEvent);

      // Should have same Jira key (no duplicate)
      expect(result1.key).toBe(result2.key);
    });

    test('retry succeeds on transient failure', async () => {
      mockTransientJiraFailure(2); // Fail 2 times, succeed on 3rd

      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      const result = await runCompleteWorkflow(slackEvent);

      expect(result.key).toBeDefined();
    });

    test('gives up after max retries', async () => {
      mockPersistentJiraFailure(); // Always fails

      const slackEvent = {
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      };

      const error = await expectWorkflowToFail(slackEvent);

      expect(error).toBeDefined();
    });
  });

  describe('Logging & Observability', () => {
    
    test('logs all major workflow steps', async () => {
      const logs = [];
      mockLogger(logs);

      await runCompleteWorkflow({
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      });

      expect(logs.some(l => l.includes('Extract message'))).toBe(true);
      expect(logs.some(l => l.includes('Sanitize'))).toBe(true);
      expect(logs.some(l => l.includes('LLM analysis'))).toBe(true);
      expect(logs.some(l => l.includes('Create Jira'))).toBe(true);
      expect(logs.some(l => l.includes('Slack notification'))).toBe(true);
    });

    test('includes timing information in logs', async () => {
      const logs = [];
      mockLogger(logs);

      await runCompleteWorkflow({
        user: 'U12345678',
        text: '<@U87654321> Create task',
        ts: '1699999999.000100',
        channel: 'C12345678'
      });

      // Should have timing logs
      expect(logs.some(l => l.includes('ms'))).toBe(true);
    });
  });
});

// Mock helper functions
function mockLLMTimeout() { /* implementation */ }
function mockJiraFailure(times) { /* implementation */ }
function mockSlackFailure() { /* implementation */ }
function mockInvalidJiraToken() { /* implementation */ }
function mockTransientJiraFailure(times) { /* implementation */ }
function mockPersistentJiraFailure() { /* implementation */ }
function mockLogger(logs) { /* implementation */ }
function expectWorkflowToFail(slackEvent) { /* implementation */ }
function runCompleteWorkflow(slackEvent) { /* implementation */ }
function getSlackNotification(slackEvent) { /* implementation */ }
function parseLLMOutput(response) { /* implementation */ }
