import { medicationInteractionService } from './medicationInteractionService.js';

export const medicationService = {
  async addMedication(medicationData, userId) {
    try {
      // Get user's existing medications
      const existingMedications = await Medication.find({ userId });
      const allMedicationNames = [
        ...existingMedications.map(med => med.name),
        medicationData.name
      ];

      // Check for interactions
      const interactionCheck = await medicationInteractionService.checkInteractions(
        allMedicationNames
      );

      // Create the medication
      const medication = new Medication({
        ...medicationData,
        userId,
        interactions: interactionCheck.interactions
      });

      await medication.save();

      // If there are interactions, send a notification
      if (interactionCheck.hasInteractions) {
        const user = await User.findById(userId);
        
        // Send Telegram notification about interactions
        if (user.telegramChatId) {
          const message = this.formatInteractionMessage(
            medicationData.name,
            interactionCheck.interactions
          );
          await notificationService.sendTelegramMessage(
            user.telegramChatId,
            message,
            false
          );
        }
      }

      return {
        medication,
        interactions: interactionCheck
      };
    } catch (error) {
      console.error('Failed to add medication:', error);
      throw error;
    }
  },

  formatInteractionMessage(medicationName, interactions) {
    let message = `⚠️ <b>Potential Medication Interactions</b>\n\n`;
    message += `When taking <b>${medicationName}</b> with your current medications:\n\n`;

    interactions.forEach(interaction => {
      message += `🔸 <b>${interaction.medications.join(' + ')}</b>\n`;
      message += `   Severity: ${interaction.severity}\n`;
      message += `   ${interaction.description}\n\n`;
    });

    message += `\nPlease consult your healthcare provider about these potential interactions.`;
    return message;
  }
}; 