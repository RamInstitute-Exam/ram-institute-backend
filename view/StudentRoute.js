import express, { Router } from "express"
import { GetStudent, getStudentExamReports, getStudentExamResult, getStudentExamStatus, RegisterStudent, StudentDeleteById, StudentLogin, StudentLogout, StudentsList, StudentUpdate } from "../Controller/StudentController.js";
import cloudinary from "../config/Cloudinary.js"
import multer from "multer"
import Student from "../model/Students.js";
import Authenticate from "../auth/Auth.js";
const route = express.Router();


route.post('/Register',RegisterStudent)
route.post('/Login',StudentLogin)
route.post('/Logout',Authenticate,StudentLogout)
route.get('/list',Authenticate,StudentsList)
route.get('/student-profile/:User',Authenticate,GetStudent)
route.put('/student-update/:User',Authenticate,StudentUpdate)
route.get('/Reports',Authenticate,getStudentExamReports)


route.get('/student/:studentId/exam/:examCode/status',Authenticate,getStudentExamStatus)
route.get('/student/:studentId/exam/:examCode/result',Authenticate,getStudentExamResult);

route.delete('/:id',Authenticate,StudentDeleteById)


const storage = multer.memoryStorage()

const upload = multer ({storage})

route.post('/upload-profile/:id',upload.single('profilephoto'), async(req,res)=>{
    try{
const studentId = req.params.id;
const file = req.file;

if(!file){
    return res.status(404).json({message:"No file Uploaded"})
}

const base64String = file.buffer.toString('base64')
const dataUri= `data:${file.mimetype}base64,${base64String}`

const uploadResult = await cloudinary.uploader.upload(dataUri,{
    folder:'student/profile',
    public_id: `student_${studentId}`
})

const updatedStudent = await Student.findByIdAndUpdate(studentId,
    {profilePhoto:uploadResult.secure_url},
    {new:true}
)
 res.status(200).json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: updatedStudent.profilePhoto,
    });
    }
    catch(error){
        console.error(error);
        
    }
})



export default route;