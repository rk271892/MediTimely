import axios from 'axios';

export const medicationInteractionService = {
  async checkInteractions(medications) {
    try {
      // First, try to get RxNorm IDs for the medications
      const rxnormIds = await Promise.all(
        medications.map(med => this.findRxNormId(med))
      );

      // Filter out any medications that weren't found
      const validRxnormIds = rxnormIds.filter(id => id);

      if (validRxnormIds.length < 2) {
        return {
          hasInteractions: false,
          message: 'No potential interactions found.'
        };
      }

      // Check for interactions using NIH API
      const interactions = await this.checkDrugInteractions(validRxnormIds);

      return {
        hasInteractions: interactions.length > 0,
        interactions: interactions,
        severity: this.calculateSeverity(interactions)
      };
    } catch (error) {
      console.error('Failed to check medication interactions:', error);
      throw new Error('Failed to check medication interactions');
    }
  },

  async findRxNormId(medicationName) {
    try {
      const response = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/approximateTerm?term=${encodeURIComponent(medicationName)}&maxEntries=1`
      );

      if (response.data?.approximateGroup?.candidate?.[0]?.rxcui) {
        return response.data.approximateGroup.candidate[0].rxcui;
      }
      return null;
    } catch (error) {
      console.error(`Failed to find RxNorm ID for ${medicationName}:`, error);
      return null;
    }
  },

  async checkDrugInteractions(rxnormIds) {
    try {
      const response = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxnormIds.join('+')}`
      );

      if (!response.data?.fullInteractionTypeGroup?.[0]?.fullInteractionType) {
        return [];
      }

      return response.data.fullInteractionTypeGroup[0].fullInteractionType.map(interaction => ({
        severity: interaction.interactionPair[0].severity,
        description: interaction.interactionPair[0].description,
        medications: [
          interaction.minConcept[0].name,
          interaction.minConcept[1].name
        ]
      }));
    } catch (error) {
      console.error('Failed to check drug interactions:', error);
      return [];
    }
  },

  calculateSeverity(interactions) {
    if (interactions.length === 0) return 'none';
    
    const severityLevels = {
      'N/A': 0,
      'minor': 1,
      'moderate': 2,
      'major': 3
    };

    const highestSeverity = interactions.reduce((max, interaction) => {
      const currentSeverity = severityLevels[interaction.severity?.toLowerCase()] || 0;
      return Math.max(max, currentSeverity);
    }, 0);

    return Object.keys(severityLevels).find(
      key => severityLevels[key] === highestSeverity
    ) || 'unknown';
  }
}; 