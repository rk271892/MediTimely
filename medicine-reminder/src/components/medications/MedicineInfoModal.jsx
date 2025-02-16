import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export const MedicineInfoModal = ({ isOpen, onClose, medicineInfo }) => {
  if (!medicineInfo) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <Dialog.Title className="text-xl font-semibold">
              Medicine Information
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-medium text-gray-900">Classification</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Drug Class: {medicineInfo.basicInfo?.drugClass}</p>
                <p>Category: {medicineInfo.basicInfo?.category}</p>
              </div>
            </div>

            {/* Dosage Forms */}
            <div>
              <h3 className="font-medium text-gray-900">Available Forms</h3>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                {medicineInfo.dosageInfo?.forms.map((form, index) => (
                  <li key={index}>{form}</li>
                ))}
              </ul>
            </div>

            {/* Side Effects */}
            {medicineInfo.sideEffects?.sideEffects.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900">Common Side Effects</h3>
                <div className="mt-2 text-sm text-gray-600">
                  {medicineInfo.sideEffects.sideEffects.map((effect, index) => (
                    <div key={index} className="mb-2">
                      {effect}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {medicineInfo.sideEffects?.warnings.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600">Important Warnings</h3>
                <div className="mt-2 text-sm text-gray-600">
                  {medicineInfo.sideEffects.warnings.map((warning, index) => (
                    <div key={index} className="mb-2 p-2 bg-red-50 rounded">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 