const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 600 }); // 缓存时间为10分钟

app.get('/', async (req, res) => {
  const cacheKey = 'videoUrl';
  const cachedVideoUrl = cache.get(cacheKey);

  if (cachedVideoUrl) {
    return res.redirect(cachedVideoUrl);
  }

  try {
    const url = 'https://cfyy.cc/api/ks/zb.php?id=CrossFire_2008';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    let videoUrl = '';
    $('script').each((i, script) => {
      const scriptContent = $(script).html();
      if (scriptContent.includes('var ok=new Ckey')) {
        const startIndex = scriptContent.indexOf("video:'") + 7;
        const endIndex = scriptContent.indexOf("'", startIndex);
        videoUrl = scriptContent.substring(startIndex, endIndex);
      }
    });

    if (videoUrl) {
      cache.set(cacheKey, videoUrl); // 缓存结果
      res.redirect(videoUrl);
    } else {
      res.send('未找到包含视频链接的脚本标签');
    }
  } catch (error) {
    res.status(500).send('获取页面内容失败');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
