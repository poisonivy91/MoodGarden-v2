// server/vertex.js
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';

const project = 'moodgarden-469017';
const location = 'us-central1';
const model = 'imagen-3.0-generate-001'; // ✅ verified working from console

const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

const auth = new GoogleAuth({
  keyFile: './keys/moodgarden-469017-fe8abe6538fe.json',
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

export async function generateImage(prompt) {
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const body = {
      instances: [{ prompt }],
      parameters: { sampleCount: 1 }, // ✅ minimal valid body
    };

    console.log('>>> Requesting Imagen with:', body);

    const res = await axios.post(endpoint, body, {
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('>>> Vertex response:', JSON.stringify(res.data, null, 2));

    return res.data.predictions?.[0]?.bytesBase64Encoded || null;
  } catch (err) {
    console.error('Vertex AI error:', err.response?.data || err.message);
    throw err;
  }
}


