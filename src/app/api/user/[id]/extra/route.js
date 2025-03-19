import pool from "@/config/db";
import { NextResponse } from "next/server";



export async function GET(req, {params}) {
    try {
       const {id} = await params
       const userId = id

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Fetch top_followup entries (Latest entry per customer)
        const topFollowupQuery = `
            SELECT DISTINCT ON (f.customer_id) f.*, c.*
            FROM feedback f
            JOIN customer c ON f.customer_id = c.id
            WHERE f.user_id = $1 AND f.type = 'feedback' AND f.top_follow = true
            ORDER BY f.customer_id, f.created_at ASC;
        `;
        const topFollowup = await pool.query(topFollowupQuery, [userId]);

        // Fetch recent customers
        const recentCustomerQuery = `
            SELECT * FROM customer 
            WHERE ownership = $1 AND member = false;
        `;
        const recentCustomer = await pool.query(recentCustomerQuery, [userId]);

        // Fetch weekly follow-ups (Latest entry per customer)
        const weeklyFollowupQuery = `
            SELECT DISTINCT ON (f.customer_id) f.*, c.*
            FROM feedback f
            JOIN customer c ON f.customer_id = c.id
            WHERE f.user_id = $1 AND f.type = 'feedback' AND f.followup_type = 'weekly'
            ORDER BY f.customer_id, f.created_at ASC;
        `;
        const weeklyFollowup = await pool.query(weeklyFollowupQuery, [userId]);

        // Fetch monthly follow-ups (Latest entry per customer)
        const monthlyFollowupQuery = `
            SELECT DISTINCT ON (f.customer_id) f.*, c.*
            FROM feedback f
            JOIN customer c ON f.customer_id = c.id
            WHERE f.user_id = $1 AND f.type = 'feedback' AND f.followup_type = 'monthly'
            ORDER BY f.customer_id, f.created_at ASC;
        `;
        const monthlyFollowup = await pool.query(monthlyFollowupQuery, [userId]);

        return NextResponse.json({
            top_followup: topFollowup.rows,
            recent_customer: recentCustomer.rows,
            weekly: weeklyFollowup.rows,
            monthly: monthlyFollowup.rows,
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0