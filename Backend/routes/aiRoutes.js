const express = require('express');
const Parser = require('rss-parser');
const parser = new Parser();
const router = express.Router();

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