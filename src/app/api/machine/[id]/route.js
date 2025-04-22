import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params; // Machine ID

  try {
    // 1. Get the machine and its customer ID
    const machineQuery = `SELECT * FROM sale WHERE id = $1`;
    const machineResult = await pool.query(machineQuery, [id]);

    if (machineResult.rows.length === 0) {
      return NextResponse.json({ message: "Machine not found" }, { status: 404 });
    }

    const machine = machineResult.rows[0];
    const customerId = machine.customer_id;
    const sellBy = machine.sell_by; // Get sell_by ID

    // 2. Get customer details
    const customerQuery = `SELECT * FROM customer WHERE id = $1`;
    const customerResult = await pool.query(customerQuery, [customerId]);

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const customer = customerResult.rows[0];

    // 3. Get the seller's name from users table
    let sellByName = null;
    if (sellBy) {
      const sellerQuery = `SELECT name FROM users WHERE id = $1`;
      const sellerResult = await pool.query(sellerQuery, [sellBy]);

      if (sellerResult.rows.length > 0) {
        sellByName = sellerResult.rows[0].name;
      }
    }

    // 4. Get all payments related to this machine, ordered by transaction_date
    const paymentsQuery = `SELECT * FROM payment WHERE machine_id = $1 ORDER BY transaction_date ASC`;
    const paymentsResult = await pool.query(paymentsQuery, [id]);

    // 5. Add track number to each payment
    const payments = paymentsResult.rows.map((payment, index) => ({
      ...payment,
      track: index + 1, // Starts from 1
    }));

    // 6. Attach payments and sell_by_name to the machine object
    machine.payments = payments;
    machine.sell_by_name = sellByName; // Attach seller's name

    return NextResponse.json({ customer, machine }, { status: 200 });

  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
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
          UPDATE sale 
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

export const revalidate = 0