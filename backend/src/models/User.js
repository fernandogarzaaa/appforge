/**
 * User Model
 * Basic user schema for authentication and profile management
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  password: {
    type: String,
    required: true
  },
  
  firstName: {
    type: String,
    trim: true
  },
  
  lastName: {
    type: String,
    trim: true
  },
  
  role: {
    type: String,
    enum: ['user', 'admin', 'developer'],
    default: 'user'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date
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

const User = mongoose.model('User', userSchema);

export { User };
export default User;
