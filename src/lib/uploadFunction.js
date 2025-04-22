import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../config/firebase";

export function UploadImage(image, name) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const metadata = {
        contentType: "image/png",
      };

      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");

          if (snapshot.state === "paused") {
            console.log("Upload is paused");
          } else if (snapshot.state === "running") {
            console.log("Upload is running");
          }
        },
        (error) => reject(error), // Reject on error
        async () => {
          try {
            console.log(uploadTask.snapshot.ref)
            resolve(uploadTask.snapshot.ref); // Resolve with the file URL
          } catch (error) {
            reject(error);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}
