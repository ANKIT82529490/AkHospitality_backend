import jwt from 'jsonwebtoken'

const doctorAuth = (req, res, next) => {
    try {
        const token = req.headers.dtoken
        if (!token) {
            return res.json({ success: false, message: "Not Authorized" })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.docId = decoded.id   

        next()

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default doctorAuth
