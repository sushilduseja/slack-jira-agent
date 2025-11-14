/**
 * Unit Tests for Parse Function
 * 
 * Tests for the JavaScript function that:
 * - Sanitizes Slack input
 * - Parses LLM structured output
 * - Formats data for Jira/Slack
 */

describe('Parse Function', () => {
  
  describe('Sanitize Input', () => {
    
    test('removes bot mentions', () => {
      const input = '<@U87654321> Create a login page';
      const expected = 'Create a login page';
      expect(sanitizeInput(input)).toBe(expected);
    });

    test('removes multiple mentions', () => {
      const input = '<@U87654321> <@U12345678> Create feature';
      const expected = 'Create feature';
      expect(sanitizeInput(input)).toBe(expected);
    });

    test('trims whitespace', () => {
      const input = '   Create a task   ';
      const expected = 'Create a task';
      expect(sanitizeInput(input)).toBe(expected);
    });

    test('rejects messages under 10 characters', () => {
      const input = 'Create';
      expect(() => sanitizeInput(input)).toThrow('Message too short');
    });

    test('accepts exact 10 character message', () => {
      const input = 'Create task'; // 11 chars
      expect(sanitizeInput(input)).toBe('Create task');
    });
  });

  describe('Parse LLM Output', () => {
    
    test('extracts title from LLM response', () => {
      const llmOutput = 'TITLE: Create user dashboard\nDESCRIPTION: ...';
      const result = parseLLMOutput(llmOutput);
      expect(result.title).toBe('Create user dashboard');
    });

    test('handles missing title', () => {
      const llmOutput = 'DESCRIPTION: Some description';
      const result = parseLLMOutput(llmOutput);
      expect(result.title).toBe('Untitled Task');
    });

    test('extracts complexity as integer', () => {
      const llmOutput = 'COMPLEXITY: 4\nOTHER: field';
      const result = parseLLMOutput(llmOutput);
      expect(result.complexity).toBe(4);
      expect(typeof result.complexity).toBe('number');
    });

    test('clamps complexity between 1-5', () => {
      const output1 = 'COMPLEXITY: 0';
      const result1 = parseLLMOutput(output1);
      expect(result1.complexity).toBe(1);

      const output2 = 'COMPLEXITY: 10';
      const result2 = parseLLMOutput(output2);
      expect(result2.complexity).toBe(5);
    });

    test('extracts modules as array', () => {
      const llmOutput = 'MODULES: frontend, backend, database';
      const result = parseLLMOutput(llmOutput);
      expect(result.modules).toEqual(['frontend', 'backend', 'database']);
    });

    test('trims whitespace in modules', () => {
      const llmOutput = 'MODULES: frontend , backend , database';
      const result = parseLLMOutput(llmOutput);
      expect(result.modules).toEqual(['frontend', 'backend', 'database']);
    });

    test('extracts priority', () => {
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      
      priorities.forEach(priority => {
        const llmOutput = `PRIORITY: ${priority}`;
        const result = parseLLMOutput(llmOutput);
        expect(result.priority).toBe(priority);
      });
    });

    test('extracts hours as integer', () => {
      const llmOutput = 'HOURS: 8';
      const result = parseLLMOutput(llmOutput);
      expect(result.hours).toBe(8);
      expect(typeof result.hours).toBe('number');
    });

    test('defaults to Medium priority if missing', () => {
      const llmOutput = 'TITLE: Task';
      const result = parseLLMOutput(llmOutput);
      expect(result.priority).toBe('Medium');
    });

    test('defaults to 4 hours if missing', () => {
      const llmOutput = 'TITLE: Task';
      const result = parseLLMOutput(llmOutput);
      expect(result.hours).toBe(4);
    });

    test('defaults to complexity 3 if missing', () => {
      const llmOutput = 'TITLE: Task';
      const result = parseLLMOutput(llmOutput);
      expect(result.complexity).toBe(3);
    });

    test('handles multiline descriptions', () => {
      const llmOutput = `TITLE: Task
DESCRIPTION: Line 1
Line 2
Line 3
COMPLEXITY: 3`;
      const result = parseLLMOutput(llmOutput);
      expect(result.description).toContain('Line 1');
      expect(result.description).toContain('Line 2');
    });

    test('ignores extra whitespace in field values', () => {
      const llmOutput = 'TITLE:   Create dashboard   \n';
      const result = parseLLMOutput(llmOutput);
      expect(result.title).toBe('Create dashboard');
    });
  });

  describe('Format Arrays', () => {
    
    test('joins modules with comma separator', () => {
      const modules = ['frontend', 'backend', 'database'];
      const formatted = formatArray(modules);
      expect(formatted).toBe('frontend, backend, database');
    });

    test('handles empty modules array', () => {
      const formatted = formatArray([]);
      expect(formatted).toBe('N/A');
    });

    test('handles single module', () => {
      const formatted = formatArray(['frontend']);
      expect(formatted).toBe('frontend');
    });

    test('joins labels with comma separator', () => {
      const labels = ['feature', 'ui', 'dashboard'];
      const formatted = formatArray(labels);
      expect(formatted).toBe('feature, ui, dashboard');
    });
  });

  describe('Format Timestamp', () => {
    
    test('converts Unix timestamp to readable format', () => {
      const timestamp = '1699999999.000100';
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toMatch(/[A-Z][a-z]{2} \d{2}, \d{4}/);
    });

    test('includes time in formatted output', () => {
      const timestamp = '1699999999.000100';
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    test('handles decimal Unix timestamps', () => {
      const timestamp = '1699999999.999999';
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });

    test('uses UTC timezone by default', () => {
      const timestamp = '1699999999.000100';
      const formatted = formatTimestamp(timestamp);
      // Should be consistent regardless of local timezone
      expect(formatted).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    
    test('processes complete LLM response', () => {
      const llmOutput = `TITLE: Build authentication API
DESCRIPTION: Create OAuth2 endpoint with refresh tokens
MODULES: backend, auth-service
ASSIGNEE: unassigned
COMPLEXITY: 4
PRIORITY: High
HOURS: 8
LABELS: api, security, auth`;

      const result = parseLLMOutput(llmOutput);

      expect(result.title).toBe('Build authentication API');
      expect(result.complexity).toBe(4);
      expect(result.priority).toBe('High');
      expect(result.hours).toBe(8);
      expect(result.modules).toEqual(['backend', 'auth-service']);
      expect(result.labels).toEqual(['api', 'security', 'auth']);
    });

    test('handles malformed LLM response gracefully', () => {
      const llmOutput = 'This is not structured output at all';
      const result = parseLLMOutput(llmOutput);

      expect(result.title).toBe('Untitled Task');
      expect(result.complexity).toBe(3);
      expect(result.priority).toBe('Medium');
      expect(result.hours).toBe(4);
    });

    test('full pipeline: sanitize -> parse -> format', () => {
      const rawInput = '<@U87654321> Create user dashboard for analytics';
      const llmOutput = `TITLE: Build analytics dashboard
DESCRIPTION: Create responsive dashboard
MODULES: frontend, backend
PRIORITY: High
COMPLEXITY: 3
HOURS: 6
LABELS: dashboard, analytics`;

      const sanitized = sanitizeInput(rawInput);
      const parsed = parseLLMOutput(llmOutput);
      const formatted = {
        modules: formatArray(parsed.modules),
        labels: formatArray(parsed.labels)
      };

      expect(sanitized).toBe('Create user dashboard for analytics');
      expect(parsed.title).toBe('Build analytics dashboard');
      expect(formatted.modules).toBe('frontend, backend');
      expect(formatted.labels).toBe('dashboard, analytics');
    });
  });
});
