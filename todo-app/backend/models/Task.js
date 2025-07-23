const mongoose = require('mongoose');

  const TaskSchema = new mongoose.Schema({
    task_id: {
      type: Number,
      required: [true, 'Task ID is required'],
      unique: true,
      min: [1, 'Task ID must be positive']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [3, 'Description must be at least 3 characters']
    },
    due_date: {
      type: Date,
      required: [true, 'Due date is required']
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    tags: {
      type: [String],
      default: []
    }
  }, { timestamps: true });

  // TaskSchema.index({ task_id: 1 });

  module.exports = mongoose.model('Task', TaskSchema);