import multer from "multer"
import express from "express"
import pdfParse from "pdf-parse"
import Question from "../model/Question.js"

const storage = multer.memoryStorage()

const upload = multer({storage})

const router = express.Router();

router.post('/upload-questions', upload.single('pdf'), async (req, res) => {
    try {
      const { examCode } = req.body;
      if (!req.file) return res.status(400).json({ message: 'PDF file required' });
  
      const buffer = req.file.buffer;
      const pdfData = await pdfParse(buffer);
      const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);
  
      const questions = [];
      let current = null;
      let questionNumber = 0;
  
      for (let line of lines) {
        // Start of a new question
        if (/^\d+\./.test(line)) {
          if (current) questions.push(current); // Push previous question
  
          questionNumber++; // Increment for each new question
          current = {
            examCode,
            questionNumber,
            questionText: line.replace(/^\d+\.\s*/, '').trim(),
            options: {}
          };
        } else if (/^[A-Da-d]\)/.test(line)) {
          const key = line[0].toUpperCase();
          const value = line.slice(2).trim();
          if (current && ['A', 'B', 'C', 'D'].includes(key)) {
            current.options[key] = value;
          }
        }
      }
  
      if (current) questions.push(current); // Push final question
  
      const result = await Question.insertMany(questions);
  
      res.status(201).json({
        message: 'Questions uploaded successfully',
        examCode,
        inserted: result.length
      });
    } catch (err) {
      console.error('Error parsing PDF:', err);
      res.status(500).json({ message: 'Server Error while uploading questions' });
    }
  });


  router.post('/upload-answer-key', upload.single('pdf'), async (req, res) => {
    try {
      const { examCode } = req.body;
      if (!req.file) return res.status(400).json({ message: 'PDF file required' });
  
      const buffer = req.file.buffer;
      const pdfData = await pdfParse(buffer);
      const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);
  
      // Loop through each line in the PDF and update the answer key for each question
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = /^(\d+)\.\s([A-Da-d])/.exec(line); // Match question number and answer option (e.g. "1. A")
        if (match) {
          const questionNumber = parseInt(match[1]);
          const answer = match[2].toUpperCase();
  
          // Update the Question document with the correct option
          const question = await Question.findOneAndUpdate(
            { examCode, questionNumber }, 
            { correctOption: answer }, // Update correctOption
            { new: true } // Return the updated document
          );
  
          if (!question) {
            console.log(`Question with examCode: ${examCode} and questionNumber: ${questionNumber} not found.`);
          }
        }
      }
  
      res.status(200).json({
        message: 'Answer key uploaded and updated successfully',
        examCode
      });
    } catch (err) {
      console.error('Error parsing PDF:', err);
      res.status(500).json({ message: 'Server Error while uploading answer key' });
    }
  }); 
  

  //   router.post('/upload-answer-key', Authenticate,upload.single('pdf'), async (req, res) => {
//   try {
//     const { examCode } = req.body;
//     if (!req.file) return res.status(400).json({ message: 'PDF file required' });

//     const buffer = req.file.buffer;
//     const pdfData = await pdfParse(buffer);
//     const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

//     const examDoc = await ExamQuestion.findOne({ examCode });

//     if (!examDoc) {
//       return res.status(404).json({ message: 'Exam not found for given examCode' });
//     }

//     // Loop through answer key lines and update in-memory questions
//     for (let line of lines) {
//       const match = /^(\d+)\.\s*([A-Da-d])/.exec(line); // e.g., "1. A"
//       if (match) {
//         const questionNumber = parseInt(match[1]);
//         const answer = match[2].toUpperCase();

//         const question = examDoc.questions.find(q => q.questionNumber === questionNumber);
//         if (question) {
//           question.correctOption = answer;
//         } else {
//           console.log(`Question ${questionNumber} not found in examCode: ${examCode}`);
//         }
//       }
//     }

//     // Save once after all updates
//     await examDoc.save();

//     res.status(200).json({
//       message: 'Answer key uploaded and updated successfully',
//       examCode
//     });
//   } catch (err) {
//     console.error('Error parsing PDF:', err);
//     res.status(500).json({ message: 'Server Error while uploading answer key' });
//   }
// });

// router.post('/upload-questions', Authenticate,upload.single('pdf'), async (req, res) => {
//   try {
//     const { examCode } = req.body;
//     if (!req.file) return res.status(400).json({ message: 'PDF file required' });

//     const buffer = req.file.buffer;
//     const pdfData = await pdfParse(buffer);
//     const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

//     const questions = [];
//     let current = null;
//     let questionNumber = 0;

//     for (let line of lines) {
//       // Start of a new question
//       if (/^\d+\./.test(line)) {
//         if (current) questions.push(current); // Push previous question

//         questionNumber++;
//         current = {
//           questionNumber,
//           questionText: line.replace(/^\d+\.\s*/, '').trim(),
//           options: {}
//         };
//       } else if (/^[A-Da-d]\)/.test(line)) {
//         const key = line[0].toUpperCase();
//         const value = line.slice(2).trim();
//         if (current && ['A', 'B', 'C', 'D'].includes(key)) {
//           current.options[key] = value;
//         }
//       }
//     }

//     if (current) questions.push(current); // Push final question

//     // Save in one document with all questions
//     const result = await ExamQuestion.create({
//       examCode,
//       questions
//     });

//     res.status(201).json({
//       message: 'Questions uploaded and grouped successfully',
//       examCode,
//       questionCount: result.questions.length,
//       documentId: result._id
//     });

//   } catch (err) {
//     console.error('Error parsing PDF:', err);
//     res.status(500).json({ message: 'Server Error while uploading questions' });
//   }
// });
  export default router;