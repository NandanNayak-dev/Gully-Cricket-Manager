const express = require('express');
const router = express.Router();
const GullyInfo = require('../models/GullyInfo');

// Register
router.post('/register', async (req, res) => {
  try {
    const { gullyName, password } = req.body;
    let gully = await GullyInfo.findOne({ gullyName });
    if (gully) return res.status(400).json({ msg: 'Gully already exists' });

    gully = new GullyInfo({ gullyName, password });
    await gully.save();
    
    res.json({ _id: gully._id, gullyName: gully.gullyName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { gullyName, password } = req.body;
    let gully = await GullyInfo.findOne({ gullyName });
    if (!gully) return res.status(400).json({ msg: 'Invalid Credentials' });

    if (gully.password !== password) return res.status(400).json({ msg: 'Invalid Credentials' });
    
    res.json({ _id: gully._id, gullyName: gully.gullyName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
