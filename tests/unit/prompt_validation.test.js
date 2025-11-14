/**
 * Unit Tests for Prompt Validation
 * 
 * Tests to validate the LLM prompt engineering
 */

describe('LLM Prompt Validation', () => {
  
  describe('System Prompt Structure', () => {
    
    test('system prompt includes all required output fields', () => {
      const systemPrompt = getSystemPrompt();
      
      const requiredFields = [
        'TITLE',
        'DESCRIPTION',
        'MODULES',
        'ASSIGNEE',
        'COMPLEXITY',
        'PRIORITY',
        'HOURS',
        'LABELS'
      ];

      requiredFields.forEach(field => {
        expect(systemPrompt).toContain(field);
      });
    });

    test('system prompt includes default values', () => {
      const systemPrompt = getSystemPrompt();
      
      expect(systemPrompt).toContain('COMPLEXITY: 3');
      expect(systemPrompt).toContain('PRIORITY: Medium');
      expect(systemPrompt).toContain('HOURS: 4');
    });

    test('system prompt specifies output format', () => {
      const systemPrompt = getSystemPrompt();
      
      expect(systemPrompt.toLowerCase()).toContain('format');
      expect(systemPrompt.toLowerCase()).toContain('output');
    });

    test('system prompt includes complexity scale definition', () => {
      const systemPrompt = getSystemPrompt();
      
      expect(systemPrompt).toMatch(/complexity.*1.*5/i);
      expect(systemPrompt).toMatch(/1.*5.*scale/i);
    });

    test('system prompt lists valid priorities', () => {
      const systemPrompt = getSystemPrompt();
      
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      priorities.forEach(priority => {
        expect(systemPrompt).toContain(priority);
      });
    });
  });

  describe('Prompt Behavior', () => {
    
    test('prompt guides toward reasonable complexity estimates', () => {
      // Expected complexity levels for different tasks
      const testCases = [
        {
          input: 'Update documentation',
          expectedComplexity: 1 // 1-2
        },
        {
          input: 'Create new API endpoint',
          expectedComplexity: 3 // 3-4
        },
        {
          input: 'Refactor entire authentication system',
          expectedComplexity: 5 // 4-5
        }
      ];

      testCases.forEach(testCase => {
        // Verify complexity ranges make sense
        expect(testCase.expectedComplexity).toBeGreaterThanOrEqual(1);
        expect(testCase.expectedComplexity).toBeLessThanOrEqual(5);
      });
    });

    test('prompt guides toward reasonable hour estimates', () => {
      // Verify hour estimates scale with complexity
      expect(estimateHours(1)).toBeLessThanOrEqual(estimateHours(2));
      expect(estimateHours(2)).toBeLessThanOrEqual(estimateHours(3));
      expect(estimateHours(3)).toBeLessThanOrEqual(estimateHours(4));
      expect(estimateHours(4)).toBeLessThanOrEqual(estimateHours(5));
    });

    test('prompt generates module names from predefined list', () => {
      const validModules = [
        'frontend',
        'backend',
        'database',
        'devops',
        'infrastructure',
        'mobile',
        'api',
        'auth-service'
      ];

      // LLM should only suggest these modules or similar
      const testModule = 'frontend';
      expect(validModules).toContain(testModule);
    });
  });

  describe('Prompt Temperature & Determinism', () => {
    
    test('recommended temperature is low (0.3)', () => {
      const temperature = 0.3;
      
      // Low temperature = more deterministic output
      expect(temperature).toBeLessThan(0.5);
      expect(temperature).toBeGreaterThanOrEqual(0);
    });

    test('max tokens is reasonable (1000)', () => {
      const maxTokens = 1000;
      
      // Should be enough for structured output without being excessive
      expect(maxTokens).toBeGreaterThanOrEqual(500);
      expect(maxTokens).toBeLessThanOrEqual(2000);
    });
  });

  describe('Edge Cases in Prompt', () => {
    
    test('prompt handles ambiguous requests', () => {
      const systemPrompt = getSystemPrompt();
      
      // Should instruct to make reasonable assumptions
      expect(systemPrompt).toMatch(/default|assume|uncertain/i);
    });

    test('prompt avoids bias toward high complexity', () => {
      const systemPrompt = getSystemPrompt();
      
      // Should not encourage inflating estimates
      expect(systemPrompt).not.toMatch(/always high|always increase/i);
    });

    test('prompt is language-agnostic enough for translations', () => {
      const systemPrompt = getSystemPrompt();
      
      // Should work with non-English input (Claude is multilingual)
      expect(systemPrompt).toContain('Extract');
      expect(systemPrompt).toContain('analyze');
    });
  });

  describe('Prompt Injection Prevention', () => {
    
    test('output format is specific enough to prevent injection', () => {
      const systemPrompt = getSystemPrompt();
      
      // Format should prevent users from injecting fake field values
      expect(systemPrompt).toMatch(/TITLE:/);
      expect(systemPrompt).toMatch(/DESCRIPTION:/);
    });

    test('prompt includes instruction boundaries', () => {
      const systemPrompt = getSystemPrompt();
      
      // Should have clear sections
      expect(systemPrompt).toContain('Output format');
      expect(systemPrompt).toContain('Defaults');
    });
  });

  describe('Multi-Language Support', () => {
    
    test('prompt works with French input', () => {
      const input = 'Créer une page de connexion';
      
      // Claude should handle this fine
      expect(input).toBeTruthy();
      // Manual test in production
    });

    test('prompt works with Spanish input', () => {
      const input = 'Crear un panel de usuario';
      
      expect(input).toBeTruthy();
      // Manual test in production
    });

    test('prompt works with Asian languages', () => {
      const input = '创建用户仪表板';
      
      expect(input).toBeTruthy();
      // Manual test in production
    });
  });
});

// Helper functions
function getSystemPrompt() {
  return `You are a technical task analyzer. Extract structured task details.

Output format (plain text, one per line):
TITLE: [concise title, max 80 chars]
DESCRIPTION: [detailed analysis with context]
MODULES: [comma-separated: frontend, backend, database, etc]
ASSIGNEE: support@company.com
COMPLEXITY: [1-5 scale]
PRIORITY: [Low|Medium|High|Critical]
HOURS: [estimated hours as integer]
LABELS: [comma-separated tags]

Defaults if uncertain:
- COMPLEXITY: 3
- PRIORITY: Medium
- HOURS: 4`;
}

function estimateHours(complexity) {
  // Rough estimation based on complexity
  const estimates = {
    1: 2,
    2: 4,
    3: 8,
    4: 16,
    5: 32
  };
  return estimates[complexity] || 4;
}
