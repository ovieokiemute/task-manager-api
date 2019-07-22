const validator = require('validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tasks = require('./task');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    age: {
        type: Number,
        default: 0,
        trim: true,
        validate(value){
            if(value < 0){
                throw new Error ('Age must be a positive number');
            }
        },
        
    },

    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: true,
        validate(value){
            if (!validator.isEmail(value)){
                throw new Error ('Email is invalid');
            }
        },
        

    },

    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        validate(value){
            if (validator.contains(value.toLowerCase(), 'password')){
                throw new Error('Cannot contain password');
            }
        }

    },

    avatar: {
        type: Buffer
    },

    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]

}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function(){
    const userObject = this.toObject();

    delete userObject.tokens;
    delete userObject.password;
    delete userObject.avatar;

    return userObject;
}

userSchema.methods.generateAuthToken = async function(){
    const token = jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET_KEY);

    this.tokens = this.tokens.concat({ token });

    await this.save();


    return token;


}

userSchema.statics.findUserCredentials = async (email, password) => {
    const user = await User.findOne({email});

    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new Error('Unable to login');
    }

    return user;
}


userSchema.pre('save', async function(next){
    
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 8)
    }

    next()
});

userSchema.pre('remove', async function(next){
    await Tasks.deleteMany({owner: this._id});

    next();
})

const User = mongoose.model('Users', userSchema);


module.exports = User;



 