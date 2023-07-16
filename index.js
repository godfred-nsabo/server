const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const cors = require('cors');

const prisma = new PrismaClient();

async function main() {
    const app = express();

app.use(express.json());
app.use(cors())
app.use(express.static(__dirname)); // server css as static

// get our app to use body parser 
app.use(bodyParser.urlencoded({ extended: true }));
// Configure nodemailer
const transporter = nodemailer.createTransport({

  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER,  
    pass: process.env.GMAIL_PASS, 
  },
});
app.get("/contact", async (req, res) => {
    try {
      const response = await axios.get("http://127.0.0.1:5500/frontend/contact.html");
      const data = response.data
      res.send(data);
    } catch (error) {
       
      res.status(500).send("No data")
    }
})

// Function to validate email format
function validateEmail(email) {
  const emailRegex = /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
}

// Endpoint to handle the form submission
app.post("/contact", async (req, res) => {
  try {
    const { firstname, lastname, email, phone, message, subject } = req.body;

    // Validate email format
    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email Format." });
    }

    // Check if the email already exists in the database
    const existingContact = await prisma.contact.findUnique({ where: { email } });
    if (existingContact) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Validate string lengths
    const MAX_NAME_LENGTH = 50;
    const MAX_MESSAGE_LENGTH = 500;
    if (
      firstname.length > MAX_NAME_LENGTH ||
      lastname.length > MAX_NAME_LENGTH ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `First name, last name, and message should be less than ${MAX_NAME_LENGTH} characters, respectively.`,
      });
    }

    // Create a new contact record in the database
    const contact = await prisma.contact.create({
      data: {
        firstname,
        lastname,
        email,
        phone, 
        message,
        subject
      },
    });

    // Send an email to the client
    const mailOptions = {
      from: `SampsonCVWebsite <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Thank you for contacting us",
      text: "Your message has been received. We will get back to you soon.",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.json({
      success: true,
      message: "Contact form submitted successfully!",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while submitting the form.",
      });
  }
});



app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
  }
  
  main()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })