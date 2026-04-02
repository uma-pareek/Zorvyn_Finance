import { prisma } from "../../config/prisma";

function decimalToNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value?.toNumber === "function") return value.toNumber();
  return Number(value);
}

export async function getDashboardSummary(userId: string, includeInsights: boolean) {
  const totalsIncomePromise = prisma.financialRecord.aggregate({
    where: { userId, deletedAt: null, type: "INCOME" as any },
    _sum: { amount: true },
  });

  const totalsExpensePromise = prisma.financialRecord.aggregate({
    where: { userId, deletedAt: null, type: "EXPENSE" as any },
    _sum: { amount: true },
  });

  const recentTransactionsPromise = prisma.financialRecord.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: 7,
    select: { id: true, amount: true, type: true, category: true, date: true, notes: true, createdAt: true },
  });

  if (!includeInsights) {
    const [incomeAgg, expenseAgg, recent] = await Promise.all([
      totalsIncomePromise,
      totalsExpensePromise,
      recentTransactionsPromise,
    ]);

    const totalIncome = decimalToNumber(incomeAgg._sum.amount);
    const totalExpense = decimalToNumber(expenseAgg._sum.amount);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      categoryBreakdown: { income: [], expense: [] },
      recentTransactions: recent.map((r) => ({
        id: r.id,
        amount: decimalToNumber(r.amount),
        type: r.type,
        category: r.category,
        date: r.date,
        notes: r.notes,
        createdAt: r.createdAt,
      })),
      monthlyTrends: [],
    };
  }

  const categoryIncomePromise = prisma.financialRecord.groupBy({
    by: ["category"],
    where: { userId, deletedAt: null, type: "INCOME" as any },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  const categoryExpensePromise = prisma.financialRecord.groupBy({
    by: ["category"],
    where: { userId, deletedAt: null, type: "EXPENSE" as any },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  // Use conditional aggregation to pivot INCOME/EXPENSE columns per month.
  const monthlyTrendsPromise = prisma.$queryRaw<
    Array<{ month: string; incomeTotal: number; expenseTotal: number }>
  >`
    SELECT
      to_char(date_trunc('month', "date"), 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN amount ELSE 0 END), 0)::double precision AS "incomeTotal",
      COALESCE(SUM(CASE WHEN "type" = 'EXPENSE' THEN amount ELSE 0 END), 0)::double precision AS "expenseTotal"
    FROM "FinancialRecord"
    WHERE "userId" = ${userId}
      AND "deletedAt" IS NULL
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 12
  `;

  const [incomeAgg, expenseAgg, recent, categoryIncome, categoryExpense, monthlyRows] =
    await Promise.all([
      totalsIncomePromise,
      totalsExpensePromise,
      recentTransactionsPromise,
      categoryIncomePromise,
      categoryExpensePromise,
      monthlyTrendsPromise,
    ]);

  const totalIncome = decimalToNumber(incomeAgg._sum.amount);
  const totalExpense = decimalToNumber(expenseAgg._sum.amount);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    categoryBreakdown: {
      income: categoryIncome.map((row) => ({ category: row.category, total: decimalToNumber(row._sum.amount) })),
      expense: categoryExpense.map((row) => ({ category: row.category, total: decimalToNumber(row._sum.amount) })),
    },
    recentTransactions: recent.map((r) => ({
      id: r.id,
      amount: decimalToNumber(r.amount),
      type: r.type,
      category: r.category,
      date: r.date,
      notes: r.notes,
      createdAt: r.createdAt,
    })),
    monthlyTrends: monthlyRows
      .slice()
      .reverse()
      .map((row) => ({ month: row.month, income: decimalToNumber(row.incomeTotal), expense: decimalToNumber(row.expenseTotal) })),
  };
}

