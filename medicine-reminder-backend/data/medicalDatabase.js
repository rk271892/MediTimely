export const medicalDatabase = {
  symptoms: {
    'Headache': {
      commonCauses: [
        'Tension Headache',
        'Migraine',
        'Dehydration',
        'Eye Strain',
        'Stress'
      ],
      urgencyLevel: {
        high: ['Severe, sudden onset', 'With fever and stiff neck', 'After head injury'],
        medium: ['With vision changes', 'Persistent > 3 days'],
        low: ['Mild to moderate', 'Responds to OTC medication']
      },
      selfCare: [
        'Stay hydrated',
        'Rest in a quiet, dark room',
        'Use over-the-counter pain relievers',
        'Apply cold or warm compress'
      ]
    },
    'Fever': {
      commonCauses: [
        'Viral Infection',
        'Bacterial Infection',
        'Common Cold',
        'Flu'
      ],
      urgencyLevel: {
        high: ['Above 103°F (39.4°C)', 'With severe headache', 'With rash'],
        medium: ['Persistent > 3 days', 'With cough and congestion'],
        low: ['Below 102°F (38.9°C)', 'With mild symptoms']
      },
      selfCare: [
        'Rest',
        'Stay hydrated',
        'Take fever reducers',
        'Monitor temperature'
      ]
    },
    'Nausea': {
      commonCauses: [
        'Food Poisoning',
        'Gastritis',
        'Motion Sickness',
        'Viral Infection'
      ],
      urgencyLevel: {
        high: ['With severe abdominal pain', 'Unable to keep fluids down'],
        medium: ['Persistent > 24 hours', 'With fever'],
        low: ['Mild, occasional', 'Without other symptoms']
      },
      selfCare: [
        'Sip clear fluids',
        'Avoid solid foods temporarily',
        'Try ginger tea',
        'Rest'
      ]
    }
    // Add more symptoms...
  },

  conditions: {
    'Common Cold': {
      symptoms: ['Cough', 'Fever', 'Fatigue', 'Runny Nose'],
      recommendedActions: [
        'Rest',
        'Stay hydrated',
        'Use over-the-counter cold medications',
        'Monitor symptoms'
      ],
      whenToSeekHelp: [
        'Fever above 103°F (39.4°C)',
        'Symptoms lasting more than 10 days',
        'Severe sinus pain',
        'Difficulty breathing'
      ]
    },
    'Food Poisoning': {
      symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Stomach Pain'],
      recommendedActions: [
        'Stay hydrated',
        'Rest',
        'Avoid solid foods',
        'Monitor symptoms'
      ],
      whenToSeekHelp: [
        'Severe abdominal pain',
        'Unable to keep fluids down',
        'Bloody stools',
        'High fever'
      ]
    }
    // Add more conditions...
  },

  medicationInteractions: {
    'Ibuprofen': {
      conflictsWith: ['Aspirin', 'Blood Thinners'],
      sideEffects: ['Stomach Pain', 'Nausea'],
      warningSymptoms: ['Black Stools', 'Severe Stomach Pain']
    },
    'Paracetamol': {
      conflictsWith: ['Alcohol'],
      sideEffects: ['Nausea', 'Skin Rash'],
      warningSymptoms: ['Yellowing of Skin', 'Dark Urine']
    }
    // Add more medications...
  }
}; 