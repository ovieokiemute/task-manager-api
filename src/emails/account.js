const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ovie.okiemute@hotmail.com',
        subject: 'Welcome to our Application',
        text: `Welcome ${name}. Thank you for choosing our cloud services. Let us know how you enjoy it.`
    })
};

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ovie.okiemute@hotmail.com',
        subject: 'We are sad to see you go',
        text: `Goodbye from Mars Cloud Services. ${name}, please let us know what we could do to be of better service to you.`
})

};


module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}