const express = require('express');
const Parser = require('rss-parser');
const parser = new Parser();
const router = express.Router();
const axios = require('axios');
const StudentAiChat = require('../models/StudentAiChat');
require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

router.post('/aiChat', async (req, res) => {
    const { userId, message } = req.body;
    console.log(userId, message);
    if(!userId || !message){
        return res.status(400).json({ error: 'userId and message are required' });
    }
    try{
        const studentAiHistory = await StudentAiChat.findOne({ userId });
        const summary = studentAiHistory.summary;
        const chatHistory = studentAiHistory.chatHistory;
        const last_10_messages = chatHistory.slice(-10);
        const contextMessages = [
            {
                role: 'system',
                content: `You are a compassionate mental health chatbot named "MindMate". Help users with empathy, kindness, and support, but do not give medical advice. User summary: ${summary}`,
            },
            ...last_10_messages.map(msg => ({
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
                model: 'llama3-70b-8192', 
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
        const userMsg = `User: ${message}`;
        const botMsg = `Bot: ${reply}`;
        const updatedChatHistory = [...studentAiHistory.chatHistory, userMsg, botMsg];

        studentAiHistory.chatHistory = updatedChatHistory;
        
        await studentAiHistory.save();

        res.json({ reply });

    } catch (err) {
        console.error('Error From AI:', err.message);
        res.status(500).json({ error: 'Failed to fetch blog feed' });
    }
});

router.get('/podcasts', async (req, res) => {
    try {
        const feed = await parser.parseURL('https://feeds.megaphone.fm/verywellmindpodcast');

        // Filter items that have a non-empty link
        const validItems = feed.items.filter(item => item.link && item.link.trim() !== '');

        // Map only the valid ones
        const blogList = validItems.slice(0, 5).map(item => ({
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

router.get('/getArticles', async (req, res) => {
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

module.exports = router;