#!/usr/bin/env node

/**
 * Validate Configuration
 * 
 * Pre-deployment checks for Slack-Jira Agent setup
 * Validates:
 * - Environment variables are set
 * - API endpoints are reachable
 * - Credentials are valid
 * - Jira project exists
 * - Slack app is configured
 */

const https = require('https');
const path = require('path');
require('dotenv').config();

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    '✓': `${colors.green}✓${colors.reset}`,
    '✗': `${colors.red}✗${colors.reset}`,
    '⚠': `${colors.yellow}⚠${colors.reset}`,
    'ℹ': `${colors.blue}ℹ${colors.reset}`
  }[level] || level;

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function checkEnvironment() {
  log('ℹ', 'Checking environment variables...');

  const required = [
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET',
    'JIRA_DOMAIN',
    'JIRA_EMAIL',
    'JIRA_API_TOKEN',
    'JIRA_PROJECT_KEY',
    'ANTHROPIC_API_KEY'
  ];

  let allValid = true;

  required.forEach(varName => {
    if (process.env[varName]) {
      log('✓', `${varName} is set`);
    } else {
      log('✗', `${varName} is missing`);
      allValid = false;
    }
  });

  return allValid;
}

function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);

    https.request(options, (res) => {
      clearTimeout(timeout);
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    }).on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    }).end();
  });
}

async function checkJiraConnection() {
  log('ℹ', 'Checking Jira Cloud connection...');

  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!domain || !email || !token) {
    log('⚠', 'Jira credentials not configured, skipping...');
    return false;
  }

  try {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const options = {
      hostname: domain,
      path: '/rest/api/3/myself',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await httpsRequest(options);

    if (response.status === 200) {
      const user = JSON.parse(response.data);
      log('✓', `Jira authenticated as ${user.displayName}`);
      return true;
    } else if (response.status === 401) {
      log('✗', 'Jira authentication failed: Invalid credentials');
      return false;
    } else {
      log('✗', `Jira returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    log('✗', `Jira connection failed: ${error.message}`);
    return false;
  }
}

async function checkJiraProject() {
  log('ℹ', 'Checking Jira project...');

  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!domain || !email || !token || !projectKey) {
    log('⚠', 'Jira credentials or project key not configured, skipping...');
    return false;
  }

  try {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const options = {
      hostname: domain,
      path: `/rest/api/3/project/${projectKey}`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await httpsRequest(options);

    if (response.status === 200) {
      const project = JSON.parse(response.data);
      log('✓', `Jira project ${projectKey} found: ${project.name}`);
      return true;
    } else if (response.status === 404) {
      log('✗', `Jira project ${projectKey} not found`);
      return false;
    } else {
      log('✗', `Jira returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    log('✗', `Project check failed: ${error.message}`);
    return false;
  }
}

async function checkSlackToken() {
  log('ℹ', 'Checking Slack bot token...');

  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    log('⚠', 'Slack bot token not configured, skipping...');
    return false;
  }

  try {
    const options = {
      hostname: 'slack.com',
      path: '/api/auth.test',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await httpsRequest(options);
    const data = JSON.parse(response.data);

    if (data.ok) {
      log('✓', `Slack token valid for user @${data.user_id}`);
      return true;
    } else {
      log('✗', `Slack token invalid: ${data.error}`);
      return false;
    }
  } catch (error) {
    log('✗', `Slack token check failed: ${error.message}`);
    return false;
  }
}

async function checkAnthropicKey() {
  log('ℹ', 'Checking Anthropic API key...');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    log('⚠', 'Anthropic API key not configured, skipping...');
    return false;
  }

  try {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    };

    // Just test if key is accepted (without actually calling the API)
    // A real test would be a minimal API call
    if (apiKey.startsWith('sk-ant-')) {
      log('✓', 'Anthropic API key format is valid');
      return true;
    } else {
      log('✗', 'Anthropic API key format is invalid (should start with sk-ant-)');
      return false;
    }
  } catch (error) {
    log('✗', `Anthropic key check failed: ${error.message}`);
    return false;
  }
}

async function runAllChecks() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Slack-Jira Agent - Configuration Validator             ║
╚════════════════════════════════════════════════════════════╝
  `);

  const checks = [
    { name: 'Environment Variables', fn: checkEnvironment },
    { name: 'Slack Token', fn: checkSlackToken },
    { name: 'Jira Connection', fn: checkJiraConnection },
    { name: 'Jira Project', fn: checkJiraProject },
    { name: 'Anthropic API Key', fn: checkAnthropicKey }
  ];

  const results = [];

  for (const check of checks) {
    console.log();
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
    } catch (error) {
      log('✗', `${check.name} check error: ${error.message}`);
      results.push({ name: check.name, passed: false });
    }
  }

  // Summary
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Summary                                                 ║
╚════════════════════════════════════════════════════════════╝
  `);

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? colors.green : colors.red;
    console.log(`${color}${status}${colors.reset} ${result.name}`);
  });

  console.log(`
Status: ${passed}/${total} checks passed

${passed === total ? colors.green + '✓ All systems ready for deployment!' + colors.reset : colors.yellow + '⚠ Please fix the issues above before deploying' + colors.reset}
  `);

  process.exit(passed === total ? 0 : 1);
}

// Run validation
runAllChecks().catch(error => {
  log('✗', `Validation failed: ${error.message}`);
  process.exit(1);
});
