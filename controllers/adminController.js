import validator from "validator"
import bcrypt from 'bcrypt'
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"

const addDoctor = async (req,res) => {
    try {
        const {name, email, password, speciality,  degree, experience, about, fees, address} = req.body
        const imageFile = req.file

        // Checking for all required data
        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
            return res.json({success:false,message:"Missing Details"})
        }

        // Check if image file exists
        if (!imageFile) {
            console.log('No image file received');
            return res.json({success:false,message:"Image file is required"})
        }

        console.log('Image file received:', imageFile);
        console.log('Image file path:', imageFile.path);

        // Validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false,message:"Please enter a valid email"})
        }

        // Validating strong password
        if(password.length < 8){
            return res.json({success:false,message:"Please enter a strong password"})
        }

        // Validating fees
        const feesNum = parseFloat(fees);
        if (isNaN(feesNum) || feesNum <= 0) {
            return res.json({success:false,message:"Please enter a valid positive fee amount"})
        }

        // Hashing doctor password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"})
        const imageUrl = imageUpload.secure_url

        let addressObj;
        try {
            addressObj = JSON.parse(address);
        } catch (e) {
            return res.json({success:false,message:"Invalid address format"})
        }

        const doctorData = {
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees: feesNum,
            address: addressObj,
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({success:true,message:"Doctor Added"})
    } catch (error) {
        console.log("Error in addDoctor:", error);
        res.json({success:false,message:error.message})
    }
}


//API For admin Login
const loginAdmin = async (req,res) => {
    try {
        const {email,password} = req.body

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){

            const token = jwt.sign(email+password,process.env.JWT_SECRET)
            res.json({success:true,token})

        }else{
            res.json({success:false,message:"Invalid credentials"})
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API to get all doctor list for admin panel
const allDoctors = async (req,res) => {
    try {
        
        const doctors = await doctorModel.find({}).select('-password')
        res.json({success:true,doctors})

    } catch (error) {
          console.log(error)
        res.json({success:false,message:error.message})
    }
}


const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({success:true,appointments}) 
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//Api for appointment cancellation
const appointmentCancel = async (req , res) => {
    try {
        const {appointmentId} = req.body;

        if (!appointmentId) {
            return res.json({ success: false, message: "Appointment ID missing." });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
             return res.json({ success: false, message: "Appointment not found." });
        }

        if (appointmentData.cancelled) {
            return res.json({success:false,message:'Appointment already cancelled'});
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true});

        // Releasing doctor slot
        const {docId, slotDate, slotTime} = appointmentData;
        const doctorData = await doctorModel.findById(docId);

        if (doctorData) {
            const slots_booked = doctorData.slots_booked;
            if (slots_booked.has(slotDate)) {
                slots_booked.set(slotDate, slots_booked.get(slotDate).filter(e => e !== slotTime));
                await doctorModel.findByIdAndUpdate(docId, { slots_booked });
            }
        }

        res.json({success:true, message:'Appointment Cancelled'});

    } catch (error) {
        console.log("Error in cancelAppointment:", error);
        res.json({ success: false, message: error.message });
    }
}

//Api to get dashbord data for admin panel
 const adminDashboard = async (req,res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments:appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }

        res.json({success:true,dashData})
        
    } catch (error) {
         console.log(error);
        res.json({ success: false, message: error.message });
    }
 }

export {addDoctor,loginAdmin,allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard}






