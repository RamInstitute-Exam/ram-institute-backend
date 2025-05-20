import ExamQuestion from "../model/Question.js";
import StudentExamReport from "../model/StudentExam.js";


export  const ExamsList = async (req, res) => {
  try {
    const exams = await ExamQuestion.find({}, {
      examCode: 1,
      examName: 1,
      examDescription: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Failed to fetch exams.' });
  }
}

export const getAllExams = async (req, res) => {
  try {
    const exams = await ExamQuestion.find().sort({ createdAt: -1 });
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch exams' });
  }
};





export const ExamSubmit = async (req, res) => {
  try {
    const { examCode, studentId, answers, autoSubmitted = false } = req.body;

    if (!studentId || !examCode || !answers) {
      return res.status(400).json({ message: "Missing studentId, examCode, or answers" });
    }

    // Find the exam
    const exam = await ExamQuestion.findOne({ examCode });
    if (!exam) {
      return res.status(404).json({ message: "❌ Exam not found" });
    }

    // Check for existing completed submission
    let studentExam = await StudentExamReport.findOne({ studentId, examCode });

    if (studentExam && studentExam.status === "completed") {
      return res.status(400).json({ message: "❌ Exam already submitted" });
    }

    // If no report exists, create new
    const now = new Date();
    if (!studentExam) {
      studentExam = new StudentExamReport({
        studentId,
        examCode,
        startTime: now,
      });
    }

    // Store student answers
    studentExam.answers = answers;

    // Calculate score
    let correctAnswers = 0;
    for (const question of exam.questions) {
      const selectedOption = answers[question.questionNumber];
      if (selectedOption === question.correctOption) {
        correctAnswers++;
      }
    }

    const totalQuestions = exam.questions.length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const passingCriteria = Math.ceil(totalQuestions * 0.6);
    const resultStatus = correctAnswers >= passingCriteria ? "passed" : "failed";

    // Update report
    studentExam.totalQuestions = totalQuestions;
    studentExam.correctAnswers = correctAnswers;
    studentExam.wrongAnswers = wrongAnswers;
    studentExam.result = correctAnswers;
    studentExam.status = "completed";
    studentExam.endTime = now;
    studentExam.autoSubmitted = autoSubmitted;

    // Calculate time taken in seconds
    const timeTakenInSeconds = Math.floor((now - studentExam.startTime) / 1000);
    studentExam.timeTakenInSeconds = timeTakenInSeconds;

    await studentExam.save();

    // Update exam summary
    exam.totalAttendees = (exam.totalAttendees || 0) + 1;
    if (resultStatus === "passed") {
      exam.passCount = (exam.passCount || 0) + 1;
    } else {
      exam.failCount = (exam.failCount || 0) + 1;
    }

    await exam.save();

    res.status(200).json({
      message: "✅ Exam submitted successfully",
      data: {
        examCode,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        result: resultStatus,
        score: correctAnswers,
        timeTakenInSeconds,
        submittedAt: studentExam.endTime,
      }
    });

  } catch (error) {
    console.error("Exam Submit Error:", error);
    res.status(500).json({ message: "❌ Internal server error" });
  }
};


export const Questions =  async (req, res) => {
  try {
    const { examCode } = req.params; 
    const exam = await ExamQuestion.findOne({ examCode });

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // remove correct options before sending to students
    const questionsForStudent = exam.questions.map(q => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options, 
    }));

    res.status(200).json({ examCode, questions: questionsForStudent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}


// export const ExamSubmit = async (req, res) => {
//   try {
//     const { examCode, studentId, answers } = req.body;

//     if (!studentId || !examCode) {
//       return res.status(400).json({ message: "Missing studentId or examCode" });
//     }

//     // Find the exam
//     const exam = await ExamQuestion.findOne({ examCode });
//     if (!exam) {
//       return res.status(404).json({ message: "Exam not found" });
//     }

//     // Find or create a new student exam report
//     let studentExam = await StudentExamReport.findOne({ studentId, examCode });
//     if (!studentExam) {
//       studentExam = new StudentExamReport({
//         studentId,
//         examCode,
//         startTime: Date.now(),
//       });
//     }

//     // Calculate correct answers
//     let correctAnswers = 0;
//     exam.questions.forEach((q) => {
//       if (answers[q.questionNumber] === q.correctOption) {
//         correctAnswers++;
//       }
//     });

//     const totalQuestions = exam.questions.length;
//     const wrongAnswers = totalQuestions - correctAnswers;
//     const passingCriteria = Math.ceil(totalQuestions * 0.6); // 60% pass
//     const status = correctAnswers >= passingCriteria ? "passed" : "failed";

//     // Update the student's exam result
//     studentExam.result = correctAnswers;
//     studentExam.status = "completed";
//     studentExam.correctAnswers = correctAnswers;
//     studentExam.wrongAnswers = wrongAnswers;
//     studentExam.endTime = Date.now();

//     await studentExam.save();

//     // Update the exam summary counts
//     exam.totalAttendees = (exam.totalAttendees || 0) + 1;
//     if (status === "passed") {
//       exam.passCount = (exam.passCount || 0) + 1;
//     } else {
//       exam.failCount = (exam.failCount || 0) + 1;
//     }

//     await exam.save();

//     res.status(200).json({
//       message: "✅ Exam submitted successfully",
//       studentExam: {
//         totalQuestions,
//         correctAnswers,
//         wrongAnswers,
//         result: status,
//         score: correctAnswers,
//         status: "completed",
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };