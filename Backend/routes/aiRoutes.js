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
    try {
        const summaryResponse = await axios.get(`http://localhost:5000/api/ai/getSummary/${userId}`);
        const summary = summaryResponse.data.summary || "No summary found.";

        const studentAiHistory = await StudentAiChat.findOne({ userId });
        //const summary = studentAiHistory.summary;
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


router.get('/getSummary/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const userChat = await StudentAiChat.findOne({ userId });

        if (!userChat) {
            return res.status(404).json({ error: 'User chat not found.' });
        }
        res.json({ summary: userChat.summary });
    } catch (err) {
        console.error('Error fetching summary:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.post('/update-summary/:userId', async (req, res) => {
    const { userId } = req.params;
    const { latestMessage } = req.body;

    if (!latestMessage) {
        return res.status(400).json({ error: 'latestMessage is required.' });
    }

    try {
        const studentAiHistory = await StudentAiChat.findOne({ userId });

        if (!studentAiHistory) {
            return res.status(404).json({ error: 'Chat record not found for user.' });
        }

        const previousSummary = studentAiHistory.summary || "No previous summary.";

        const prompt = `
            You are a mental health summarizer. Your job is to generate a concise and evolving psychological summary of a user based on their past summary and their most recent message.

            Instructions:
            - The updated summary should reflect the user's emotional state, personality traits, mental health concerns, and communication tone.
            - You must **prioritize the latest message** over older ones. If it contradicts older information, favor the latest one.
            - Keep useful previous information if it’s still relevant.
            - Avoid repeating outdated or contradicted statements.
            - Do **not** include explanations, formatting, or introductory phrases like "Updated Summary:" — only output the **final summary** sentence(s).
            - Write in simple, natural English, as if you're describing the person to a counselor.
            - Do **not** assume details not present in the inputs.

            Previous Summary:
            "${previousSummary}"

            Latest User Message:
            "${latestMessage}"

            Now generate an improved, realistic summary of the user based on the above:
            `.trim();



        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: 'You are an empathetic summarizer for mental health conversations.' },
                    { role: 'user', content: prompt },
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const updatedSummary = response.data.choices[0].message.content.trim();

        // Save updated summary
        studentAiHistory.summary = updatedSummary;
        await studentAiHistory.save();

        res.json({ updatedSummary });
    } catch (error) {
        console.error('Summary update error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to update summary.' });
    }
});


router.get('/getQuote/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const student = await StudentAiChat.findOne({ userId });
        const summary = student?.summary || "This user needs mental support and guidance.";

        const prompt = `
            You are a mental health assistant. Based on the following psychological summary of a person, generate one short, inspiring or comforting quote to help them feel better or stay motivated.

            User Summary: "${summary}"

            Only return the quote and nothing else.
            `.trim();

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: 'You are a positive and motivational quote generator for mental health users.' },
                    { role: 'user', content: prompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const quote = response.data.choices[0].message.content.trim();
        console.log(quote);
        res.json({ quote });

    } catch (err) {
        console.error('Error generating quote:', err.message);
        res.status(500).json({ error: 'Failed to generate quote' });
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