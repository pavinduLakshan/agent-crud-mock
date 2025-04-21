// agent-management-api-server.js
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory database for this example
const agents = new Map();
const credentials = new Map();

// Authentication middleware (simplified)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: "AGT-90001",
      message: "Authentication Failure.",
      description: "The provided access token is missing, expired, or invalid.",
      traceId: uuidv4()
    });
  }
  
  // In a real implementation, you would validate the token
  // For now, just pass through
  next();
};

// Authorization middleware (simplified)
const authorize = (scope) => (req, res, next) => {
  // In a real implementation, you would check if the authenticated user has the required scope
  // For now, just pass through
  next();
};

// List all agents
app.get('/agents', authenticate, authorize('internal_org_agent_mgt_read'), (req, res) => {
  try {
    const agentsList = Array.from(agents.values());
    res.status(200).json(agentsList);
  } catch (error) {
    res.status(500).json({
      code: "AGT-10001",
      message: "Internal Server Error.",
      description: "An unexpected error occurred while processing the request.",
      traceId: uuidv4()
    });
  }
});

// Create a new agent
app.post('/agents', authenticate, authorize('internal_org_agent_mgt_create'), (req, res) => {
  try {
    const { name, description, version, url, owner } = req.body;
    
    // Validate required fields
    if (!name || !description || !version) {
      return res.status(400).json({
        code: "AGT-60001",
        message: "Invalid Input.",
        description: "One or more attribute values required for agent creation are invalid or missing.",
        traceId: uuidv4()
      });
    }
    
    const newAgentId = uuidv4();
    const now = new Date().toISOString();
    
    const newAgent = {
      id: newAgentId,
      name,
      description,
      version,
      url: url || null,
      owner: owner || null,
      createdAt: now,
      updatedAt: now
    };
    
    agents.set(newAgentId, newAgent);
    
    res.status(201).json(newAgent);
  } catch (error) {
    res.status(500).json({
      code: "AGT-10001",
      message: "Internal Server Error.",
      description: "An unexpected error occurred while processing the request.",
      traceId: uuidv4()
    });
  }
});

// Get a specific agent by ID
app.get('/:agentId', authenticate, authorize('internal_org_agent_mgt_read'), (req, res) => {
  try {
    const { agentId } = req.params;
    
    if (!agents.has(agentId)) {
      return res.status(404).json({
        code: "AGT-70001",
        message: "Resource Not Found.",
        description: `The agent with the specified ID '${agentId}' does not exist.`,
        traceId: uuidv4()
      });
    }
    
    res.status(200).json(agents.get(agentId));
  } catch (error) {
    res.status(500).json({
      code: "AGT-10001",
      message: "Internal Server Error.",
      description: "An unexpected error occurred while processing the request.",
      traceId: uuidv4()
    });
  }
});

// Update an existing agent
app.put('/:agentId', authenticate, authorize('internal_org_agent_mgt_update'), (req, res) => {
  try {
    const { agentId } = req.params;
    const updateData = req.body;
    
    if (!agents.has(agentId)) {
      return res.status(404).json({
        code: "AGT-70001",
        message: "Resource Not Found.",
        description: `The agent with the specified ID '${agentId}' does not exist.`,
        traceId: uuidv4()
      });
    }
    
    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: "AGT-60001",
        message: "Invalid Input.",
        description: "At least one field must be provided for update.",
        traceId: uuidv4()
      });
    }
    
    const agent = agents.get(agentId);
    const updatedAgent = {
      ...agent,
      ...updateData,
      id: agentId, // Ensure ID can't be changed
      updatedAt: new Date().toISOString()
    };
    
    agents.set(agentId, updatedAgent);
    
    res.status(200).json(updatedAgent);
  } catch (error) {
    res.status(500).json({
      code: "AGT-10001",
      message: "Internal Server Error.",
      description: "An unexpected error occurred while processing the request.",
      traceId: uuidv4()
    });
  }
});

