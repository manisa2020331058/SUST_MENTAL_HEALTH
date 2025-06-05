// routes/seminarRoutes.js
const express = require('express');
const { 
  createSeminar,
  getAllSeminars,
  updateSeminarStatus,
  deleteSeminar
} = require('../controllers/seminarController');
const { protect, psychologistOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect,psychologistOnly, createSeminar)
  .get( getAllSeminars);

router.route('/:id/status')
  .put(protect,psychologistOnly, updateSeminarStatus);
  router.route('/:id')
  .delete(protect, psychologistOnly, deleteSeminar);


module.exports = router;