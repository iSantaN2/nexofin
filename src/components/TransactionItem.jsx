import React from "react";

export default function TransactionItem({ type, category, amount, date }) {
  const isIncome = type === "income";

  return (
    <div className="flex justify-between items-center bg-white shadow-sm rounded-2xl p-4 mb-3 hover:shadow-md transition-all">
      <div>
        <h4 className="font-semibold text-gray-800">{category}</h4>
        <p className="text-sm text-gray-500">{date}</p>
      </div>
      <span
        className={`font-bold ${
          isIncome ? "text-green-500" : "text-red-500"
        }`}
      >
        {isIncome ? "+" : "-"}${amount}
      </span>
    </div>
  );
}
