// routes/seminarRoutes.js
const express = require('express');
const { 
  createSeminar,
  getAllSeminars,
  updateSeminarStatus
} = require('../controllers/seminarController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createSeminar)
  .get(protect, getAllSeminars);

router.route('/:id/status')
  .put(protect, updateSeminarStatus);

module.exports = router;