import React from 'react';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate, onDismiss }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="font-medium">New version available!</div>
      <div className="text-sm">Refresh to update the app.</div>
      <div className="flex space-x-2">
        <button
          onClick={onUpdate}
          className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm"
        >
          Update now
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1 bg-gray-200 rounded-md text-sm"
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification; 