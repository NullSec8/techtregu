const express = require('express');
const auth = require('../middleware/auth');
const favoritesRepository = require('../database/favoritesRepository');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const favorites = await favoritesRepository.getUserFavorites(req.user.id);
    res.json(favorites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/ids', auth, async (req, res) => {
  try {
    const ids = await favoritesRepository.getFavoriteIds(req.user.id);
    res.json(ids);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/:listingId', auth, async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId, 10);
    if (Number.isNaN(listingId) || listingId <= 0) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }
    const added = await favoritesRepository.addFavorite(req.user.id, listingId);
    res.json({ ok: true, added });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.delete('/:listingId', auth, async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId, 10);
    if (Number.isNaN(listingId) || listingId <= 0) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }
    const removed = await favoritesRepository.removeFavorite(req.user.id, listingId);
    res.json({ ok: true, removed });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/check/:listingId', auth, async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId, 10);
    if (Number.isNaN(listingId) || listingId <= 0) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }
    const favorited = await favoritesRepository.isFavorite(req.user.id, listingId);
    res.json({ favorited });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;