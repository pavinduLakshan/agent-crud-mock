# Agent Management API Server

A Node.js implementation of the Agent Management API based on the OpenAPI specification.

## Overview

This project implements a RESTful API server for managing AI agents, including creating, reading, updating, and deleting agents and their associated credentials. The implementation follows the OpenAPI specification defined in [identity-agent repository PR #1](https://github.com/shashimalcse/identity-agent/pull/1).

## Features

- RESTful API endpoints for agent management operations
- Support for various credential types (SECRET, MTLS, PRIVATE_KEY_JWT, OAUTH2_CLIENT_CREDENTIALS)
- Authentication and authorization middleware
- Standardized error responses
- In-memory storage (for demonstration purposes)

## Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/agent-management-api.git
cd agent-management-api
```

2. Install dependencies
```bash
npm install
```

## Usage

Start the server:
```bash
node index.js
```

The server will be available at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|---------------|
| GET | / | List all agents | internal_org_agent_mgt_read |
| POST | / | Create a new agent | internal_org_agent_mgt_create |
| GET | /{agentId} | Get a specific agent | internal_org_agent_mgt_read |
| PUT | /{agentId} | Update an existing agent | internal_org_agent_mgt_update |
| DELETE | /{agentId} | Delete an agent | internal_org_agent_mgt_delete |
| POST | /{agentId}/credentials | Add a new credential | internal_org_agent_mgt_update |
| PUT | /{agentId}/credentials/{credentialId} | Update a credential | internal_org_agent_mgt_update |

## Authentication

This API uses OAuth 2.0 for authentication. Requests must include a valid bearer token in the Authorization header:

```
Authorization: Bearer your-access-token
```

## Example Requests

### Create a new agent

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "name": "Gardio Hotel Booking Assistant",
    "description": "Helps users interact with the Gardio Hotels booking system.",
    "version": "1.2.0",
    "url": "https://api.gardiohotels.com/booking/v1"
  }'
```

### Add a credential to an agent

```bash
curl -X POST http://localhost:3000/a1b2c3d4-e5f6-7890-1234-567890abcdef/credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "credentialType": "SECRET",
    "credentialDetails": {
      "secretValue": "s3cr3t-p@ssw0rd"
    }
  }'
```

## Development

### OpenAPI Specification

The full OpenAPI specification for this implementation can be found in [identity-agent repository PR #1](https://github.com/shashimalcse/identity-agent/pull/1).

### Implementation Notes

- This implementation uses in-memory storage for demonstration purposes. For production use, integrate with a database.
- Authentication and authorization middleware is simplified. Replace with proper OAuth2 token validation in production.
- Error handling follows the standardized format defined in the OpenAPI specification.

## Future Improvements

- Database integration (MongoDB, PostgreSQL, etc.)
- Comprehensive request validation
- Proper OAuth2 security implementation
- Logging and monitoring
- API documentation with Swagger UI
- Unit and integration tests
- Docker containerization
- CI/CD pipeline

## License

[MIT](LICENSE)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Create a new Pull Request