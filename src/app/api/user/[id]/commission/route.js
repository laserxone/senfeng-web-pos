import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {

    const { id } = await params

    try {
        const salesResult = await pool.query(
            'SELECT * FROM sale WHERE sell_by = $1',
            [id]
          );
          const sales = salesResult.rows;
          
          const enrichedSales = await Promise.all(
            sales.map(async (sale) => {
              // Step 2: Get customer details (id, name, owner only)
              const customerResult = await pool.query(
                'SELECT id, name, owner FROM customer WHERE id = $1',
                [sale.customer_id]
              );
              const customer = customerResult.rows[0] || {};
          
              // Step 3: Get all payments for this sale (assuming sale.id is machine_id)
              const paymentResult = await pool.query(
                'SELECT * FROM payment WHERE machine_id = $1',
                [sale.id]
              );
              const payments = (paymentResult.rows || []).filter(
                (payment) => payment.clearance_date !== null
              );
          
              // Sum payment amounts
              const paid_amount = payments.reduce((sum, payment) => {
                return sum + Number(payment.amount || 0);
              }, 0);
          
              // Step 4: Get commission for this sale
              const commissionResult = await pool.query(
                'SELECT * FROM commissions WHERE sale_id = $1',
                [sale.id]
              );
              const commission = commissionResult.rows[0] || {};
          
              return {
                ...sale,
                customer,
                payments,
                created_amount: Number(sale.price || 0),
                paid_amount,
                balance: Number(sale.price || 0) - paid_amount,
                commission,
              };
            })
          );
          
          return NextResponse.json(enrichedSales, { status: 200 });
          

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}

export async function POST(req, { params }) {

    try {
        const data = await req.json();
        const { id } = await params

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO visit (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        const { rows } = await pool.query(query, values);
        const newData = rows[0];
        const userQuery = `SELECT name FROM users WHERE id = $1;`;
        const userResult = await pool.query(userQuery, [id]);
        const user_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;

        return NextResponse.json({ ...newData, user_name }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}


export const revalidate = 0