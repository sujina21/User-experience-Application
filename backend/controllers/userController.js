const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {success, failure} =  require('../utils/message');
const moment = require("moment");
const cloudinary = require("../utils/cloudinary");
const {randomOtpGenerator} = require("../utils/randomOtpGenerator.js");
const {sendEmail} = require("../utils/sendEmail.js");
const emailTemplate = require("../utils/emailTemplate.js");

exports.register_new_user = async (req, res) => {
    
    try{
        const checkUser= await User.findOne({email: req.body.email});
        if(checkUser){
           res.json(failure("User Already Exists"));
        }
        else{
            const fullname = req.body.name;
            let avatarUrl=`https://ui-avatars.com/api/?background=random&name=${fullname}`;

            if(req.files !== undefined){
                const formImage = req.files.profilePicture;
                const imagePath = formImage.tempFilePath;
                avatarUrl = await cloudinary.upload_image(imagePath);
            }
            const email = req.body.email;
            const phone = req.body.phone;
            const role = req.body.role;
            const password = req.body.password;
            const salt = await bcrypt.genSalt(10);
            const hash= await bcrypt.hash(password, salt);
            const newUser = new User({
                fullname: fullname,
                email: email,
                phone: phone,
                role: role ? role : "user",
                password: hash,
                profile: avatarUrl
            });
            const subject = "Welcome to The Beauty Aesthetics";
            const textContent = emailTemplate.welcomeEmailTemplate(fullname)
            sendEmail(email, fullname, subject, textContent)
            await newUser.save();
            res.json(success("User Registered Successfully"));
            
        }
    }
    catch(err){
        console.log(err);

        res.json(failure("Something went wrong"));
    }
    res.end();


};

exports.login_user = async (req, res) => { 
    try{
        const user = await User.findOne({email: req.body.email});
        if(user){
            const validPass = await bcrypt.compare(req.body.password, user.password);
            if(validPass){
                const accessToken = jwt.sign({_id: user._id}, process.env.TOKEN_KEY);
                console.log(`login --> `+accessToken);
                
                res.json({message:"Login Successful", data:user, success:true, accessToken: accessToken});
            }
            else{
                res.json(failure("Invalid Email or Password"));
            }
        }
        else{
            res.json(failure("Invalid Email or Password"));
        }
    }   
    catch(err){
        console.log(err);
        res.json(failure("Something went wrong"));
    }
    res.end();
}   

exports.get_user_profile = async (req, res) => {
    try{
        const user = await User.findById(req.user._id);  //already verified user
        if(user){
            res.json(success("User Fetched", user));
        }
        else{
            res.json(failure("User Not Found"));
        }
    }
    catch(err){
        console.log(err);
        res.json(failure("Something went wrong"));
    }
    res.end();
}

exports.update_user_profile = async (req, res) => {
    try{
        await User.updateOne({_id: req.user._id}, {
            fullname: req.body.fullname,
            bio: req.body.bio,
            phone: req.body.phone,
            address: req.body.address,
            gender: req.body.gender,
            website: req.body.website
        });
        res.json(success("Profile Updated Successfully"));
    } catch(err){
        console.log(err);
        res.json(failure("Something went wrong"));
    }   
    res.end();
}

/*
module.exports.reset_password = async (req, res) => {
    try{
        const user = await User.findOne({email: req.body.email});
        if(user){
            const resetCode = randomIntGenerator(100000, 999999);
            console.log(`Your OTP: ${resetCode}`);
            const hashedResetCode= await bcrypt.hash(resetCode.toString(), 10);
            const resetCodeExpiry = moment().add(20, 'minutes');
            await User.findByIdAndUpdate(user._id, {resetCode: hashedResetCode, resetCodeExpiration: resetCodeExpiry}); 
            //send email with reset code
            res.json(success("Reset Code Sent Successfully"));
        } else {
            res.json(failure("Email doesnot Exist"));
        }
        } catch(err){
            console.log(err);
            res.json(failure("Something went wrong"));
        }
        res.end();
}

module.exports.create_new_password = async (req, res) => {
    try{
        const user = await User.findOne({email: req.body.email}).select("resetCode resetCodeExpiration"); 
        if(user){
            const validResetCode = await bcrypt.compare(req.body.resetCode, user.resetCode);
            if(validResetCode){
                const currentTime = moment(Date.now()).format();
                const remainingTime = -(moment(currentTime).diff(user.resetCodeExpiration, 's'));
                console.log(`Now: ${currentTime} | Expiry: ${user.resetCodeExpiration} | Remaining Time: ${remainingTime} seconds`);
                if(remainingTime>0){
                    const salt = await bcrypt.genSalt(10);
                    const hash= await bcrypt.hash(req.body.newPassword, salt);
                    await User.findByIdAndUpdate(user._id, {password: hash});
                    res.json(success("Password Updated Successfully"));
                } else {
                    res.json(failure("Reset Code Expired"));
                }
                user.resetCode = null;
                user.resetCodeExpiration = null;
                await user.save();
            } else {
                res.json(failure("Invalid Reset Code"));
            }
        } else {
            res.json(failure("Email doesnot Exist"));
        }
    } catch(err){
        console.log(err);
        res.json(failure("Something went wrong"));
    }   
    res.end();
}

*/

module.exports.get_all_users = async (req, res) => {
    try{
        const users = await User.find().select("fullname email phone role");
        res.json(success("Users Fetched", users)); 
    }
    catch(err){
        console.log(err);
        res.json(failure("Something went wrong"));
    }
    res.end();
}


module.exports.update_user_role = async (req, res) => {
    try{
        await User.updateOne({_id: req.params.userId}, {role: req.params.status});
        res.json(success("User Role Updated Successfully"));
    }
    catch(err){
        console.log(err);
        res.json(failure("Something went wrong"));
    }
    res.end();
}

module.exports.resetCode = async (req, res) => {
    try {
        const email = req.body.email
        const resetCode = randomOtpGenerator(100000, 999999)
        const hashedResetCode = await bcrypt.hash(resetCode.toString(), 10);
        const resetCodeExpiration = moment().add(24, 'h')
        const user = await User.findOne({ email: email })
        if (!user) {
            return res.status(404).json(failure("User doesn't found with this email"))
        }
        user.resetCode = hashedResetCode
        user.resetCodeExpiration = resetCodeExpiration.format()
        await user.save()
        const subject = "Reset password"
        const textContent = emailTemplate.resetPasswordEmailTemplate(user.fullname, resetCode, resetCodeExpiration.format('MMMM Do YYYY, h:mm:ss a'))
        sendEmail(user.email, user.fullname, subject, textContent)
        res.json(success("Reset code sent to your registered email"))
    } catch (error) {
        console.error(error)
    }
    res.end()
}

module.exports.change_password = async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findOne({ _id: req.user._id }).select("+passwordSetDate")
    // Check is Old Password is valid
    const validLogin = await bcrypt.compare(oldPassword, user.password)
    if (validLogin) {
        const salt = await bcrypt.genSalt(10)
        // Create new password
        const hashed = await bcrypt.hash(newPassword, salt)
        user.passwordSetDate = new Date()
        user.password = hashed
        await user.save()
        res.status(200).json(success("Password Changed"))
    }
    else {
        res.status(404).json(failure())
    }
    res.end()
}

module.exports.newPassword = async function (req, res) {
    try {
        const email = req.body.email
        const resetCode = req.body.resetCode
        const password = req.body.newPassword
        const user = await User.findOne({ email: email }).select("resetCode resetCodeExpiration password")
        if (user) {
            if (user.resetCode) {
                const isValid = await bcrypt.compare(resetCode, user.resetCode);
                if (isValid) {
                    const now = moment(Date.now()).format()
                    const expiration = user.resetCodeExpiration
                    const remainingTime = -(moment(now).diff(expiration, 's'))
                    console.log(now, expiration, remainingTime)
                    if (remainingTime > 0) {
                        const salt = await bcrypt.genSalt(10);
                        const hashed = await bcrypt.hash(password, salt);
                        user.password = hashed
                        res.status(200).json(success("Password Reset"))
                    }
                    else {
                        res.status(400).json(failure("Reset Code Expired"))
                    }
                    user.resetCode = null
                    user.resetCodeExpiration = null
                    user.save()
                }
                else {
                    res.json(failure("Invalid reset code"))
                }
            }
            else {
                res.json(failure("Reset Code does not exist"))
            }
        }
        else {
            res.json(failure("Reset Code does not exist"))
        }
    } catch (error) {
        console.log(error)
        res.json(failure())
    }
    res.end()
}