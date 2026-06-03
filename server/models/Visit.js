import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    device: {
      type: String,
      enum: ['Mobile', 'Tablet', 'Desktop', 'Unknown'],
      default: 'Unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    country: {
      type: String,
      default: 'Unknown',
    },
  },
  { timestamps: false }
);

visitSchema.index({ urlId: 1, timestamp: -1 });

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