// Delete an agent
app.delete('/:agentId', authenticate, authorize('internal_org_agent_mgt_delete'), (req, res) => {
  try {
    const { agentId } = req.params;
    
    if (!agents.has(agentId)) {
      return res.status(404).json({
        code: "AGT-70001",
        message: "Resource Not Found.",
        description: `The agent with the specified ID '${agentId}' does not exist.`,
        traceId: uuidv4()
      });
    }
    
    agents.delete(agentId);
    
    // Also delete any associated credentials
    for (const [credId, cred] of credentials.entries()) {
      if (cred.agentId === agentId) {
        credentials.delete(credId);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      code: "AGT-10001",
      message: "Internal Server Error.",
      description: "An unexpected error occurred while processing the request.",
      traceId: uuidv4()
    });
  }
});

// Add a new credential for an agent
app.post('/:agentId/credentials', authenticate, authorize('internal_org_agent_mgt_update'), (req, res) => {
  try {
    const { agentId } = req.params;
    const { credentialType, credentialDetails } = req.body;
    
    if (!agents.has(agentId)) {
      return res.status(404).json({
        code: "AGT-70001",
        message: "Resource Not Found.",
        description: `The agent with the specified ID '${agentId}' does not exist.`,
        traceId: uuidv4()
      });
    }
    
    // Validate credential type
    const validTypes = ['SECRET', 'MTLS', 'PRIVATE_KEY_JWT', 'OAUTH2_CLIENT_CREDENTIALS'];
    if (!credentialType || !validTypes.includes(credentialType)) {
      return res.status(400).json({
        code: "AGT-60001",
        message: "Invalid Input.",
        description: "Invalid or missing credential type.",
        traceId: uuidv4()
      });
    }
    
    const credentialId = uuidv4();
    
    const newCredential = {
      credentialId,
      agentId,
      credentialType,
      credentialDetails
    };
    
    credentials.set(credentialId, newCredential);
    
    // Create response object (mask sensitive data)
    const responseObj = {
      credentialId,
      credentialDetails: {
        credentialType
        // Note: sensitive fields are intentionally omitted
      }
    };
    
    res.status(201).json(responseObj);
  } catch (error) {
    res.status(500).json({
      code: "AGT-10001",
      message: "Internal Server Error.",
      description: "An unexpected error occurred while processing the request.",
      traceId: uuidv4()
    });
  }
});

// Update a specific credential for an agent
app.put('/:agentId/credentials/:credentialId', authenticate, authorize('internal_org_agent_mgt_update'), (req, res) => {
  try {
    const { agentId, credentialId } = req.params;
    const { credentialType, credentialDetails } = req.body;
    
    if (!agents.has(agentId)) {
      return res.status(404).json({
        code: "AGT-70001",
        message: "Resource Not Found.",
        description: `The agent with the specified ID '${agentId}' does not exist.`,
        traceId: uuidv4()
      });
    }
    
    if (!credentials.has(credentialId)) {
      return res.status(404).json({
        code: "AGT-70001",
        message: "Resource Not Found.",
        description: `The credential with the specified ID '${credentialId}' does not exist.`,
        traceId: uuidv4()
      });
    }
    
    const existingCred = credentials.get(credentialId);
    
    // Ensure the credential belongs to the specified agent
    if (existingCred.agentId !== agentId) {
      return res.status(404).json({
        code: "AGT-70001",
        message: "Resource Not Found.",
        description: `The credential with ID '${credentialId}' does not belong to agent with ID '${agentId}'.`,
        traceId: uuidv4()
      });
    }
    
    // Ensure credential type cannot be changed
    if (credentialType !== existingCred.credentialType) {
      return res.status(400).json({
        code: "AGT-60001",
        message: "Invalid Input.",
        description: "Credential type cannot be changed.",
        traceId: uuidv4()
      });
    }
    
    // Update the credential
    const updatedCredential = {
      ...existingCred,
      credentialDetails
    };
    
    credentials.set(credentialId, updatedCredential);
    
    // Create response object (mask sensitive data)
    const responseObj = {
      credentialId,
      credentialDetails: {
        credentialType
        // Note: sensitive fields are intentionally omitted
      }
    };
    
    res.status(200).json(responseObj);
  } catch (error) {
    res.status(500).json({
      code: "AGT-10001",
      message: "Internal Server Error.",
      description: "An unexpected error occurred while processing the request.",
      traceId: uuidv4()
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Agent Management API server listening at http://localhost:${port}`);
});
