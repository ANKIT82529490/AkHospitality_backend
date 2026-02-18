import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'

// Api to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !password || !email) {
            return res.json({ success: false, message: "Missing Details" })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password (min 8 chars)" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Api login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: 'User does not exist' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid credentials' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Api to get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.userId   
        const userData = await userModel.findById(userId).select('-password')
        res.json({ success: true, userData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId   
        const { name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data is Missing" })
        }

        // Validate phone number
        if (!/^\d{10}$/.test(phone)) {
            return res.json({ success: false, message: "Phone number must be 10 digits" })
        }

        const updateData = {
            name,
            phone,
            dob,
            gender
        }

        if (address) {
            try {
                updateData.address = JSON.parse(address)
            } catch (e) {
                return res.json({ success: false, message: "Invalid address format" })
            }
        }

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            updateData.image = imageUpload.secure_url
        }

        await userModel.findByIdAndUpdate(userId, updateData)

        res.json({ success: true, message: "Profile Updated" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId; // 👈 from auth middleware
    const { docId, slotDate, slotTime } = req.body;

    // Validate required fields
    if (!docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: 'Missing required fields' });
    }

    const docData = await doctorModel.findById(docId).select('-password');
    if (!docData) {
      return res.json({ success: false, message: 'Doctor not found' });
    }
    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor not available' });
    }

    // Check slot availability using the model's method
    if (!docData.isSlotAvailable(slotDate, slotTime)) {
      return res.json({ success: false, message: 'Slot not available' });
    }

    // Book the slot
    const slots_booked = docData.slots_booked;
    if (!slots_booked.has(slotDate)) {
      slots_booked.set(slotDate, []);
    }
    slots_booked.get(slotDate).push(slotTime);

    const userData = await userModel.findById(userId).select('-password');
    if (!userData) {
      return res.json({ success: false, message: 'User not found' });
    }

   const appointmentData = {
  userId,
  docId,
  userData,
  docData: {
    _id: docData._id,
    name: docData.name,
    image: docData.image,
    speciality: docData.speciality,
    address: docData.address,
    experience: docData.experience,
    fees: docData.fees,
    degree: docData.degree,
    about: docData.about,
    available: docData.available
  },
  amount: docData.fees,
  slotTime,
  slotDate,
  // ✅ REMOVE THIS (schema default will set date)
  // date: Date.now()
};


    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: 'Appointment Booked' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const listAppointment = async (req, res) => {
    try {
        
        const userId = req.userId; 

        if (!userId) {
            // Agar token decode ho gaya par ID nahi mili
            return res.json({ success: false, message: "Authentication failed. User ID missing after token decode." });
        }

        // Yeh backend console mein print hoga
        console.log("Appointment List Request received for User ID:", userId); 

        const appointments = await appointmentModel.find({ userId });

        res.json({ success: true, appointments });
        
    } catch (error) {
        console.log("Error in listAppointment:", error);
        res.json({ success: false, message: error.message });
    }
}


    const cancelAppointment = async (req , res) => {
    try {
        const userId = req.userId;
        const {appointmentId} = req.body;

        if (!appointmentId) {
            return res.json({ success: false, message: "Appointment ID missing." });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
             return res.json({ success: false, message: "Appointment not found." });
        }

        if (appointmentData.userId.toString() !== userId.toString()) {
            return res.json({success:false,message:'Unauthorized action'});
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

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

//Online Patments system 
const paymentRazorpay = async (req,res) => {



    try {

         const { appointmentId } = req.body
         const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData || appointmentData.cancelled) {
        return res.json({success:false,message:"Appoinment Cancelled or not found"})
    }

    // creating option for razorpay payment 
    const options = {
        amount: appointmentData.amount * 100,
        currency: process.env.CURRENCY,
        receipt: appointmentId,
    }

    // creation of an order
    const order = await razorpayInstance.orders.create(options)
    res.json({success:true,order})
        
    } catch (error) {
        
         console.log(error);
         res.json({ success: false, message: error.message });

    }
 }
//Api to verify payment 
const verifyRazorpay = async (req,res) => {


    try {

        const {razorpay_order_id} = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        console.log(orderInfo)
        if(orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
            res.json({success:true, message:"Payment Successful"})
        } else {
            res.json({success:false, message:"Payment failed"})
        }
        
    } catch (error) {
         console.log(error);
         res.json({ success: false, message: error.message });

    }
 }



export { registerUser, loginUser, getProfile , updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay }

