import SectionPanel from "../ui/SectionPanel";
import CategoryIcon from "../CategoryIcon";
import { formatDate, formatSignedCurrency, formatTime } from "../../utils/formatters";

export default function RecentTransactionsPanel({
  transactions,
  totalPages,
  currentPage,
  onPageChange,
}) {
  return (
    <SectionPanel>
      <h3 className="mb-4 font-semibold">Transacciones recientes</h3>
      {transactions.length === 0 ? (
        <p className="py-10 text-center text-gray-400">No hay transacciones.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === "Ingreso" || transaction.type === "income";

            return (
              <li
                key={transaction.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon category={transaction.category} type={transaction.type} />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {transaction.category || "Sin categoria"}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                    <p className="text-xs text-gray-400">
                      {formatTime(transaction.createdAt || transaction.date)} · {transaction.account}
                    </p>
                  </div>
                </div>
                <p className={`text-base font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}>
                  {formatSignedCurrency(transaction.amount, { income: isIncome })}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => onPageChange(index + 1)}
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                currentPage === index + 1
                  ? "bg-[#0a2b6e] text-white"
                  : "bg-[#eff8ff] text-[#0a2b6e] hover:bg-[#e3f2ff]"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </SectionPanel>
  );
}
