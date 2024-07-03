const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const { JSDOM } = require('jsdom');

const app = express();
const cache = new NodeCache({ stdTTL: 108000 }); // 缓存 30 小时，108000 秒

const targetUrl = 'http://cfyy.cc/cdn/ks/bilibili482946.flv';

async function fetchVideoUrl() {
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const dom = new JSDOM(response.data);
    const scriptContent = dom.window.document.querySelector('script').textContent;
    const videoUrlMatch = scriptContent.match(/video\s*:\s*'([^']+)'/);

    if (videoUrlMatch && videoUrlMatch[1]) {
      return videoUrlMatch[1];
    } else {
      throw new Error('Video URL not found');
    }
  } catch (error) {
    console.error('Error fetching video URL:', error.message);
    throw error;
  }
}

app.get('/', async (req, res) => {
  const cachedVideoUrl = cache.get('videoUrl');

  if (cachedVideoUrl) {
    return res.send(`Cached video URL: ${cachedVideoUrl}`);
  }

  try {
    const videoUrl = await fetchVideoUrl();
    cache.set('videoUrl', videoUrl);
    res.send(`Fetched video URL: ${videoUrl}`);
  } catch (error) {
    res.status(500).send(`Error fetching video URL: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
