import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY;

export const medicineInfoService = {
  async getMedicineInfo(medicineName) {
    try {
      console.log('Searching for medicine:', medicineName);
      
      // First try OpenFDA API
      const openFDAInfo = await this.searchOpenFDA(medicineName);
      if (openFDAInfo) {
        return this.formatOpenFDAResponse(openFDAInfo);
      }

      // Then try web scraping
      const scrapedInfo = await this.getWebScrapedMedicineInfo(medicineName);
      if (scrapedInfo) {
        return scrapedInfo;
      }

      // Finally, fall back to generic info
      return this.getGenericMedicineInfo(medicineName);
    } catch (error) {
      console.error('Failed to get medicine info:', error);
      return this.getGenericMedicineInfo(medicineName);
    }
  },

  async searchOpenFDA(medicineName) {
    try {
      const response = await axios.get(
        `https://api.fda.gov/drug/label.json?api_key=${OPENFDA_API_KEY}&search=brand_name:"${medicineName}"&limit=1`
      );
      return response.data.results[0];
    } catch (error) {
      console.log('OpenFDA search failed:', error.message);
      return null;
    }
  },

  parseAdverseReactions(text) {
    if (!text) return [];
    // Split text into bullet points and clean up
    return text
      .split(/[•\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  },

  parseIndications(text) {
    if (!text) return [];
    return text
      .split(/[•\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  },

  parseDosage(text) {
    if (!text) return [];
    return text
      .split(/[•\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  },

  async getGenericMedicineInfo(medicineName) {
    // Provide basic information for common medicines
    const commonMedicines = {
      'dolo': {
        basicInfo: {
          drugClass: 'Analgesic and Antipyretic',
          category: 'Pain Relief and Fever Reduction',
          manufacturer: 'Micro Labs Ltd'
        },
        dosageInfo: {
          forms: ['Tablet', 'Syrup'],
          route: 'Oral',
          strength: '650 mg'
        },
        sideEffects: {
          warnings: [
            'Do not exceed recommended dose',
            'Avoid alcohol while taking this medication',
            'Consult doctor if symptoms persist'
          ],
          sideEffects: [
            'Nausea',
            'Stomach pain',
            'Loss of appetite',
            'Headache',
            'Skin rash'
          ],
          precautions: [
            'Use with caution in liver disease',
            'Not recommended for long-term use without medical supervision',
            'Inform doctor if pregnant or planning pregnancy'
          ]
        },
        usage: {
          indications: [
            'Fever',
            'Mild to moderate pain',
            'Headache',
            'Body ache'
          ],
          dosageInstructions: [
            'Adults: 1 tablet every 4-6 hours as needed',
            'Maximum 4 tablets in 24 hours',
            'Take with or after food'
          ],
          contraindications: [
            'Hypersensitivity to paracetamol',
            'Severe liver disease',
            'Alcohol dependence'
          ]
        }
      }
      // Add more common medicines here
    };

    // Check if we have generic info for this medicine
    const genericName = Object.keys(commonMedicines).find(name => 
      medicineName.toLowerCase().includes(name.toLowerCase())
    );

    return genericName ? commonMedicines[genericName] : null;
  },

  async findRxNormId(medicineName) {
    try {
      const response = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/approximateTerm?term=${encodeURIComponent(medicineName)}&maxEntries=1`
      );

      return response.data?.approximateGroup?.candidate?.[0]?.rxcui || null;
    } catch (error) {
      console.error('Failed to find RxNorm ID:', error);
      return null;
    }
  },

  async getRxNormInfo(rxnormId) {
    try {
      const response = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/RxClass/class/byRxcui?rxcui=${rxnormId}`
      );

      return {
        drugClass: response.data?.rxclassDrugInfoList?.rxclassDrugInfo?.[0]?.rxclassMinConceptItem?.className || 'Unknown',
        category: response.data?.rxclassDrugInfoList?.rxclassDrugInfo?.[0]?.rxclassMinConceptItem?.classType || 'Unknown'
      };
    } catch (error) {
      console.error('Failed to get RxNorm info:', error);
      return null;
    }
  },

  async getDailyMedInfo(rxnormId) {
    try {
      const response = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/rxcui/${rxnormId}/allrelated`
      );

      return {
        manufacturer: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'manufacturerName')?.value || 'Unknown',
        warnings: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'warnings')?.value || [],
        sideEffects: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'sideEffects')?.value || [],
        precautions: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'precautions')?.value || [],
        indications: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'indications')?.value || [],
        dosage: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'dosage')?.value || [],
        route: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'route')?.value || 'Unknown',
        strength: response.data?.allRelatedGroup?.conceptGroup
          ?.find(g => g.tty === 'SCD')?.conceptProperties
          ?.find(p => p.name === 'strength')?.value || 'Unknown'
      };
    } catch (error) {
      console.error('Failed to get DailyMed info:', error);
      return null;
    }
  },

  formatOpenFDAResponse(openFDAInfo) {
    // Implementation of formatOpenFDAResponse method
  },

  formatRxNormResponse(rxnormInfo, dailyMedInfo) {
    // Implementation of formatRxNormResponse method
  },

  async getWebScrapedMedicineInfo(medicineName) {
    // Remove this method
  },

  async scrapeMedlinePlus(medicineName) {
    // Remove this method
  },

  async scrapeWebMD(medicineName) {
    // Remove this method
  }
}; 