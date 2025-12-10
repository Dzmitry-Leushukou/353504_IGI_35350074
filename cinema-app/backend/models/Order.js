const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  seats: {
    type: [String],
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'online'],
    default: 'online'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  showDate: {
    type: Date,
    required: true
  },
  showTime: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for user timezone display
orderSchema.virtual('showDateLocal').get(function() {
  // This would be handled in the controller based on user timezone
  return this.showDate;
});

orderSchema.virtual('orderDateLocal').get(function() {
  return this.orderDate;
});

module.exports = mongoose.model('Order', orderSchema);