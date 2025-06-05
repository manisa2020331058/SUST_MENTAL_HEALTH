const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const User = require('./models/User');
const connectDB = require('./db');
const Parser = require('rss-parser');




const parser = new Parser();
connectDB(); 
const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.get('/blogs', async (req, res) => {
    try {
        const feed = await parser.parseURL('https://www.psychiatrictimes.com/rss');
        const blogList = feed.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            summary: item.contentSnippet || item.content?.slice(0, 200)
        }));
        res.json(blogList);
    } catch (err) {
        console.error('Error fetching blogs:', err.message);
        res.status(500).json({ error: 'Failed to fetch blog feed' });
    }
});


app.get('/podcasts', async (req, res) => {
    try {
        const feed = await parser.parseURL('https://feeds.megaphone.fm/verywellmindpodcast');
        const blogList = feed.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            summary: item.contentSnippet || item.content?.slice(0, 200)
        }));
        res.json(blogList);
    } catch (err) {
        console.error('Error fetching blogs:', err.message);
        res.status(500).json({ error: 'Failed to fetch blog feed' });
    }
});

// Route to register a new user
app.post('/register', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = new User({
            username,
            summary: '',
            last_10_messages: [],
            allMsg: [],
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (err) {
        console.error('❌ Registration error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/chat', async (req, res) => {
    const { username, message } = req.body;

    if (!username || !message) {
        return res.status(400).json({ error: 'Username and message are required.' });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Build context messages
        const history = user.last_10_messages || [];
        const summary = user.summary || "No summary provided.";

        console.log(summary,username);

        const contextMessages = [
            {
                role: 'system',
                content: `You are a compassionate mental health chatbot named "MindMate". Help users with empathy, kindness, and support, but do not give medical advice. User summary: ${summary}`,
            },
            ...history.map(msg => ({
                role: msg.startsWith("User:") ? "user" : "assistant",
                content: msg.replace(/^User: |^Bot: /, "")
            })),
            {
                role: 'user',
                content: message,
            }
        ];

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192', // Updated to a valid model name
                messages: contextMessages,
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const reply = response.data.choices[0].message.content;

        // Update message history
        const userMsg = `User: ${message}`;
        const botMsg = `Bot: ${reply}`;
        const updatedLast10 = [...history, userMsg, botMsg].slice(-10);
        const updatedAll = [...user.allMsg, userMsg, botMsg];

        user.last_10_messages = updatedLast10;
        user.allMsg = updatedAll;
        await user.save();

        res.json({ reply });

    } catch (error) {
        console.error('Groq API error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Groq request failed' });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
