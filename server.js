// server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCXWicT0jLpv6DtnHzj9lO21zsrxuc2Fcw';

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

async function uploadToGemini(imageBase64) {
  const imagePath = path.join(__dirname, 'temp.jpg');
  fs.writeFileSync(imagePath, Buffer.from(imageBase64, 'base64'));

  try {
    const uploadResult = await fileManager.uploadFile(imagePath, {
      mimeType: 'image/jpeg',
      displayName: 'temp.jpg',
    });
    fs.unlinkSync(imagePath); // Clean up temp file
    return uploadResult.file;
  } catch (error) {
    fs.unlinkSync(imagePath); // Clean up temp file in case of error
    console.error('Upload to Gemini failed:', error);
    throw error;
  }
}

app.post('/upload-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const file = await uploadToGemini(imageBase64);
    res.json({ uri: file.uri });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error uploading image', details: error.message });
  }
});

app.post('/get-recommendations', async (req, res) => {
  try {
    const { imageUri, transcript } = req.body;
    const prompt = `Provide improvements based on this image and speech. Use 10 words. Speech: ${transcript}`;
    console.log(prompt);
    
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: 'image/jpeg',
                fileUri: imageUri,
              }
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage('');
    res.json({ recommendations: result.response.text() });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Error getting recommendations', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});