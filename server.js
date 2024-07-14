require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Anthropic } = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {});

const interactionSchema = new mongoose.Schema({
  sessionId: String,
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
  const { message, npcName, sessionId } = req.body;

  try {
    let conversation = [];
    let session = sessionId;

    if (session) {
      // Retrieve the conversation history
      conversation = await Interaction.find({ sessionId: session }).sort({ timestamp: 1 });
    } else {
      // Create a new session if none exists
      session = uuidv4();
    }

    // Format the conversation context
    const conversationContext = conversation.map(interaction => ({
      role: "user",
      content: `User: ${interaction.userMessage}\nNPC: ${interaction.botMessage}`
    }));

    // Add the new user message to the context
    conversationContext.push({ role: "user", content: `User: ${message}` });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: conversationContext,
    });

    console.log('Response: ', JSON.stringify(response));

    // Extract the bot message from the response
    const botMessageContent = response.content[0].text;
    if (!botMessageContent) {
      throw new Error("Response content is undefined");
    }

    const newInteraction = new Interaction({
      sessionId: session,
      userMessage: message,
      botMessageContent,
      npcName
    });
    await newInteraction.save();

    res.json({ botMessageContent, sessionId: session });
  } catch (error) {
    console.error('Error: ', error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

const port = process.env.BACKEND_SERVER_PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
