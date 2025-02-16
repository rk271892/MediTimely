import { medicalDatabase } from '../data/medicalDatabase.js';

// Symptom analysis rules and knowledge base
const symptomRules = {
  // High urgency combinations
  highUrgency: {
    symptoms: [
      ['Chest Pain', 'Shortness of Breath'],
      ['Severe Headache', 'Vision Changes'],
      ['High Fever', 'Stiff Neck'],
      ['Severe Abdominal Pain', 'Vomiting']
    ],
    duration: ['Hours', 'Days'],
    severity: ['Severe']
  },

  // Medium urgency combinations
  mediumUrgency: {
    symptoms: [
      ['Fever', 'Cough'],
      ['Headache', 'Nausea'],
      ['Dizziness', 'Fatigue'],
      ['Body Pain', 'Fever']
    ],
    duration: ['Days', 'Weeks'],
    severity: ['Moderate']
  }
};

// Common conditions and their symptoms
const conditionDatabase = {
  'Common Cold': {
    symptoms: ['Cough', 'Fever', 'Fatigue', 'Body Pain'],
    recommendation: 'Rest, stay hydrated, and take over-the-counter cold medication if needed.',
    selfCare: true
  },
  'Migraine': {
    symptoms: ['Headache', 'Nausea', 'Vision Changes'],
    recommendation: 'Rest in a dark quiet room, stay hydrated, and consider prescribed migraine medication.',
    selfCare: true
  },
  'Food Poisoning': {
    symptoms: ['Nausea', 'Stomach Pain', 'Vomiting'],
    recommendation: 'Stay hydrated, rest, and avoid solid foods temporarily.',
    selfCare: true
  },
  'Flu': {
    symptoms: ['Fever', 'Body Pain', 'Fatigue', 'Cough'],
    recommendation: 'Rest, stay hydrated, and monitor temperature. Consider flu medication.',
    selfCare: true
  }
};

// Medicine side effects database
const medicationSideEffects = {
  'Ibuprofen': ['Stomach Pain', 'Nausea'],
  'Paracetamol': ['Nausea', 'Fatigue'],
  'Aspirin': ['Stomach Pain', 'Dizziness'],
  'Amoxicillin': ['Nausea', 'Dizziness', 'Fatigue']
};

export const symptomAnalyzerService = {
  async analyzeSymptoms(data) {
    const { symptoms, severity, duration, factors, medications } = data;

    // Check for high urgency conditions first
    const urgencyLevel = this.checkUrgencyLevel(symptoms, severity, duration);
    if (urgencyLevel === 'high') {
      return {
        recommendation: 'Seek immediate medical attention',
        possibleCauses: this.findPossibleCauses(symptoms),
        urgency: 'high',
        selfCareSteps: []
      };
    }

    // Check medication interactions
    const medicationWarnings = this.checkMedicationInteractions(medications, symptoms);
    if (medicationWarnings.length > 0) {
      return {
        recommendation: 'Your symptoms might be related to medication interactions',
        possibleCauses: medicationWarnings,
        urgency: 'medium',
        selfCareSteps: ['Consult your healthcare provider about medication adjustments']
      };
    }

    // Analyze symptoms and provide recommendations
    const analysis = this.analyzeSymptomCombination(symptoms, factors);
    return {
      recommendation: analysis.recommendation,
      possibleCauses: analysis.causes,
      urgency: urgencyLevel,
      selfCareSteps: analysis.selfCare
    };
  },

  checkUrgencyLevel(symptoms, severity, duration) {
    for (const symptom of symptoms) {
      const symptomData = medicalDatabase.symptoms[symptom];
      if (!symptomData) continue;

      // Check high urgency conditions
      if (severity === 'Severe' && symptomData.urgencyLevel.high.some(cond => 
        symptoms.join(' ').toLowerCase().includes(cond.toLowerCase())
      )) {
        return 'high';
      }

      // Check medium urgency conditions
      if (severity === 'Moderate' && symptomData.urgencyLevel.medium.some(cond =>
        symptoms.join(' ').toLowerCase().includes(cond.toLowerCase())
      )) {
        return 'medium';
      }
    }
    return 'low';
  },

  findPossibleCauses(symptoms) {
    const causes = new Set();
    symptoms.forEach(symptom => {
      const symptomData = medicalDatabase.symptoms[symptom];
      if (symptomData?.commonCauses) {
        symptomData.commonCauses.forEach(cause => causes.add(cause));
      }
    });
    return Array.from(causes);
  },

  checkMedicationInteractions(medications, symptoms) {
    const warnings = [];
    medications.forEach(med => {
      const medData = medicalDatabase.medicationInteractions[med];
      if (medData) {
        if (medData.sideEffects.some(effect => symptoms.includes(effect))) {
          warnings.push(`${med} can cause: ${medData.sideEffects.join(', ')}`);
        }
      }
    });
    return warnings;
  },

  analyzeSymptomCombination(symptoms, factors) {
    const relevantConditions = Object.entries(medicalDatabase.conditions)
      .filter(([_, condition]) => 
        symptoms.some(s => condition.symptoms.includes(s))
      )
      .map(([name, data]) => ({
        name,
        matchScore: this.calculateMatchScore(symptoms, factors, data.symptoms),
        ...data
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    if (relevantConditions.length === 0) {
      return {
        recommendation: 'Monitor your symptoms and rest',
        causes: ['No specific condition identified'],
        selfCare: ['Rest', 'Stay hydrated', 'Monitor symptoms']
      };
    }

    const topCondition = relevantConditions[0];
    return {
      recommendation: `Your symptoms match ${topCondition.name}`,
      causes: [topCondition.name],
      selfCare: topCondition.recommendedActions
    };
  },

  calculateMatchScore(userSymptoms, factors, conditionSymptoms) {
    let score = 0;
    userSymptoms.forEach(s => {
      if (conditionSymptoms.includes(s)) score += 1;
    });
    if (factors.fever && conditionSymptoms.includes('Fever')) score += 0.5;
    if (factors.fatigue && conditionSymptoms.includes('Fatigue')) score += 0.5;
    return score;
  }
}; 