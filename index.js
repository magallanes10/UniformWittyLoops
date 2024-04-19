const express = require('express');
const ytdl = require('ytdl-core');
const sanitize = require('sanitize-filename');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8080;

app.get('/api/upload', async (req, res) => {
    const { link, title } = req.query;

    if (!link) {
        return res.status(400).send('Link parameter is missing');
    }

    try {
        if (!ytdl.validateURL(link)) {
            return res.status(400).send('Invalid YouTube link');
        }

        const info = await ytdl.getInfo(link);

        
        const fileName = title ? sanitize(title.replace(/\s+/g, '_')) + '.mp3' : sanitize(info.videoDetails.title.replace(/\s+/g, '_')) + '.mp3';

        const audioStream = ytdl.downloadFromInfo(info, {
            format: 'mp3',
        });

        const filePath = `${__dirname}/${fileName}`;
        const fileWriteStream = fs.createWriteStream(filePath);

        audioStream.pipe(fileWriteStream);

        fileWriteStream.on('finish', () => {
            res.json({ src: fileName });
        });

    } catch (error) {
        console.error('Error downloading YouTube audio:', error);
        res.status(500).send('Error downloading YouTube audio');
    }
});

app.get('/files', (req, res) => {
    const { src } = req.query;

    if (!src) {
        return res.status(400).send('Source parameter is missing');
    }

    try {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `inline; filename=${src}`);

        // Stream the audio file to the response
        const filePath = `${__dirname}/${src}`;
        const audioStream = fs.createReadStream(filePath);

        audioStream.pipe(res);

    } catch (error) {
        console.error('Error serving YouTube audio:', error);
        res.status(500).send('Error serving YouTube audio');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
