const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');

const { Media } = require("../models");
const fs = require('fs');

router.post('/', (req, res) => {
  const image = req.body.image;
  if (!isBase64(image, {mimeRequired : true})) {
    return res.status(400).json({ status : 'error', message : 'Invalid base64' });
  }

  try {
    base64Img.img(image, './public/images', Date.now(), async (err, filepath) => {
        if (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }

        const filename = filepath.split('\\').pop().split('/').pop();
        const media = await Media.create({ images: `/images/${filename}` });

        if (!media) {
            return res.status(400).json({ status: 'error', message: 'Error creating media' });
        } else {
            return res.status(200).json({
                status: 'success',
                data: {
                    id: media.id,
                    image: `${req.get('host')}/images/${filename}`,
                },
            });
        }
    });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
  
});

router.get('/', async (req, res) => {
  const media = await Media.findAll();

  const mappedMedia = media.map((n) => {
    return {
      id: n.id,
      image: `${req.get('host')}${n.images}`,
    };
  })

  if(!media) {
    return res.status(400).json({ status : 'error', message : 'Error getting media' });
  } else {
    if (media.length === 0) { 
      return res.status(200).json({
        status: 'success',
        message: 'request is successful, but the data is empty' ,
      });
    }
    return res.status(200).json({
      status: 'success', data: mappedMedia
    });
  }
})

router.delete('/:id', async (req, res) => {
  const media = await Media.findOne({ where: { id: req.params.id } });

  if (!media) {
    return res.status(404).json({ status: 'error', message: 'Error deleting media, media not found' });
  } else {
    fs.unlink(`./public${media.images}`, async (err) => { 
      if (err) {
        return res.status(400).json({ status: 'error', message: err.message });
      } 
      await media.destroy();
      return res.status(200).json({ status: 'success', message: 'media deleted' });
    });
  }
});

module.exports = router;
