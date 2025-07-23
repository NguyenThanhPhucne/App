const express = require('express');
  const router = express.Router();
  const mongoose = require('mongoose');
  const Task = require('../models/Task');

  // Validate ObjectId Middleware
  const validateObjectId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    next();
  };

  // GET all tasks with optional filtering
  router.get('/', async (req, res) => {
    try {
      let query = {};
      if (req.query.status) query.status = req.query.status;
      if (req.query.tag) query.tags = { $in: [req.query.tag] };
      const tasks = await Task.find(query);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST create a task
  router.post('/', async (req, res) => {
    try {
      const { task_id, description, due_date, tags, status } = req.body;
      const task = new Task({
        task_id,
        description,
        due_date: new Date(due_date),
        tags: tags || [],
        status: status || 'pending'
      });
      await task.save();
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // PUT update a task
  router.put('/:id', validateObjectId, async (req, res) => {
    try {
      const updates = {};
      const allowedUpdates = ['description', 'due_date', 'tags', 'status'];
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (req.body.due_date) updates.due_date = new Date(req.body.due_date);
      const task = await Task.findByIdAndUpdate(req.params.id, { $set: updates }, {
        new: true,
        runValidators: true
      });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE a task
  router.delete('/:id', validateObjectId, async (req, res) => {
    try {
      const task = await Task.findByIdAndDelete(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ message: 'Task deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  module.exports = router;