const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const { JSDOM } = require('jsdom');

const app = express();
const CACHE_TTL = process.env.CACHE_TTL || 108000; // 默认缓存时间为 108000 秒
const cache = new NodeCache({ stdTTL: CACHE_TTL });
const targetUrl = process.env.TARGET_URL || 'http://cfyy.cc/cdn/ks/bilibili482946.flv';

const axiosConfig = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  timeout: 5000 // 设置超时时间为 5 秒
};

async function fetchVideoUrl() {
  try {
    const response = await axios.get(targetUrl, axiosConfig);
    const dom = new JSDOM(response.data);
    const scriptTags = dom.window.document.querySelectorAll('script');

    for (const script of scriptTags) {
      const scriptContent = script.textContent;
      const videoUrlMatch = scriptContent.match(/video\s*:\s*'([^']+)'/);

      if (videoUrlMatch && videoUrlMatch[1]) {
        return videoUrlMatch[1];
      }
    }
    throw new Error('Video URL not found in the page');
  } catch (error) {
    console.error('Error fetching video URL:', error);
    throw new Error('Failed to fetch video URL');
  }
}

async function getVideoUrl() {
  const cachedVideoUrl = cache.get('videoUrl');

  if (cachedVideoUrl) {
    return cachedVideoUrl;
  }

  const videoUrl = await fetchVideoUrl();
  cache.set('videoUrl', videoUrl);
  return videoUrl;
}

app.get('/', async (req, res) => {
  try {
    const videoUrl = await getVideoUrl();
    res.redirect(videoUrl);
  } catch (error) {
    res.status(500).send(`Error fetching video URL: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
