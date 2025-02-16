import mongoose from 'mongoose';
import { parseISO, isValid } from 'date-fns';

const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  duration: {
    startDate: {
      type: String,
      required: true
    },
    days: {
      type: Number,
      required: true
    }
  },
  timings: [{
    time: {
      type: String,
      required: true
    },
    period: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: true
    }
  }],
  active: {
    type: Boolean,
    default: true
  },
  instructions: String
}, { timestamps: true });

const Medication = mongoose.model('Medication', medicationSchema);

export default Medication; 