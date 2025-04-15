import admin from "@/lib/firebaseAdmin";
import moment from "moment";
import { NextResponse } from "next/server";



export async function GET(req, { params }) {

    try {
        const threeMonthsBack = moment().subtract(3, 'months').startOf('month').toDate();

      

        // Step 2: Query branchexpenses records before 3 months back where image exists
        const branchexpensesQuery = `
            SELECT * 
            FROM branchexpenses 
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;
        const branchexpensesResults = await pool.query(branchexpensesQuery, [threeMonthsBack]);

        // Step 3: Query reimbursement records before 3 months back where image exists
        const reimbursementQuery = `
            SELECT * 
            FROM reimbursement 
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;
        const reimbursementResults = await pool.query(reimbursementQuery, [threeMonthsBack]);

        // Step 4: Collect all images to delete
        const imagesToDelete = [];

      

        // Collect images from branchexpenses
        branchexpensesResults.rows.forEach(item => {
            if (item.image) imagesToDelete.push(item.image);
        });

        // Collect images from reimbursement
        reimbursementResults.rows.forEach(item => {
            if (item.image) imagesToDelete.push(item.image);
        });

        // Step 5: Delete images from Firebase storage
        const storage = admin.storage().bucket();  // Initialize Firebase storage
        const promises = imagesToDelete.map(imageRef => {
            if (imageRef && !imageRef.includes('http')) {
                // Deleting the image if it's a reference (not a URL)
                const file = storage.file(imageRef);
                return file.delete();
            }
            return null;  // Skip if it's a URL
        });

        // Wait for all image deletions to complete
        await Promise.all(promises);

       
        const updateBranchexpensesQuery = `
            UPDATE branchexpenses 
            SET image = ''
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;
        const updateReimbursementQuery = `
            UPDATE reimbursement 
            SET image = ''
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;

        // Execute update queries
        await pool.query(updateBranchexpensesQuery, [threeMonthsBack]);
        await pool.query(updateReimbursementQuery, [threeMonthsBack]);

        return NextResponse.json({ message: "Old Data updated" }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { message: "Failed ", details: err.message },
            { status: 500 }
        );
    }
}