// server/vertex.js
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';

const project = process.env.GOOGLE_CLOUD_PROJECT;              // ← no hardcoding
const location = process.env.VERTEX_LOCATION || 'us-central1';
const model = process.env.VERTEX_MODEL || 'imagen-3.0-generate-001';

// Correct Vertex endpoint
const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

// Build GoogleAuth options using whichever credential pattern you provided
function buildAuthOptions() {
  // Prefer GOOGLE_APPLICATION_CREDENTIALS (Secret File path)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { scopes: ['https://www.googleapis.com/auth/cloud-platform'] };
  }
  // Fallback: full JSON pasted into an env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      return { credentials: creds, scopes: ['https://www.googleapis.com/auth/cloud-platform'] };
    } catch (e) {
      console.error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON:', e.message);
      process.exit(1);
    }
  }
  // Optional: base64 variant
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_B64) {
    try {
      const raw = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_B64, 'base64').toString('utf8');
      const creds = JSON.parse(raw);
      return { credentials: creds, scopes: ['https://www.googleapis.com/auth/cloud-platform'] };
    } catch (e) {
      console.error('Invalid GOOGLE_APPLICATION_CREDENTIALS_B64:', e.message);
      process.exit(1);
    }
  }
  console.error('No Google credentials found. Set GOOGLE_APPLICATION_CREDENTIALS (file path) or GOOGLE_APPLICATION_CREDENTIALS_JSON.');
  process.exit(1);
}

const auth = new GoogleAuth(buildAuthOptions());

export async function generateImage(prompt) {
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT not set');

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const body = {
    instances: [{ prompt }],
    parameters: { sampleCount: 1, negativePrompt: '' }
  };

  const res = await axios.post(endpoint, body, {
    headers: {
      Authorization: `Bearer ${token.token || token}`,
      'Content-Type': 'application/json',
    },
  });

  return res.data.predictions?.[0]?.bytesBase64Encoded || null;
}
