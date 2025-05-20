import mongoose from 'mongoose';

const studentExamSchema = new mongoose.Schema(
  {
    examCode: {
      type: String,
      required: true,
      trim: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Students',
      required: true,
    },

    answers: {
      type: Map,
      of: String, // Example: { '1': 'A', '2': 'C' }
      default: {},
    },

    attemptedQuestions: {
      type: Number,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
    },

    result: {
      type: Number,
      default: null, // Final score or percentage
    },

    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },

    startTime: {
      type: Date,
      default: null,
    },

    endTime: {
      type: Date,
      default: null,
    },

    durationInMinutes: {
      type: Number,
      default: null, // Optional time limit
    },

    autoSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Time taken in seconds
studentExamSchema.virtual('timeTakenInSeconds').get(function () {
  if (this.startTime && this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return null;
});

const StudentExamReport = mongoose.model('StudentExamReport', studentExamSchema);

export default StudentExamReport;
