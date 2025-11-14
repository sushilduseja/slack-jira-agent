# Example Slack Messages

Input examples and expected Jira ticket outputs.

## Example 1: Simple Feature Request

### Slack Message
```
@Jira Agent Create a login page for mobile users
```

### Expected Jira Ticket
- **Key:** PROJ-101
- **Summary:** Create a login page for mobile users
- **Description:** 
  ```
  Scope
  Develop a responsive login interface for mobile devices with support for both email/password and social authentication options.
  
  Details
  Modules: frontend
  Effort: 4h (Complexity 3/5)
  Labels: mobile, feature, authentication
  
  Context
  Requested by <@U12345678> on Nov 14, 2024, 10:30 AM
  Original: Create a login page for mobile users
  ```
- **Priority:** Medium
- **Complexity:** 3

---

## Example 2: Complex Backend Task

### Slack Message
```
@Jira Agent Build API endpoint for user authentication with OAuth2 support and rate limiting for increased security and performance
```

### Expected Jira Ticket
- **Key:** PROJ-102
- **Summary:** Build API endpoint for user authentication with OAuth2 support and rate limiting
- **Description:**
  ```
  Scope
  Implement a production-ready authentication API endpoint with OAuth2 protocol support, including authorization code flow, token refresh mechanisms, and request rate limiting to prevent abuse and ensure system stability.
  
  Details
  Modules: backend, auth-service, infrastructure
  Effort: 8h (Complexity 4/5)
  Labels: api, authentication, oauth2, performance, security
  
  Context
  Requested by <@U87654321> on Nov 14, 2024, 10:35 AM
  Original: Build API endpoint for user authentication with OAuth2 support and rate limiting for increased security and performance
  ```
- **Priority:** High
- **Complexity:** 4

---

## Example 3: Bug Fix

### Slack Message
```
@Jira Agent Fix bug in payment processing module - transactions timing out after 30 seconds
```

### Expected Jira Ticket
- **Key:** PROJ-103
- **Summary:** Fix bug in payment processing module - transactions timing out after 30 seconds
- **Description:**
  ```
  Scope
  Investigate and resolve timeout issues in the payment processing module where transactions are failing after 30 seconds. Root cause analysis and fix implementation needed.
  
  Details
  Modules: backend, payment-gateway, database
  Effort: 4h (Complexity 3/5)
  Labels: bug, payment, critical, performance
  
  Context
  Requested by <@U11111111> on Nov 14, 2024, 10:40 AM
  Original: Fix bug in payment processing module - transactions timing out after 30 seconds
  ```
- **Priority:** High
- **Complexity:** 3

---

## Example 4: Urgent Request

### Slack Message
```
@Jira Agent URGENT: Database is down, need immediate failover to backup instance
```

### Expected Jira Ticket
- **Key:** PROJ-104
- **Summary:** URGENT: Database is down, need immediate failover to backup instance
- **Description:**
  ```
  Scope
  Immediate incident response required. Database primary instance is down. Activate failover to backup instance to restore service availability.
  
  Details
  Modules: infrastructure, database, devops
  Effort: 1h (Complexity 4/5)
  Labels: incident, critical, database, infrastructure
  
  Context
  Requested by <@U22222222> on Nov 14, 2024, 10:45 AM
  Original: URGENT: Database is down, need immediate failover to backup instance
  ```
- **Priority:** Critical
- **Complexity:** 4

---

## Example 5: Documentation Task

### Slack Message
```
@Jira Agent Document the new payment API endpoints and create examples for integration
```

### Expected Jira Ticket
- **Key:** PROJ-105
- **Summary:** Document the new payment API endpoints and create examples for integration
- **Description:**
  ```
  Scope
  Create comprehensive API documentation for the new payment processing endpoints, including request/response examples, error handling guide, and integration tutorial for developers.
  
  Details
  Modules: documentation, api
  Effort: 3h (Complexity 2/5)
  Labels: documentation, api, payment
  
  Context
  Requested by <@U33333333> on Nov 14, 2024, 10:50 AM
  Original: Document the new payment API endpoints and create examples for integration
  ```
- **Priority:** Medium
- **Complexity:** 2

---

## Example 6: Performance Optimization

### Slack Message
```
@Jira Agent Optimize database queries in the user reporting module - queries taking 5+ seconds
```

### Expected Jira Ticket
- **Key:** PROJ-106
- **Summary:** Optimize database queries in the user reporting module - queries taking 5+ seconds
- **Description:**
  ```
  Scope
  Profile and optimize slow database queries in the user reporting module. Target: reduce query execution time from 5+ seconds to <1 second. May include indexing strategy, query rewrite, or caching implementation.
  
  Details
  Modules: backend, database
  Effort: 6h (Complexity 3/5)
  Labels: performance, optimization, database, reporting
  
  Context
  Requested by <@U44444444> on Nov 14, 2024, 10:55 AM
  Original: Optimize database queries in the user reporting module - queries taking 5+ seconds
  ```
