const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv();        
addFormats(ajv);             

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/schemaform');

const formDataSchema = new mongoose.Schema({
  schemaId: String,
  data: Object,
  timestamp: { type: Date, default: Date.now },
});

const FormData = mongoose.model('FormData', formDataSchema);

const schema = JSON.parse(fs.readFileSync('./schemas/sharedSchema.json'));
const validate = ajv.compile(schema); 

app.get('/schema', (req, res) => {
  res.json(schema);
});

app.post('/submit', async (req, res) => {
  const isValid = validate(req.body);
  if (!isValid) {
    return res.status(400).json({ errors: validate.errors });
  }

  const entry = new FormData({ schemaId: schema.title, data: req.body });
  await entry.save();
  res.status(200).json({ message: 'Form submitted successfully.' });
});

app.get('/submissions', async (req, res) => {
  const entries = await FormData.find({ schemaId: schema.title });
  res.json(entries);
});

app.delete('/clear-submissions', async (req, res) => {
    try {
      await FormData.deleteMany({ schemaId: schema.title });
      res.status(200).json({ message: 'Submissions cleared.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to clear submissions.' });
    }
  });
  

app.listen(8000, (err) => {
    if (err) {
      console.error("❌ Error binding to port 8000:", err);
    } else {
      console.log("✅ Server running on port 8000");
    }
  });
  
