const express = require('express');
const router = new express.Router();
const User = require('../models/users');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const {sendWelcomeEmail, sendGoodbyeEmail} = require('../emails/account');



router.post('/users', async (req, res) => {
    const user = new User(req.body);
   

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);

        const token = await user.generateAuthToken();
        res.status(201).send({user, token})

    } catch (error) {
        res.status(400).send(error);
    }

  
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findUserCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.send({user, token});

    } catch (error) {
        res.status(404).send(error);
    }
});

router.get('/users/me', auth, async (req, res) => {

    res.send(req.user);
    // try {

    //   const user = await User.find({});
    //   res.status(201).send(user)  

    // } catch (error) {
       
    //     res.status(400).send(error)
    // }  
});


router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
           return token.token !== req.token
        });

        await req.user.save();
        res.send()
    } catch (error) {
        res.status(500).send()
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();
        res.send('Logged out all Sessions!')
    } catch (error) {
        res.status(500).send();
    }
})


router.patch('/users/me', auth, async (req, res)=> {
    const updates = Object.keys(req.body);
    const acceptedUpdates = ['name', 'age', 'email', 'password'];
    const isValidUpdates = updates.every(update => acceptedUpdates.includes(update));

    if(!isValidUpdates){
        return res.status(404).send('Invalid Updates');
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);

        await req.user.save()

       //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true}, );
       
    //    if(!user){
    //        return  res.status(400).send();
    //    }

       res.send(req.user)
    } catch (error) {
        res.status(500).send(error) 
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndRemove(req.params.id);(req.user._id)
        // if(!user){
        //     return res.status(404).send();
        //}

        
        await req.user.remove();
        sendGoodbyeEmail(req.user.email, req.user.name);
        
        res.send(req.user);
        
    } catch (error) {
        res.status(500).send()
    }
});


//Uploading profile photo

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpeg|png|jpg)$/)){
            return cb(new Error('Please upload an Image'));
        }

        cb(undefined, true)
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height:250}).png().toBuffer();
    req.user.avatar = buffer

    //req.user.avatar = req.file.buffer;

    await req.user.save();
    res.send('File upload successful')
}, (error, req, res, next) => {
    res.send({
        Error: error.message
    })
});

router.delete('/users/me/avatar', auth, async(req, res) => {

    req.user.avatar = undefined;

    await req.user.save();
    res.send({status: 'Removed successfully'})
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar){
            throw new Error('Could not find your avatar')
        }

         res.set('Content-type', 'image/png');
         res.send(user.avatar)
    } catch (error) {
        res.status(404).send({Error: error})
    }
})



module.exports = router;


