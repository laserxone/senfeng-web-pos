import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req, {params}) {
const {id} = await params


    try {
        const customerQuery = await pool.query(`SELECT * FROM customer WHERE ownership = $1 ORDER BY name ASC`, [id]);
        const customers = customerQuery.rows;

        if (customers.length === 0) {
            return NextResponse.json({ customers: [] }, { status: 200 });
        }

        // Extract customer IDs
        const customerIds = customers.map((customer) => customer.id);

        // Fetch all sales related to the customers
        const salesQuery = await pool.query(
            `SELECT * FROM sale WHERE customer_id = ANY($1)`,
            [customerIds]
        );
        const sales = salesQuery.rows;

        // Map sales back to their respective customers
        const customersWithSales = customers.map((customer) => ({
            ...customer,
            sales: sales.filter((sale) => sale.customer_id === customer.id),
        }));

        return NextResponse.json(customersWithSales, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export const revalidate = 0