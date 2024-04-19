const express = require('express');
const ytdl = require('ytdl-core');
const sanitize = require('sanitize-filename');
const fs = require('fs');
const app = express();
const port = 8080;

app.get('/api/upload', async (req, res) => {
    const { link } = req.query;

    if (!link) {
        return res.status(400).send('Link parameter is missing');
    }

    try {
        // Validate if the link is a valid YouTube link
        if (!ytdl.validateURL(link)) {
            return res.status(400).send('Invalid YouTube link');
        }

        // Get video info
        const info = await ytdl.getInfo(link);

        // Generate safe file name from video title
        const fileName = sanitize(info.videoDetails.title.replace(/\s+/g, '_')) + '.mp3';

        // Download the audio as an MP3 file
        const audioStream = ytdl.downloadFromInfo(info, {
            format: 'mp3',
        });

        // Write the audio stream to disk
        const filePath = `${__dirname}/${fileName}`;
        const fileWriteStream = fs.createWriteStream(filePath);

        audioStream.pipe(fileWriteStream);

        fileWriteStream.on('finish', () => {
            // Redirect to the /files endpoint after downloading
            const redirectUrl = `/files?src=${encodeURIComponent(fileName)}`;
            res.redirect(redirectUrl);
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
        // Set response headers for the file
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
