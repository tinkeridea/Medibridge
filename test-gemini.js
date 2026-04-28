const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
ai.getGenerativeModel({ model: 'gemini-pro' }).generateContent('test').then(console.log).catch(console.error);
