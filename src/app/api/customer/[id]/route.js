import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import { storage } from "firebase-admin";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params;

  try {
    // 1. Get customer data with ownership from users table
    const customerQuery = `
        SELECT c.*, u.name AS ownership_name, l.name AS lead_name
        FROM customer c
        LEFT JOIN users u ON c.ownership = u.id
        LEFT JOIN users l ON c.lead = l.id
        WHERE c.id = $1
    `;
    const customerResult = await pool.query(customerQuery, [id]);

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const customer = customerResult.rows[0];

    // 2. Get all machines related to this customer
    const machinesQuery = `SELECT * FROM sale WHERE customer_id = $1 ORDER BY created_at ASC`;
    const machinesResult = await pool.query(machinesQuery, [id]);

    let machines = machinesResult.rows;

    // 3. Get all payments related to these machines & calculate total received
    const machineIds = machines.map(m => m.id);

    let billReceived = 0;
    let payments = [];

    if (machineIds.length > 0) {
      // Fetch all payments related to these machines
      const paymentsQuery = `SELECT * FROM payment WHERE machine_id = ANY($1)`;
      const paymentsResult = await pool.query(paymentsQuery, [machineIds]);
      payments = paymentsResult.rows;

      // Calculate total received
      const totalReceivedQuery = `SELECT SUM(amount) AS total_received FROM payment WHERE machine_id = ANY($1)`;
      const totalReceivedResult = await pool.query(totalReceivedQuery, [machineIds]);
      billReceived = totalReceivedResult.rows[0].total_received || 0;
    }

    // 4. Attach payments to their respective machines
    machines = machines.map(machine => ({
      ...machine,
      payments: payments.filter(payment => payment.machine_id === machine.id)
    }));

    // 5. Calculate total price of all machines
    const billTotal = machines.reduce((sum, machine) => sum + (Number(machine.price) || 0), 0);

    // 6. Attach machines & calculated values to customer object
    customer.machines = machines;
    customer.bill_received = parseFloat(billReceived);
    customer.bill_total = parseFloat(billTotal);

    return NextResponse.json(customer, { status: 200 });

  } catch (error) {
    console.error('Error fetching data: ', error);
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

    values.push(id); // Add ID as the last parameter for WHERE clause
    const query = `
          UPDATE customer 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    console.log("Inventory data updated successfully");
    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating inventory data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    await pool.query(`DELETE FROM feedback WHERE customer_id = $1`, [id]);

    const visitResult = await pool.query(`SELECT * FROM visit WHERE customer_id = $1`, [id]);

    if (visitResult.rows.length > 0) {
      for (const item of visitResult.rows) {
        const image = item.image
        if (image && !image.includes("http")) {
          const bucket = admin.storage().bucket()
          await bucket.file(image).delete()
          console.log("image deleted")
        }
      }
      await pool.query(`DELETE FROM visit WHERE customer_id = $1`, [id]);
    }


    const saleResult = await pool.query(`SELECT * FROM sale WHERE customer_id = $1`, [id]);

    if (saleResult.rows.length > 0) {
      const sale = saleResult.rows[0];

      const machineId = sale.id;
      const paymentResult = await pool.query(`SELECT * FROM payment WHERE machine_id = $1`, [machineId]);

      if (paymentResult.rows.length > 0) {

        for (const payment of paymentResult.rows) {
          const image = payment.image;
          if (image && !image.includes('http')) {
            const bucket = admin.storage().bucket()
            await bucket.file(image).delete()
            console.log("image deleted")
          }
        }

        await pool.query(`DELETE FROM payment WHERE machine_id = $1`, [machineId]);
      }

      await pool.query(`DELETE FROM sale WHERE customer_id = $1`, [id]);
    }

    await pool.query(`DELETE FROM customer WHERE id = $1`, [id]);


    return NextResponse.json({ message: "Customer Deleted" }, { status: 200 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0;
