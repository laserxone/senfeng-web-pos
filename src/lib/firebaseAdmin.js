import admin from 'firebase-admin';

const serviceAccount = {}


if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export default admin;
