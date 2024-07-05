// server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = 'AIzaSyCXWicT0jLpv6DtnHzj9lO21zsrxuc2Fcw';

app.use(express.static('public'));
app.use(express.json());

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

app.post('/get-recommendations', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const chatSession = model.startChat({ generationConfig, history: [] });
    const result = await chatSession.sendMessage(imageBase64);
    res.json({ recommendations: result.response.text() });
  } catch (error) {
    res.status(500).send('Error getting recommendations');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
