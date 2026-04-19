const express = require('express');
const { LOCATIONS, getLocations } = require('../../shared/locations');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getLocations());
});

router.get('/all', (req, res) => {
  res.json(LOCATIONS);
});

module.exports = router;