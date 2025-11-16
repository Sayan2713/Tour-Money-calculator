import React from 'react';

const PageContainer = ({ title, children }) => (
  <div className="max-w-7xl mx-auto p-4 sm:p-8">
    <div className="bg-white rounded-lg shadow-md p-8 min-h-[60vh]">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">{title}</h1>
      {children}
    </div>
  </div>
);

export default PageContainer;