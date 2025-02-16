import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../../services/axiosConfig';

const severityLevels = ['Mild', 'Moderate', 'Severe'];
const durations = ['Hours', 'Days', 'Weeks'];
const commonSymptoms = [
  'Headache', 'Fever', 'Nausea', 'Fatigue', 
  'Cough', 'Body Pain', 'Dizziness', 'Stomach Pain'
];

export default function SymptomAnalyzer({ userMedications }) {
  const [formData, setFormData] = useState({
    symptoms: [],
    customSymptom: '',
    severity: 'Mild',
    duration: 'Hours',
    factors: {
      fever: false,
      fatigue: false,
      sleepIssues: false,
      highStress: false
    },
    medications: userMedications || [],
    allergies: '',
    medicalConditions: ''
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to use the symptom analyzer');
      setLoading(false);
      return;
    }
    console.log('Submitting symptoms:', formData);
    try {
      const response = await axios.post('/api/analyze-symptoms/analyze', {
        ...formData,
        medications: formData.medications || []  // Ensure medications is an array
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      alert('Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Symptom Analyzer</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symptoms Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Symptoms
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {commonSymptoms.map(symptom => (
              <button
                key={symptom}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  symptoms: prev.symptoms.includes(symptom)
                    ? prev.symptoms.filter(s => s !== symptom)
                    : [...prev.symptoms, symptom]
                }))}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.symptoms.includes(symptom)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Enter other symptoms..."
            value={formData.customSymptom}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              customSymptom: e.target.value
            }))}
            className="mt-2 w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Severity and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                severity: e.target.value
              }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              {severityLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                duration: e.target.value
              }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              {durations.map(duration => (
                <option key={duration} value={duration}>{duration}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Other Factors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Factors
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(formData.factors).map(([key, value]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    factors: {
                      ...prev.factors,
                      [key]: !value
                    }
                  }))}
                  className="mr-2"
                />
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Symptoms'}
        </button>
      </form>

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-white rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Recommendation:</h4>
              <p className="text-gray-600">{analysis.recommendation}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Possible Causes:</h4>
              <ul className="list-disc list-inside text-gray-600">
                {analysis.possibleCauses.map((cause, index) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </div>
            {analysis.urgency && (
              <div className={`p-4 rounded-md ${
                analysis.urgency === 'high' ? 'bg-red-100 text-red-700' :
                analysis.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                <p className="font-medium">
                  {analysis.urgency === 'high' ? '⚠️ Seek immediate medical attention' :
                   analysis.urgency === 'medium' ? '⚠️ Consider consulting a doctor' :
                   '✓ Self-care measures recommended'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
} 