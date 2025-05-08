import React from "react";



const NotificationBadge = ({ count }) => {
  if (count === 0) return null;

  return (
    <div className="relative animate-pulse-opacity">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white text-md font-bold">
        {count}
      </span>
    </div>
  );
};

export default NotificationBadge;
