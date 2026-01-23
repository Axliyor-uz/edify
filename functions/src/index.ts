import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const syncUserProfileChanges = onDocumentUpdated("users/{userId}", async (event) => {
    const newValue = event.data?.after.data();
    const oldValue = event.data?.before.data();
    const userId = event.params.userId;

    // 🛑 1. BETTER CHECK: Did ANY visible profile data change?
    const nameChanged = newValue?.displayName !== oldValue?.displayName;
    const userChanged = newValue?.username !== oldValue?.username;
    const photoChanged = newValue?.photoURL !== oldValue?.photoURL;

    // If nothing important changed (e.g. they just updated their 'lastLogin'), STOP here.
    if (!nameChanged && !userChanged && !photoChanged) {
        return null;
    }

    // 2. Prepare the new data object
    const updatedProfile = {
        displayName: newValue?.displayName || "Unknown",
        username: newValue?.username || "unknown",
        photoURL: newValue?.photoURL || null
    };

    console.log(`Syncing profile for ${userId} (Changed: Name=${nameChanged}, User=${userChanged})`);

    // 3. Find all classes this student is in
    const classesQuery = await db.collection('classes')
        .where('studentIds', 'array-contains', userId)
        .get();

    // 4. Update them all
    const batch = db.batch();

    classesQuery.docs.forEach((classDoc) => {
        const classRef = db.collection('classes').doc(classDoc.id);
        
        // Update the WHOLE mini-profile in the map
        batch.update(classRef, {
            [`roster.${userId}`]: updatedProfile
        });
    });

    return batch.commit();
});