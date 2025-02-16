export const createMedicationMessage = (medication, timing, user) => {
  return `
🔔 *Medication Reminder*

Hello ${user.name}! Time for your medicine.

*Medicine:* ${medication.name}
*Dosage:* ${medication.dosage}
*Time:* ${timing.time} (${timing.period})

${medication.instructions ? `\n*Instructions:* ${medication.instructions}` : ''}

Please take your medication on time! 
Stay healthy! 🌟

_Reply with:_
✅ - Taken
⏰ - Remind in 5min`;
}; 