import express from 'express'
import cors from "cors";
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctor.Route.js';
import userRouter from './routes/userRoute.js'

//app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middlewares
app.use(express.json())

const allowedOrigins = [
  process.env.FRONTEND_URL?.trim(),
  process.env.ADMIN_URL?.trim(),
  'https://ak-hospitality-frontend-94cy.vercel.app',
  'https://ak-hospitality-admin.vercel.app',
  'https://ak-hospitality-backend.vercel.app'
].filter(Boolean)

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS policy violation: origin not allowed'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'atoken', 'dtoken'],
  credentials: true,
  exposedHeaders: ['Authorization']
}))

app.options(/.*/, cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'atoken', 'dtoken'],
  credentials: true
}))

//api endpoints
app.use('/api/admin',adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)

app.get('/',(req,res)=>{
    res.send('API WORKING GRATING')
})

app.listen(port, ()=> console.log("Server Started",port))
