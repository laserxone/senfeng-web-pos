
import pool from '@/config/db';
import { NextResponse } from 'next/server';


export async function GET(req, res) {


    try {
        const result = await pool.query("SELECT * FROM inventory ORDER BY id ASC");
        const lastIdResult = await pool.query("SELECT MAX(id) AS last_id FROM savedinvoices");

        return NextResponse.json({ stock: result.rows, lastInventoryId: lastIdResult.rows[0]?.last_id || 0 }, { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Processing error" }, { status: 500 })
    }

}

export async function POST(req, res) {



    try {

        const { name, price, qty, image, threshold, new_order } = await req.json()
        if (!name || !price || !qty || !image || !threshold || !new_order) {
            return NextResponse.json({ message: "All fields are required." }, { status: 400 });
        }

        const result = await pool.query(
            "INSERT INTO inventory (name, price, qty, img, threshold, new_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [name, price, qty, image, threshold, new_order]
        );

        return NextResponse.json(result.rows, { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Processing error" }, { status: 500 })
    }

}


export async function PUT(req, res) {

    try {
        const {
            entries,
            name,
            company,
            phone,
            address,
            manager,
            invoicenumber,
            fields
        } = await req.json();

        await pool.query(
            `INSERT INTO savedinvoices 
            (name, company, phone, address, manager, invoicenumber, fields) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, company, phone, address, manager, invoicenumber, JSON.stringify(fields)]
        );
        if(entries.length > 0){
            for (const entry of entries) {
                const { id, qty } = entry;
                await pool.query(
                    "UPDATE inventory SET qty = $1 WHERE id = $2",
                    [qty, id]
                );
            }
        }
       

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