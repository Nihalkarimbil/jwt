require('dotenv').config()
const express =require('express')
const app=express()
const jwt = require('jsonwebtoken')
const mongoose=require('mongoose')

app.use(express.json())
app.use(express.urlencoded({extended:true}))

const userAuth=async(req,res,next)=>{
    const token=req.headers['x-acces-token']
    if(!token){
        res.status(401).json({message:'authorised'})
    }
    try {
        const decoded=jwt.verify(token,process.env.SECRET_KEY)
        req.userid=decoded.userid
        next()
    } catch (error) {
        console.log(error)
        res.status(401).json({message:'unauthorised'})
    }
}


mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('connected with mongo')).catch((error)=>console.log(error))

const userSchema=new mongoose.Schema({
    username:String,
    password:String
})

const User= mongoose.model('user',userSchema)

app.post('/api/register',async(req,res)=>{
    try {
        const {username,password}=req.body;
        const user =await User.findOne({username:username})
        if(user){
            return res.status(400).json({message:'user already exist'})
        }
        const newUser=new User({username,password})
        await newUser.save()
        const token =await jwt.sign({userid:newUser._id},process.env.SECRET_KEY)
        res.status(200).json({message:'user created sucsesfully',token})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({messege:'internal server eror'})
    }
})


app.post('/api/login',async(req,res)=>{
    try {
        const {username,password}=req.body;
        const user= await User.findOne({username:username})
        if(!user){
            return res.status(401).json({message:'invalid cresentials'})
        }
        if(user.password !== password){
            return res.status(401).json({message:'invalid credentials'})
        }
        const token = jwt.sign({ userid: user._id }, process.env.SECRET_KEY, {
            expiresIn: '1h' // Token will expire in 1 hour
        });
        res.status(200).json({ message: 'User logged in successfully', token });

    } catch (error) {
        console.log(error)
        res.status(500).json({message:'internal server error'})
    }
})

app.get('/api/protected',userAuth,(req,res)=>{
    res.status(200).json({message:'protetected resourse'})

})

app.get('/api/user',userAuth,async(req,res)=>{
    try {
        const user= await User.findById(req.userid)
        res.status(200).json({username:user.username})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:'internal server'})
    }
})

app.listen(3004,()=>console.log('app running'))