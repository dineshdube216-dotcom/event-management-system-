import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between h-[420px]">
      <div className="h-48 w-full skeleton-loading"></div>
      <div className="p-5 space-y-4 flex-1">
        <div className="h-6 bg-slate-200 rounded-lg w-3/4 skeleton-loading"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-full skeleton-loading"></div>
          <div className="h-4 bg-slate-100 rounded w-5/6 skeleton-loading"></div>
        </div>
        <div className="pt-4 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-1/2 skeleton-loading"></div>
          <div className="h-4 bg-slate-100 rounded w-2/3 skeleton-loading"></div>
        </div>
      </div>
      <div className="p-5 pt-0 flex gap-2">
        <div className="h-10 bg-slate-200 rounded-xl flex-1 skeleton-loading"></div>
        <div className="h-10 bg-slate-200 rounded-xl w-28 skeleton-loading"></div>
      </div>
    </div>
  );
};
