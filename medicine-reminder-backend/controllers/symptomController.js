import axios from 'axios';

// Predefined medical knowledge base
const SYMPTOM_RULES = {
  Headache: {
    causes: [
      'Tension or stress',
      'Dehydration',
      'Eye strain',
      'Migraine',
      'High blood pressure'
    ],
    recommendations: {
      mild: 'Rest, hydration, and over-the-counter pain relievers if needed',
      moderate: 'Take a break from screens, try cold/hot compress, consider pain medication',
      severe: 'Seek medical attention, especially if accompanied by other symptoms'
    },
    urgencyFactors: ['fever', 'vomiting', 'vision changes', 'neck stiffness']
  },
  Fever: {
    causes: [
      'Viral infection',
      'Bacterial infection',
      'Inflammatory condition',
      'Heat exhaustion'
    ],
    recommendations: {
      mild: 'Rest, fluids, and monitor temperature',
      moderate: 'Take fever reducers, rest, and increase fluid intake',
      severe: 'Seek immediate medical attention if temperature exceeds 103°F (39.4°C)'
    },
    urgencyFactors: ['difficulty breathing', 'severe pain', 'confusion']
  },
  Nausea: {
    causes: [
      'Food poisoning',
      'Stomach virus',
      'Motion sickness',
      'Medication side effect'
    ],
    recommendations: {
      mild: 'Small sips of clear fluids, rest, and avoid solid foods temporarily',
      moderate: 'Try anti-nausea medication and stick to BRAT diet',
      severe: 'Seek medical attention if persistent or accompanied by severe pain'
    },
    urgencyFactors: ['severe abdominal pain', 'blood in vomit', 'dehydration']
  },
  Fatigue: {
    causes: [
      'Lack of sleep',
      'Stress',
      'Poor diet',
      'Anemia',
      'Depression'
    ],
    recommendations: {
      mild: 'Improve sleep habits and maintain a balanced diet',
      moderate: 'Consider lifestyle changes and stress management',
      severe: 'Consult healthcare provider for underlying causes'
    },
    urgencyFactors: ['chest pain', 'shortness of breath']
  },
  Cough: {
    causes: [
      'Common cold',
      'Allergies',
      'Asthma',
      'Respiratory infection'
    ],
    recommendations: {
      mild: 'Stay hydrated and try honey for soothing',
      moderate: 'Over-the-counter cough medicine and humidifier',
      severe: 'Seek medical attention if persistent or producing colored mucus'
    },
    urgencyFactors: ['difficulty breathing', 'chest pain', 'coughing blood']
  },
  'Body Pain': {
    causes: [
      'Exercise',
      'Strain or injury',
      'Viral infection',
      'Inflammation'
    ],
    recommendations: {
      mild: 'Rest and gentle stretching',
      moderate: 'OTC pain relievers and ice/heat therapy',
      severe: 'Seek medical evaluation if pain is severe or persistent'
    },
    urgencyFactors: ['inability to move', 'severe swelling', 'fever']
  },
  Dizziness: {
    causes: [
      'Inner ear problems',
      'Low blood pressure',
      'Dehydration',
      'Medication side effect'
    ],
    recommendations: {
      mild: 'Sit or lie down, stay hydrated',
      moderate: 'Avoid sudden movements and check medications',
      severe: 'Seek immediate care if accompanied by other symptoms'
    },
    urgencyFactors: ['fainting', 'chest pain', 'severe headache']
  },
  'Stomach Pain': {
    causes: [
      'Indigestion',
      'Gas',
      'Food intolerance',
      'Gastritis'
    ],
    recommendations: {
      mild: 'Try antacids and avoid trigger foods',
      moderate: 'Monitor symptoms and maintain food diary',
      severe: 'Seek medical attention if severe or persistent'
    },
    urgencyFactors: ['severe pain', 'blood in stool', 'persistent vomiting']
  }
};

export const analyzeSymptoms = async (req, res) => {
  try {
    console.log('Analyzing symptoms:', req.body);
    const {
      symptoms,
      customSymptom,
      severity,
      duration,
      factors,
      medications,
      allergies,
      medicalConditions
    } = req.body;

    // Combine all symptoms
    const allSymptoms = [...symptoms];
    if (customSymptom) {
      allSymptoms.push(customSymptom);
    }

    // Analyze each symptom
    let possibleCauses = new Set();
    let recommendations = [];
    let urgencyLevel = 'low';
    let needsImmediate = false;

    // Check for high-risk combinations
    const hasHighRiskFactors = factors.fever && factors.highStress;
    const hasMedicalConditions = medicalConditions && medicalConditions.length > 0;

    allSymptoms.forEach(symptom => {
      const symptomData = SYMPTOM_RULES[symptom];
      if (symptomData) {
        // Add causes
        symptomData.causes.forEach(cause => possibleCauses.add(cause));

        // Add recommendations based on severity
        recommendations.push(symptomData.recommendations[severity.toLowerCase()]);

        // Check urgency factors against provided factors
        const hasUrgentFactors = symptomData.urgencyFactors.some(factor => 
          factors[factor] || 
          allSymptoms.includes(factor) ||
          (medicalConditions && medicalConditions.toLowerCase().includes(factor))
        );

        if (hasUrgentFactors || hasHighRiskFactors) {
          urgencyLevel = 'high';
          needsImmediate = true;
        } else if (severity === 'Severe' || hasMedicalConditions) {
          urgencyLevel = 'medium';
        }
      }
    });

    // Duration-based urgency adjustment
    if (duration === 'Weeks' && urgencyLevel === 'low') {
      urgencyLevel = 'medium';
    }

    // Format response
    const analysis = {
      possibleCauses: Array.from(possibleCauses),
      recommendation: recommendations.join(' '),
      urgency: urgencyLevel,
      needsImmediate,
      additionalNotes: [
        "This is an automated analysis based on common medical knowledge.",
        "Always consult a healthcare provider for proper diagnosis and treatment.",
        medications.length > 0 ? "Consider potential medication interactions." : null,
        allergies ? "Take into account your known allergies." : null
      ].filter(note => note)
    };

    res.json(analysis);

  } catch (error) {
    console.error('Symptom analysis error:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      error: 'Failed to analyze symptoms',
      details: error.message
    });
  }
}; 