import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function MedicineInfoModal({ isOpen, onClose, medicineInfo }) {
  console.log('Modal props:', { isOpen, medicineInfo });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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

                {medicineInfo && (
                  <div className="mt-4 space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="font-medium text-gray-900">Classification</h3>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Drug Class: {medicineInfo.basicInfo?.drugClass || 'Not available'}</p>
                        <p>Category: {medicineInfo.basicInfo?.category || 'Not available'}</p>
                      </div>
                    </div>

                    {/* Dosage Forms */}
                    <div>
                      <h3 className="font-medium text-gray-900">Available Forms</h3>
                      <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                        {medicineInfo.dosageInfo?.forms?.length > 0 ? (
                          medicineInfo.dosageInfo.forms.map((form, index) => (
                            <li key={index}>{form}</li>
                          ))
                        ) : (
                          <li>No dosage information available</li>
                        )}
                      </ul>
                    </div>

                    {/* Side Effects */}
                    {medicineInfo.sideEffects?.sideEffects?.length > 0 && (
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
                    {medicineInfo.sideEffects?.warnings?.length > 0 && (
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
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 