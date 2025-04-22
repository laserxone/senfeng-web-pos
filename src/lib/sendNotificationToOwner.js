import moment from "moment"
import admin from "./firebaseAdmin"
import pool from "@/config/db";



export const sendNotificationToOwner = async (title, page) => {
  try {

    const ownersResult = await pool.query(
      "SELECT id FROM users WHERE designation = 'Owner'"
    );
    const ownerIds = ownersResult.rows.map((owner) => owner.id);

    const TimeStamp = moment().valueOf()

    const notifications = ownerIds.map((eachId) => ({
      TimeStamp,
      page,
      read: false,
      title,
      sendTo: eachId,
    }));



    const db = admin.firestore();
    const batch = db.batch();

    notifications.forEach((notification) => {
      const docRef = db.collection("Notification").doc();
      batch.set(docRef, notification);
    });

    await batch.commit();


    console.log("Notification sent")
  } catch (error) {
    console.error("Error sending notification:", error)
  }
}