#!/usr/bin/env node

/**
 * Anonymize Workflow Export
 * 
 * Strips personally identifiable information (PII) from exported Sim.ai workflow
 * before sharing publicly. Removes:
 * - API keys and tokens
 * - Domain names and URLs
 * - Email addresses
 * - Slack workspace/channel IDs
 * - Jira instance URLs
 */

const fs = require('fs');
const path = require('path');

// Patterns to redact
const PATTERNS = [
  {
    name: 'API Keys',
    pattern: /sk-ant-[A-Za-z0-9]{48,}/g,
    replacement: 'sk-ant-xxx'
  },
  {
    name: 'Slack Tokens (Bot)',
    pattern: /xoxb-[A-Za-z0-9-]{100,}/g,
    replacement: 'xoxb-xxx'
  },
  {
    name: 'Slack Tokens (App)',
    pattern: /xapp-[A-Za-z0-9-]{50,}/g,
    replacement: 'xapp-xxx'
  },
  {
    name: 'Jira API Tokens',
    pattern: /[A-Za-z0-9]{32}/g,
    replacement: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  {
    name: 'Email Addresses',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: 'user@example.com'
  },
  {
    name: 'Jira URLs',
    pattern: /https:\/\/[a-zA-Z0-9-]+\.atlassian\.net/g,
    replacement: 'https://company.atlassian.net'
  },
  {
    name: 'Slack User IDs',
    pattern: /U[A-Z0-9]{10}/g,
    replacement: 'U12345678'
  },
  {
    name: 'Slack Channel IDs',
    pattern: /C[A-Z0-9]{10}/g,
    replacement: 'C12345678'
  },
  {
    name: 'Domain Names',
    pattern: /[a-zA-Z0-9-]+\.com(?!mon)/gi,
    replacement: 'company.com'
  }
];

function anonymizeWorkflow(filePath) {
  console.log(`📝 Anonymizing workflow: ${filePath}`);

  try {
    // Read the workflow file
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalLength = content.length;
    let redactionCount = 0;

    // Apply each redaction pattern
    PATTERNS.forEach(({ name, pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`  ✓ ${name}: ${matches.length} occurrences redacted`);
        redactionCount += matches.length;
        content = content.replace(pattern, replacement);
      }
    });

    // Parse and clean JSON
    let workflow;
    try {
      workflow = JSON.parse(content);
    } catch (e) {
      console.error('  ✗ Failed to parse JSON');
      return false;
    }

    // Additional JSON-level redactions
    cleanWorkflowObject(workflow);

    // Write anonymized version
    const outputPath = filePath.replace('.json', '.anonymized.json');
    fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));

    const newLength = fs.readFileSync(outputPath, 'utf-8').length;
    
    console.log(`
✅ Anonymization complete
  Original size: ${(originalLength / 1024).toFixed(2)} KB
  Redactions: ${redactionCount}
  Output: ${outputPath}
    `);

    return true;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

function cleanWorkflowObject(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  if (Array.isArray(obj)) {
    obj.forEach(cleanWorkflowObject);
  } else {
    // Redact sensitive keys
    const sensitiveKeys = [
      'api_key',
      'apiKey',
      'api_token',
      'token',
      'secret',
      'password',
      'auth_header',
      'authorization',
      'bearer',
      'jira_api_token',
      'slack_token',
      'slack_signing_secret',
      'anthropic_api_key'
    ];

    for (const key in obj) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        obj[key] = 'xxx';
      } else {
        cleanWorkflowObject(obj[key]);
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node anonymize_workflow.js <path-to-workflow.json>

Example:
  node anonymize_workflow.js ./config/workflow_config.json
    `);
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`✗ File not found: ${filePath}`);
    process.exit(1);
  }

  const success = anonymizeWorkflow(filePath);
  process.exit(success ? 0 : 1);
}

module.exports = { anonymizeWorkflow };
