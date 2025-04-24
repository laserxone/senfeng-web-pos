import pool from "@/config/db"
import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"


export async function DELETE(req, { params }) {

    const { id } = await params
    if (!id) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }

    try {
        const result = await pool.query(`
            WITH RECURSIVE descendants AS (
                SELECT id FROM folder WHERE id = $1
                UNION
                SELECT f.id FROM folder f
                INNER JOIN descendants d ON f.parent_folder = d.id
            )
            SELECT id FROM descendants;
        `, [id])

        const folderIds = result.rows.map((row) => row.id)

        const docResult = await pool.query(`
            SELECT path FROM document WHERE folder_id = ANY($1)
        `, [folderIds])

        const paths = docResult.rows.map((row) => row.path)

        if (paths.length > 0) {
            const { error: storageError } = await supabase
                .storage
                .from('documents')
                .remove(paths)

            if (storageError) {
                console.log("Storage delete error:", storageError)
                return NextResponse.json({ message: "Failed to delete files from storage" }, { status: 500 })
            }

        }

        await pool.query(`DELETE FROM folder WHERE id = $1`, [id])

        return NextResponse.json({ message: "Folder and documents deleted" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }

}

export const revalidate = 0