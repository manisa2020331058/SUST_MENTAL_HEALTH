// controllers/seminarController.js
const asyncHandler = require('express-async-handler');
const Seminar = require('../models/Seminar');
const Student = require('../models/Student');

// Create Seminar
exports.createSeminar = asyncHandler(async (req, res) => {
  const seminar = new Seminar({
    ...req.body,
    conductedBy: req.user._id
  });

  await seminar.save();
  res.status(201).json(seminar);
});

// Get All Seminars
exports.getAllSeminars = asyncHandler(async (req, res) => {
  const seminars = await Seminar.find()
    .populate('conductedBy', 'personalInfo')
    .sort({ date: 1 });
  
  res.json(seminars);
});

// Update Seminar Status
exports.updateSeminarStatus = asyncHandler(async (req, res) => {
  const seminar = await Seminar.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );

  if (!seminar) {
    res.status(404);
    throw new Error('Seminar not found');
  }

  res.json(seminar);
});

