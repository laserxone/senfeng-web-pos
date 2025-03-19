import pool from "@/config/db";
import { branchNavItem, employeeNavItems, InventoryNavItem, ownerNavItems } from "@/constants/data";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {
    const { email } = await params
    try {
        const query = `
      SELECT * FROM users WHERE email = $1 LIMIT 1
    `;
        let base_route = ""
        const result = await pool.query(query, [email]);
        if (result.rows.length == 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }
        let nav_items = []
        if (result.rows[0].designation == 'Owner'){
            nav_items = [...ownerNavItems]
            base_route = "owner"
        }
        else if (result.rows[0].designation == 'Engineer'){
            base_route = 'engineer'
            nav_items = [...employeeNavItems]
            if(result.rows[0].branch_expenses_assigned)
                nav_items.push(branchNavItem)
            if(result.rows[0].inventory_assigned)
                nav_items.push(InventoryNavItem)
        }
        else if (result.rows[0].designation == 'Sales'){
            base_route = 'sales'
            nav_items = [...employeeNavItems]
            if(result.rows[0].branch_expenses_assigned)
                nav_items.push(branchNavItem)
            if(result.rows[0].inventory_assigned)
                nav_items.push(InventoryNavItem)
        } else if (result.rows[0].designation == 'Customer Relationship Manager'){
            base_route = 'crm'
            nav_items = [...employeeNavItems]
            if(result.rows[0].branch_expenses_assigned)
                nav_items.push(branchNavItem)
            if(result.rows[0].inventory_assigned)
                nav_items.push(InventoryNavItem)
        }
        
        else if (result.rows[0].designation == 'Customer Relationship Manager (After Sales)'){
            base_route = 'aftersales'
            nav_items = [...employeeNavItems]
            if(result.rows[0].branch_expenses_assigned)
                nav_items.push(branchNavItem)
            if(result.rows[0].inventory_assigned)
                nav_items.push(InventoryNavItem)
        }
        return NextResponse.json({ ...result.rows[0], nav_items: nav_items, base_route : base_route }, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export const revalidate = 0