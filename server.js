require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {});

const interactionSchema = new mongoose.Schema({
  userMessage: String,
  botMessage: String,
  npcName: String,
  timestamp: { type: Date, default: Date.now },
});

const Interaction = mongoose.model('Interaction', interactionSchema);

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

// Add the GET endpoint
app.get('/api/chat', (req, res) => {
  res.json({ message: 'Success! The GET endpoint is working.' });
});

// Add a root endpoint for quick verification
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/api/chat', async (req, res) => {
  const { message, npcName } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [{ role: "user", content: `You are the ghost of an NPC named ${npcName} from the Laundry Files universe. Respond to the following message in character: ${message}` }],
    });

    console.log('Response: ', JSON.stringify(response));

    // Extract the bot message from the response
    const botMessage = response.content[0].text;
    const newInteraction = new Interaction({ userMessage: message, botMessage, npcName });
    await newInteraction.save();

    res.json({ botMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

const port = process.env.BACKEND_SERVER_PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
