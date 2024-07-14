require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const interactionSchema = new mongoose.Schema({
  userMessage: String,
  botMessage: String,
  npcName: String,
  timestamp: { type: Date, default: Date.now },
});

const Interaction = mongoose.model('Interaction', interactionSchema);

app.post('/api/chat', async (req, res) => {
  const { message, npcName } = req.body;

  try {
    const response = await axios.post('https://api.anthropic.com/v1/claude', {
      prompt: `You are the ghost of an NPC named ${npcName} from the Laundry Files universe. Respond to the following message in character: ${message}`,
      max_tokens: 150,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const botMessage = response.data.choices[0].text.trim();

    const newInteraction = new Interaction({ userMessage: message, botMessage, npcName });
    await newInteraction.save();

    res.json({ botMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
