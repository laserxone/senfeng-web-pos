import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const userQuery = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userQuery.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const user = userQuery.rows[0];

    const customersQuery = await pool.query(
      "SELECT * FROM customer WHERE ownership = $1",
      [id]
    );
    const customers = customersQuery.rows;
    const totalCustomers = customers.length;

    const customerIds = customers.map((customer) => customer.id);
    let sales = [];
    let totalSales = 0;
    if (customerIds.length > 0) {
      const salesQuery = await pool.query(
        `SELECT * FROM sale WHERE customer_id = ANY($1)`,
        [customerIds]
      );
      sales = salesQuery.rows;
      totalSales = sales.length;
    }

    const machineIds = sales.map((sale) => sale.id);
    let payments = [];
    if (machineIds.length > 0) {
      const paymentsQuery = await pool.query(
        `SELECT * FROM payment WHERE machine_id = ANY($1)`,
        [machineIds]
      );
      payments = paymentsQuery.rows;
    }

    const currentDate = new Date();
    const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    
    const machinesSoldQuery = `
      SELECT COUNT(*) AS total_machines_sold 
      FROM sale 
      WHERE created_at BETWEEN $1 AND $2 AND sell_by = $3
    `;
    
    const currentMonthSalesResult = await pool.query(machinesSoldQuery, [
      firstDayOfCurrentMonth,
      lastDayOfCurrentMonth,
      id,
    ]);
    const machinesSoldThisMonth = parseInt(currentMonthSalesResult.rows[0].total_machines_sold, 10) || 0;

    
    const lastMonthSalesResult = await pool.query(machinesSoldQuery, [
      firstDayOfLastMonth,
      lastDayOfLastMonth,
      id,
    ]);
    const machinesSoldLastMonth = parseInt(lastMonthSalesResult.rows[0].total_machines_sold, 10) || 0;

   
    let percentageChange = 0;
    if (machinesSoldLastMonth === 0) {
      percentageChange = machinesSoldThisMonth > 0 ? 100 : 0; 
    } else {
      percentageChange = ((machinesSoldThisMonth - machinesSoldLastMonth) / machinesSoldLastMonth) * 100;
    }

    let feedbacksTakenThisMonth = 0;
    if (customerIds.length > 0) {
      const feedbackQuery = await pool.query(
        `SELECT COUNT(DISTINCT customer_id) AS feedbacks_taken
         FROM feedback 
         WHERE created_at BETWEEN $1 AND $2 
         AND user_id = $3 
         AND customer_id = ANY($4)`,
        [firstDayOfCurrentMonth, lastDayOfCurrentMonth, id, customerIds]
      );
      feedbacksTakenThisMonth = parseInt(feedbackQuery.rows[0].feedbacks_taken, 10) || 0;
    }

    // Calculate remaining feedbacks
    const remainingFeedbacks = totalCustomers - feedbacksTakenThisMonth;

    const allTasks = await pool.query(
      `SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [id]
    )

    const responseData = {
      user,
      totalCustomers,
      totalSales,
      machinesSoldThisMonth,
      machinesSoldLastMonth,
      feedbacksTakenThisMonth,
      remainingFeedbacks,
      allTasks : allTasks.rows.length,
      percentageChange: percentageChange.toFixed(2),
      customers: customers.map((customer) => ({
        ...customer,
        sales: sales
          .filter((sale) => sale.customer_id === customer.id)
          .map((sale) => ({
            ...sale,
            payments: payments.filter((payment) => payment.machine_id === sale.id),
          })),
      })),
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Error fetching data", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE users 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    console.log("data updated successfully");
    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0;
