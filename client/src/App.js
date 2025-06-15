import React, { useEffect, useState } from 'react';
import Form from '@rjsf/core';
import axios from 'axios';
import { saveAs } from 'file-saver';
import validator from "@rjsf/validator-ajv8";
import './App.css';

const transformErrors = (errors) => {
  return errors.map(err => {
    if (err.name === "required") {
      return {
        ...err,
        message: `${err.params.missingProperty} is required`
      };
    }
    return err;
  });
};


function App() {
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    axios.get('http://localhost:8000/schema')
      .then(res => setSchema(res.data))
      .catch(() => setStatus("Failed to load schema"));

    axios.get('http://localhost:8000/submissions')
      .then(res => setSubmissions(res.data));
  }, []);

  const handleSubmit = ({ formData }) => {
    axios.post('http://localhost:8000/submit', formData)
      .then(() => {
        setStatus("✅ Form submitted successfully");
        setFormData({});
        return axios.get('http://localhost:8000/submissions');
      })
      .then(res => setSubmissions(res.data))
      .catch(err => {
        const msg = err.response?.data?.errors?.[0]?.message || "Submission failed";
        setStatus("❌ " + msg);
      });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
    saveAs(blob, 'form-data.json');
  };

  const handleImport = (e) => {
    const reader = new FileReader();
    reader.onload = () => setFormData(JSON.parse(reader.result));
    reader.readAsText(e.target.files[0]);
  };

  const handleClear = () => {
    axios.delete('http://localhost:8000/clear-submissions')
      .then(() => {
        setSubmissions([]);
        setStatus("🧹 Cleared all submissions");
      })
      .catch(() => setStatus("❌ Failed to clear submissions"));
  };
  

  if (!schema) return <p>Loading form schema...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>{schema.title || "Dynamic Form"}</h2>

      <Form
        schema={schema}
        formData={formData}
        validator={validator} 
        transformErrors={transformErrors}
        showErrorList={false} 
        onChange={e => setFormData(e.formData)}
        onSubmit={handleSubmit}
        liveValidate
      />

<div style={{ marginTop: 10 }}>

  <button onClick={handleClear} style={{ backgroundColor: "red" }}>Clear Submissions</button>
</div>


      <p>{status}</p>

      <h3>Submitted Entries</h3>
      <ul>
        {submissions.map((s, i) => (
          <li key={i}>{JSON.stringify(s.data)}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
