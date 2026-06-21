import { AnimatePresence, motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import EmptyState from "../ui/EmptyState";
import SectionPanel from "../ui/SectionPanel";
import { formatCurrency } from "../../utils/formatters";

export default function CategoryDistributionPanel({ data, colors, filter }) {
  return (
    <SectionPanel className="flex h-full flex-col">
      <div className="mb-4 flex min-h-9 items-center justify-between gap-3">
        <h3 className="font-semibold">Distribucion por categoria</h3>
        <span className="select-none px-3 py-1.5 text-sm opacity-0" aria-hidden>
          Placeholder
        </span>
      </div>
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {data.length === 0 ? (
            <motion.div
              key="no-data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState title="No hay datos para mostrar." />
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex h-full flex-col gap-6 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="flex h-[260px] min-h-[240px] w-full min-w-0 justify-center xl:h-[240px] xl:w-1/2">
                <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {data.map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={colors[idx % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex w-full flex-col justify-center xl:w-1/2">
                {data.map((entry, idx) => {
                  const total = data.reduce((sum, item) => sum + item.value, 0);
                  const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";

                  return (
                    <div
                      key={`${entry.name}-${idx}`}
                      className="flex items-center justify-between py-1 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        />
                        <span className="text-gray-700">{entry.name}</span>
                      </div>
                      <span className="text-gray-500">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionPanel>
  );
}
