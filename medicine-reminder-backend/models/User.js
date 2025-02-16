import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true,
    select: true,
    get: function(v) {
      return v === true;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Validate Indian phone numbers (10 digits)
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  whatsappNumber: {
    type: String,
    trim: true,
  },
  fcmToken: {
    type: String,
    default: null
  },
  telegramChatId: {
    type: String,
    default: null
  },
  telegramUsername: {
    type: String,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpiry: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      // Always ensure isAdmin is a boolean
      ret.isAdmin = doc.isAdmin === true;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      // Always ensure isAdmin is a boolean
      ret.isAdmin = doc.isAdmin === true;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords for user:', this.email);
    if (!this.password) {
      console.error('No password hash stored for user');
      return false;
    }
    if (!candidatePassword) {
      console.error('No candidate password provided');
      return false;
    }
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User; 