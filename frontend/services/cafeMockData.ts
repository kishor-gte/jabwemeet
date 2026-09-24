export const cafeMockData = {
  kpis: {
    todayOrders: { value: 24, change: "+12%", isPositive: true },
    reservations: { value: 18, change: "+8%", isPositive: true },
    monthlyRevenue: { value: "INR 1,25,000", change: "+14%", isPositive: true },
    customers: { value: 486, change: "+9%", isPositive: true }
  },
  upcomingReservations: [
    { id: "RES-001", customerName: "Rahul Sharma", guests: 4, date: "2026-09-24", time: "19:00", table: "T-12", status: "Confirmed" },
    { id: "RES-002", customerName: "Priya Singh", guests: 2, date: "2026-09-24", time: "20:30", table: "T-04", status: "Pending" }
  ],
  topSellingItems: [
    { id: "ITM-001", name: "Cappuccino", category: "Coffee", orders: 124, revenue: 24800 },
    { id: "ITM-002", name: "Chicken Burger", category: "Snacks", orders: 98, revenue: 19600 },
    { id: "ITM-003", name: "Cold Coffee", category: "Beverages", orders: 86, revenue: 17200 },
    { id: "ITM-004", name: "Brownie", category: "Desserts", orders: 71, revenue: 10650 }
  ]
};
