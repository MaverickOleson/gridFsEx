require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const mongodb = require('mongodb');
const client = new mongodb.MongoClient(process.env.MONGO_URI);
const db = client.db('gridFsEx');
const bucket = new mongodb.GridFSBucket(db, { bucketName: 'userImgs' });

(async () => {
    await client.connect();
})();

app.get('/api/v1/users', async (req, res) => {
    try {
        const users = await db.collection('gridFsEx').find({}).toArray();
        res.send(users);
    } catch (err) { res.status(500).json({ msg: err }) }
});
app.post('/api/v1/users', async (req, res) => {
    try {
        const user = { _id: req.body.name, imgs: [] };

        const match = await db.collection('gridFsEx').findOne({ _id: req.body.name });
        if (match) return res.redirect('/');

        const createImg = image => {
            const imgId = (mongodb.ObjectId()).toString();
            user.imgs.push(imgId);

            fs.writeFileSync(`./${imgId}.png`, image.data, { encoding: 'base64' });
            fs.createReadStream(`./${imgId}.png`).
                pipe(bucket.openUploadStream(imgId, {
                    chunkSizeBytes: 10485760
                })).on('finish', () => {
                    fs.unlinkSync(`./${imgId}.png`)
                });
        }

        if (req.files.img.length) {
            req.files.img.forEach(image => {
                createImg(image);
            })
        } else {
            createImg(req.files.img);
        }

        await db.collection('gridFsEx').insertOne(user);

        res.redirect('/')
    } catch (err) { res.status(500).json({ msg: err }) }
});

app.post('/api/v1/userDelete/:id', async (req, res) => {
    try {
        await client.connect();
        const user = await db.collection('gridFsEx').findOne({ _id: req.params.id });
        user.imgs.forEach(async imgName => {
            const imageId = [];
            const image = bucket.find({ filename: imgName });
            await image.forEach(img => imageId.push(img._id));
            await bucket.delete(imageId[0]);
        })
        await db.collection('gridFsEx').deleteOne({ _id: req.params.id });
        res.redirect('/');
    } catch (error) {
        res.status(500).json({ msg: error });
    }
});

app.get('/api/v1/userImages', async (req, res) => {
    try {
        const data = [];
        await bucket.find({}).forEach(doc => data.push(doc));
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ msg: error });
    }
})

app.get('/api/v1/userImages/:id', async (req, res) => {
    try {
        await client.connect();
        const data = [];
        await bucket.find({ filename: req.params.id }).forEach(doc => data.push(doc));
        if (!data.length) return res.status(404).json({ msg: 'URL path does not exist' });
        bucket.openDownloadStreamByName(req.params.id).pipe(res);
        res.status(201);
    } catch (err) { res.status(500).json({ msg: err }) }
});

module.exports = app;