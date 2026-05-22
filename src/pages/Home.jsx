import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Plus } from "lucide-react";

export default function Home() {
  // Datos simulados â€” reemplÃ¡zalos luego con tu contexto o Firestore
  const ingresos = 1250;
  const gastos = 980;

  const balance = (ingresos || 0) - (gastos || 0);

  const data = [
    { name: "Comida", value: 33 },
    { name: "Servicios", value: 23 },
    { name: "Transporte", value: 18 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-6">
      {/* TÃ­tulo */}
      <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
        Hola, Nick <span className="animate-wave">ðŸ‘‹</span>
      </h1>
      <p className="text-gray-500 mb-6">Balance actual</p>

      {/* Tarjeta de balance */}
      <div className="bg-white shadow-sm rounded-xl p-6 flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">S/ {balance}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Ingresos: <span className="text-green-600">S/ {ingresos}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">
            Gastos: <span className="text-red-600">S/ {gastos}</span>
          </p>
        </div>
      </div>

      {/* GrÃ¡fico de distribuciÃ³n */}
      <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          DistribuciÃ³n de gastos
        </h3>

        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BotÃ³n AÃ±adir transacciÃ³n */}
      <div className="flex justify-center mt-auto">
        <button className="flex items-center gap-2 bg-[#0a2b6e] hover:bg-[#081f52] text-white px-5 py-3 rounded-full shadow-md transition">
          <Plus className="w-5 h-5" />
          AÃ±adir transacciÃ³n
        </button>
      </div>
    </div>
  );
}

