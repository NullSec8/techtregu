const express = require('express');
const auth = require('../middleware/auth');
const favoritesRepository = require('../database/favoritesRepository');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  const favorites = await favoritesRepository.getUserFavorites(req.user.id);
  res.json(favorites);
}));

router.get('/ids', auth, asyncHandler(async (req, res) => {
  const ids = await favoritesRepository.getFavoriteIds(req.user.id);
  res.json(ids);
}));

router.post('/:listingId', auth, asyncHandler(async (req, res) => {
  const listingId = parseInt(req.params.listingId, 10);
  if (Number.isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ message: 'Invalid listing id' });
  }
  const added = await favoritesRepository.addFavorite(req.user.id, listingId);
  res.json({ ok: true, added });
}));

router.delete('/:listingId', auth, asyncHandler(async (req, res) => {
  const listingId = parseInt(req.params.listingId, 10);
  if (Number.isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ message: 'Invalid listing id' });
  }
  const removed = await favoritesRepository.removeFavorite(req.user.id, listingId);
  res.json({ ok: true, removed });
}));

router.get('/check/:listingId', auth, asyncHandler(async (req, res) => {
  const listingId = parseInt(req.params.listingId, 10);
  if (Number.isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ message: 'Invalid listing id' });
  }
  const favorited = await favoritesRepository.isFavorite(req.user.id, listingId);
  res.json({ favorited });
}));

module.exports = router;