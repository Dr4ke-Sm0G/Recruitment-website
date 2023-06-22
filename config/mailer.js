const mailer = require('nodemailer');

module.exports = {

    sendEmail: function(to, subject, content) {

        // Check that emails are enabled.
        if(!process.env.EMAIL_ENABLED) return;

        const transporter = mailer.createTransport({
            host: process.env.EMAIL_SERVICE,
            port: process.env.EMAIL_PORT,
            secureConnection: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            }
        });

        // Setting a global sender.
        const options = {
            'from': process.env.EMAIL_SENDER,
            'to': to,
            'subject': subject,
            'text': content
        };

        transporter.sendMail(options, (error, info) =>{
            if(error) console.error(`Cannot send email to ${options.to}.`);
            else console.log(`Email sent to ${options.to}`);
        });
    }
}