
import React from 'react';
import { ProjectStatus } from '../../types';
import { PROJECT_STATUS_ORDER } from '../../constants';

interface ProgressBarProps {
  status: ProjectStatus;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ status }) => {
  const currentIndex = PROJECT_STATUS_ORDER.indexOf(status);
  const totalSteps = PROJECT_STATUS_ORDER.length - 1;
  const percentage = totalSteps > 0 ? Math.round((currentIndex / totalSteps) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-teal-700">{status}</span>
        <span className="text-sm font-medium text-teal-700">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