- **Priority:** High
- **Complexity:** 3

---

## Example 7: Infrastructure Task

### Slack Message
```
@Jira Agent Set up monitoring and alerting for all production services using Prometheus and Grafana
```

### Expected Jira Ticket
- **Key:** PROJ-107
- **Summary:** Set up monitoring and alerting for all production services using Prometheus and Grafana
- **Description:**
  ```
  Scope
  Implement comprehensive monitoring and alerting infrastructure for all production services. Configure Prometheus for metrics collection and Grafana for visualization and dashboards. Set up alerting rules for critical metrics.
  
  Details
  Modules: infrastructure, devops, monitoring
  Effort: 12h (Complexity 4/5)
  Labels: infrastructure, monitoring, prometheus, grafana, devops
  
  Context
  Requested by <@U55555555> on Nov 14, 2024, 11:00 AM
  Original: Set up monitoring and alerting for all production services using Prometheus and Grafana
  ```
- **Priority:** High
- **Complexity:** 4

---

## Example 8: Refactoring

### Slack Message
```
@Jira Agent Refactor authentication service to use dependency injection pattern for better testability
```

### Expected Jira Ticket
- **Key:** PROJ-108
- **Summary:** Refactor authentication service to use dependency injection pattern for better testability
- **Description:**
  ```
  Scope
  Refactor the authentication service to implement dependency injection pattern. Improve code modularity, testability, and maintainability. No functional changes - pure refactoring.
  
  Details
  Modules: backend, auth-service
  Effort: 6h (Complexity 3/5)
  Labels: refactoring, code-quality, testing, auth-service
  
  Context
  Requested by <@U66666666> on Nov 14, 2024, 11:05 AM
  Original: Refactor authentication service to use dependency injection pattern for better testability
  ```
- **Priority:** Medium
- **Complexity:** 3

---

## Example 9: Feature with Multiple Requirements

### Slack Message
```
@Jira Agent Implement user analytics dashboard with real-time data visualization, export to CSV, and custom date range filtering
```

### Expected Jira Ticket
- **Key:** PROJ-109
- **Summary:** Implement user analytics dashboard with real-time data visualization, export to CSV, and custom date range filtering
- **Description:**
  ```
  Scope
  Build a comprehensive user analytics dashboard with the following features:
  1. Real-time data visualization with charts and metrics
  2. CSV export functionality for reports
  3. Custom date range filtering for flexible analysis
  
  Details
  Modules: frontend, backend, database, data-visualization
  Effort: 16h (Complexity 5/5)
  Labels: feature, analytics, dashboard, reporting, visualization
  
  Context
  Requested by <@U77777777> on Nov 14, 2024, 11:10 AM
  Original: Implement user analytics dashboard with real-time data visualization, export to CSV, and custom date range filtering
  ```
- **Priority:** High
- **Complexity:** 5

---

## Example 10: Security Update

### Slack Message
```
@Jira Agent Update all dependencies to latest versions and patch security vulnerability in lodash package
```

### Expected Jira Ticket
- **Key:** PROJ-110
- **Summary:** Update all dependencies to latest versions and patch security vulnerability in lodash package
- **Description:**
  ```
  Scope
  Conduct security audit and update all project dependencies to latest versions, with particular focus on patching the known vulnerability in the lodash package. Run full test suite to ensure compatibility.
  
  Details
  Modules: infrastructure, security, build
  Effort: 4h (Complexity 2/5)
  Labels: security, dependencies, vulnerability, maintenance
  
  Context
  Requested by <@U88888888> on Nov 14, 2024, 11:15 AM
  Original: Update all dependencies to latest versions and patch security vulnerability in lodash package
  ```
- **Priority:** Critical
- **Complexity:** 2

---

## Complexity Scale Reference

| Level | Description | Estimate | Examples |
|-------|-------------|----------|----------|
| **1** | Trivial | 1-2h | Doc update, simple config |
| **2** | Simple | 2-4h | Bug fix, small feature |
| **3** | Moderate | 4-8h | New endpoint, UI component |
| **4** | Complex | 8-16h | Integration, system change |
| **5** | Very Complex | 16h+ | Major refactor, new system |

---

## Priority Mapping

| Priority | Urgency | Response Time |
|----------|---------|---------------|
| **Critical** | Immediate | Production down, blocking |
| **High** | ASAP | > 1 hour impact |
| **Medium** | Within 24h | Normal feature |
| **Low** | Whenever | Nice to have |

