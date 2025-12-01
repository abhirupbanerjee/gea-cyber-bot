// Test script to fetch and display the OpenAI Assistant configuration
require('dotenv').config();
const axios = require('axios');

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION;

async function fetchAssistant() {
  try {
    const headers = {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    };

    if (OPENAI_ORGANIZATION) {
      headers['OpenAI-Organization'] = OPENAI_ORGANIZATION;
    }

    const response = await axios.get(
      `https://api.openai.com/v1/assistants/${ASSISTANT_ID}`,
      { headers }
    );

    console.log('=== ASSISTANT CONFIGURATION ===\n');
    console.log('Name:', response.data.name);
    console.log('Model:', response.data.model);
    console.log('\nTools:', response.data.tools.length);

    response.data.tools.forEach((tool, index) => {
      console.log(`\n--- Tool ${index + 1} ---`);
      console.log('Type:', tool.type);

      if (tool.type === 'function') {
        console.log('Function Name:', tool.function.name);
        console.log('Description:', tool.function.description);
        console.log('Parameters:', JSON.stringify(tool.function.parameters, null, 2));
      }
    });

    console.log('\n=== END ===');

  } catch (error) {
    console.error('Error fetching assistant:', error.response?.data || error.message);
  }
}

fetchAssistant();
