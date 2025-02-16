import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: function() {
      return !this.metadata?.isSystemBroadcast;
    }
  },
  time: {
    type: String,
    required: function() {
      return !this.metadata?.isSystemBroadcast;
    }
  },
  period: {
    type: String,
    enum: ['AM', 'PM', 'morning', 'afternoon', 'evening', 'night'],
    required: function() {
      return !this.metadata?.isSystemBroadcast;
    }
  },
  message: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  notificationTypes: {
    type: [String],
    default: ['sms']
  },
  fcmStatus: {
    type: String,
    default: 'not_applicable'
  },
  fcmToken: {
    type: String,
    default: null
  },
  telegramChatId: {
    type: String,
    default: null
  },
  metadata: {
    type: Object,
    default: {}
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a pre-save middleware to set default values for broadcast messages
notificationSchema.pre('save', function(next) {
  if (this.metadata?.isSystemBroadcast) {
    this.time = this.time || '00:00';
    this.period = this.period || 'morning';
  }
  next();
});

notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ fcmStatus: 1, scheduledFor: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 