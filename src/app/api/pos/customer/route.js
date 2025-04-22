

import pool from '@/config/db';
import { NextResponse } from 'next/server';

export async function GET(req, res) {


    try {
       
        const customer = await pool.query("SELECT * FROM poscustomer")
       
        return NextResponse.json({ customers: customer.rows }, { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Processing error" }, { status: 500 })
    }

}

export async function PUT(req, res) {

    try {
        const {
            name,
            company,
            phone,
            address,
        } = await req.json();

       
        const result = await pool.query("SELECT id FROM poscustomer WHERE phone = $1 LIMIT 1", [phone]);
        if (result.rows.length > 0) {
            await pool.query(
                "UPDATE poscustomer SET name = $1, customer = $2, phone = $3, address = $4 WHERE id = $5",
                [name, company, phone, address, result.rows[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO poscustomer 
                (name, customer, phone, address) 
                VALUES ($1, $2, $3, $4)`,
                [name, company, phone, address]
            );
        }

        return NextResponse.json({ message: "Data saved" }, { status: 200 });

    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Processing error" }, { status: 500 })
    }

}

export const revalidate = 0